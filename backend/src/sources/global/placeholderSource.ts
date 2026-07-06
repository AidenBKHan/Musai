import { SafetyIndex, computeOverallScore, statusFor, STATUS_LABELS } from '../../models/safetyIndex';
import { SafetySearchQuery, SafetySource } from '../types';

// FR/JP (and any future MVP destination) are handled by DataGoKrSource with
// real MOFA-shaped data; this list intentionally excludes them.
const COUNTRIES: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  DE: 'Germany',
  CN: 'China',
  AU: 'Australia',
  CA: 'Canada',
};

/**
 * Stand-in for the many destinations not yet covered by a real government
 * data source (see sources/kr/dataGoKrSource.ts for that pattern). Produces
 * a deterministic, clearly-labeled placeholder score so the app/widget
 * pipeline works for "any country" today, without pretending to have live
 * data no one has verified yet.
 */
export class PlaceholderGlobalSource implements SafetySource {
  readonly countryCodes = Object.keys(COUNTRIES);
  readonly sourceName = '샘플 데이터 (실제 국가 API 연동 전)';

  async fetchByCountryCode(countryCode: string): Promise<SafetyIndex | null> {
    const countryName = COUNTRIES[countryCode.toUpperCase()];
    if (!countryName) return null;
    return this.buildIndex(countryCode.toUpperCase(), countryName);
  }

  async search(query: SafetySearchQuery): Promise<SafetyIndex[]> {
    const needle = query.query.trim().toLowerCase();
    const match = Object.entries(COUNTRIES).find(([code, name]) =>
      name.toLowerCase().includes(needle) || code.toLowerCase() === needle,
    );
    return match ? [await this.buildIndex(match[0], match[1])] : [];
  }

  private async buildIndex(countryCode: string, countryName: string): Promise<SafetyIndex> {
    const factors = [
      { label: 'Crime rate (placeholder)', score: this.deterministicScore(countryCode, 1), weight: 2 },
      { label: 'Disaster safety (placeholder)', score: this.deterministicScore(countryCode, 2), weight: 1 },
      { label: 'Traffic safety (placeholder)', score: this.deterministicScore(countryCode, 3), weight: 1 },
    ];
    const score = computeOverallScore(factors);
    const status = statusFor(score);
    return {
      countryCode,
      countryName,
      score,
      status,
      statusLabel: STATUS_LABELS[status],
      safeHowTips: ['실제 데이터 연동 전 표시되는 샘플 안내입니다.'],
      updatedAt: new Date().toISOString(),
      sourceName: this.sourceName,
      factors,
    };
  }

  /** Stable pseudo-score in [50, 95] so repeated calls don't jitter. */
  private deterministicScore(countryCode: string, salt: number): number {
    let hash = salt;
    for (const ch of countryCode) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
    return 50 + (hash % 46);
  }
}
