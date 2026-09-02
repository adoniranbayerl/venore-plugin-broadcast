import type { OperationResult } from "@venore/plugin-sdk";

// Mapa "token da saída" → lista de IPs que estão com aquela tela aberta agora (uma entrada por
// conexão SSE viva). Lido de um Map em memória (runtime/output-bus), sem I/O — ver service.ts.
export type ListConnectedOutputIpsResult = OperationResult<Record<string, string[]>>;
