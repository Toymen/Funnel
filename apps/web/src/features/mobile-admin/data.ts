import "server-only";

import { applications, db } from "@harly/db";
import { and, eq, inArray, sql } from "drizzle-orm";

import { getWorkspaceContext } from "@/features/workspaces/context";

import { parseQuickApply, type QuickApplyInfo } from "./quick-contact";

/**
 * Lädt `snapshot.quickApply` für die angegebenen Bewerbungen des aktuellen
 * Arbeitsbereichs. Eigener, kleiner Query statt Änderungen an Harlys großen
 * Profil- und Listen-Queries (Upstream-Merges bleiben klein, siehe UPSTREAM.md).
 * Die Aufrufer haben die Sichtrechte auf die Bewerbungen bereits geprüft.
 */
export async function getQuickApplyByApplicationIds(
  applicationIds: readonly string[],
): Promise<Map<string, QuickApplyInfo>> {
  const ids = [...new Set(applicationIds)].filter(Boolean);
  const result = new Map<string, QuickApplyInfo>();
  if (ids.length === 0) return result;

  const { organization: workspace } = await getWorkspaceContext();
  const rows = await db
    .select({
      id: applications.id,
      quickApply: sql<unknown>`${applications.snapshot} -> 'quickApply'`,
    })
    .from(applications)
    .where(
      and(
        eq(applications.workspaceId, workspace.id),
        inArray(applications.id, ids),
      ),
    );

  for (const row of rows) {
    const info = parseQuickApply(row.quickApply);
    if (info) result.set(row.id, info);
  }
  return result;
}
