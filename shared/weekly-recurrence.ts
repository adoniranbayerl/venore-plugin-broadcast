import { getZonedParts, zonedPartsToInstant } from "./timezone";

// Recorrência simples "toda semana" — pedido explícito: "quero criar um evento que acontece toda
// semana, por exemplo toda Quarta. Não quero ter que ficar trocando a data toda semana. Quero que
// mostre a data da quarta próxima". Deliberadamente sem regra genérica de recorrência (RRULE
// completo, intervalo, "até tal data", exceções) — só o caso pedido, mesma hora e mesmo dia da
// semana, pra sempre.
//
// event.startAt é a ÂNCORA do padrão quando recurring=true — só o dia da semana e o horário dele
// importam, nunca a data em si. Puro (sem I/O), por isso vive em shared/, importável tanto pelo
// server (get-output-state/service.ts) quanto por um "use client" component (agenda-section.tsx,
// direto daqui, nunca do barrel — mesmo racional documentado em outros pontos do plugin).
//
// endAt (opcional) é passado só pra saber a DURAÇÃO do evento — pedido explícito: "apenas quando o
// evento acabar, retire ele ou atualize a data (no caso dos recorrentes)". Sem isso, um evento
// recorrente com duração (ex: 09:00–11:00) pulava pra semana que vem assim que o HORÁRIO DE INÍCIO
// passava (10:00, por exemplo), mesmo com o evento ainda em andamento até as 11:00 — a âncora só
// avança de verdade quando o evento inteiro (início + duração) já ficou no passado.
// timeZone (opcional): quando passado, "que dia da semana é hoje" e "que horas são agora" são
// lidos NESSE fuso (o da instituição), não no fuso do processo/browser — a TV pode estar em
// qualquer lugar, mas "toda quarta 19:30" é sempre no fuso da sede. Sem timeZone, comportamento
// original preservado byte a byte (chamadas antigas / testes legados).
export function resolveEventOccurrenceDate(
  event: { startAt: Date; endAt?: Date | null; recurring: boolean },
  now: Date = new Date(),
  timeZone?: string,
): Date {
  if (!event.recurring) return event.startAt;
  const durationMs = event.endAt ? event.endAt.getTime() - event.startAt.getTime() : 0;
  return resolveWeeklyAnchor(event.startAt, durationMs, now, timeZone);
}

// endAt agora é um timestamp completo (não só hora) — pode cair em qualquer data posterior ao
// início, inclusive dias depois (pedido explícito: "o término pode acontecer em qualquer data
// posterior... pode haver eventos que duram dias"). Pra evento NÃO recorrente, endAt já é
// absoluto — devolve como veio. Pra evento recorrente, endAt (como startAt) é só a ÂNCORA do
// padrão: o que se repete toda semana é a DURAÇÃO entre os dois (endAt - startAt), não a data do
// término em si — então a resolução soma essa mesma duração à ocorrência de início já resolvida
// (resolveWeeklyAnchor, mesma função usada por resolveEventOccurrenceDate — as duas SEMPRE
// resolvem pra âncora da mesma semana), nunca reusa a data crua do endAt gravado (que pode ser de
// semanas/meses atrás, igual ao startAt cru). null quando o evento não tem término definido.
export function resolveEventEndDate(
  event: { startAt: Date; endAt: Date | null; recurring: boolean },
  now: Date = new Date(),
  timeZone?: string,
): Date | null {
  if (!event.endAt) return null;
  if (!event.recurring) return event.endAt;
  const durationMs = event.endAt.getTime() - event.startAt.getTime();
  const resolvedStart = resolveWeeklyAnchor(event.startAt, durationMs, now, timeZone);
  return new Date(resolvedStart.getTime() + durationMs);
}

// isEventHappeningNow NÃO recebe timeZone de propósito: startAt/endAt já chegam RESOLVIDOS (dois
// instantes absolutos) e `now` também é absoluto — comparar o intervalo é independente de fuso,
// não há hora de parede envolvida aqui.
//
// "Acontecendo agora" — pedido explícito: "quero o status de 'Acontecendo' no evento" (TV) e,
// depois, o mesmo status no admin. startAt/endAt aqui já precisam chegar RESOLVIDOS (ocorrência
// efetiva de um evento recorrente, ou o valor absoluto de um não-recorrente — ver
// resolveEventOccurrenceDate/resolveEventEndDate acima), então a checagem é uma comparação direta
// de intervalo, sem recorrência nenhuma pra considerar aqui. Compartilhada entre o admin
// (agenda-section.tsx) e a view de saída (layer-renderer.tsx) — por isso vive aqui, não em
// nenhum dos dois. Sem endAt (evento sem término definido), nunca conta como "acontecendo" — não
// dá pra saber quando o evento termina.
export function isEventHappeningNow(startAt: Date | string, endAt: Date | string | null, now: Date = new Date()): boolean {
  if (!endAt) return false;
  const start = typeof startAt === "string" ? new Date(startAt) : startAt;
  const end = typeof endAt === "string" ? new Date(endAt) : endAt;
  return start.getTime() <= now.getTime() && now.getTime() <= end.getTime();
}

// Mesmo dia da semana e horário do anchor, na primeira ocorrência cujo FIM (início + duração)
// ainda não passou — durationMs=0 (evento sem término, comportamento original) já cobre "se hoje
// é o dia certo mas o horário já passou, pula pra semana que vem"; com duração, um evento em
// andamento (início no passado, fim no futuro) conta como a ocorrência ATUAL, não avança.
//
// Com timeZone: dia da semana / horário do anchor e "hoje"/"agora" são todos lidos e reconstruídos
// NESSE fuso (getZonedParts/zonedPartsToInstant), então a ocorrência cai na parede certa da sede
// independente de onde o processo/browser roda. Sem timeZone: caminho original intacto.
function resolveWeeklyAnchor(anchor: Date, durationMs: number, now: Date, timeZone?: string): Date {
  if (timeZone) {
    const anchorParts = getZonedParts(anchor, timeZone);
    const nowParts = getZonedParts(now, timeZone);

    let dayDiff = anchorParts.weekday - nowParts.weekday;
    if (dayDiff < 0) dayDiff += 7;

    const buildCandidate = (extraDays: number): Date =>
      zonedPartsToInstant(
        {
          year: nowParts.year,
          month: nowParts.month,
          day: nowParts.day + dayDiff + extraDays,
          hour: anchorParts.hour,
          minute: anchorParts.minute,
          second: anchorParts.second,
        },
        timeZone,
      );

    let candidate = buildCandidate(0);
    if (candidate.getTime() + durationMs < now.getTime()) {
      candidate = buildCandidate(7);
    }
    return candidate;
  }

  const candidate = new Date(now);
  candidate.setHours(anchor.getHours(), anchor.getMinutes(), anchor.getSeconds(), anchor.getMilliseconds());

  let dayDiff = anchor.getDay() - now.getDay();
  if (dayDiff < 0) dayDiff += 7;
  candidate.setDate(candidate.getDate() + dayDiff);

  if (candidate.getTime() + durationMs < now.getTime()) {
    candidate.setDate(candidate.getDate() + 7);
  }

  return candidate;
}
