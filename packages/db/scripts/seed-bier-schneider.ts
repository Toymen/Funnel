import "dotenv/config";

import { and, asc, eq } from "drizzle-orm";

import { createDatabaseClient, schema, type QuickApplyLocalization } from "../src";

/**
 * Legt die drei Bier-Schneider-Beispielstellen inkl. Kurzbewerbung und
 * Übersetzungen an (PRD v2 §5, §12). Idempotent: vorhandene Stellen (gleicher
 * Slug) werden aktualisiert. Voraussetzung: Arbeitsbereich existiert bereits
 * (Harly-Setup unter /setup oder `pnpm db:seed`).
 *
 * Aufruf: pnpm --filter @harly/db db:seed:bier-schneider
 * Übersetzungen sind Entwürfe → Prüfung durch Muttersprachler (Issue #8).
 */

type Lang = "de-easy" | "en" | "pl" | "ro" | "uk" | "ru" | "tr" | "ar";

type SeedQuestion = {
  id: string;
  label: string;
  options: string[];
  labels: Record<Lang, string>;
  optionLabels?: Partial<Record<Lang, Record<string, string>>>;
};

type SeedJob = {
  slug: string;
  title: string;
  icon: string;
  description: string;
  requirements: string;
  benefits: string;
  salaryMin: number | null;
  payLabel: string | null;
  hoursLabel: string;
  employmentType: "full_time" | "part_time";
  questions: SeedQuestion[];
  localizations: Record<Lang, QuickApplyLocalization>;
};

const YES_NO = ["Ja", "Nein"];

const START: SeedQuestion = {
  id: "start",
  label: "Wann können Sie anfangen?",
  options: ["sofort", "in 1 Monat", "in 2–3 Monaten", "später"],
  labels: {
    "de-easy": "Wann können Sie anfangen?",
    en: "When can you start?",
    pl: "Kiedy możesz zacząć?",
    ro: "Când puteți începe?",
    uk: "Коли ви можете почати?",
    ru: "Когда вы можете начать?",
    tr: "Ne zaman başlayabilirsiniz?",
    ar: "متى يمكنك البدء؟",
  },
  optionLabels: {
    "de-easy": {
      sofort: "Sofort",
      "in 1 Monat": "In 1 Monat",
      "in 2–3 Monaten": "In 2 bis 3 Monaten",
      später: "Später",
    },
    en: { sofort: "Right away", "in 1 Monat": "In 1 month", "in 2–3 Monaten": "In 2–3 months", später: "Later" },
    pl: { sofort: "Od razu", "in 1 Monat": "Za miesiąc", "in 2–3 Monaten": "Za 2–3 miesiące", später: "Później" },
    ro: { sofort: "Imediat", "in 1 Monat": "Într-o lună", "in 2–3 Monaten": "În 2–3 luni", später: "Mai târziu" },
    uk: { sofort: "Одразу", "in 1 Monat": "Через місяць", "in 2–3 Monaten": "Через 2–3 місяці", später: "Пізніше" },
    ru: { sofort: "Сразу", "in 1 Monat": "Через месяц", "in 2–3 Monaten": "Через 2–3 месяца", später: "Позже" },
    tr: { sofort: "Hemen", "in 1 Monat": "1 ay içinde", "in 2–3 Monaten": "2–3 ay içinde", später: "Daha sonra" },
    ar: { sofort: "فوراً", "in 1 Monat": "خلال شهر", "in 2–3 Monaten": "خلال ٢–٣ أشهر", später: "لاحقاً" },
  },
};

const JOBS: SeedJob[] = [
  {
    slug: "lkw-fahrer",
    title: "LKW-Fahrer (m/w/d)",
    icon: "truck",
    description:
      "<p>Sie beliefern Gastronomie, Getränkemärkte und Feste in der Region mit Getränken. Jeden Abend sind Sie wieder zu Hause.</p><h3>Ihre Aufgaben</h3><ul><li>Getränke an Kunden in der Region ausliefern</li><li>Leergut zurücknehmen</li><li>Fahrzeug sauber und sicher halten</li></ul>",
    requirements:
      "<ul><li>Führerschein Klasse CE</li><li>Berufskraftfahrer-Qualifikation (Modul 95)</li><li>Freundlicher Umgang mit Kunden</li></ul>",
    benefits: "<ul><li>Kein Fernverkehr – abends zu Hause</li><li>Moderne LKW</li><li>Unbefristeter Vertrag</li></ul>",
    salaryMin: 3100,
    payLabel: null,
    hoursLabel: "Mo–Fr ab 6 Uhr",
    employmentType: "full_time",
    questions: [
      {
        id: "fuehrerschein-ce",
        label: "Haben Sie den Führerschein Klasse CE?",
        options: YES_NO,
        labels: {
          "de-easy": "Haben Sie den Führer-Schein CE?",
          en: "Do you have a CE driving licence?",
          pl: "Czy masz prawo jazdy kat. C+E?",
          ro: "Aveți permis de conducere categoria CE?",
          uk: "У вас є посвідчення водія категорії CE?",
          ru: "У вас есть права категории CE?",
          tr: "CE sınıfı ehliyetiniz var mı?",
          ar: "هل لديك رخصة قيادة فئة CE؟",
        },
      },
      {
        id: "modul-95",
        label: "Haben Sie die Berufskraftfahrer-Qualifikation (Modul 95)?",
        options: YES_NO,
        labels: {
          "de-easy": "Haben Sie die Karte für Berufs-Fahrer (Code 95)?",
          en: "Do you have the professional driver qualification (Code 95)?",
          pl: "Czy masz kwalifikację zawodową kierowcy (kod 95)?",
          ro: "Aveți atestat profesional (cod 95)?",
          uk: "У вас є кваліфікація професійного водія (код 95)?",
          ru: "У вас есть квалификация профессионального водителя (код 95)?",
          tr: "Profesyonel sürücü belgeniz (Kod 95) var mı?",
          ar: "هل لديك مؤهل السائق المهني (كود 95)؟",
        },
      },
      START,
    ],
    localizations: {
      "de-easy": {
        title: "LKW-Fahrer",
        summary: "Sie fahren mit dem LKW. Sie bringen Getränke zu Kunden. Am Abend sind Sie zu Hause.",
      },
      en: { title: "Truck driver", summary: "You deliver drinks in the region. You are home every evening." },
      pl: { title: "Kierowca ciężarówki", summary: "Dowozisz napoje w regionie. Każdego wieczoru jesteś w domu." },
      ro: { title: "Șofer de camion", summary: "Livrați băuturi în regiune. În fiecare seară sunteți acasă." },
      uk: { title: "Водій вантажівки", summary: "Ви доставляєте напої в регіоні. Щовечора ви вдома." },
      ru: { title: "Водитель грузовика", summary: "Вы доставляете напитки в регионе. Каждый вечер вы дома." },
      tr: { title: "Kamyon şoförü", summary: "Bölgede içecek teslim edersiniz. Her akşam evdesiniz." },
      ar: { title: "سائق شاحنة", summary: "توصل المشروبات في المنطقة. تعود إلى بيتك كل مساء." },
    },
  },
  {
    slug: "lagermitarbeiter",
    title: "Lagermitarbeiter (m/w/d)",
    icon: "warehouse",
    description:
      "<p>Sie stellen Getränke-Bestellungen zusammen und beladen unsere LKW. Anlernen ist möglich.</p><h3>Ihre Aufgaben</h3><ul><li>Bestellungen kommissionieren</li><li>LKW be- und entladen</li><li>Leergut sortieren</li></ul>",
    requirements: "<ul><li>Staplerschein von Vorteil</li><li>Bereitschaft zur Schichtarbeit</li></ul>",
    benefits: "<ul><li>Einarbeitung im Team</li><li>Staplerschein bezahlen wir</li><li>Sicherer Arbeitsplatz</li></ul>",
    salaryMin: null,
    payLabel: "ab 15,50 € / Stunde",
    hoursLabel: "Früh- und Spätschicht",
    employmentType: "full_time",
    questions: [
      {
        id: "staplerschein",
        label: "Haben Sie einen Staplerschein?",
        options: YES_NO,
        labels: {
          "de-easy": "Haben Sie einen Stapler-Schein?",
          en: "Do you have a forklift licence?",
          pl: "Czy masz uprawnienia na wózek widłowy?",
          ro: "Aveți permis de stivuitorist?",
          uk: "У вас є посвідчення на навантажувач?",
          ru: "У вас есть удостоверение на погрузчик?",
          tr: "Forklift belgeniz var mı?",
          ar: "هل لديك رخصة قيادة رافعة شوكية؟",
        },
      },
      {
        id: "schichtarbeit",
        label: "Ist Schichtarbeit für Sie möglich?",
        options: YES_NO,
        labels: {
          "de-easy": "Können Sie früh und spät arbeiten?",
          en: "Can you work shifts?",
          pl: "Czy możesz pracować na zmiany?",
          ro: "Puteți lucra în ture?",
          uk: "Чи можете ви працювати змінами?",
          ru: "Можете ли вы работать сменами?",
          tr: "Vardiyalı çalışabilir misiniz?",
          ar: "هل يمكنك العمل بنظام الورديات؟",
        },
      },
      START,
    ],
    localizations: {
      "de-easy": {
        title: "Arbeit im Lager",
        summary: "Sie packen Getränke für Kunden. Sie laden die LKW. Wir zeigen Ihnen alles.",
      },
      en: { title: "Warehouse worker", summary: "You pick drinks orders and load our trucks. We train you." },
      pl: {
        title: "Pracownik magazynu",
        summary: "Kompletujesz zamówienia napojów i ładujesz ciężarówki. Przyuczymy Cię.",
      },
      ro: { title: "Lucrător în depozit", summary: "Pregătiți comenzi de băuturi și încărcați camioane. Vă instruim." },
      uk: {
        title: "Працівник складу",
        summary: "Ви комплектуєте замовлення напоїв і завантажуєте вантажівки. Ми все покажемо.",
      },
      ru: {
        title: "Работник склада",
        summary: "Вы собираете заказы напитков и загружаете грузовики. Мы всему научим.",
      },
      tr: {
        title: "Depo çalışanı",
        summary: "İçecek siparişlerini hazırlar ve kamyonları yüklersiniz. Size öğretiriz.",
      },
      ar: { title: "عامل مستودع", summary: "تجهز طلبات المشروبات وتحمّل الشاحنات. نحن ندربك." },
    },
  },
  {
    slug: "kaufmaennischer-mitarbeiter",
    title: "Kaufmännischer Mitarbeiter (m/w/d)",
    icon: "office",
    description:
      "<p>Sie nehmen Bestellungen an, betreuen Kunden am Telefon und organisieren Touren mit.</p><h3>Ihre Aufgaben</h3><ul><li>Bestellungen erfassen</li><li>Kunden am Telefon beraten</li><li>Touren mit der Disposition planen</li></ul>",
    requirements:
      "<ul><li>Kaufmännische Ausbildung</li><li>Gute Deutschkenntnisse</li><li>Sicher am Computer</li></ul>",
    benefits: "<ul><li>Gleitzeit</li><li>Teilzeit möglich</li><li>Kurze Wege im Familienunternehmen</li></ul>",
    salaryMin: null,
    payLabel: "nach Vereinbarung",
    hoursLabel: "Mo–Fr, Gleitzeit",
    employmentType: "full_time",
    questions: [START],
    localizations: {
      "de-easy": {
        title: "Arbeit im Büro",
        summary: "Sie arbeiten im Büro. Sie nehmen Bestellungen an. Sie sprechen mit Kunden am Telefon.",
      },
      en: { title: "Office clerk", summary: "You take orders and help customers on the phone." },
      pl: { title: "Pracownik biurowy", summary: "Przyjmujesz zamówienia i obsługujesz klientów telefonicznie." },
      ro: { title: "Funcționar comercial", summary: "Preluați comenzi și consiliați clienții la telefon." },
      uk: { title: "Офісний працівник", summary: "Ви приймаєте замовлення і консультуєте клієнтів телефоном." },
      ru: { title: "Офисный сотрудник", summary: "Вы принимаете заказы и консультируете клиентов по телефону." },
      tr: { title: "Büro elemanı", summary: "Sipariş alır ve müşterilere telefonda yardımcı olursunuz." },
      ar: { title: "موظف إداري", summary: "تستقبل الطلبات وتساعد الزبائن عبر الهاتف." },
    },
  },
];

/** Deutsche Pipeline-Stufen; der Funnel-Report erkennt Gespräch/Angebot/Eingestellt. */
const STAGES = [
  { name: "Neu", color: "#E0F2FE" },
  { name: "Prüfung", color: "#F5F3FF" },
  { name: "Kontakt", color: "#FEF9C3" },
  { name: "Gespräch", color: "#FEF3C7" },
  { name: "Angebot", color: "#DCFCE7" },
  { name: "Eingestellt", color: "#CCFBF1" },
  { name: "Abgesagt", color: "#FEE2E2" },
];

function localize(job: SeedJob): Record<string, QuickApplyLocalization> {
  const result: Record<string, QuickApplyLocalization> = {};
  for (const lang of Object.keys(job.localizations) as Lang[]) {
    result[lang] = {
      ...job.localizations[lang],
      questions: Object.fromEntries(job.questions.map((q) => [q.id, q.labels[lang]])),
      options: Object.fromEntries(
        job.questions.filter((q) => q.optionLabels?.[lang]).map((q) => [q.id, q.optionLabels![lang]!]),
      ),
    };
  }
  return result;
}

async function main() {
  const { db, sql } = createDatabaseClient();
  try {
    const [workspace] = await db
      .select({ id: schema.organization.id })
      .from(schema.organization)
      .orderBy(asc(schema.organization.createdAt))
      .limit(1);
    if (!workspace) throw new Error("Kein Arbeitsbereich gefunden – bitte zuerst /setup durchlaufen.");
    const [owner] = await db
      .select({ userId: schema.member.userId })
      .from(schema.member)
      .where(eq(schema.member.organizationId, workspace.id))
      .orderBy(asc(schema.member.createdAt))
      .limit(1);
    if (!owner) throw new Error("Kein Mitglied im Arbeitsbereich gefunden.");

    for (const seed of JOBS) {
      const applicationConfig = {
        resumeRequired: false,
        sections: { profile: { resume: { visibility: "optional" } } },
        questions: seed.questions.map((q) => ({
          id: q.id,
          label: q.label,
          type: "select",
          required: false,
          options: q.options,
        })),
      };
      const values = {
        workspaceId: workspace.id,
        title: seed.title,
        slug: seed.slug,
        location: "Mülheim-Kärlich",
        employmentType: seed.employmentType,
        workplaceType: "onsite" as const,
        description: seed.description,
        requirements: seed.requirements,
        benefits: seed.benefits,
        salaryMin: seed.salaryMin,
        currency: seed.salaryMin ? "EUR" : null,
        salaryPeriod: seed.salaryMin ? "monthly" : null,
        jobLocationCountry: "DE",
        applicationConfig,
        status: "open" as const,
        publishedAt: new Date(),
        createdById: owner.userId,
      };

      await db.transaction(async (tx) => {
        const [existing] = await tx
          .select({ id: schema.jobs.id })
          .from(schema.jobs)
          .where(and(eq(schema.jobs.workspaceId, workspace.id), eq(schema.jobs.slug, seed.slug)))
          .limit(1);
        const jobId = existing
          ? (
              await tx
                .update(schema.jobs)
                .set(values)
                .where(eq(schema.jobs.id, existing.id))
                .returning({ id: schema.jobs.id })
            )[0]!.id
          : (await tx.insert(schema.jobs).values(values).returning({ id: schema.jobs.id }))[0]!.id;

        if (!existing) {
          await tx
            .insert(schema.jobStages)
            .values(STAGES.map((stage, index) => ({ workspaceId: workspace.id, jobId, order: index + 1, ...stage })));
        }
        for (const [index, q] of seed.questions.entries()) {
          await tx
            .insert(schema.applicationQuestions)
            .values({
              workspaceId: workspace.id,
              jobId,
              key: q.id,
              label: q.label,
              type: "select",
              required: false,
              options: q.options,
              order: index + 1,
            })
            .onConflictDoUpdate({
              target: [schema.applicationQuestions.jobId, schema.applicationQuestions.key],
              set: { label: q.label, options: q.options, order: index + 1, updatedAt: new Date() },
            });
        }
        await tx
          .insert(schema.jobQuickApply)
          .values({
            jobId,
            workspaceId: workspace.id,
            icon: seed.icon,
            payLabel: seed.payLabel,
            hoursLabel: seed.hoursLabel,
            localizations: localize(seed),
          })
          .onConflictDoUpdate({
            target: schema.jobQuickApply.jobId,
            set: {
              icon: seed.icon,
              payLabel: seed.payLabel,
              hoursLabel: seed.hoursLabel,
              localizations: localize(seed),
              updatedAt: new Date(),
            },
          });
      });
      console.log(`Stelle angelegt/aktualisiert: ${seed.slug}`);
    }
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error("Bier-Schneider-Seed fehlgeschlagen.");
  console.error(error);
  process.exit(1);
});
