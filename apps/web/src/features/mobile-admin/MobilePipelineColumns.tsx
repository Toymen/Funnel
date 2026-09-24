"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { UserAvatar } from "@/components/ui/UserAvatar";
import type {
  PipelineApplication,
  PipelineStage,
} from "@/features/pipeline/data";
import { cn } from "@/lib/utils";

import {
  columnIndexForScroll,
  isTerminalStageName,
  moveConfirmationMessage,
} from "./mobile-pipeline";
import { MOBILE_ADMIN_TEXT } from "./quick-contact";
import { QuickApplyBadges } from "./QuickApplyBadges";

export type MobilePipelineStage = Pick<PipelineStage, "id" | "name" | "color">;
export type MobilePipelineApplication = Pick<
  PipelineApplication,
  | "id"
  | "candidateId"
  | "candidateFirstName"
  | "candidateLastName"
  | "candidateAvatarUrl"
  | "candidateAvatarFallbackSrcs"
  | "currentStageId"
  | "quickApply"
>;

type MobilePipelineColumnsProps = {
  stages: MobilePipelineStage[];
  columns: ReadonlyMap<string, MobilePipelineApplication[]>;
  disabled?: boolean;
  /** Wird nur bei echtem Stufenwechsel aufgerufen (nach Bestätigung bei Endstufen). */
  onMove: (applicationId: string, toStageId: string) => void;
};

const FALLBACK_COLOR = "#a1a1aa";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Kanban auf dem Handy (PRD §11.1): Spalten nebeneinander mit Scroll-Snap zum
 * Wischen, darüber Stufen-Chips zum Springen. Der Statuswechsel läuft über ein
 * Auswahlfeld je Karte statt über Drag & Drop.
 */
export function MobilePipelineColumns({
  stages,
  columns,
  disabled = false,
  onMove,
}: MobilePipelineColumnsProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef(new Map<string, HTMLButtonElement>());
  const [activeIndex, setActiveIndex] = useState(0);

  const activeStageId = stages[activeIndex]?.id;
  useEffect(() => {
    if (!activeStageId) return;
    chipRefs.current
      .get(activeStageId)
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeStageId]);

  function handleScroll() {
    const scroller = scrollerRef.current;
    const first = scroller?.firstElementChild;
    if (!scroller || !(first instanceof HTMLElement)) return;
    const gap = Number.parseFloat(getComputedStyle(scroller).columnGap) || 0;
    setActiveIndex(
      columnIndexForScroll(
        scroller.scrollLeft,
        first.offsetWidth + gap,
        stages.length,
      ),
    );
  }

  function jumpTo(index: number) {
    const column = scrollerRef.current?.children.item(index);
    if (!(column instanceof HTMLElement)) return;
    setActiveIndex(index);
    column.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "nearest",
      inline: "start",
    });
  }

  function handleStageChange(
    application: MobilePipelineApplication,
    toStageId: string,
  ) {
    if (toStageId === application.currentStageId) return;
    const target = stages.find((stage) => stage.id === toStageId);
    if (!target) return;
    const name =
      `${application.candidateFirstName} ${application.candidateLastName}`.trim();
    if (
      isTerminalStageName(target.name) &&
      !window.confirm(moveConfirmationMessage(name, target.name))
    )
      return;
    onMove(application.id, toStageId);
  }

  return (
    <div className="space-y-3">
      <nav
        aria-label={MOBILE_ADMIN_TEXT.stageColumns}
        className="relative -mx-4 overflow-x-auto px-4"
      >
        <ul className="flex w-max gap-2 pb-1">
          {stages.map((stage, index) => {
            const count = columns.get(stage.id)?.length ?? 0;
            const active = index === activeIndex;
            return (
              <li key={stage.id}>
                <button
                  type="button"
                  ref={(node) => {
                    if (node) chipRefs.current.set(stage.id, node);
                    else chipRefs.current.delete(stage.id);
                  }}
                  aria-current={active ? "true" : undefined}
                  aria-label={MOBILE_ADMIN_TEXT.stageCount(stage.name, count)}
                  onClick={() => jumpTo(index)}
                  className={cn(
                    "flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-near-ink",
                    active
                      ? "border-near-ink bg-near-ink text-pure-snow"
                      : "border-hairline bg-pure-snow text-near-ink",
                  )}
                >
                  <span
                    aria-hidden
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: stage.color ?? FALLBACK_COLOR }}
                  />
                  {stage.name}
                  <span className="tabular-nums opacity-70">{count}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <p className="sr-only">{MOBILE_ADMIN_TEXT.stageColumnsHint}</p>

      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="relative -mx-4 flex snap-x snap-mandatory items-start gap-3 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 pb-2"
      >
        {stages.map((stage) => {
          const items = columns.get(stage.id) ?? [];
          const headingId = `mobile-stage-${stage.id}`;
          return (
            <section
              key={stage.id}
              aria-labelledby={headingId}
              className="w-[85%] max-w-sm shrink-0 snap-start rounded-[var(--radius-lg)] bg-warm-paper p-2"
            >
              <h3
                id={headingId}
                className="flex items-center gap-2 px-1 py-2 text-sm font-semibold text-near-ink"
              >
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: stage.color ?? FALLBACK_COLOR }}
                />
                <span className="truncate">{stage.name}</span>
                <span className="ms-auto tabular-nums text-soft-ink">
                  {items.length}
                </span>
              </h3>
              {items.length === 0 ? (
                <p className="rounded-[var(--radius-md)] p-6 text-center text-[13px] text-soft-ink">
                  {MOBILE_ADMIN_TEXT.emptyStage}
                </p>
              ) : (
                <ul className="space-y-2">
                  {items.map((application) => {
                    const name =
                      `${application.candidateFirstName} ${application.candidateLastName}`.trim();
                    return (
                      <li
                        key={application.id}
                        className="rounded-[var(--radius-md)] border border-hairline bg-pure-snow p-2.5"
                      >
                        <Link
                          href={`/dashboard/candidates/${application.candidateId}`}
                          className="flex min-h-11 min-w-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-near-ink"
                        >
                          <UserAvatar
                            name={name}
                            src={application.candidateAvatarUrl}
                            fallbackSrcs={
                              application.candidateAvatarFallbackSrcs
                            }
                            size="sm"
                          />
                          <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-near-ink">
                            {name}
                          </span>
                        </Link>
                        <QuickApplyBadges
                          info={application.quickApply ?? null}
                          className="mt-1.5"
                        />
                        <select
                          aria-label={MOBILE_ADMIN_TEXT.stageSelect(name)}
                          value={application.currentStageId}
                          disabled={disabled}
                          onChange={(event) =>
                            handleStageChange(application, event.target.value)
                          }
                          className="mt-2 min-h-11 w-full rounded-full border border-hairline bg-pure-snow px-3 text-sm text-near-ink disabled:opacity-50"
                        >
                          {stages.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
