import { getSetting } from "@venore/plugin-sdk/settings";
import { getCache, setCache } from "@venore/plugin-sdk";
import { BROADCAST_SETTINGS } from "../shared/settings";
import type { RegionWeather } from "../contracts/types";

// Infra de runtime (chamada externa cacheada), não uma feature — mesmo espírito de
// runtime/output-bus.ts: não há ator/autorização envolvidos, é dado derivado de uma configuração
// (broadcast.region) que qualquer output pode exibir. Sem chave de API — Open-Meteo é gratuito
// pra uso não-comercial (geocoding + forecast), verificado na documentação oficial antes de
// implementar.
const GEOCODE_CACHE_TTL_SECONDS = 60 * 60 * 24;
const WEATHER_CACHE_TTL_SECONDS = 60 * 15;
// TTL curto pra resultado nulo (API fora do ar, região não encontrada) — não trava uma falha
// passageira em cache pelo TTL inteiro, mesmo racional de EMPTY_RESULT_CACHE_TTL_SECONDS em
// region-news.ts (achado na prática: um 403 de config errada ficou "sem notícia" até expirar).
const FAILURE_CACHE_TTL_SECONDS = 60;

type Coordinates = { latitude: number; longitude: number };
type CachedEnvelope<T> = { value: T | null };

// Tabela WMO (mesma usada pelo Open-Meteo) — cobre os códigos mais comuns, não os ~30 possíveis;
// código fora da tabela cai no fallback "—"/🌡️ em vez de quebrar a renderização.
const WEATHER_CODE_LABELS: Record<number, { label: string; emoji: string }> = {
  0: { label: "Céu limpo", emoji: "☀️" },
  1: { label: "Poucas nuvens", emoji: "🌤️" },
  2: { label: "Parcialmente nublado", emoji: "⛅" },
  3: { label: "Nublado", emoji: "☁️" },
  45: { label: "Neblina", emoji: "🌫️" },
  48: { label: "Neblina com geada", emoji: "🌫️" },
  51: { label: "Garoa fraca", emoji: "🌦️" },
  53: { label: "Garoa", emoji: "🌦️" },
  55: { label: "Garoa forte", emoji: "🌦️" },
  61: { label: "Chuva fraca", emoji: "🌧️" },
  63: { label: "Chuva", emoji: "🌧️" },
  65: { label: "Chuva forte", emoji: "🌧️" },
  71: { label: "Neve fraca", emoji: "🌨️" },
  73: { label: "Neve", emoji: "🌨️" },
  75: { label: "Neve forte", emoji: "🌨️" },
  80: { label: "Pancadas de chuva", emoji: "🌦️" },
  81: { label: "Pancadas de chuva", emoji: "🌦️" },
  82: { label: "Pancadas de chuva fortes", emoji: "⛈️" },
  95: { label: "Tempestade", emoji: "⛈️" },
  96: { label: "Tempestade com granizo", emoji: "⛈️" },
  99: { label: "Tempestade com granizo forte", emoji: "⛈️" },
};

function describeWeatherCode(code: number): { label: string; emoji: string } {
  return WEATHER_CODE_LABELS[code] ?? { label: "—", emoji: "🌡️" };
}

async function geocodeRegion(region: string): Promise<Coordinates | null> {
  const cacheKey = `broadcast:geocode:${region.toLowerCase()}`;
  const cached = getCache<CachedEnvelope<Coordinates>>(cacheKey);
  if (cached) return cached.value;

  let coordinates: Coordinates | null = null;
  try {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", region);
    url.searchParams.set("count", "1");
    url.searchParams.set("language", "pt");
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (response.ok) {
      const body = (await response.json()) as { results?: { latitude: number; longitude: number }[] };
      const first = body.results?.[0];
      if (first) coordinates = { latitude: first.latitude, longitude: first.longitude };
    }
  } catch {
    coordinates = null;
  }

  setCache<CachedEnvelope<Coordinates>>(cacheKey, { value: coordinates }, coordinates ? GEOCODE_CACHE_TTL_SECONDS : FAILURE_CACHE_TTL_SECONDS);
  return coordinates;
}

// Retorna null quando broadcast.region não está configurada ou a resolução falha em qualquer
// etapa (geocoding indisponível, forecast indisponível) — a layer "info" degrada mostrando só o
// relógio, nunca quebra a página por causa de uma API externa fora do ar.
export async function resolveRegionWeather(): Promise<RegionWeather | null> {
  const regionSetting = await getSetting({ key: BROADCAST_SETTINGS.region.key });
  const region = regionSetting.success && typeof regionSetting.data?.value === "string" ? regionSetting.data.value : "";
  if (!region.trim()) return null;

  const cacheKey = `broadcast:weather:${region.toLowerCase()}`;
  const cached = getCache<CachedEnvelope<RegionWeather>>(cacheKey);
  if (cached) return cached.value;

  let weather: RegionWeather | null = null;
  const coordinates = await geocodeRegion(region);
  if (coordinates) {
    try {
      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.searchParams.set("latitude", String(coordinates.latitude));
      url.searchParams.set("longitude", String(coordinates.longitude));
      url.searchParams.set("current", "temperature_2m,weather_code");
      url.searchParams.set("timezone", "auto");
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (response.ok) {
        const body = (await response.json()) as { current?: { temperature_2m: number; weather_code: number } };
        if (body.current) {
          const description = describeWeatherCode(body.current.weather_code);
          weather = {
            temperatureC: body.current.temperature_2m,
            weatherCode: body.current.weather_code,
            conditionLabel: description.label,
            emoji: description.emoji,
          };
        }
      }
    } catch {
      weather = null;
    }
  }

  setCache<CachedEnvelope<RegionWeather>>(cacheKey, { value: weather }, weather ? WEATHER_CACHE_TTL_SECONDS : FAILURE_CACHE_TTL_SECONDS);
  return weather;
}
