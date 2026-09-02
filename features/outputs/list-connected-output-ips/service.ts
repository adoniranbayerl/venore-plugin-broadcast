import { getConnectedOutputIps } from "../../../runtime/output-bus";
import type { ListConnectedOutputIpsResult } from "./types";

// Só embrulha a leitura do bus em memória no formato OperationResult — nenhuma regra de negócio,
// nenhum I/O (getConnectedOutputIps percorre um Map por processo, ver runtime/output-bus.ts). O
// handler é quem autoriza (authorizeActor("broadcast.manage")); antes desta feature a action
// chamava getConnectedOutputIps direto pelo barrel, sem gate nenhum.
export async function listConnectedOutputIps(): Promise<ListConnectedOutputIpsResult> {
  return { success: true, data: getConnectedOutputIps() };
}
