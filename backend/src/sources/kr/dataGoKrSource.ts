import {
  RiskComponent,
  SafeHowTip,
  SafetyIndex,
  computeSafetyCheckIndex,
  statusFor,
  STATUS_LABELS,
} from '../../models/safetyIndex';
import { SafetySearchQuery, SafetySource } from '../types';
import {
  COUNTRY_ACCIDENT_URL,
  COUNTRY_SAFETY_NOTICE_URL,
  SP_TRAVEL_WARNING_URL,
  TRAVEL_ALARM_URL,
  fetchMofaItems,
  pickField,
} from './mofaApi';
import { fetchWeatherRisk } from './kmaWeatherApi';

interface DestinationProfile {
  countryCode: string;
  countryName: string;
  regionName: string;
  contextLabel: string;
  /** English names accepted for text search (city, country, etc). */
  aliases: string[];
  components: RiskComponent[];
  riskTags: string[];
  safeHowTips: SafeHowTip[];
}

/**
 * Weighted risk components and destination scores below are taken directly
 * from the proposal's own tables (extracted from the source .hwp — see
 * "안전체크 지수 산정 요소" and "MVP 대표 지역별 검증 시나리오"), not invented:
 *
 *  산정 요소      가중치   Paris 위험점수  Paris 반영점수
 *  여행경보         40%         20            8.00
 *  최근 공지        25%         24            6.00
 *  사건사고·치안    20%         50           10.00
 *  기상·재난        15%         27            4.05
 *                                  합계(종합위험점수) 28.05
 *
 * → 안전체크 지수 = 100 − 28.05 = 71.95 ≈ 72 ("유의 필요"), matching the
 * proposal's own worked Paris example exactly. Osaka (84점) and Phnom Penh
 * (52점) are the proposal's other two MVP validation destinations from the
 * same table, but only their final scores are given there (no per-component
 * breakdown) — the risk-component values below for those two are reverse
 * engineered to land exactly on 84.0 and 52.0 using the real 40/25/20/15
 * weights and each destination's qualitative risk themes from the proposal
 * (Osaka: 세관·의약품 반입, low crime, typhoon season; Phnom Penh: 여행자제
 * 단계, 고수익 취업 제안 사기, elevated personal-safety risk).
 *
 * riskTags and safeHowTips are taken from the .hwp's own embedded mockup
 * screenshots ([그림4] mobile/Paris, [그림3] desktop/Phnom Penh — both
 * legible; [그림2] tablet/Osaka's Safe-How icons were partly illegible at
 * the extracted resolution, so Osaka's tips are drawn from the clearer
 * narrative text elsewhere in the proposal instead of guessed from pixels).
 */
const DESTINATIONS: DestinationProfile[] = [
  {
    countryCode: 'FR',
    countryName: '프랑스',
    regionName: '파리',
    contextLabel: '관광지',
    aliases: ['paris', 'france'],
    components: [
      { label: '여행경보 위험점수', riskScore: 20, weight: 0.4 },
      { label: '최근 공지 위험점수', riskScore: 24, weight: 0.25 },
      { label: '사건사고·치안 위험점수', riskScore: 50, weight: 0.2 },
      { label: '기상·재난 위험점수', riskScore: 27, weight: 0.15 },
    ],
    riskTags: ['소매치기', '여권 분실', '관광지 주변 범죄'],
    safeHowTips: [
      { icon: '🎒', text: '백팩은 앞으로 메고 지퍼를 잠그세요.' },
      { icon: '⚠️', text: '야외 테이블 위에 스마트폰과 지갑을 올려두지 마세요.' },
      { icon: '📔', text: '여권 원본과 사본을 분리해 보관하세요.' },
    ],
  },
  {
    countryCode: 'JP',
    countryName: '일본',
    regionName: '오사카',
    contextLabel: '입국 전',
    aliases: ['osaka', 'japan'],
    components: [
      { label: '여행경보 위험점수', riskScore: 10, weight: 0.4 },
      { label: '최근 공지 위험점수', riskScore: 16, weight: 0.25 },
      { label: '사건사고·치안 위험점수', riskScore: 10, weight: 0.2 },
      { label: '기상·재난 위험점수', riskScore: 40, weight: 0.15 },
    ],
    riskTags: ['의약품 반입', '입국 유의', '여권 분실'],
    safeHowTips: [
      { icon: '💊', text: '처방전이 필요한 의약품은 반입 규정을 출국 전 확인하세요.' },
      { icon: '🛃', text: '세관 신고 대상 품목을 미리 확인하세요.' },
      { icon: '📔', text: '여권·수하물 분실·도난에 대비해 사본을 보관하세요.' },
    ],
  },
  {
    countryCode: 'KH',
    countryName: '캄보디아',
    regionName: '프놈펜',
    contextLabel: '출장·장기체류',
    aliases: ['phnom penh', 'cambodia'],
    components: [
      { label: '여행경보 위험점수', riskScore: 50, weight: 0.4 },
      { label: '최근 공지 위험점수', riskScore: 56, weight: 0.25 },
      { label: '사건사고·치안 위험점수', riskScore: 55, weight: 0.2 },
      { label: '기상·재난 위험점수', riskScore: 20, weight: 0.15 },
    ],
    riskTags: ['고수익 취업제안', '여권 보관 요구', '최신 공지 5건', '긴급 연락처'],
    safeHowTips: [
      { icon: '📄', text: '출국 전 회사·계약서·사업자 정보를 반드시 확인하세요.' },
      { icon: '🔒', text: '여권 원본을 타인에게 맡기지 말고, 본인이 직접 보관하세요.' },
      { icon: '⚠️', text: '위험 상황 발생 시 재외공관 공식 연락처로 우선 연락하세요.' },
    ],
  },
];

/**
 * Korea's Ministry of Foreign Affairs (외교부) publishes safety data about
 * *foreign* destinations for outbound Korean travelers — country/region
 * safety info, travel advisories, notices, incident prevention info,
 * overseas mission contacts — so this source is keyed by destination
 * country code (FR/JP/KH), not by "KR". `DATA_GO_KR_SERVICE_KEY` must be set
 * to call the live APIs; until the specific MOFA datasets are wired up (see
 * TODO below), the proposal's three MVP destinations return its worked
 * examples.
 */
export class DataGoKrSource implements SafetySource {
  readonly countryCodes = DESTINATIONS.map((d) => d.countryCode);
  readonly sourceName = '외교부 국가별 안전정보 · 여행경보 · 공지사항 · 사건사고 예방정보 · 재외공관 정보';

  constructor(private readonly serviceKey: string | undefined) {}

  async fetchByCountryCode(countryCode: string): Promise<SafetyIndex | null> {
    const profile = DESTINATIONS.find((d) => d.countryCode === countryCode.toUpperCase());
    return profile ? this.buildIndex(profile) : null;
  }

  async search(query: SafetySearchQuery): Promise<SafetyIndex[]> {
    const needle = query.query.trim().toLowerCase();
    const profile = DESTINATIONS.find(
      (d) =>
        d.countryCode.toLowerCase() === needle ||
        d.countryName.toLowerCase().includes(needle) ||
        d.regionName.toLowerCase().includes(needle) ||
        d.aliases.some((alias) => alias.includes(needle) || needle.includes(alias)),
    );
    return profile ? [await this.buildIndex(profile)] : [];
  }

  private async buildIndex(profile: DestinationProfile): Promise<SafetyIndex> {
    const { components, realtimeEventCorrection } = await this.fetchRiskComponents(profile);
    const score = computeSafetyCheckIndex(components, realtimeEventCorrection);
    const status = statusFor(score);
    return {
      countryCode: profile.countryCode,
      countryName: profile.countryName,
      regionName: profile.regionName,
      contextLabel: profile.contextLabel,
      score,
      status,
      statusLabel: STATUS_LABELS[status],
      riskTags: profile.riskTags,
      safeHowTips: profile.safeHowTips,
      updatedAt: new Date().toISOString(),
      sourceName: this.sourceName,
      factors: components.map((c) => ({ label: c.label, score: 100 - c.riskScore })),
    };
  }

  private async fetchRiskComponents(
    profile: DestinationProfile,
  ): Promise<{ components: RiskComponent[]; realtimeEventCorrection: number }> {
    if (!this.serviceKey) {
      // No service key configured — return the proposal's worked-example
      // risk components so the pipeline (API → app → widget) is
      // exercisable end-to-end before real MOFA credentials exist.
      return { components: profile.components, realtimeEventCorrection: 0 };
    }

    const key = this.serviceKey;
    const [travelAlarm, notices, accidents, weather, specialWarning] = await Promise.allSettled([
      fetchMofaItems(TRAVEL_ALARM_URL, key).then((items) => filterByCountry(items, profile)),
      fetchMofaItems(COUNTRY_SAFETY_NOTICE_URL, key).then((items) => filterByCountry(items, profile)),
      fetchMofaItems(COUNTRY_ACCIDENT_URL, key).then((items) => filterByCountry(items, profile)),
      fetchWeatherRisk(profile.countryCode, key),
      fetchMofaItems(SP_TRAVEL_WARNING_URL, key).then((items) => filterByCountry(items, profile)),
    ]);

    const fallback = profile.components;

    const components: RiskComponent[] = [
      {
        label: '여행경보 위험점수',
        weight: 0.4,
        riskScore: settledOr(travelAlarm, fallback[0].riskScore, (items) => travelAlarmRisk(items)),
      },
      {
        label: '최근 공지 위험점수',
        weight: 0.25,
        riskScore: settledOr(notices, fallback[1].riskScore, (items) => noticeCountRisk(items)),
      },
      {
        label: '사건사고·치안 위험점수',
        weight: 0.2,
        riskScore: settledOr(accidents, fallback[2].riskScore, (items) => countryAccidentRisk(items)),
      },
      {
        label: '기상·재난 위험점수',
        weight: 0.15,
        // fetchWeatherRisk() itself returns undefined (not a rejection) for
        // destinations with no GTS station coverage (e.g. Cambodia) — that
        // still needs to fall back to the proposal's placeholder value.
        riskScore: settledOr(weather, fallback[3].riskScore, (score) => score ?? fallback[3].riskScore),
      },
    ];

    // 특별여행주의보 (SpTravelWarningServiceV2) is the dataset the proposal
    // earmarked for "실시간 이벤트 보정" — a country actively flagged with a
    // 철수권고(evacuate)/여행금지(forbidden) special advisory subtracts
    // directly from the final index, on top of the weighted components.
    const realtimeEventCorrection = settledOr(specialWarning, 0, (items) =>
      specialWarningCorrection(items),
    );

    return { components, realtimeEventCorrection };
  }
}

/**
 * MOFA's own search params for these endpoints aren't independently
 * confirmed (no outbound network access to sample a real request from this
 * sandbox) — so instead of guessing a query-param name, this fetches a
 * broad page and matches the destination client-side against every string
 * field in each item. Less efficient than a proper server-side filter, but
 * robust to whatever the actual param name turns out to be.
 */
function filterByCountry(
  items: Record<string, unknown>[],
  profile: DestinationProfile,
): Record<string, unknown>[] {
  const needles = [profile.countryCode, profile.countryName, ...profile.aliases].map((s) =>
    s.toLowerCase(),
  );
  return items.filter((item) => {
    const haystack = Object.values(item).join(' ').toLowerCase();
    return needles.some((needle) => haystack.includes(needle));
  });
}

/** Unwraps a Promise.allSettled result, falling back to the proposal's worked-example value on any failure. */
function settledOr<T>(
  result: PromiseSettledResult<T>,
  fallback: number,
  extract: (value: T) => number,
): number {
  if (result.status === 'rejected') {
    console.warn('musai-backend: MOFA API call failed, using fallback value —', result.reason);
    return fallback;
  }
  return extract(result.value);
}

// 여행경보제도 defines 4 tiers: 1=남색경보(여행유의), 2=황색경보(여행자제),
// 3=적색경보(철수권고), 4=흑색경보(여행금지). The response field for this is
// confirmed to be `alarm_lvl` (외교부_국가∙지역별 여행경보 활용가이드 v1.4.docx),
// but the doc's own sample value was an empty string (Ghana had no active
// alarm), so the exact non-empty encoding (numeric tier vs. the Korean tier
// name vs. a color name) isn't confirmed — tries numeric first, then a
// Korean-keyword match against both alarm_lvl and remark (비고).
const TIER_KEYWORD_RISK: Array<[RegExp, number]> = [
  [/흑색|여행금지|금지/, 100],
  [/적색|철수권고|철수/, 75],
  [/황색|여행자제|자제/, 50],
  [/남색|여행유의|유의/, 25],
];

function travelAlarmRisk(items: Record<string, unknown>[]): number {
  // The list returns one row per country/region regardless of alarm status
  // (region_ty suggests some countries have several rows for sub-regions
  // with different alarm levels) — so zero matching rows means our country
  // name/code didn't match anything in the list (a lookup miss), not "no
  // active alarm", and multiple matches take the highest (most protective).
  if (items.length === 0) return 30;

  const risks = items.map((item) => {
    const alarmLvl = pickField(item, ['alarm_lvl']) ?? '';
    if (!alarmLvl) return 15; // matched the country; alarm_lvl is blank — no active alarm
    if (TRAVEL_ALARM_LEVEL_RISK[alarmLvl] !== undefined) return TRAVEL_ALARM_LEVEL_RISK[alarmLvl];
    const text = `${alarmLvl} ${pickField(item, ['remark']) ?? ''}`;
    const tier = TIER_KEYWORD_RISK.find(([pattern]) => pattern.test(text));
    return tier ? tier[1] : 40; // alarm_lvl is non-empty but unrecognized — assume some elevated risk
  });
  return Math.max(...risks);
}

const TRAVEL_ALARM_LEVEL_RISK: Record<string, number> = { '1': 25, '2': 50, '3': 75, '4': 100 };

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

// "최근 30~90일 내 공지 건수, 긴급공지 여부, 반복 위험 키워드" per the
// proposal's own spec. Field names (wrtDt/title/content) are confirmed
// against 외교부_기술문서_국가별 안전정보_v1.9.docx — see COUNTRY_SAFETY_NOTICE_URL
// in mofaApi.ts.
function noticeCountRisk(items: Record<string, unknown>[]): number {
  const now = Date.now();
  const recent = items.filter((item) => {
    const wrtDt = pickField(item, ['wrtDt']);
    if (!wrtDt) return true; // no date on record — count it conservatively
    const parsed = Date.parse(wrtDt);
    return Number.isNaN(parsed) || now - parsed <= NINETY_DAYS_MS;
  });
  const urgentCount = recent.filter((item) => {
    const text = `${pickField(item, ['title']) ?? ''} ${pickField(item, ['content']) ?? ''}`;
    return /긴급|위험|주의보|자제|철수/.test(text);
  }).length;
  return Math.min(100, 10 + recent.length * 6 + urgentCount * 10);
}

// CountryAccidentService2's `news` field is an HTML write-up (사건ㆍ사고
// 현황/유형, 자연재해, 유의해야할 지역 sections — see the confirmed sample
// in mofaApi.ts's COUNTRY_ACCIDENT_URL comment). Length and severe-keyword
// density stand in for "how much documented risk content exists" since
// there's no numeric severity field to read directly.
function countryAccidentRisk(items: Record<string, unknown>[]): number {
  if (items.length === 0) return 30; // lookup miss (no matching country row), not "no risk"
  const news = pickField(items[0], ['news']) ?? '';
  if (!news) return 15;

  const text = news.replace(/<[^>]+>/g, ' ');
  const severeCount = (text.match(/강도|살인|테러|납치|강간|폭탄|무장|총격/g) ?? []).length;
  const cautionCount = (text.match(/유의|주의|자제|위험|경계/g) ?? []).length;

  let risk = 20 + Math.min(20, Math.floor(text.length / 500));
  risk += Math.min(30, severeCount * 8);
  risk += Math.min(20, cautionCount * 2);
  return Math.min(100, risk);
}

// 철수권고(evacuate)/여행금지(forbidden) special-advisory flags subtract
// directly from the final index as a real-time correction, per the
// proposal's own "대규모 시위, 공항 폐쇄, 감염병 확산... 실시간 이벤트
// 보정점수를 별도로 적용" spec — these two fields are non-empty (e.g. "일부")
// only when that specific advisory is actively in force for the country.
function specialWarningCorrection(items: Record<string, unknown>[]): number {
  if (items.length === 0) return 0;
  const item = items[0];
  let correction = 0;
  if (pickField(item, ['forbidden_region_ty'])) correction += 20;
  if (pickField(item, ['evacuate_region_ty'])) correction += 10;
  return correction;
}
