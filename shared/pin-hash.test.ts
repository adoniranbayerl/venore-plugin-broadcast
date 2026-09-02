import { describe, expect, it } from "vitest";
import { hashPin, isHashedPin, verifyPin } from "./pin-hash";

describe("pin-hash", () => {
  it("produz um hash no formato canônico scrypt$salt$hash", async () => {
    const hash = await hashPin("1234");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(hash.split("$")).toHaveLength(3);
    expect(isHashedPin(hash)).toBe(true);
  });

  it("gera hashes diferentes pro mesmo PIN (salt aleatório)", async () => {
    expect(await hashPin("1234")).not.toBe(await hashPin("1234"));
  });

  it("verifica o PIN correto contra o hash", async () => {
    const hash = await hashPin("9876");
    expect(await verifyPin("9876", hash)).toBe(true);
  });

  it("rejeita PIN errado, vazio ou não-string contra o hash", async () => {
    const hash = await hashPin("9876");
    expect(await verifyPin("0000", hash)).toBe(false);
    expect(await verifyPin("", hash)).toBe(false);
    expect(await verifyPin(undefined as unknown as string, hash)).toBe(false);
  });

  it("aceita PIN legado em texto plano (fallback pré-hash)", async () => {
    expect(isHashedPin("1234")).toBe(false);
    expect(await verifyPin("1234", "1234")).toBe(true);
    expect(await verifyPin("0000", "1234")).toBe(false);
  });
});
