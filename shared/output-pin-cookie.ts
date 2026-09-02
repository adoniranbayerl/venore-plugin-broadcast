import { cookies } from "next/headers";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// Um cookie por saída (não um só pro plugin inteiro) — token já identifica a saída de forma única,
// então cada TV só carrega o PIN que ela mesma desbloqueou, nunca o de outra saída. Mesmo padrão de
// platform/nav-mode (cookie, não localStorage — precisa estar disponível no primeiro render do
// Server Component em routes/out/page.tsx, antes de qualquer JS de cliente rodar).
function outputPinCookieName(token: string): string {
  return `broadcast-output-pin-${token}`;
}

// Lido em Server Component (routes/out/page.tsx) e em Route Handlers (routes/api/output-state,
// routes/api/output-events) — os três precisam da mesma checagem antes de expor dado da saída.
export async function readOutputPinCookie(token: string): Promise<string | null> {
  const store = await cookies();
  return store.get(outputPinCookieName(token))?.value ?? null;
}

// Só chamável de dentro de uma Server Action (routes/out/actions.ts) — Server Component em modo de
// leitura não pode escrever cookie. O valor é o PIN que a TV digitou (não o hash): cada request
// seguinte reenvia esse cookie como `candidate` e verify-output-pin re-confere contra o hash da
// coluna. `secure: true` — o cookie só trafega em HTTPS (a saída de TV deve rodar atrás de TLS).
export async function setOutputPinCookie(token: string, pin: string): Promise<void> {
  const store = await cookies();
  store.set(outputPinCookieName(token), pin, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });
}
