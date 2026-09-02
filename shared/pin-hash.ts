import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

// Mesmo formato/algoritmo canônico de senha do projeto (`scrypt$<saltBase64>$<hashBase64>`,
// scrypt do node:crypto com custo padrão N=16384/r=8/p=1, 64 bytes derivados de um salt de 16) —
// DUPLICADO de propósito de contexts/auth/features/identity/password-hashing.ts: aquele módulo é
// interno do context de auth e não é reexportado pelo barrel, e um plugin não pode importar
// internals de um context (regra 7/8 do AGENTS.md). Sem dependência nova — node:crypto já é do
// runtime. Usado por verify-output-pin (comparação) e set-output-pin (gravação).
const scrypt = promisify(scryptCallback);
const DERIVED_KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const HASH_PREFIX = "scrypt$";

export async function hashPin(pin: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derived = (await scrypt(pin, salt, DERIVED_KEY_LENGTH)) as Buffer;
  return `${HASH_PREFIX}${salt.toString("base64")}$${derived.toString("base64")}`;
}

// true quando o valor guardado já está no formato de hash — o oposto é um PIN em texto plano
// gravado antes desta fase (ver verifyPin abaixo pro fallback).
export function isHashedPin(stored: string): boolean {
  return stored.startsWith(HASH_PREFIX);
}

// Compara um PIN digitado com o valor guardado na coluna `pin`. Aceita os dois formatos:
// - `scrypt$...`  -> deriva e compara em tempo constante (timingSafeEqual).
// - texto plano   -> PIN legado (gravado antes desta fase); comparação direta. A migração pra hash
//   é preguiçosa: routes/out/actions.ts re-grava o PIN via setOutputPin no primeiro acerto, então
//   um PIN legado vira hash sozinho no próximo uso (ver DoD da Fase 9 — "migração de re-hash
//   documentada"). Nenhuma migração de dados em SQL: scrypt não roda no banco.
export async function verifyPin(candidate: string, stored: string): Promise<boolean> {
  if (typeof candidate !== "string" || candidate.length === 0) return false;

  if (!isHashedPin(stored)) {
    // Não usa timingSafeEqual aqui de propósito: PIN legado, tamanhos podem divergir e o valor
    // some no primeiro acerto (re-hash). O caminho de estado estável é o hash acima.
    return candidate === stored;
  }

  const [, saltBase64, hashBase64] = stored.split("$");
  if (!saltBase64 || !hashBase64) return false;

  const salt = Buffer.from(saltBase64, "base64");
  const expectedHash = Buffer.from(hashBase64, "base64");
  const derived = (await scrypt(candidate, salt, expectedHash.length)) as Buffer;
  if (derived.length !== expectedHash.length) return false;
  return timingSafeEqual(derived, expectedHash);
}
