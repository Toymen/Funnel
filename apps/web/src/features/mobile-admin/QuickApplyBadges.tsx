import { Languages, Mic, PhoneIncoming, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { languageInfo } from "@/features/quick-apply/languages";
import { cn } from "@/lib/utils";

import {
  MOBILE_ADMIN_TEXT,
  modeLabel,
  type QuickApplyInfo,
  type QuickApplyMode,
} from "./quick-contact";

const MODE_ICON = {
  quick: Zap,
  callback: PhoneIncoming,
  voice: Mic,
} satisfies Record<QuickApplyMode, typeof Zap>;

/**
 * Badges für Sprache und Modus einer Kurzbewerbung (PRD §11).
 * Rendert nichts, wenn keine Kurzbewerbungsdaten vorliegen.
 */
export function QuickApplyBadges({
  info,
  className,
}: {
  info: QuickApplyInfo | null;
  className?: string;
}) {
  if (!info) return null;
  const mode = modeLabel(info);
  const ModeIcon = info.mode ? MODE_ICON[info.mode] : null;
  const language = info.language ? languageInfo(info.language) : null;

  return (
    <ul
      aria-label={MOBILE_ADMIN_TEXT.badgesLabel}
      className={cn(
        "relative flex min-w-0 flex-wrap items-center gap-1.5",
        className,
      )}
    >
      {language ? (
        <li className="min-w-0">
          <Badge variant="info" className="relative max-w-full">
            <Languages aria-hidden />
            <span className="sr-only">{MOBILE_ADMIN_TEXT.languagePrefix}</span>
            <span
              lang={language.code === "de-easy" ? "de" : language.code}
              dir={language.dir}
              className="truncate"
            >
              {language.name}
            </span>
          </Badge>
        </li>
      ) : null}
      {mode && ModeIcon ? (
        <li className="min-w-0">
          <Badge
            variant={info.mode === "callback" ? "warning" : "neutral"}
            className="max-w-full"
          >
            <ModeIcon aria-hidden />
            <span className="truncate">{mode}</span>
          </Badge>
        </li>
      ) : null}
    </ul>
  );
}
