"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/**
 * Der Bier-Schneider-LKW (PRD v2 §6.1): blaues Fahrerhaus, Pritsche mit gelben
 * Getränkekisten. Fährt nach rechts; in RTL-Sprachen wird er gespiegelt.
 */
export function TruckSvg({
  moving = false,
  className,
  title,
}: {
  moving?: boolean;
  className?: string;
  title?: string;
}) {
  const reduce = useReducedMotion();
  const spin = moving && !reduce;
  const wheel = (cx: number) => (
    <motion.g
      style={{ originX: `${cx}px`, originY: "50px" }}
      animate={spin ? { rotate: 360 } : { rotate: 0 }}
      transition={spin ? { repeat: Infinity, duration: 0.45, ease: "linear" } : { duration: 0 }}
    >
      <circle cx={cx} cy={50} r={8} fill="var(--bs-tyre)" />
      <circle cx={cx} cy={50} r={3.5} fill="var(--bs-hub)" />
      <rect x={cx - 0.8} y={43} width={1.6} height={4} rx={0.8} fill="var(--bs-hub)" />
    </motion.g>
  );

  return (
    <svg
      viewBox="0 0 132 62"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {/* Pritsche mit Kisten: 3 × 2 Getränkekisten */}
      <rect x={4} y={36} width={80} height={6} rx={1.5} fill="var(--bs-asphalt)" />
      {[0, 1, 2].map((col) =>
        [0, 1].map((row) => (
          <g key={`${col}-${row}`}>
            <rect
              x={7 + col * 25.5}
              y={12 + row * 12}
              width={23.5}
              height={11}
              rx={1.5}
              fill="var(--bs-crate)"
            />
            {/* Flaschenhälse */}
            {[0, 1, 2, 3].map((b) => (
              <rect
                key={b}
                x={10 + col * 25.5 + b * 5}
                y={9.5 + row * 12}
                width={2.2}
                height={4}
                rx={1}
                fill="var(--bs-bottle)"
              />
            ))}
            <rect
              x={10 + col * 25.5}
              y={15.5 + row * 12}
              width={17.5}
              height={2}
              rx={1}
              fill="var(--bs-crate-shade)"
            />
          </g>
        )),
      )}
      {/* Fahrerhaus */}
      <path
        d="M86 18 h22 c4 0 7 2 9 5.5 l7 12 c.7 1.2 1 2.5 1 3.9 V44 c0 1.7-1.3 3-3 3 H86 Z"
        fill="var(--bs-brew)"
      />
      <path d="M92 22 h14.5 c2 0 3.6 1 4.6 2.8 l4.6 8.2 H92 Z" fill="var(--bs-window)" />
      <rect x={120} y={39} width={5} height={3} rx={1} fill="var(--bs-crate)" />
      <rect x={82} y={40} width={10} height={4} rx={1} fill="var(--bs-asphalt)" />
      {wheel(20)}
      {wheel(66)}
      {wheel(108)}
    </svg>
  );
}

/** Abgaswölkchen hinter dem LKW. */
function Puffs() {
  return (
    <span aria-hidden className="pointer-events-none absolute -start-4 bottom-2 flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block size-2.5 rounded-full bg-[var(--bs-puff)]"
          initial={{ opacity: 0.7, scale: 0.6, x: 0, y: 0 }}
          animate={{ opacity: 0, scale: 1.8, x: -14 - i * 6, y: -6 - i * 3 }}
          transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.25, ease: "easeOut" }}
        />
      ))}
    </span>
  );
}

/**
 * Fortschritt als Straße (PRD v2 §5.1 Nr. 5). Der LKW fährt nach jeder
 * abgeschlossenen Eingabe eine Station weiter.
 */
export function RoadProgress({
  step,
  total,
  label,
  rtl = false,
}: {
  step: number;
  total: number;
  label: string;
  rtl?: boolean;
}) {
  const reduce = useReducedMotion();
  // Der LKW „fährt“, solange die angezeigte Station noch nicht erreicht ist.
  const [settledStep, setSettledStep] = useState(step);
  const moving = !reduce && settledStep !== step;
  const ratio = total <= 1 ? 1 : Math.min(step / (total - 1), 1);

  useEffect(() => {
    const id = window.setTimeout(() => setSettledStep(step), 650);
    return () => window.clearTimeout(id);
  }, [step]);

  return (
    <div
      className="relative h-16 w-full select-none"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={Math.min(step + 1, total)}
      aria-valuetext={label}
    >
      {/* Straße mit Mittelstreifen */}
      <div className="absolute inset-x-0 bottom-1 h-5 rounded-full bg-[var(--bs-asphalt)]">
        <div className="absolute inset-x-4 top-1/2 h-0.5 -translate-y-1/2 bg-[repeating-linear-gradient(90deg,var(--bs-lane)_0_14px,transparent_14px_26px)] opacity-80" />
      </div>
      {/* Stationen */}
      {Array.from({ length: total }, (_, i) => {
        const pos = total <= 1 ? 100 : (i / (total - 1)) * 100;
        return (
          <span
            key={i}
            aria-hidden
            className={
              "absolute bottom-7 size-2.5 -translate-x-1/2 rounded-full border-2 border-[var(--bs-asphalt)] " +
              (i <= step ? "bg-[var(--bs-crate)]" : "bg-[var(--bs-surface)]")
            }
            style={rtl ? { right: `calc(${pos}% - 5px)` } : { left: `calc(${pos}% )` }}
          />
        );
      })}
      <motion.div
        className="absolute bottom-2 w-20"
        style={rtl ? { right: 0 } : { left: 0 }}
        initial={false}
        animate={
          rtl
            ? { right: `calc(${ratio * 100}% - ${ratio * 80}px)` }
            : { left: `calc(${ratio * 100}% - ${ratio * 80}px)` }
        }
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 90, damping: 16 }}
      >
        <motion.div
          animate={moving ? { y: [0, -1.5, 0, -1, 0] } : { y: 0 }}
          transition={{ duration: 0.6 }}
          className={rtl ? "-scale-x-100" : undefined}
        >
          <TruckSvg moving={moving} className="w-20" />
          {moving ? <Puffs /> : null}
        </motion.div>
      </motion.div>
    </div>
  );
}

/**
 * Der LKW fährt einmal über die ganze Seite (beim Absenden, PRD v2 §6.1).
 * Blockiert nie: pointer-events-none, max. 900 ms, danach onDone.
 */
export function DriveAcross({
  active,
  rtl = false,
  onDone,
}: {
  active: boolean;
  rtl?: boolean;
  onDone?: () => void;
}) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (active && reduce) onDone?.();
  }, [active, reduce, onDone]);

  return (
    <AnimatePresence>
      {active && !reduce ? (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 bottom-[18vh] z-50 overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-40"
            initial={{ x: rtl ? "100vw" : "-12rem" }}
            animate={{ x: rtl ? "-12rem" : "100vw" }}
            transition={{ duration: 0.9, ease: [0.5, 0, 0.2, 1] }}
            onAnimationComplete={() => onDone?.()}
          >
            <div className={rtl ? "-scale-x-100" : undefined}>
              <TruckSvg moving className="w-40 drop-shadow-sm" />
              <Puffs />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/**
 * Mini-LKW, der über einen Button rollt (PRD v2 §6.1). Wird vom Button über
 * `rolling` ausgelöst; der Button bleibt dabei bedienbar.
 */
export function ButtonTruck({ rolling, rtl = false }: { rolling: boolean; rtl?: boolean }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <AnimatePresence>
      {rolling ? (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 flex w-12 items-end pb-0.5"
          style={rtl ? { right: 0 } : { left: 0 }}
          initial={{ x: rtl ? "3rem" : "-3rem" }}
          animate={{ x: rtl ? "-110vw" : "110vw" }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeIn" }}
        >
          <span className={rtl ? "-scale-x-100" : undefined}>
            <TruckSvg moving className="w-12" />
          </span>
        </motion.span>
      ) : null}
    </AnimatePresence>
  );
}
