import type { BroadcastOutputEvent } from "../contracts/types";

// Pub/sub em memória, por processo — não é uma feature (sem handler/service/store/authorizeActor,
// é infraestrutura de runtime, mesmo espírito do buffer de log em observability/). Assume um único
// processo Node de longa duração (o plano do plugin é rodar num servidor local, não serverless
// multi-instância) — se isso mudar no futuro, isto precisa virar Redis pub/sub ou equivalente;
// registrado como suposição, não como Known Gap ainda, porque bate com o requisito atual.
type Subscriber = (event: BroadcastOutputEvent) => void;

// Cada conexão carrega o IP de quem abriu (pedido explícito: "quero poder saber qual é a TV que
// conectou. Pode ser com o dado de IP local") — capturado uma vez na rota SSE (ver
// routes/api/output-events/route.ts) e guardado junto do subscriber, não um registro à parte:
// a conexão SSE em si já É a "presença" da TV, o IP é só um dado a mais sobre ela.
// `onEvict` é chamado quando o teto de conexões abaixo derruba esta conexão — a rota fecha o
// controller do stream nesse callback (a TV reconecta sozinha via `retry:` do EventSource).
type Connection = { subscriber: Subscriber; ip: string; onEvict: () => void };

// Teto de conexões SSE simultâneas por token. Cenário real: um proxy/switch no meio de uma LAN
// derruba o socket ocioso sem o Node perceber (nenhum cancel() dispara) — a TV reconecta e a
// conexão fantasma fica pra trás, acumulando ao longo de dias. O heartbeat na rota já força uma
// escrita periódica que faz o socket morto ser detectado cedo; este teto é a rede de segurança
// pro que escapar disso. Ao exceder, a conexão MAIS ANTIGA do token é evictada (Set preserva
// ordem de inserção). 8 é folgado: o normal é 1 conexão por token (uma TV), com alguma folga pra
// churn de reconexão e uma prévia aberta no painel.
export const MAX_CONNECTIONS_PER_TOKEN = 8;

// Guardado em globalThis, não numa variável de módulo comum — bug real observado: uma server
// action (setOutputPlaylist/setOutputDrawer) e a rota SSE (app/api/broadcast/output/[token]/events)
// ficam em "camadas" de bundle diferentes no Next.js (Server Action vs. Route Handler), e cada
// camada pode acabar com sua PRÓPRIA cópia avaliada deste módulo — duas Maps diferentes, uma
// nunca vendo os subscribers da outra, evento publicado nunca chega no SSE. globalThis é o único
// objeto garantidamente compartilhado entre todas as camadas dentro do mesmo processo Node (mesmo
// truque já usado pra singleton de client de banco em apps Next.js).
type OutputBusGlobal = typeof globalThis & {
  __broadcastOutputConnections?: Map<string, Set<Connection>>;
};

function getConnectionsByToken(): Map<string, Set<Connection>> {
  const globalWithBus = globalThis as OutputBusGlobal;
  if (!globalWithBus.__broadcastOutputConnections) {
    globalWithBus.__broadcastOutputConnections = new Map();
  }
  return globalWithBus.__broadcastOutputConnections;
}

export function subscribeToOutputEvents(
  token: string,
  subscriber: Subscriber,
  ip = "desconhecido",
  onEvict: () => void = () => {},
): () => void {
  const connectionsByToken = getConnectionsByToken();
  const connections = connectionsByToken.get(token) ?? new Set<Connection>();
  const connection: Connection = { subscriber, ip, onEvict };
  connections.add(connection);
  connectionsByToken.set(token, connections);

  // Derruba as mais antigas até voltar ao teto — normalmente no máximo uma por vez, o `while` só
  // cobre o caso de o teto ter sido baixado com conexões já abertas.
  while (connections.size > MAX_CONNECTIONS_PER_TOKEN) {
    const oldest: Connection | undefined = connections.values().next().value;
    if (!oldest || oldest === connection) break;
    connections.delete(oldest);
    try {
      oldest.onEvict();
    } catch {
      // A rota pode já ter fechado o controller por conta própria — evicção é best-effort.
    }
  }

  return () => {
    connections.delete(connection);
    if (connections.size === 0) {
      connectionsByToken.delete(token);
    }
  };
}

export function publishOutputEvent(token: string, event: BroadcastOutputEvent): void {
  const connections = getConnectionsByToken().get(token);
  if (!connections) return;
  for (const connection of connections) connection.subscriber(event);
}

// IPs conectados agora mesmo, por token — pedido explícito: "vamos criar um sistema em que mostra
// também a quantidade de TVs conectadas" + depois "quero poder saber qual é a TV que conectou".
// Cada conexão já É uma TV com a tela aberta (rota GET .../output-events) — não precisa de um
// mecanismo de presença à parte; a quantidade é só o tamanho da lista, calculado por quem consome
// (ver components/admin/actions.ts). Mesma suposição de processo único documentada no topo do
// arquivo.
export function getConnectedOutputIps(): Record<string, string[]> {
  const ipsByToken: Record<string, string[]> = {};
  for (const [token, connections] of getConnectionsByToken()) {
    ipsByToken[token] = [...connections].map((connection) => connection.ip);
  }
  return ipsByToken;
}
