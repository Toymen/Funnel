/**
 * Beispieldaten für Stories und Tests der HR-Handy-Ansicht (keine echten Personen).
 */
import type {
  MobilePipelineApplication,
  MobilePipelineStage,
} from "./MobilePipelineColumns";

export const callbackContact = {
  name: "Oleksandr Kowalenko",
  phone: "+49 176 12345678",
  email: "tel-4917612345678@kurzbewerbung.invalid",
  quickApply: { language: "uk", mode: "callback", callbackWindow: "evening" },
} as const;

export const voiceContact = {
  name: "Mehmet Yılmaz",
  phone: "0170 9876543",
  email: "mehmet.yilmaz@example.com",
  quickApply: { language: "tr", mode: "voice", callbackWindow: null },
} as const;

export const emailOnlyContact = {
  name: "Katarzyna Nowak",
  phone: null,
  email: "katarzyna.nowak@example.org",
  quickApply: { language: "pl", mode: "quick", callbackWindow: null },
} as const;

export const classicContact = {
  name: "Maximiliane-Theresa von Hohenberg-Schwarzenfeld",
  phone: "06232 123456",
  email: "maximiliane.theresa.von.hohenberg@sehr-lange-domain-beispiel.example",
  quickApply: null,
} as const;

export const pipelineStages: MobilePipelineStage[] = [
  { id: "s-neu", name: "Neu", color: "#93c5fd" },
  { id: "s-pruefung", name: "Prüfung", color: "#c4b5fd" },
  { id: "s-kontakt", name: "Kontakt", color: "#fde68a" },
  { id: "s-gespraech", name: "Gespräch", color: "#fdba74" },
  { id: "s-eingestellt", name: "Eingestellt", color: "#86efac" },
  { id: "s-abgesagt", name: "Abgesagt", color: "#fca5a5" },
];

function application(
  id: string,
  firstName: string,
  lastName: string,
  currentStageId: string,
  quickApply: MobilePipelineApplication["quickApply"],
): MobilePipelineApplication {
  return {
    id,
    candidateId: `c-${id}`,
    candidateFirstName: firstName,
    candidateLastName: lastName,
    candidateAvatarUrl: null,
    candidateAvatarFallbackSrcs: [],
    currentStageId,
    quickApply,
  };
}

export const pipelineApplications: MobilePipelineApplication[] = [
  application("a1", "Anna", "", "s-neu", {
    language: "de",
    mode: "quick",
    callbackWindow: null,
  }),
  application("a2", "Oleksandr", "Kowalenko-Wasylenko", "s-neu", {
    language: "uk",
    mode: "callback",
    callbackWindow: "evening",
  }),
  application("a3", "أحمد", "", "s-neu", {
    language: "ar",
    mode: "quick",
    callbackWindow: null,
  }),
  application("a4", "Mehmet", "Yılmaz", "s-pruefung", {
    language: "tr",
    mode: "voice",
    callbackWindow: null,
  }),
  application(
    "a5",
    "Maximiliane-Theresa",
    "von Hohenberg-Schwarzenfeld",
    "s-kontakt",
    null,
  ),
];

export function columnsFor(
  stages: MobilePipelineStage[],
  applications: MobilePipelineApplication[],
): Map<string, MobilePipelineApplication[]> {
  return new Map(
    stages.map((stage) => [
      stage.id,
      applications.filter((a) => a.currentStageId === stage.id),
    ]),
  );
}
