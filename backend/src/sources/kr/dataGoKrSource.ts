import { SafetyIndex, computeOverallScore } from '../../models/safetyIndex';
import { SafetySearchQuery, SafetySource } from '../types';

const REGIONS: Record<string, string> = {
  서울: 'Seoul',
  부산: 'Busan',
  인천: 'Incheon',
  대구: 'Daegu',
  대전: 'Daejeon',
  광주: 'Gwangju',
  울산: 'Ulsan',
  세종: 'Sejong',
};

/**
 * Aggregates Korea's public-data-portal (data.go.kr) open APIs into a single
 * safety index. `DATA_GO_KR_SERVICE_KEY` must be set to call the live APIs;
 * the specific dataset endpoints (crime, disaster, traffic-accident stats,
 * etc.) that make up the final score are intentionally left as TODOs below —
 * pick the datasets your project has been granted access to on data.go.kr and
 * fill in `fetchFactors`.
 */
export class DataGoKrSource implements SafetySource {
  readonly countryCodes = ['KR'];
  readonly sourceName = '공공데이터포털 (data.go.kr)';

  constructor(private readonly serviceKey: string | undefined) {}

  async fetchByCountryCode(countryCode: string): Promise<SafetyIndex | null> {
    if (countryCode !== 'KR') return null;
    return this.buildIndex('대한민국', undefined);
  }

  async search(query: SafetySearchQuery): Promise<SafetyIndex[]> {
    const matchedRegion = Object.keys(REGIONS).find((ko) =>
      query.query.includes(ko) || query.query.toLowerCase().includes(REGIONS[ko].toLowerCase()),
    );
    if (!matchedRegion && !/korea|한국|대한민국/i.test(query.query)) return [];

    return [await this.buildIndex('대한민국', matchedRegion ? REGIONS[matchedRegion] : undefined)];
  }

  private async buildIndex(countryName: string, regionName?: string): Promise<SafetyIndex> {
    const factors = await this.fetchFactors(regionName);
    return {
      countryCode: 'KR',
      countryName,
      regionName,
      score: computeOverallScore(factors),
      updatedAt: new Date().toISOString(),
      sourceName: this.sourceName,
      factors,
    };
  }

  private async fetchFactors(regionName?: string) {
    if (!this.serviceKey) {
      // No service key configured — return clearly-labeled placeholder
      // factors so the rest of the pipeline (API, app, widget) can be
      // exercised end-to-end without live credentials.
      return [
        { label: '범죄 발생률 (placeholder)', score: 70, weight: 2 },
        { label: '재난 안전 (placeholder)', score: 80, weight: 1 },
        { label: '교통사고 안전 (placeholder)', score: 75, weight: 1 },
      ];
    }

    // TODO: call the specific data.go.kr datasets this project has access
    // to (e.g. 경찰청 범죄 발생 현황, 행정안전부 재난안전데이터) using
    // this.serviceKey, and map their fields into { label, score, weight }.
    // Keeping this as a single override point means adding a new upstream
    // dataset never touches the route/service layer above.
    void regionName;
    throw new Error(
      'DATA_GO_KR_SERVICE_KEY is set but fetchFactors() has no dataset wired up yet — see TODO in dataGoKrSource.ts',
    );
  }
}
