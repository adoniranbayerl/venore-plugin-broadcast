import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getSetting } from "@venore/plugin-sdk/settings";
import { BROADCAST_SETTINGS } from "../../../shared/settings";
import { findOutputNameByToken } from "./store";
import type { GenerateAgentScriptCommand, GenerateAgentScriptResult } from "./types";

// scripts/broadcast-diag-agent.ps1 fica FORA de features/ de propósito (não é código do plugin,
// é um artefato pra rodar num PC de TV) — resolvido por caminho relativo ao próprio arquivo
// (import.meta.url), não por um import de módulo (TS/webpack não sabe carregar .ps1 como código).
// Continua funcionando tanto rodando a partir do source quanto de dentro de node_modules/@venore/
// plugin-broadcast/ (git dependency instala o repositório inteiro, o arquivo existe fisicamente
// nos dois casos).
const TEMPLATE_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../../scripts/broadcast-diag-agent.ps1");

// Remove acento (NFD separa a letra da marca combinante, ̀-ͯ cobre as marcas) antes de
// reduzir a [a-z0-9-] — "Recepção" -> "recepcao", pro nome do arquivo baixado nunca depender de
// como o navegador/SO trata acento em Content-Disposition.
function slugify(value: string): string {
  return (
    value
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "estacao"
  );
}

export async function generateAgentScript(command: GenerateAgentScriptCommand): Promise<GenerateAgentScriptResult> {
  const outputName = await findOutputNameByToken(command.token);
  if (!outputName) {
    return { success: false, error: { code: "broadcast.generate-agent-script.not_found", message: "Saída não encontrada." } };
  }

  const agentKeySetting = await getSetting({ key: BROADCAST_SETTINGS.diagnosticsAgentKey.key });
  const agentKey = agentKeySetting.success && typeof agentKeySetting.data?.value === "string" ? agentKeySetting.data.value : "";
  // Sem isso, o script baixado teria $AgentKey = "" e todo report do PC seria rejeitado em
  // silêncio (report-agent-diagnostics.invalid_key) — melhor recusar o download com uma mensagem
  // clara do que entregar um script que nunca vai funcionar.
  if (!agentKey) {
    return {
      success: false,
      error: {
        code: "broadcast.generate-agent-script.no_agent_key",
        message: "Gere a chave do agent em /admin/broadcast/diagnostics antes de baixar o script.",
      },
    };
  }

  const template = await readFile(TEMPLATE_PATH, "utf8");
  const content = template
    .replaceAll("__SERVER_URL__", command.serverUrl)
    .replaceAll("__OUTPUT_TOKEN__", command.token)
    .replaceAll("__AGENT_KEY__", agentKey)
    .replaceAll("__STATION_LABEL__", outputName);

  return { success: true, data: { filename: `broadcast-diag-agent-${slugify(outputName)}.ps1`, content } };
}
