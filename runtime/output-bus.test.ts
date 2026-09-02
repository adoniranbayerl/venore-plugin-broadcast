import { afterEach, describe, expect, it, vi } from "vitest";
import type { BroadcastOutputEvent } from "../contracts/types";
import {
  MAX_CONNECTIONS_PER_TOKEN,
  getConnectedOutputIps,
  publishOutputEvent,
  subscribeToOutputEvents,
} from "./output-bus";

// O pub/sub guarda estado em globalThis (ver comentário no módulo) — cada teste começa do zero.
afterEach(() => {
  delete (globalThis as { __broadcastOutputConnections?: unknown }).__broadcastOutputConnections;
});

describe("output-bus", () => {
  it("entrega eventos só para os inscritos no mesmo token", () => {
    const recepcao: BroadcastOutputEvent[] = [];
    const auditorio: BroadcastOutputEvent[] = [];
    subscribeToOutputEvents("recepcao", (e) => recepcao.push(e));
    subscribeToOutputEvents("auditorio", (e) => auditorio.push(e));

    publishOutputEvent("recepcao", { type: "alert-changed" });

    expect(recepcao).toEqual([{ type: "alert-changed" }]);
    expect(auditorio).toEqual([]);
  });

  it("para de entregar e limpa o token após o unsubscribe", () => {
    const received: BroadcastOutputEvent[] = [];
    const unsubscribe = subscribeToOutputEvents("recepcao", (e) => received.push(e), "10.0.0.5");

    expect(getConnectedOutputIps()).toEqual({ recepcao: ["10.0.0.5"] });

    unsubscribe();

    publishOutputEvent("recepcao", { type: "alert-changed" });
    expect(received).toEqual([]);
    expect(getConnectedOutputIps()).toEqual({});
  });

  it("lista os IPs conectados por token", () => {
    subscribeToOutputEvents("recepcao", () => {}, "10.0.0.5");
    subscribeToOutputEvents("recepcao", () => {}, "10.0.0.6");
    subscribeToOutputEvents("auditorio", () => {}, "10.0.0.9");

    expect(getConnectedOutputIps()).toEqual({
      recepcao: ["10.0.0.5", "10.0.0.6"],
      auditorio: ["10.0.0.9"],
    });
  });

  it("evicta a conexão mais antiga do token ao exceder o teto", () => {
    const conns = Array.from({ length: MAX_CONNECTIONS_PER_TOKEN }, (_, i) => {
      const onEvict = vi.fn();
      const received: BroadcastOutputEvent[] = [];
      subscribeToOutputEvents("recepcao", (e) => received.push(e), `ip-${i}`, onEvict);
      return { onEvict, received };
    });

    // No teto exato, ninguém é derrubado.
    expect(conns.every((c) => c.onEvict.mock.calls.length === 0)).toBe(true);

    const extraEvict = vi.fn();
    subscribeToOutputEvents("recepcao", () => {}, "ip-extra", extraEvict);

    expect(conns[0].onEvict).toHaveBeenCalledTimes(1);
    expect(conns.slice(1).every((c) => c.onEvict.mock.calls.length === 0)).toBe(true);
    expect(extraEvict).not.toHaveBeenCalled();

    // A conexão evictada não recebe mais nada; as demais seguem.
    publishOutputEvent("recepcao", { type: "alert-changed" });
    expect(conns[0].received).toEqual([]);
    expect(conns[1].received).toEqual([{ type: "alert-changed" }]);

    // E some da lista de presença (o teto vale para o total observável).
    expect(getConnectedOutputIps().recepcao).toHaveLength(MAX_CONNECTIONS_PER_TOKEN);
    expect(getConnectedOutputIps().recepcao).not.toContain("ip-0");
  });
});
