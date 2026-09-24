import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { columnsFor, pipelineApplications, pipelineStages } from "./fixtures";
import {
  type MobilePipelineApplication,
  MobilePipelineColumns,
} from "./MobilePipelineColumns";

type Args = { onMove: (applicationId: string, toStageId: string) => void };

/** Hält die Karten im Story-State, damit ein Stufenwechsel sichtbar wird. */
function Board({ onMove }: Args) {
  const [applications, setApplications] =
    useState<MobilePipelineApplication[]>(pipelineApplications);
  return (
    <div lang="de" dir="ltr" className="min-h-dvh bg-pure-snow px-4 py-4">
      <MobilePipelineColumns
        stages={pipelineStages}
        columns={columnsFor(pipelineStages, applications)}
        onMove={(applicationId, toStageId) => {
          onMove(applicationId, toStageId);
          setApplications((current) =>
            current.map((a) =>
              a.id === applicationId ? { ...a, currentStageId: toStageId } : a,
            ),
          );
        }}
      />
    </div>
  );
}

/**
 * Kanban auf dem Handy: wischbare Spalten (Scroll-Snap), Stufen-Chips zum
 * Springen, Statuswechsel per Auswahlfeld statt Drag & Drop (PRD §11.1).
 */
const meta = {
  title: "HR-Bereich/MobilePipelineColumns",
  args: { onMove: fn() },
  render: (args) => <Board {...args} />,
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Standard: Story = {};

/** Stufe per Auswahlfeld wechseln: Karte wandert in die neue Spalte. */
export const StufeWechseln: Story = {
  name: "Stufe per Auswahl wechseln",
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    await step("Anna nach „Kontakt“", async () => {
      await userEvent.selectOptions(
        canvas.getByRole("combobox", { name: "Stufe für Anna ändern" }),
        "Kontakt",
      );
    });
    await expect(args.onMove).toHaveBeenCalledWith("a1", "s-kontakt");
    await expect(
      canvas.getByRole("button", { name: "Kontakt, 2 Bewerbungen" }),
    ).toBeInTheDocument();
  },
};

/** Endstufe: ohne Bestätigung passiert nichts. */
export const EndstufeAbbrechen: Story = {
  name: "Endstufe braucht Bestätigung",
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const confirm = window.confirm;
    window.confirm = () => false;
    try {
      await userEvent.selectOptions(
        canvas.getByRole("combobox", { name: "Stufe für Anna ändern" }),
        "Abgesagt",
      );
    } finally {
      window.confirm = confirm;
    }
    await expect(args.onMove).not.toHaveBeenCalled();
  },
};

/** Stufen-Chip antippen springt zur Spalte und markiert sie. */
export const ChipSprung: Story = {
  name: "Zur Stufe springen",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const chip = canvas.getByRole("button", { name: "Kontakt, 1 Bewerbung" });
    await userEvent.click(chip);
    await expect(chip).toHaveAttribute("aria-current", "true");
  },
};
