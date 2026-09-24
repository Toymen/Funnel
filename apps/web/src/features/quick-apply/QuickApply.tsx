"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition } from "react";
import {
  Camera,
  Check,
  ChevronLeft,
  Languages,
  Mic,
  Phone,
  Square,
  ThumbsDown,
  ThumbsUp,
  Volume2,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { funnelSessionId, funnelUtm, trackFunnel } from "@/features/funnel/client";

import {
  type QuickApplyErrorKey,
  submitQuickApplicationAction,
  uploadQuickApplicationFileAction,
} from "./actions";
import type { QuickApplyJob } from "./data";
import { languageInfo, QUICK_APPLY_LANGUAGES, type QuickApplyLanguage } from "./languages";
import { format, QUICK_APPLY_MESSAGES, type QuickApplyMessages } from "./messages";
import { DriveAcross, RoadProgress } from "./Truck";

type Mode = "quick" | "callback" | "voice";
type CallbackWindow = "morning" | "midday" | "afternoon" | "evening" | "anytime";

type Draft = {
  mode: Mode | null;
  firstName: string;
  phone: string;
  email: string;
  callbackWindow: CallbackWindow | null;
  answers: Record<string, string>;
  consent: boolean;
};

const EMPTY: Draft = {
  mode: null,
  firstName: "",
  phone: "",
  email: "",
  callbackWindow: null,
  answers: {},
  consent: false,
};

const noopSubscribe = () => () => {};

/** Browser-Fähigkeit ohne Hydration-Mismatch prüfen (Server: false). */
function useBrowserSupport(check: () => boolean): boolean {
  return useSyncExternalStore(noopSubscribe, check, () => false);
}

const draftKey = (slug: string) => `bs_quick_apply:${slug}`;

/** Autosave nur im sessionStorage (Tab) – keine Bewerberdaten dauerhaft im Browser. */
function loadDraft(slug: string): Draft {
  try {
    const raw = window.sessionStorage.getItem(draftKey(slug));
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<Draft>) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

function saveDraft(slug: string, draft: Draft) {
  try {
    window.sessionStorage.setItem(draftKey(slug), JSON.stringify({ ...draft, consent: false }));
  } catch {
    // Speicher voll oder gesperrt – dann eben ohne Autosave.
  }
}

/** Vorlesen per Browser-Sprachausgabe (offline, kostenlos, PRD v2 §5.1 Nr. 7). */
function ReadAloud({ text, language, label }: { text: string; language: QuickApplyLanguage; label: string }) {
  const supported = useBrowserSupport(() => "speechSynthesis" in window);
  if (!supported) return null;
  return (
    <button
      type="button"
      className="bs-icon-button"
      aria-label={label}
      title={label}
      onClick={() => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = languageInfo(language).speech;
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }}
    >
      <Volume2 className="size-6" aria-hidden />
    </button>
  );
}

function Question({
  text,
  language,
  t,
  children,
}: {
  text: string;
  language: QuickApplyLanguage;
  t: QuickApplyMessages;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <h2 className="bs-question" tabIndex={-1} data-autofocus>
        {text}
      </h2>
      <ReadAloud text={text} language={language} label={t.readAloud} />
      {children}
    </div>
  );
}

/** Sprachnachricht statt Tippen (MediaRecorder, max. 60 s, PRD v2 §5.2). */
function VoiceRecorder({
  t,
  value,
  onChange,
}: {
  t: QuickApplyMessages;
  value: Blob | null;
  onChange: (blob: Blob | null) => void;
}) {
  const canRecord = useBrowserSupport(() => "MediaRecorder" in window && !!navigator.mediaDevices?.getUserMedia);
  const [denied, setDenied] = useState(false);
  const supported = canRecord && !denied;
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<number | null>(null);
  const url = useMemo(() => (value ? URL.createObjectURL(value) : null), [value]);

  useEffect(() => () => (url ? URL.revokeObjectURL(url) : undefined), [url]);

  const stop = useCallback(() => {
    recorder.current?.stop();
    if (timer.current) window.clearInterval(timer.current);
    setRecording(false);
  }, []);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        onChange(new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
        trackFunnel("voice_recorded");
      };
      recorder.current = rec;
      rec.start();
      setSeconds(0);
      setRecording(true);
      timer.current = window.setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= 60) stop();
          return s + 1;
        });
      }, 1000);
    } catch {
      setDenied(true);
    }
  };

  if (!supported) return <p className="bs-hint">{t.voiceUnsupported}</p>;

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        onClick={recording ? stop : () => void start()}
        className={"bs-record " + (recording ? "bs-record--on" : "")}
        aria-pressed={recording}
      >
        {recording ? <Square className="size-10" aria-hidden /> : <Mic className="size-10" aria-hidden />}
        <span>{recording ? t.voiceStop : value ? t.voiceAgain : t.voiceStart}</span>
      </button>
      <p className="bs-hint tabular-nums" aria-live="polite">
        {recording ? format(t.voiceSeconds, { seconds: 60 - seconds }) : value ? t.voiceRecorded : null}
      </p>
      {url && !recording ? (
        // Eigene Sprachnachricht zum Nachhören: Untertitel gibt es dafür nicht.
        // eslint-disable-next-line jsx-a11y/media-has-caption -- Wiedergabe der eigenen Aufnahme, keine Untertitel verfügbar
        <audio controls src={url} className="w-full" aria-label={t.voicePlayback} />
      ) : null}
    </div>
  );
}

function ChoiceCard({
  selected,
  onClick,
  icon,
  title,
  hint,
}: {
  selected?: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className="bs-card">
      {icon ? <span className="bs-card__icon">{icon}</span> : null}
      <span className="flex flex-col items-start text-start">
        <span className="bs-card__title">{title}</span>
        {hint ? <span className="bs-card__hint">{hint}</span> : null}
      </span>
    </button>
  );
}

export function QuickApply({
  job,
  initialLanguage,
  languageChosen,
}: {
  job: QuickApplyJob;
  initialLanguage: QuickApplyLanguage;
  /** true, wenn die Sprache schon per URL gewählt wurde – dann Sprachschritt überspringen. */
  languageChosen: boolean;
}) {
  const [language, setLanguage] = useState<QuickApplyLanguage>(initialLanguage);
  const t = QUICK_APPLY_MESSAGES[language];
  const rtl = languageInfo(language).dir === "rtl";
  const reduce = useReducedMotion();

  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [voice, setVoice] = useState<Blob | null>(null);
  const [screenIndex, setScreenIndex] = useState(languageChosen ? 1 : 0);
  const [error, setError] = useState<QuickApplyErrorKey | null>(null);
  const [pending, startTransition] = useTransition();
  const [driving, setDriving] = useState(false);
  const [done, setDone] = useState<{ applicationId: string; uploadToken: string } | null>(null);
  const [uploads, setUploads] = useState<string[]>([]);
  const started = useRef(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Autosave aus sessionStorage erst nach der Hydration laden
    setDraft(loadDraft(job.slug));
  }, [job.slug]);
  useEffect(() => {
    if (!done) saveDraft(job.slug, draft);
  }, [draft, done, job.slug]);

  const screens = useMemo(() => {
    const list = ["language", "mode", "name", "contact"];
    if (draft.mode === "callback") list.push("callback");
    if (draft.mode === "voice") list.push("voice");
    if (draft.mode === "quick") list.push(...job.questions.map((q) => `question:${q.id}`));
    list.push("privacy");
    return list;
  }, [draft.mode, job.questions]);

  const screen = screens[Math.min(screenIndex, screens.length - 1)];
  const firstRoadScreen = 2;
  const roadStep = Math.max(0, screenIndex - firstRoadScreen);
  const roadTotal = screens.length - firstRoadScreen;

  useEffect(() => {
    trackFunnel("step_viewed", { jobId: job.jobId, metadata: { step: screen, stepIndex: screenIndex } });
    // Fokus auf die neue Frage (Screenreader, Tastatur)
    document.querySelector<HTMLElement>("[data-autofocus]")?.focus({ preventScroll: true });
  }, [screen, screenIndex, job.jobId]);

  const update = (patch: Partial<Draft>) => {
    setError(null);
    setDraft((d) => ({ ...d, ...patch }));
  };

  const next = () => {
    trackFunnel("application_step_completed", { jobId: job.jobId, metadata: { step: screen, stepIndex: screenIndex } });
    setScreenIndex((i) => Math.min(i + 1, screens.length - 1));
  };
  const back = () => setScreenIndex((i) => Math.max(i - 1, languageChosen ? 1 : 0));

  const chooseLanguage = (code: QuickApplyLanguage) => {
    setLanguage(code);
    trackFunnel("language_selected", { jobId: job.jobId, metadata: { language: code } });
    const url = new URL(window.location.href);
    url.searchParams.set("lang", code);
    window.history.replaceState(null, "", url);
    next();
  };

  const chooseMode = (mode: Mode) => {
    update({ mode });
    if (!started.current) {
      started.current = true;
      trackFunnel("application_started", { jobId: job.jobId, metadata: { mode, language } });
    }
    if (mode === "quick") trackFunnel("quick_apply_chosen", { jobId: job.jobId });
    if (mode === "callback") trackFunnel("callback_requested", { jobId: job.jobId });
    next();
  };

  const validateContact = (): QuickApplyErrorKey | null => {
    const phone = draft.phone.trim();
    const email = draft.email.trim();
    if (!phone && !email) return "errorContact";
    if (phone && !/^[+0-9][0-9 ()/-]{5,24}$/.test(phone)) return "errorPhone";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "errorEmail";
    if (draft.mode === "callback" && !phone) return "errorPhone";
    return null;
  };

  const submit = () => {
    if (!draft.consent) {
      setError("errorPrivacy");
      return;
    }
    const form = new FormData();
    const utm = funnelUtm();
    form.set("jobSlug", job.slug);
    form.set("sessionId", funnelSessionId());
    form.set("language", language);
    form.set("mode", draft.mode ?? "quick");
    form.set("firstName", draft.firstName);
    form.set("phone", draft.phone);
    form.set("email", draft.email);
    if (draft.callbackWindow) form.set("callbackWindow", draft.callbackWindow);
    form.set("answers", JSON.stringify(draft.answers));
    form.set("consent", "true");
    if (utm.utmSource) form.set("utmSource", utm.utmSource);
    if (utm.utmMedium) form.set("utmMedium", utm.utmMedium);
    if (utm.utmCampaign) form.set("utmCampaign", utm.utmCampaign);
    if (voice) form.set("voice", voice, "sprachnachricht");

    startTransition(async () => {
      const result = await submitQuickApplicationAction(form).catch(() => null);
      if (!result?.ok) {
        setError(result?.error ?? "errorGeneric");
        return;
      }
      try {
        window.sessionStorage.removeItem(draftKey(job.slug));
      } catch {}
      setDriving(true);
      setDone({ applicationId: result.applicationId, uploadToken: result.uploadToken });
    });
  };

  const upload = (file: File) => {
    if (!done) return;
    const form = new FormData();
    form.set("applicationId", done.applicationId);
    form.set("uploadToken", done.uploadToken);
    form.set("file", file);
    startTransition(async () => {
      const result = await uploadQuickApplicationFileAction(form).catch(() => ({ ok: false }));
      if (result.ok) setUploads((u) => [...u, file.name]);
      else setError("errorUpload");
    });
  };

  const canContinue = (() => {
    if (screen === "name") return draft.firstName.trim().length > 0;
    if (screen === "callback") return draft.callbackWindow !== null;
    if (screen === "voice") return true;
    return true;
  })();

  const primary = (() => {
    if (screen === "name") return { label: t.next, action: () => (draft.firstName.trim() ? next() : setError("errorFirstName")) };
    if (screen === "contact")
      return {
        label: t.next,
        action: () => {
          const problem = validateContact();
          if (problem) setError(problem);
          else next();
        },
      };
    if (screen === "callback" || screen === "voice") return { label: t.next, action: next };
    if (screen.startsWith("question:")) {
      const q = job.questions.find((item) => `question:${item.id}` === screen);
      return q?.kind === "text" ? { label: t.next, action: next } : null;
    }
    if (screen === "privacy") return { label: pending ? t.sending : t.send, action: submit };
    return null;
  })();

  const transition = reduce ? { duration: 0 } : { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <div className="bs-quick" dir={rtl ? "rtl" : "ltr"} lang={language === "de-easy" ? "de" : language}>
      <header className="bs-top">
        {screenIndex > (languageChosen ? 1 : 0) && !done ? (
          <button type="button" className="bs-icon-button" onClick={back} aria-label={t.back}>
            <ChevronLeft className={"size-7 " + (rtl ? "rotate-180" : "")} aria-hidden />
          </button>
        ) : (
          <span className="size-12" aria-hidden />
        )}
        <p className="bs-top__job">{job.title}</p>
        {screen !== "language" && !done ? (
          <button
            type="button"
            className="bs-icon-button"
            onClick={() => setScreenIndex(0)}
            aria-label={t.chooseLanguage}
            title={languageInfo(language).name}
          >
            <Languages className="size-6" aria-hidden />
          </button>
        ) : (
          <span className="size-12" aria-hidden />
        )}
      </header>

      <main className="bs-stage">
        <AnimatePresence mode="wait" initial={false}>
          {done ? (
            <motion.section
              key="done"
              className="bs-screen"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...transition, delay: reduce ? 0 : 0.6 }}
            >
              <span className="bs-done-badge" aria-hidden>
                <Check className="size-10" />
              </span>
              <h2 className="bs-question" tabIndex={-1} data-autofocus>
                {format(t.doneTitle, { name: draft.firstName })}
              </h2>
              <p className="bs-lead">{draft.phone ? t.doneCall : t.doneMail}</p>
              <div className="bs-panel">
                <p className="font-semibold">{t.addDocuments}</p>
                <p className="bs-hint">{t.addDocumentsHint}</p>
                <label className="bs-button bs-button--ghost mt-3">
                  <Camera className="size-6" aria-hidden />
                  {t.addDocumentsButton}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    capture="environment"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) upload(file);
                      e.target.value = "";
                    }}
                  />
                </label>
                {uploads.map((name) => (
                  <p key={name} className="bs-hint mt-2 flex items-center gap-2">
                    <Check className="size-4" aria-hidden /> {t.uploaded}: {name}
                  </p>
                ))}
              </div>
            </motion.section>
          ) : (
            <motion.section
              key={screen}
              className="bs-screen"
              initial={{ opacity: 0, x: rtl ? -24 : 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: rtl ? 24 : -24 }}
              transition={transition}
            >
              {screen === "language" ? (
                <>
                  <Question text={t.chooseLanguage} language={language} t={t} />
                  <div className="bs-grid">
                    {QUICK_APPLY_LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        lang={l.code === "de-easy" ? "de" : l.code}
                        dir={l.dir}
                        aria-pressed={language === l.code}
                        onClick={() => chooseLanguage(l.code)}
                        className="bs-card bs-card--lang"
                      >
                        <span className="bs-card__title">{l.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              {screen === "mode" ? (
                <>
                  <Question text={t.howToApply} language={language} t={t} />
                  <div className="flex flex-col gap-3">
                    <ChoiceCard
                      selected={draft.mode === "quick"}
                      onClick={() => chooseMode("quick")}
                      icon={<Zap className="size-8" aria-hidden />}
                      title={t.modeQuick}
                      hint={t.modeQuickHint}
                    />
                    <ChoiceCard
                      selected={draft.mode === "callback"}
                      onClick={() => chooseMode("callback")}
                      icon={<Phone className="size-8" aria-hidden />}
                      title={t.modeCallback}
                      hint={t.modeCallbackHint}
                    />
                    <ChoiceCard
                      selected={draft.mode === "voice"}
                      onClick={() => chooseMode("voice")}
                      icon={<Mic className="size-8" aria-hidden />}
                      title={t.modeVoice}
                      hint={t.modeVoiceHint}
                    />
                  </div>
                </>
              ) : null}

              {screen === "name" ? (
                <>
                  <Question text={t.firstNameQuestion} language={language} t={t} />
                  <input
                    className="bs-input"
                    value={draft.firstName}
                    onChange={(e) => update({ firstName: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && primary?.action()}
                    placeholder={t.firstNamePlaceholder}
                    aria-label={t.firstNamePlaceholder}
                    autoComplete="given-name"
                    autoCapitalize="words"
                    enterKeyHint="next"
                    maxLength={100}
                  />
                </>
              ) : null}

              {screen === "contact" ? (
                <>
                  <Question text={t.contactQuestion} language={language} t={t} />
                  <label className="bs-label">
                    <span>{t.phoneLabel}</span>
                    <input
                      className="bs-input"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      dir="ltr"
                      value={draft.phone}
                      onChange={(e) => update({ phone: e.target.value })}
                      placeholder="0151 1234567"
                      maxLength={40}
                    />
                  </label>
                  <label className="bs-label">
                    <span>{t.emailLabel}</span>
                    <input
                      className="bs-input"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      dir="ltr"
                      value={draft.email}
                      onChange={(e) => update({ email: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && primary?.action()}
                      maxLength={200}
                    />
                  </label>
                  <p className="bs-hint">{t.contactHint}</p>
                </>
              ) : null}

              {screen === "callback" ? (
                <>
                  <Question text={t.callbackQuestion} language={language} t={t} />
                  <div className="bs-grid">
                    {(
                      [
                        ["morning", t.callbackMorning],
                        ["midday", t.callbackMidday],
                        ["afternoon", t.callbackAfternoon],
                        ["evening", t.callbackEvening],
                        ["anytime", t.callbackAnytime],
                      ] as const
                    ).map(([value, label]) => (
                      <ChoiceCard
                        key={value}
                        selected={draft.callbackWindow === value}
                        onClick={() => {
                          update({ callbackWindow: value });
                          next();
                        }}
                        title={label}
                      />
                    ))}
                  </div>
                </>
              ) : null}

              {screen === "voice" ? (
                <>
                  <Question text={t.voiceQuestion} language={language} t={t} />
                  <VoiceRecorder t={t} value={voice} onChange={setVoice} />
                </>
              ) : null}

              {screen.startsWith("question:")
                ? (() => {
                    const q = job.questions.find((item) => `question:${item.id}` === screen);
                    if (!q) return null;
                    const answer = draft.answers[q.id] ?? "";
                    const setAnswer = (value: string, advance: boolean) => {
                      update({ answers: { ...draft.answers, [q.id]: value } });
                      if (advance) next();
                    };
                    return (
                      <>
                        <Question text={q.label} language={language} t={t} />
                        {q.kind === "yesno" ? (
                          <div className="grid grid-cols-2 gap-3">
                            {q.options.map((option) => {
                              const isYes = /^(ja|yes|tak|da|так|да|evet|نعم)$/i.test(option.value);
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  aria-pressed={answer === option.value}
                                  onClick={() => setAnswer(option.value, true)}
                                  className={"bs-yesno " + (isYes ? "bs-yesno--yes" : "bs-yesno--no")}
                                >
                                  {isYes ? <ThumbsUp className="size-12" aria-hidden /> : <ThumbsDown className="size-12" aria-hidden />}
                                  <span>{isYes ? t.yes : t.no}</span>
                                </button>
                              );
                            })}
                          </div>
                        ) : q.kind === "choice" ? (
                          <div className="bs-grid">
                            {q.options.map((option) => (
                              <ChoiceCard
                                key={option.value}
                                selected={answer === option.value}
                                onClick={() => setAnswer(option.value, true)}
                                title={option.label}
                              />
                            ))}
                          </div>
                        ) : (
                          <input
                            className="bs-input"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value, false)}
                            onKeyDown={(e) => e.key === "Enter" && next()}
                            maxLength={500}
                          />
                        )}
                        {!q.required ? (
                          <button type="button" className="bs-link" onClick={next}>
                            {t.skip}
                          </button>
                        ) : null}
                      </>
                    );
                  })()
                : null}

              {screen === "privacy" ? (
                <>
                  <Question text={t.privacyQuestion} language={language} t={t} />
                  <label className="bs-consent">
                    <input
                      type="checkbox"
                      checked={draft.consent}
                      onChange={(e) => update({ consent: e.target.checked })}
                    />
                    <span>{t.privacyAccept}</span>
                  </label>
                  {job.privacyHref ? (
                    <a className="bs-link" href={job.privacyHref} target="_blank" rel="noreferrer">
                      {t.privacyRead}
                    </a>
                  ) : null}
                </>
              ) : null}
            </motion.section>
          )}
        </AnimatePresence>

        {error ? (
          <p role="alert" className="bs-error">
            {t[error]}
          </p>
        ) : null}
      </main>

      <footer className="bs-bottom">
        {screenIndex >= firstRoadScreen && !done ? (
          <>
            <p className="bs-hint text-center">
              {format(t.stepOf, { current: Math.min(roadStep + 1, roadTotal), total: roadTotal })}
            </p>
            <RoadProgress
              step={roadStep}
              total={roadTotal}
              rtl={rtl}
              label={format(t.stepOf, { current: Math.min(roadStep + 1, roadTotal), total: roadTotal })}
            />
          </>
        ) : null}
        {primary && !done ? (
          <button
            type="button"
            className="bs-button"
            onClick={primary.action}
            disabled={pending || !canContinue}
            aria-disabled={pending || !canContinue}
          >
            {primary.label}
          </button>
        ) : null}
      </footer>

      <DriveAcross active={driving} rtl={rtl} onDone={() => setDriving(false)} />
    </div>
  );
}
