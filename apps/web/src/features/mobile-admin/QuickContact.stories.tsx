import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import {
  callbackContact,
  classicContact,
  emailOnlyContact,
  voiceContact,
} from "./fixtures";
import { QuickContact, QuickContactBar } from "./QuickContact";

type Args = React.ComponentProps<typeof QuickContact>;

/**
 * Bewerberdetail im HR-Bereich: Kontakt-Karte mit Badges und die feste
 * Aktionsleiste unten (nur auf dem Handy, unter 640 px).
 */
const meta = {
  title: "HR-Bereich/QuickContact",
  component: QuickContact,
  args: { ...callbackContact },
  render: (args) => (
    <div lang="de" dir="ltr" className="min-h-dvh bg-pure-snow p-4">
      <QuickContact {...args} />
      <QuickContactBar {...args} />
    </div>
  ),
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Kurzbewerbung mit Rückrufwunsch: Anrufen ist Hauptaktion, keine Mail an die Platzhalteradresse. */
export const Rueckruf: Story = {
  name: "Rückrufwunsch (abends)",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText("Rückruf gewünscht · abends"),
    ).toBeInTheDocument();
    await expect(canvas.getByText("Bitte abends anrufen")).toBeInTheDocument();
    const call = canvas.getAllByRole("link", {
      name: "Oleksandr Kowalenko anrufen",
    });
    await expect(call[0]).toHaveAttribute("href", "tel:+4917612345678");
    await expect(
      canvas.getAllByRole("link", {
        name: "SMS an Oleksandr Kowalenko schreiben",
      })[0],
    ).toHaveAttribute("href", "sms:+4917612345678");
    await expect(canvasElement.querySelector('a[href^="mailto:"]')).toBeNull();
  },
};

/** Sprachnachricht mit Telefon und echter E-Mail: drei Aktionen. */
export const Sprachnachricht: Story = {
  args: { ...voiceContact },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Sprachnachricht")).toBeInTheDocument();
    await expect(
      canvas.getAllByRole("link", {
        name: "E-Mail an Mehmet Yılmaz schreiben",
      })[0],
    ).toHaveAttribute("href", "mailto:mehmet.yilmaz@example.com");
  },
};

/** Nur E-Mail: Mail ist die Hauptaktion. */
export const NurEmail: Story = {
  name: "Nur E-Mail",
  args: { ...emailOnlyContact },
};

/** Klassische Bewerbung ohne Kurzbewerbungsdaten: keine Badges, trotzdem Ein-Tipp-Kontakt. */
export const KlassischeBewerbung: Story = {
  args: { ...classicContact },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).queryByRole("list", { name: "Kurzbewerbung" }),
    ).toBeNull();
  },
};

/** Anonymisierte Prüfung (Harlys IdentityShield): keine Kontaktlinks. */
export const Anonymisiert: Story = {
  args: { ...callbackContact, anonymized: true },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('a[href^="tel:"]')).toBeNull();
  },
};

/** Arabisch: der Sprachname steht in eigener Schrift, rechts nach links. */
export const Arabisch: Story = {
  args: {
    name: "أحمد",
    phone: "0151 3470713",
    email: "tel-491513470713@kurzbewerbung.invalid",
    quickApply: { language: "ar", mode: "quick", callbackWindow: null },
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("العربية")).toHaveAttribute(
      "dir",
      "rtl",
    );
  },
};
