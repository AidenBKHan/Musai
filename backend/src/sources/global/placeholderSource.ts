import { SafetyIndex, computeOverallScore } from '../../models/safetyIndex';
import { SafetySearchQuery, SafetySource } from '../types';

const COUNTRIES: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  FR: 'France',
  DE: 'Germany',
  JP: 'Japan',
  CN: 'China',
  AU: 'Australia',
  CA: 'Canada',
};

/**
 * Stand-in for the many country-specific government sources that still need
 * to be integrated (each country publishes its own crime/disaster/traffic
 * open data under its own API). Produces a deterministic, clearly-labeled
 * placeholder score so the app/widget pipeline works for "any country" today,
 * without pretending to have live data no one has verified yet.
 *
 * Replace this with real per-country SafetySource implementations
 * (see sources/kr/dataGoKrSource.ts for the pattern) as they're integrated.
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
    return {
      countryCode,
      countryName,
      score: computeOverallScore(factors),
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
