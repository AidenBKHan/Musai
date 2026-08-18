/**
 * Thin client for Korea's Ministry of Foreign Affairs (외교부) OpenAPIs on
 * data.go.kr. These do NOT all share one response envelope — each service
 * team apparently built its own independently, confirmed by comparing two
 * official spec docs:
 *
 *  - CountrySafetyService: `{ response: { header: { resultCode: "00" (string) },
 *    body: { items: { item: [...] } } } }`
 *  - TravelAlarmService2: flat — `{ resultCode: 0 (number), resultMsg,
 *    data: [...], numOfRows, pageNo, totalCount, currentCount }`
 *  - Platform-level auth/key errors (any service): `{ OpenAPI_ServiceResponse:
 *    { cmmMsgHeader: { errMsg, returnAuthMsg, returnReasonCode } } }`
 *
 * fetchMofaItems() below checks all three shapes rather than assuming one.
 * Requests send both `type=json` (confirmed empirically — a live call
 * returned a valid JSON error body even though CountrySafetyService's own
 * doc only lists XML support) and `returnType=JSON` (TravelAlarmService2's
 * own documented param name for the same thing) since which one a given
 * service actually honors isn't consistent either.
 */

const BASE = 'http://apis.data.go.kr/1262000';

/**
 * data.go.kr/data/15076237 — 외교부_국가·지역별 여행경보 (TravelAlarmService2).
 * Confirmed via 외교부_국가∙지역별 여행경보 Open API 활용가이드 v1.4.docx.
 * Response fields (flat, under top-level `data[]` — see file header):
 * country_nm (한글), country_eng_nm (영문), country_iso_alp2, continent_cd,
 * continent_nm, continent_eng_nm, alarm_lvl (경보단계 — empty string when no
 * active alarm; non-empty encoding not confirmed by a live example yet),
 * remark (비고), region_ty (지역유형), written_dt (작성일). Also supports
 * server-side filtering via `cond[country_nm::EQ]` / `cond[country_iso_alp2::EQ]`
 * (exact match) — not used here since an exact-match miss on our own
 * countryName spelling would silently return zero rows; client-side
 * filterByCountry() in dataGoKrSource.ts is used instead for robustness.
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
  const qs = new URLSearchParams({
    serviceKey,
    type: 'json',
    returnType: 'JSON',
    numOfRows: '100',
    pageNo: '1',
  });
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

  // Platform-level error (bad/unregistered service key, malformed request)
  // — this envelope shows up regardless of which service was called.
  const commonError = data?.OpenAPI_ServiceResponse?.cmmMsgHeader;
  if (commonError) {
    throw new Error(
      `mofaApi: ${url} — ${commonError.errMsg ?? 'error'} (${commonError.returnReasonCode ?? '?'}): ${commonError.returnAuthMsg ?? ''}`,
    );
  }

  // CountrySafetyService-style: { response: { header: { resultCode: "00" }, body: { items: { item: [...] } } } }
  const nestedHeader = data?.response?.header;
  if (nestedHeader) {
    if (nestedHeader.resultCode !== '00' && nestedHeader.resultCode !== undefined) {
      throw new Error(`mofaApi: ${url} returned ${nestedHeader.resultCode} ${nestedHeader.resultMsg ?? ''}`);
    }
    const items = data?.response?.body?.items?.item ?? data?.response?.body?.items ?? [];
    return Array.isArray(items) ? items : [items];
  }

  // TravelAlarmService2-style: flat, { resultCode: 0, resultMsg, data: [...] }
  if (data?.resultCode !== undefined || Array.isArray(data?.data)) {
    if (data.resultCode !== 0 && data.resultCode !== undefined) {
      throw new Error(`mofaApi: ${url} returned ${data.resultCode} ${data.resultMsg ?? ''}`);
    }
    const items = data?.data ?? [];
    return Array.isArray(items) ? items : [items];
  }

  // Unrecognized shape — surface it rather than silently returning nothing.
  throw new Error(`mofaApi: ${url} returned an unrecognized response shape: ${text.slice(0, 300)}`);
}

/** Reads the first defined value among several candidate field-name guesses. */
export function pickField(item: Record<string, unknown>, candidates: string[]): string | undefined {
  for (const key of candidates) {
    const value = item[key];
    if (value !== undefined && value !== null && value !== '') return String(value);
  }
  return undefined;
}
