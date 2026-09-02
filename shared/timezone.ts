// Fuso horário da instituição (BROADCAST_SETTINGS.timezone). A sede fica num fuso fixo (hoje o
// servidor roda em Curitiba), mas a TV pode estar em qualquer lugar — então "19:30" num evento
// precisa significar 19:30 NA SEDE, tanto na hora de interpretar o que o operador digitou no admin
// quanto na hora de mostrar na tela. Este módulo centraliza as duas pontas.
//
// Puro (só Intl, sem I/O) e em shared/ de propósito: usado pelo server (parse do <input
// datetime-local> em components/admin/actions.ts) e por "use client" components (formatação da
// view de saída, weekly-recurrence.ts). Sem dependência nova — Intl.DateTimeFormat.formatToParts
// já entrega as partes de parede de um instante em qualquer fuso IANA, e a conversão inversa
// (parede → instante) é uma busca do offset a partir dessas mesmas partes.

// Fonte de verdade do default (BROADCAST_SETTINGS.timezone.defaultValue reexporta daqui pra não
// duplicar a string). America/Sao_Paulo não tem horário de verão desde 2019 — offset fixo -03:00 —,
// mas nada aqui assume isso: a conta vale pra qualquer fuso/época.
export const DEFAULT_BROADCAST_TIMEZONE = "America/Sao_Paulo";

// Opções do seletor "Fuso horário da instituição" na tela admin — as brasileiras primeiro (cobrem
// o país inteiro), depois um punhado de fusos comuns pra instituições com operação fora do Brasil.
// Rótulo por cidade conhecida + deslocamento aproximado, nunca o id IANA cru (memory
// feedback_admin_ux_no_dev_jargon). O deslocamento no rótulo é só uma dica de leitura: pras zonas
// com horário de verão ele varia ao longo do ano — o cálculo real sempre usa o id, não o texto.
export const BROADCAST_TIMEZONE_OPTIONS: { value: string; label: string }[] = [
  { value: "America/Sao_Paulo", label: "Curitiba / Brasília / São Paulo (GMT-3)" },
  { value: "America/Bahia", label: "Salvador / Recife / Fortaleza (GMT-3)" },
  { value: "America/Manaus", label: "Manaus / Cuiabá / Campo Grande (GMT-4)" },
  { value: "America/Rio_Branco", label: "Rio Branco / Acre (GMT-5)" },
  { value: "America/Noronha", label: "Fernando de Noronha (GMT-2)" },
  { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires (GMT-3)" },
  { value: "America/Montevideo", label: "Montevidéu (GMT-3)" },
  { value: "America/Asuncion", label: "Assunção (GMT-3)" },
  { value: "America/Santiago", label: "Santiago (GMT-3/-4)" },
  { value: "America/New_York", label: "Nova York / Miami (GMT-5/-4)" },
  { value: "America/Chicago", label: "Chicago (GMT-6/-5)" },
  { value: "America/Los_Angeles", label: "Los Angeles (GMT-8/-7)" },
  { value: "Europe/Lisbon", label: "Lisboa (GMT+0/+1)" },
  { value: "Europe/London", label: "Londres (GMT+0/+1)" },
  { value: "Europe/Paris", label: "Paris / Madri / Roma (GMT+1/+2)" },
  { value: "UTC", label: "UTC (GMT+0)" },
];

const PART_FORMATTER_CACHE = new Map<string, Intl.DateTimeFormat>();

function partsFormatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = PART_FORMATTER_CACHE.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    PART_FORMATTER_CACHE.set(timeZone, formatter);
  }
  return formatter;
}

export type ZonedParts = {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number; // 0-59
  second: number; // 0-59
  weekday: number; // 0 = domingo ... 6 = sábado (igual Date.getDay())
};

// Partes de parede de um instante, lidas NO fuso dado.
export function getZonedParts(instant: Date, timeZone: string): ZonedParts {
  const map: Record<string, string> = {};
  for (const part of partsFormatterFor(timeZone).formatToParts(instant)) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  const year = Number(map.year);
  const month = Number(map.month);
  const day = Number(map.day);
  // hourCycle "h23" já entrega 00-23, mas alguns builds de ICU devolvem "24" pra meia-noite.
  const hour = Number(map.hour) % 24;
  const minute = Number(map.minute);
  const second = Number(map.second);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return { year, month, day, hour, minute, second, weekday };
}

// Offset (ms) do fuso NESTE instante: (parede no fuso, tratada como UTC) - (instante UTC real).
// Ex: America/Sao_Paulo hoje devolve -3 * 3.600.000.
function zoneOffsetMs(instant: Date, timeZone: string): number {
  const p = getZonedParts(instant, timeZone);
  const wallAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  // formatToParts não tem milissegundo — compara contra o instante truncado no segundo.
  const instantSeconds = instant.getTime() - instant.getUTCMilliseconds();
  return wallAsUtc - instantSeconds;
}

// Instante UTC correspondente a uma hora de PAREDE no fuso dado. Campos fora de faixa (ex:
// day = 30 + 7, usado pelo cálculo de recorrência semanal) são normalizados pelo próprio Date.UTC.
export function zonedPartsToInstant(
  parts: { year: number; month: number; day: number; hour: number; minute: number; second?: number },
  timeZone: string,
): Date {
  const wallAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second ?? 0);
  // 1ª aproximação: assume o offset do instante "parede-como-UTC".
  const firstGuess = new Date(wallAsUtc - zoneOffsetMs(new Date(wallAsUtc), timeZone));
  // Refina uma vez — numa virada de horário de verão o offset do firstGuess pode diferir do
  // assumido; pra fuso sem horário de verão os dois são iguais e isto é um no-op.
  return new Date(wallAsUtc - zoneOffsetMs(firstGuess, timeZone));
}

const DATETIME_LOCAL_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

// "YYYY-MM-DDTHH:mm" (valor cru de <input type="datetime-local">) interpretado como hora de PAREDE
// no fuso da instituição → instante UTC pra gravar (a coluna já é timestamptz). Substitui o
// `new Date(raw)` que existia nas actions, que interpretava a string no fuso do PROCESSO do
// servidor. null quando a string não casa o formato — o validador da feature devolve "data
// inválida" a partir daí, igual antes fazia com um `new Date("")`.
export function parseWallTimeInZone(raw: string, timeZone: string): Date | null {
  const match = DATETIME_LOCAL_RE.exec(raw.trim());
  if (!match) return null;
  const [, year, month, day, hour, minute, second] = match;
  const instant = zonedPartsToInstant(
    {
      year: Number(year),
      month: Number(month),
      day: Number(day),
      hour: Number(hour),
      minute: Number(minute),
      second: second ? Number(second) : 0,
    },
    timeZone,
  );
  return Number.isNaN(instant.getTime()) ? null : instant;
}

// Dois instantes caem no MESMO dia do calendário quando lidos no fuso dado?
export function isSameZonedCalendarDay(a: Date, b: Date, timeZone: string): boolean {
  const pa = getZonedParts(a, timeZone);
  const pb = getZonedParts(b, timeZone);
  return pa.year === pb.year && pa.month === pb.month && pa.day === pb.day;
}

export function isValidTimeZone(value: string): boolean {
  if (!value) return false;
  try {
    // Lança RangeError pra um id IANA desconhecido.
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

// Valor de setting (ou qualquer coisa vinda do banco) → id de fuso válido, caindo no default
// quando ausente/inválido. Usado pelo service da view de saída e pelas actions do admin.
export function normalizeTimeZone(value: unknown): string {
  return typeof value === "string" && isValidTimeZone(value) ? value : DEFAULT_BROADCAST_TIMEZONE;
}
