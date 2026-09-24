import { useState } from "react";
import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";

import { format, QUICK_APPLY_MESSAGES } from "./messages";
import { DriveAcross, RoadProgress, TruckSvg } from "./Truck";

/** Die LKW-Teile brauchen die Farbvariablen aus `.bs-quick`. */
const withQuickTheme: Decorator = (Story) => (
  <div className="bs-quick" style={{ padding: "1.5rem 1rem" }}>
    <Story />
  </div>
);

const meta = {
  title: "Bewerbung/Truck",
  decorators: [withQuickTheme],
} satisfies Meta;

export default meta;

export const Lkw: StoryObj<typeof TruckSvg> = {
  name: "TruckSvg",
  args: { moving: false, title: "Bier-Schneider-LKW", className: "w-64" },
  render: (args) => <TruckSvg {...args} />,
};

export const LkwFaehrt: StoryObj<typeof TruckSvg> = {
  name: "TruckSvg (fährt)",
  args: { moving: true, className: "w-64" },
  render: (args) => <TruckSvg {...args} />,
};

export const Strasse: StoryObj<typeof RoadProgress> = {
  name: "RoadProgress",
  args: { step: 2, total: 6, rtl: false, label: "" },
  argTypes: {
    step: { control: { type: "range", min: 0, max: 10, step: 1 } },
    total: { control: { type: "range", min: 1, max: 10, step: 1 } },
    rtl: { control: "boolean" },
    label: { table: { disable: true } },
  },
  render: (args) => {
    const label = format(QUICK_APPLY_MESSAGES.de.stepOf, {
      current: Math.min(args.step + 1, args.total),
      total: args.total,
    });
    return (
      <div dir={args.rtl ? "rtl" : "ltr"}>
        <p className="bs-hint text-center">{label}</p>
        <RoadProgress {...args} label={label} />
      </div>
    );
  },
};

export const StrasseRtl: StoryObj<typeof RoadProgress> = {
  ...Strasse,
  name: "RoadProgress (RTL)",
  args: { step: 1, total: 5, rtl: true, label: "" },
};

function DriveAcrossDemo({ rtl }: { rtl: boolean }) {
  const [active, setActive] = useState(true);
  return (
    <div className="flex flex-col items-start gap-4">
      <button type="button" className="bs-button" onClick={() => setActive(true)} disabled={active}>
        Nochmal fahren
      </button>
      <p className="bs-hint">{active ? "LKW fährt …" : "Angekommen."}</p>
      <DriveAcross active={active} rtl={rtl} onDone={() => setActive(false)} />
    </div>
  );
}

export const QuerDurchsBild: StoryObj<typeof DriveAcrossDemo> = {
  name: "DriveAcross",
  args: { rtl: false },
  render: (args) => <DriveAcrossDemo {...args} />,
};
