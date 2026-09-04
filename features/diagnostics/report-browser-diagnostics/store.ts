import { eq, sql } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { broadcastOutputDiagEvents, broadcastOutputDiagnostics, broadcastOutputs } from "../../../database/schema";
import type { BroadcastBrowserDiagnosticsSnapshot } from "../../../contracts/types";

export async function findOutputIdByToken(token: string): Promise<string | null> {
  const [row] = await db.select({ id: broadcastOutputs.id }).from(broadcastOutputs).where(eq(broadcastOutputs.token, token)).limit(1);
  return row?.id ?? null;
}

// Upsert por outputId (índice único broadcast_output_diagnostics_output_id_idx) — "estado agora",
// nunca uma linha nova por report (ver comentário no schema).
export async function upsertBrowserSnapshot(input: { outputId: string; snapshot: BroadcastBrowserDiagnosticsSnapshot }): Promise<void> {
  await db
    .insert(broadcastOutputDiagnostics)
    .values({ outputId: input.outputId, browserSnapshot: input.snapshot, browserReportedAt: sql`now()`, updatedAt: sql`now()` })
    .onConflictDoUpdate({
      target: broadcastOutputDiagnostics.outputId,
      set: { browserSnapshot: input.snapshot, browserReportedAt: sql`now()`, updatedAt: sql`now()` },
    });
}

export async function insertDiagEvent(input: { outputId: string; message: string; detail: Record<string, unknown> }): Promise<void> {
  await db.insert(broadcastOutputDiagEvents).values({
    outputId: input.outputId,
    source: "browser",
    level: "warning",
    message: input.message,
    detail: input.detail,
  });
}
