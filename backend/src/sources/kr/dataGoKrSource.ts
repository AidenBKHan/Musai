import {
  RiskComponent,
  SafetyIndex,
  computeSafetyCheckIndex,
  statusFor,
  STATUS_LABELS,
} from '../../models/safetyIndex';
import { SafetySearchQuery, SafetySource } from '../types';

interface DestinationProfile {
  countryCode: string;
  countryName: string;
  regionName: string;
  /** English names accepted for text search (city, country, etc). */
  aliases: string[];
  components: RiskComponent[];
  safeHowTip: string;
}

/**
 * Weighted risk components matching the proposal's 안전체크 지수 formula:
 * 여행경보 단계(외교부 4단계: 남색/황색/적색/흑색) · 최근 공지 · 사건사고·치안정보 ·
 * 기상·재난정보, plus an optional 실시간 이벤트 보정(대규모 시위/공항폐쇄/감염병/
 * 항공 대량결항 등) applied on top in computeSafetyCheckIndex.
 *
 * Paris reproduces the proposal's own worked example: composite risk 28.0 →
 * safety-check index 100 − 28.0 = 72 ("유의 필요"), driven mainly by
 * pickpocketing/theft risk around tourist sites — matching the MVP demo
 * scenario described for the Paris voucher-confirmation screen. Osaka and
 * Phnom Penh are the proposal's other two MVP validation destinations.
 */
const DESTINATIONS: DestinationProfile[] = [
  {
    countryCode: 'FR',
    countryName: '프랑스',
    regionName: '파리',
    aliases: ['paris', 'france'],
    components: [
      { label: '여행경보 단계 (남색·여행유의)', riskScore: 10, weight: 0.4 },
      { label: '최근 공지', riskScore: 15, weight: 0.2 },
      { label: '사건사고·치안정보 (소매치기 등)', riskScore: 60, weight: 0.25 },
      { label: '기상·재난정보', riskScore: 40, weight: 0.15 },
    ],
    safeHowTip: '주요 관광지와 대중교통 이용 시 소매치기, 여권·휴대폰 분실에 유의하세요.',
  },
  {
    countryCode: 'JP',
    countryName: '일본',
    regionName: '오사카',
    aliases: ['osaka', 'japan'],
    components: [
      { label: '여행경보 단계 (남색·여행유의)', riskScore: 8, weight: 0.4 },
      { label: '최근 공지', riskScore: 10, weight: 0.2 },
      { label: '사건사고·치안정보', riskScore: 15, weight: 0.25 },
      { label: '기상·재난정보 (태풍 등)', riskScore: 35, weight: 0.15 },
    ],
    safeHowTip: '의약품 반입 규정과 세관 신고 대상 품목을 출국 전 확인하세요.',
  },
  {
    countryCode: 'KH',
    countryName: '캄보디아',
    regionName: '프놈펜',
    aliases: ['phnom penh', 'cambodia'],
    components: [
      { label: '여행경보 단계 (황색·여행자제)', riskScore: 45, weight: 0.4 },
      { label: '최근 공지 (고수익 취업 제안 사기 등)', riskScore: 70, weight: 0.2 },
      { label: '사건사고·치안정보', riskScore: 55, weight: 0.25 },
      { label: '기상·재난정보', riskScore: 20, weight: 0.15 },
    ],
    safeHowTip: '고수익 해외 취업 제안과 여권 보관 요구에 유의하고, 재외공관 연락처를 미리 확인하세요.',
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
    const components = await this.fetchRiskComponents(profile);
    const score = computeSafetyCheckIndex(components);
    const status = statusFor(score);
    return {
      countryCode: profile.countryCode,
      countryName: profile.countryName,
      regionName: profile.regionName,
      score,
      status,
      statusLabel: STATUS_LABELS[status],
      safeHowTip: profile.safeHowTip,
      updatedAt: new Date().toISOString(),
      sourceName: this.sourceName,
      factors: components.map((c) => ({ label: c.label, score: 100 - c.riskScore })),
    };
  }

  private async fetchRiskComponents(profile: DestinationProfile): Promise<RiskComponent[]> {
    if (!this.serviceKey) {
      // No service key configured — return the proposal's worked-example
      // risk components so the pipeline (API → app → widget) is
      // exercisable end-to-end before real MOFA credentials exist.
      return profile.components;
    }

    // TODO: replace with live calls to data.go.kr's real MOFA (외교부)
    // datasets using this.serviceKey. Confirmed datasets, one per risk
    // component below:
    //
    //  여행경보 단계
    //   - 외교부_국가·지역별 여행경보 — data.go.kr/data/15076237
    //     GET apis.data.go.kr/1262000/TravelAlarmService2/getTravelAlarmList2
    //   - 외교부_국가별 여행경보 히스토리 — data.go.kr/data/15059195
    //   - 외교부_여행경보제도 (tier definitions) — data.go.kr/data/15000827
    //
    //  최근 공지
    //   - 외교부_국가·지역별 안전공지 — data.go.kr/data/15076239
    //
    //  사건사고·치안정보
    //   - 외교부_국가·지역별 사건사고 유형 — data.go.kr/data/15076236
    //   - 외교부_사건사고 예방정보 — data.go.kr/data/15000654
    //
    //  실시간 이벤트 보정 (특별여행주의보 등)
    //   - 외교부_국가·지역별 특별여행주의보 — data.go.kr/data/15076244
    //
    //  기상·재난정보 — NOT a MOFA dataset; this is 기상청 (KMA) public data,
    //  a separate agency/service key, per the proposal's phase-2 plan.
    //
    //  참고 (not a risk component, but needed for the widget's 재외공관
    //  연락처 display and country-code normalization):
    //   - 외교부_국가·지역별 재외공관 정보 — data.go.kr/data/15075354
    //     (전화번호/영사콜센터/긴급전화번호/주소)
    //   - 외교부_재외공관 홈페이지 — data.go.kr/data/15075347
    //   - 외교부_국가표준코드 — data.go.kr/data/15091117
    //
    // Map each dataset's fields onto a RiskComponent so this function's
    // signature never needs to change as datasets are added.
    throw new Error(
      'DATA_GO_KR_SERVICE_KEY is set but fetchRiskComponents() has no dataset wired up yet — see TODO in dataGoKrSource.ts',
    );
  }
}
