import {
  RiskComponent,
  SafeHowTip,
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
    const components = await this.fetchRiskComponents(profile);
    const score = computeSafetyCheckIndex(components);
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
