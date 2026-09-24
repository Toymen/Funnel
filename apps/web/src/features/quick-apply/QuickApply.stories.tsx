import type { Meta, StoryContext, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { submitQuickApplicationAction } from "./actions";
import { truckDriverJobFor } from "./fixtures";
import { isQuickApplyLanguage, type QuickApplyLanguage } from "./languages";
import { format, QUICK_APPLY_MESSAGES } from "./messages";
import { QuickApply } from "./QuickApply";

/**
 * Die Stelle (fixtures.ts) und die Startsprache kommen aus der Toolbar
 * „Sprache“; als Control bleibt nur, ob die Sprache schon gewählt ist.
 */
type Args = { languageChosen: boolean };

function globalLanguage(globals: StoryContext["globals"]): QuickApplyLanguage {
  return isQuickApplyLanguage(globals.language) ? globals.language : "de";
}

const meta = {
  title: "Bewerbung/QuickApply",
  args: { languageChosen: false },
  argTypes: {
    languageChosen: { description: "Sprache kam schon per URL (?lang=…) – Sprachwahl überspringen." },
  },
  // `key`: neu einhängen, wenn die Toolbar-Sprache wechselt – die Komponente
  // merkt sich die Sprache sonst in ihrem eigenen State.
  render: (args, { globals }) => {
    const language = globalLanguage(globals);
    return (
      <QuickApply
        key={language}
        job={truckDriverJobFor(language)}
        initialLanguage={language}
        languageChosen={args.languageChosen}
      />
    );
  },
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;

type PlayContext = Parameters<NonNullable<Story["play"]>>[0];

/** Klickt den Schnell-Modus bis zur Datenschutz-Seite durch. */
async function fillQuickFlow({ canvasElement, globals, step }: PlayContext, firstName: string) {
  const canvas = within(canvasElement);
  const language = globalLanguage(globals);
  const t = QUICK_APPLY_MESSAGES[language];
  const job = truckDriverJobFor(language);

  await step("Modus „Schnell“ wählen", async () => {
    await userEvent.click(await canvas.findByText(t.modeQuick));
  });
  await step("Vorname", async () => {
    await userEvent.type(await canvas.findByRole("textbox", { name: t.firstNamePlaceholder }), firstName);
    await userEvent.click(canvas.getByRole("button", { name: t.next }));
  });
  await step("Telefon", async () => {
    await userEvent.type(await canvas.findByLabelText(t.phoneLabel), "0151 1234567");
    await userEvent.click(canvas.getByRole("button", { name: t.next }));
  });
  await step("Zwei Ja/Nein-Fragen und die Auswahlfrage", async () => {
    await canvas.findByText(job.questions[0]!.label);
    await userEvent.click(canvas.getByRole("button", { name: t.yes }));
    await canvas.findByText(job.questions[1]!.label);
    await userEvent.click(canvas.getByRole("button", { name: t.yes }));
    await userEvent.click(await canvas.findByRole("button", { name: job.questions[2]!.options[0]!.label }));
  });
  await step("Datenschutz bestätigen", async () => {
    await userEvent.click(await canvas.findByRole("checkbox"));
  });
  await step("Absenden", async () => {
    await userEvent.click(canvas.getByRole("button", { name: t.send }));
  });
  return { canvas, t };
}

/** Danke-Seite erscheint (mit kurzer Einblend-Verzögerung nach dem LKW). */
async function expectThanks(context: PlayContext, firstName: string) {
  const { canvas, t } = await fillQuickFlow(context, firstName);
  const title = await canvas.findByText(format(t.doneTitle, { name: firstName }), {}, { timeout: 5000 });
  await waitFor(() => expect(title).toBeVisible(), { timeout: 3000 });
  await expect(canvas.getByText(t.doneCall)).toBeInTheDocument();
  await expect(submitQuickApplicationAction).toHaveBeenCalledTimes(1);
}

/** Erster Bildschirm: Sprachwahl. */
export const Start: Story = {};

/** Sprache kam schon per URL (?lang=…) – es geht direkt mit der Modus-Wahl los. */
export const SpracheGewaehlt: Story = {
  name: "Sprache bereits gewählt",
  args: { languageChosen: true },
};

/** Schnell-Ablauf bis zur Danke-Seite. */
export const SchnellBewerbung: Story = {
  name: "Schnell-Bewerbung bis Danke",
  args: { languageChosen: true },
  parameters: { quickApplyMock: { submit: "success", delayMs: 300 } },
  play: (context) => expectThanks(context, "Mehmet"),
};

/** Server meldet „schon beworben“ (errorDuplicate). */
export const AbsendenFehler: Story = {
  name: "Absenden-Fehler (schon beworben)",
  args: { languageChosen: true },
  parameters: { quickApplyMock: { submit: "errorDuplicate", delayMs: 300 } },
  play: async (context) => {
    const { canvas, t } = await fillQuickFlow(context, "Mehmet");
    const alert = await canvas.findByRole("alert", {}, { timeout: 5000 });
    await expect(alert).toHaveTextContent(t.errorDuplicate);
  },
};

/** Langsamer Server: der Button zeigt „Wird gesendet …“ und ist gesperrt. */
export const Senden: Story = {
  name: "Wird gesendet (Verzögerung)",
  args: { languageChosen: true },
  parameters: { quickApplyMock: { submit: "success", delayMs: 600_000 } },
  play: async (context) => {
    const { canvas, t } = await fillQuickFlow(context, "Mehmet");
    await expect(await canvas.findByRole("button", { name: t.sending })).toBeDisabled();
  },
};

/** Arabisch, rechts nach links – unabhängig von der Toolbar. */
export const Arabisch: Story = {
  name: "Arabisch (RTL)",
  args: { languageChosen: true },
  globals: { language: "ar" },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector(".bs-quick")).toHaveAttribute("dir", "rtl");
  },
};

/** Arabisch: kompletter Schnell-Ablauf in RTL. */
export const ArabischSchnellBewerbung: Story = {
  name: "Arabisch (RTL) bis Danke",
  args: { languageChosen: true },
  globals: { language: "ar" },
  parameters: { quickApplyMock: { submit: "success", delayMs: 300 } },
  play: (context) => expectThanks(context, "Ahmad"),
};
