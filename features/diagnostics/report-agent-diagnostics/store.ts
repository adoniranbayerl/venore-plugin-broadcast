import { eq, sql } from "drizzle-orm";
import { db } from "@venore/plugin-sdk";
import { broadcastOutputDiagEvents, broadcastOutputDiagnostics, broadcastOutputs } from "../../../database/schema";
import type { BroadcastAgentDiagnosticsSnapshot } from "../../../contracts/types";

export async function findOutputIdByToken(token: string): Promise<string | null> {
  const [row] = await db.select({ id: broadcastOutputs.id }).from(broadcastOutputs).where(eq(broadcastOutputs.token, token)).limit(1);
  return row?.id ?? null;
}

export async function upsertAgentSnapshot(input: {
  outputId: string;
  snapshot: BroadcastAgentDiagnosticsSnapshot;
  stationLabel: string | null;
}): Promise<void> {
  await db
    .insert(broadcastOutputDiagnostics)
    .values({
      outputId: input.outputId,
      agentSnapshot: input.snapshot,
      agentReportedAt: sql`now()`,
      agentStationLabel: input.stationLabel,
      updatedAt: sql`now()`,
    })
    .onConflictDoUpdate({
      target: broadcastOutputDiagnostics.outputId,
      set: {
        agentSnapshot: input.snapshot,
        agentReportedAt: sql`now()`,
        agentStationLabel: input.stationLabel,
        updatedAt: sql`now()`,
      },
    });
}

export async function insertDiagEvent(input: { outputId: string; message: string; detail: Record<string, unknown> }): Promise<void> {
  await db.insert(broadcastOutputDiagEvents).values({
    outputId: input.outputId,
    source: "agent",
    level: "warning",
    message: input.message,
    detail: input.detail,
  });
}
