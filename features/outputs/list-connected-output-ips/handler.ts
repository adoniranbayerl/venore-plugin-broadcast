import { authorizeActor } from "@venore/plugin-sdk/rbac";
import { listConnectedOutputIps } from "./service";
import type { ListConnectedOutputIpsResult } from "./types";

// Só broadcast.manage — saber quais TVs (IPs) estão com cada tela aberta agora é visão de quem
// administra as saídas por inteiro, não de um editor de escopo estreito (mesmo critério de
// set-agenda-outputs, ver index.ts). Chamado pelo poll do admin em outputs-section.tsx.
export async function listConnectedOutputIpsHandler(): Promise<ListConnectedOutputIpsResult> {
  const authz = await authorizeActor("broadcast.manage");
  if (!authz.authorized) {
    return { success: false, error: authz.error };
  }

  return listConnectedOutputIps();
}
