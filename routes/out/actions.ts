"use server";

import { headers } from "next/headers";
import { verifyOutputPin } from "../../index";
import { setOutputPinCookie } from "../../shared/output-pin-cookie";
import {
  checkPinAttempt,
  registerPinFailure,
  registerPinSuccess,
} from "../../runtime/pin-attempts";

export type SubmitOutputPinState = { error: string | null };

// x-forwarded-for — mesmo padrão de getClientIp em routes/api/output-events/route.ts (não
// compartilhado, poucas ocorrências). "desconhecido" quando não há proxy na frente: nesse caso
// todo mundo cai na mesma chave (token + "desconhecido"), o que é aceitável numa LAN — o limite
// ainda barra o brute force, só não separa por origem.
async function getClientIp(): Promise<string> {
  const forwardedFor = (await headers()).get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "desconhecido";
}

function formatRetry(seconds: number): string {
  const minutes = Math.ceil(seconds / 60);
  return minutes <= 1 ? "cerca de 1 minuto" : `cerca de ${minutes} minutos`;
}

// Sem revalidatePath — depois de um Server Action ligado a <form action={...}>, o Next já
// reexecuta os Server Components da rota atual sozinho (mesma página, mesmo token), então o
// próximo render de routes/out/page.tsx já lê o cookie recém-gravado e segue o fluxo normal.
export async function submitOutputPinAction(_prevState: SubmitOutputPinState, formData: FormData): Promise<SubmitOutputPinState> {
  const token = String(formData.get("token") ?? "").trim();
  const pin = String(formData.get("pin") ?? "").trim();
  if (!token || !pin) {
    return { error: "Informe o PIN." };
  }

  // Limitador de brute force por (token + IP), estado em memória (runtime/pin-attempts.ts). Um
  // admin pode zerar o contador de um token a qualquer momento (features/outputs/
  // reset-output-pin-attempts, botão no card da tela).
  const ip = await getClientIp();
  const gate = checkPinAttempt(token, ip);
  if (gate.blocked) {
    return { error: `Muitas tentativas. Tente de novo em ${formatRetry(gate.retryAfterSeconds)}.` };
  }

  const result = await verifyOutputPin({ token, candidate: pin });
  if (!result.success || !result.data.valid) {
    const afterFailure = registerPinFailure(token, ip);
    if (afterFailure.blocked) {
      return { error: `PIN incorreto. Bloqueado por ${formatRetry(afterFailure.retryAfterSeconds)} após tentativas seguidas.` };
    }
    return { error: "PIN incorreto." };
  }

  registerPinSuccess(token, ip);
  await setOutputPinCookie(token, pin);
  return { error: null };
}
