import { Mail, MessageSquare, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  type ContactAction,
  type ContactActionKind,
  contactActions,
  type ContactInput,
  MOBILE_ADMIN_TEXT,
} from "./quick-contact";
import { QuickApplyBadges } from "./QuickApplyBadges";

const ICON = {
  call: Phone,
  sms: MessageSquare,
  email: Mail,
} satisfies Record<ContactActionKind, typeof Phone>;

type QuickContactProps = ContactInput & {
  /** Identität ist anonymisiert (Harlys IdentityShield): keine Kontaktlinks zeigen. */
  anonymized?: boolean;
  className?: string;
};

function ActionLink({
  action,
  className,
}: {
  action: ContactAction;
  className?: string;
}) {
  const Icon = ICON[action.kind];
  return (
    <Button
      asChild
      variant={action.primary ? "default" : "outline"}
      className={cn("min-h-11 px-4", className)}
    >
      <a href={action.href} aria-label={action.ariaLabel}>
        <Icon aria-hidden className="size-4" />
        {action.label}
      </a>
    </Button>
  );
}

function callbackHint(input: ContactInput): string | null {
  const qa = input.quickApply;
  if (qa?.mode !== "callback" || !qa.callbackWindow) return null;
  return MOBILE_ADMIN_TEXT.callbackHint(
    MOBILE_ADMIN_TEXT.callbackWindow[qa.callbackWindow],
  );
}

/**
 * Kontakt-Karte im Bewerberdetail: Badges (Sprache, Modus, Rückrufzeit) und
 * Ein-Tipp-Aktionen. Auf dem Handy sitzen die Aktionen in {@link QuickContactBar}
 * am unteren Rand (Daumenzone), hier nur ab `sm`.
 */
export function QuickContact({
  anonymized = false,
  className,
  ...input
}: QuickContactProps) {
  const actions = anonymized ? [] : contactActions(input);
  const hint = callbackHint(input);

  return (
    <section
      aria-label={MOBILE_ADMIN_TEXT.contactHeading}
      className={cn(
        "rounded-2xl border border-border/70 bg-card p-4 sm:p-5",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="text-sm font-semibold text-foreground">
          {MOBILE_ADMIN_TEXT.contactHeading}
        </h2>
        <QuickApplyBadges info={input.quickApply ?? null} />
      </div>
      {hint ? (
        <p className="mt-2 text-sm font-medium text-warning-clay">{hint}</p>
      ) : null}
      {anonymized ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {MOBILE_ADMIN_TEXT.anonymized}
        </p>
      ) : actions.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {MOBILE_ADMIN_TEXT.noContact}
        </p>
      ) : (
        <div className="mt-3 hidden flex-wrap gap-2 sm:flex">
          {actions.map((action) => (
            <ActionLink key={action.kind} action={action} />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * Feste Aktionsleiste am unteren Bildschirmrand, nur auf dem Handy (< sm).
 * Enthält einen Platzhalter, damit der letzte Seiteninhalt nicht verdeckt wird.
 * Gehört ans Ende des Seiteninhalts.
 */
export function QuickContactBar({
  anonymized = false,
  ...input
}: QuickContactProps) {
  const actions = anonymized ? [] : contactActions(input);
  if (actions.length === 0) return null;

  return (
    <>
      <div aria-hidden className="h-16 sm:hidden" />
      <nav
        aria-label={MOBILE_ADMIN_TEXT.contactBarLabel}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-card/95 px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur sm:hidden"
      >
        <div className="grid auto-cols-fr grid-flow-col gap-2">
          {actions.map((action) => (
            <ActionLink key={action.kind} action={action} className="w-full" />
          ))}
        </div>
      </nav>
    </>
  );
}
