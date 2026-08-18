/**
 * Client for 기상청 세계기상전문(GTS) 조회서비스 — GtsInfoService, published on
 * data.go.kr (same portal/account/service key as the MOFA APIs, no separate
 * KMA credential needed). Confirmed against
 * 기상청_세계기상전문(GTS)_조회서비스_오픈API활용가이드.docx.
 *
 * Unlike the MOFA APIs, this one isn't keyed by country code directly —
 * it's a two-step lookup: getGtsStn(국가코드) → a list of GTS station IDs
 * for that country, then getSynop(stnId, tm) → surface observations for
 * one station at one UTC timestamp. Response envelope matches
 * CountrySafetyService's shape (response.header/response.body.items.item),
 * already handled by fetchMofaItems() in mofaApi.ts.
 */

import { fetchMofaItems, pickField } from './mofaApi';

const BASE = 'http://apis.data.go.kr/1360000/GtsInfoService';
export const GTS_STATION_URL = `${BASE}/getGtsStn`;
export const GTS_SYNOP_URL = `${BASE}/getSynop`;

/**
 * KMA's own GTS 국가코드 (not ISO) for our MVP destinations — from
 * 기상청_세계기상전문(GTS)_조회서비스_오픈API활용가이드_국가코드리스트(지상).xlsx.
 * Cambodia has no row in that list at all (no GTS surface station coverage
 * there) — its weather component keeps using the proposal's placeholder
 * value rather than silently reporting zero risk.
 */
const GTS_COUNTRY_CODE: Partial<Record<string, string>> = {
  FR: '443',
  JP: '377',
};

/** WMO SYNOP observations land on 3-hour UTC boundaries (00/03/06/.../21). */
function candidateSynopTimestamps(count: number): string[] {
  const now = new Date();
  let slot = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      Math.floor(now.getUTCHours() / 3) * 3,
    ),
  );
  // Step back one slot first — the most recent boundary's data usually
  // isn't published yet by the time we'd query it.
  slot = new Date(slot.getTime() - 3 * 60 * 60 * 1000);

  const timestamps: string[] = [];
  for (let i = 0; i < count; i++) {
    const y = slot.getUTCFullYear();
    const mo = String(slot.getUTCMonth() + 1).padStart(2, '0');
    const d = String(slot.getUTCDate()).padStart(2, '0');
    const h = String(slot.getUTCHours()).padStart(2, '0');
    timestamps.push(`${y}${mo}${d}${h}00`);
    slot = new Date(slot.getTime() - 3 * 60 * 60 * 1000);
  }
  return timestamps;
}

/**
 * Composite 0–100 risk score from confirmed SYNOP fields: rn/hr3Rn
 * (강수량, precipitation mm), ws (풍속, wind speed m/s), sd (적설, snow
 * depth cm), vs (시정, visibility m) — covering the proposal's own
 * "폭염·폭설·태풍·호우" weather risk themes. Thresholds are a reasonable
 * first pass (KMA/WMO's own heavy-rain/gale conventions), not independently
 * calibrated against real incident data.
 */
function synopRisk(item: Record<string, unknown>): number {
  const num = (field: string): number => {
    const raw = pickField(item, [field]);
    const parsed = raw !== undefined ? Number.parseFloat(raw) : NaN;
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const rain3h = num('hr3Rn') || num('rn');
  const windSpeed = num('ws');
  const snowDepth = num('sd');
  const visibility = pickField(item, ['vs']) !== undefined ? num('vs') : 99999;

  let risk = 10;
  if (rain3h >= 30) risk += 40;
  else if (rain3h >= 10) risk += 20;
  else if (rain3h >= 3) risk += 8;

  if (windSpeed >= 25) risk += 40; // typhoon-force
  else if (windSpeed >= 17) risk += 25; // gale
  else if (windSpeed >= 10) risk += 10;

  if (snowDepth >= 10) risk += 30;
  else if (snowDepth >= 3) risk += 15;

  if (visibility < 500) risk += 15;
  else if (visibility < 1000) risk += 8;

  return Math.min(100, risk);
}

/** Returns a 0–100 weather risk score, or undefined if this destination has no GTS station coverage or nothing could be fetched. */
export async function fetchWeatherRisk(
  countryCode: string,
  serviceKey: string,
): Promise<number | undefined> {
  const gtsCountryCode = GTS_COUNTRY_CODE[countryCode.toUpperCase()];
  if (!gtsCountryCode) return undefined;

  const stations = await fetchMofaItems(GTS_STATION_URL, serviceKey, {
    cc: gtsCountryCode,
    category: 'synop',
    numOfRows: 1,
  });
  const stnId = stations[0] && pickField(stations[0], ['stnId']);
  if (!stnId) return undefined;

  for (const tm of candidateSynopTimestamps(4)) {
    const items = await fetchMofaItems(GTS_SYNOP_URL, serviceKey, { tm, stnId, numOfRows: 1 });
    if (items.length > 0) return synopRisk(items[0]);
  }
  return undefined;
}
