import { SafetyIndex } from '../models/safetyIndex';
import { SafetySource } from '../sources/types';
import { TtlCache } from '../lib/cache';

const CACHE_TTL_MS = 30 * 60 * 1000;

export class SafetyIndexService {
  private readonly countryCache = new TtlCache<SafetyIndex>(CACHE_TTL_MS);
  private readonly searchCache = new TtlCache<SafetyIndex[]>(CACHE_TTL_MS);

  constructor(private readonly sources: SafetySource[]) {}

  async getByCountryCode(countryCode: string): Promise<SafetyIndex | null> {
    const code = countryCode.toUpperCase();
    const cached = this.countryCache.get(code);
    if (cached) return cached;

    const source = this.sources.find((s) => s.countryCodes.includes(code));
    if (!source) return null;

    const result = await source.fetchByCountryCode(code);
    if (result) this.countryCache.set(code, result);
    return result;
  }

  async search(query: string): Promise<SafetyIndex[]> {
    const cached = this.searchCache.get(query);
    if (cached) return cached;

    const resultsPerSource = await Promise.all(this.sources.map((s) => s.search({ query })));
    const results = resultsPerSource.flat();
    this.searchCache.set(query, results);
    return results;
  }
}
