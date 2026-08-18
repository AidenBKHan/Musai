/**
 * Thin client for Korea's Ministry of Foreign Affairs (외교부) OpenAPIs on
 * data.go.kr. All of these share the same request/response envelope
 * (`response.header.resultCode` / `response.body.items.item[]`), a
 * `serviceKey` query param, and (confirmed empirically — a live call
 * returned a valid JSON error body) accept `type=json` to skip XML, even
 * though the per-service doc below only lists XML as a supported format —
 * so one generic fetch function covers every endpoint here.
 *
 * Endpoint paths and field names are taken from data.go.kr's own official
 * spec doc for each service (외교부_기술문서_국가별 안전정보_v1.9.docx for
 * CountrySafetyService; the others are still cross-checked via data.go.kr's
 * listing pages only, not an official field-level doc — see the TODO on
 * TRAVEL_ALARM_URL/ACCIDENT_URL below).
 */

const BASE = 'http://apis.data.go.kr/1262000';

/**
 * data.go.kr/data/15076237 — 외교부_국가·지역별 여행경보.
 * TODO: field names below are still best-effort guesses (see
 * TRAVEL_ALARM_LEVEL_RISK/travelAlarmRisk in dataGoKrSource.ts) — no
 * official field-level spec doc for this one has been confirmed yet,
 * unlike CountrySafetyService below.
 */
export const TRAVEL_ALARM_URL = `${BASE}/TravelAlarmService2/getTravelAlarmList2`;
/**
 * data.go.kr/data/15000760 — 외교부_국가별 안전정보 (CountrySafetyService v1).
 * Confirmed via 외교부_기술문서_국가별 안전정보_v1.9.docx. Response fields:
 * resultCode, resultMsg, numOfRows, pageNo, totalCount, id, countryName
 * (한글), countryEnName (영문), title, content, fileUrl, wrtDt (작성일,
 * e.g. "2016-07-07"). There's also a newer CountrySafetyService3
 * (data.go.kr/data/15076239, adds ISO-code search) not used here since
 * this is the dataset actually approved on the account and its schema is
 * confirmed, not just assumed identical to v3's.
 */
export const COUNTRY_SAFETY_NOTICE_URL = `${BASE}/CountrySafetyService/getCountrySafetyList`;
/**
 * data.go.kr/data/15000654 — 외교부_사건사고 예방정보 (also covers
 * 15076236 사건사고 유형). TODO: field names still best-effort guesses,
 * same caveat as TRAVEL_ALARM_URL above.
 */
export const ACCIDENT_URL = `${BASE}/AccidentService/getAccidentList`;
/** data.go.kr/data/15075354 — 외교부_국가·지역별 재외공관 정보 */
export const EMBASSY_URL = `${BASE}/EmbassyService2/getEmbassyList2`;
/** data.go.kr/data/15075346 — 외교부_국가·지역별 표준코드 */
export const COUNTRY_CODE_URL = `${BASE}/CountryCodeService/getCountryCodeList`;

export interface MofaApiParams {
  [key: string]: string | number | undefined;
}

/**
 * Calls a MOFA OpenAPI endpoint and returns its `items.item` array (always
 * an array, even when the API returns a single bare object for a one-row
 * result — data.go.kr APIs do that inconsistently).
 */
export async function fetchMofaItems(
  url: string,
  serviceKey: string,
  params: MofaApiParams = {},
): Promise<Record<string, unknown>[]> {
  const qs = new URLSearchParams({ serviceKey, type: 'json', numOfRows: '100', pageNo: '1' });
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) qs.set(key, String(value));
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  let res: Response;
  try {
    res = await fetch(`${url}?${qs.toString()}`, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    throw new Error(`mofaApi: ${url} responded ${res.status}`);
  }

  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    // Some MOFA datasets ignore type=json for error responses and return
    // XML/plain-text even on failure (e.g. bad serviceKey) — surface the
    // raw body so the cause is visible instead of a cryptic parse error.
    throw new Error(`mofaApi: ${url} did not return JSON — raw response: ${text.slice(0, 300)}`);
  }

  // data.go.kr has two distinct error envelopes: a platform-wide one used
  // for request-level problems (bad/unregistered service key, malformed
  // params — cmmMsgHeader.returnReasonCode) and a per-service one used for
  // business-logic errors (response.header.resultCode). Check both rather
  // than assuming only the per-service shape, or a platform-level failure
  // silently falls through as an empty item list instead of a clear error.
  const commonError = data?.OpenAPI_ServiceResponse?.cmmMsgHeader;
  if (commonError) {
    throw new Error(
      `mofaApi: ${url} — ${commonError.errMsg ?? 'error'} (${commonError.returnReasonCode ?? '?'}): ${commonError.returnAuthMsg ?? ''}`,
    );
  }

  const header = data?.response?.header;
  if (header && header.resultCode !== '00' && header.resultCode !== undefined) {
    throw new Error(`mofaApi: ${url} returned ${header.resultCode} ${header.resultMsg ?? ''}`);
  }

  const items = data?.response?.body?.items?.item ?? data?.response?.body?.items ?? [];
  return Array.isArray(items) ? items : [items];
}

/** Reads the first defined value among several candidate field-name guesses. */
export function pickField(item: Record<string, unknown>, candidates: string[]): string | undefined {
  for (const key of candidates) {
    const value = item[key];
    if (value !== undefined && value !== null && value !== '') return String(value);
  }
  return undefined;
}
