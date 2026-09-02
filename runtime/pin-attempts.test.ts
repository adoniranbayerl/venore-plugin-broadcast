import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BLOCK_BASE_MINUTES,
  MAX_FAILURES_BEFORE_BLOCK,
  checkPinAttempt,
  clearPinAttemptsForToken,
  hasActivePinBlockForToken,
  registerPinFailure,
  registerPinSuccess,
} from "./pin-attempts";

// Estado em globalThis (ver comentário no módulo) — cada teste começa do zero.
afterEach(() => {
  delete (globalThis as { __broadcastPinAttempts?: unknown }).__broadcastPinAttempts;
  vi.useRealTimers();
});

function failNTimes(token: string, ip: string, n: number) {
  let status = { blocked: false, retryAfterSeconds: 0 };
  for (let i = 0; i < n; i += 1) status = registerPinFailure(token, ip);
  return status;
}

describe("pin-attempts", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-28T12:00:00Z"));
  });

  it("não bloqueia enquanto está abaixo do teto de falhas", () => {
    failNTimes("recepcao", "10.0.0.5", MAX_FAILURES_BEFORE_BLOCK - 1);
    expect(checkPinAttempt("recepcao", "10.0.0.5").blocked).toBe(false);
  });

  it("bloqueia a combinação (token+IP) ao atingir o teto", () => {
    const status = failNTimes("recepcao", "10.0.0.5", MAX_FAILURES_BEFORE_BLOCK);
    expect(status.blocked).toBe(true);
    expect(status.retryAfterSeconds).toBeGreaterThan(0);
    expect(checkPinAttempt("recepcao", "10.0.0.5").blocked).toBe(true);
    // Outro IP no mesmo token segue livre.
    expect(checkPinAttempt("recepcao", "10.0.0.9").blocked).toBe(false);
  });

  it("libera sozinho quando o tempo de bloqueio passa", () => {
    failNTimes("recepcao", "10.0.0.5", MAX_FAILURES_BEFORE_BLOCK);
    expect(checkPinAttempt("recepcao", "10.0.0.5").blocked).toBe(true);

    vi.advanceTimersByTime(BLOCK_BASE_MINUTES * 60_000 + 1_000);
    expect(checkPinAttempt("recepcao", "10.0.0.5").blocked).toBe(false);
  });

  it("aumenta a duração do bloqueio a cada reincidência (backoff progressivo)", () => {
    const first = failNTimes("recepcao", "10.0.0.5", MAX_FAILURES_BEFORE_BLOCK);
    vi.advanceTimersByTime(first.retryAfterSeconds * 1000 + 1_000);

    const second = failNTimes("recepcao", "10.0.0.5", MAX_FAILURES_BEFORE_BLOCK);
    expect(second.retryAfterSeconds).toBeGreaterThan(first.retryAfterSeconds);
  });

  it("reset (todos os IPs de um token) libera na hora", () => {
    failNTimes("recepcao", "10.0.0.5", MAX_FAILURES_BEFORE_BLOCK);
    failNTimes("recepcao", "10.0.0.9", MAX_FAILURES_BEFORE_BLOCK);
    expect(hasActivePinBlockForToken("recepcao")).toBe(true);

    const cleared = clearPinAttemptsForToken("recepcao");

    expect(cleared).toBe(2);
    expect(checkPinAttempt("recepcao", "10.0.0.5").blocked).toBe(false);
    expect(checkPinAttempt("recepcao", "10.0.0.9").blocked).toBe(false);
    expect(hasActivePinBlockForToken("recepcao")).toBe(false);
  });

  it("acerto do PIN zera o contador da combinação", () => {
    failNTimes("recepcao", "10.0.0.5", MAX_FAILURES_BEFORE_BLOCK - 1);
    registerPinSuccess("recepcao", "10.0.0.5");
    // Recomeça do zero: mais uma falha não pode bloquear.
    expect(registerPinFailure("recepcao", "10.0.0.5").blocked).toBe(false);
  });

  it("não conta falha nova enquanto já está bloqueado", () => {
    failNTimes("recepcao", "10.0.0.5", MAX_FAILURES_BEFORE_BLOCK);
    const during = registerPinFailure("recepcao", "10.0.0.5");
    expect(during.blocked).toBe(true);
    // blockCount não avançou: ao liberar, o próximo bloqueio ainda é o "segundo".
    vi.advanceTimersByTime(during.retryAfterSeconds * 1000 + 1_000);
    expect(checkPinAttempt("recepcao", "10.0.0.5").blocked).toBe(false);
  });
});
