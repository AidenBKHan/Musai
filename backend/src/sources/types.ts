import { SafetyIndex } from '../models/safetyIndex';

export interface SafetySearchQuery {
  /** Free-text query, e.g. a city or country name as typed by the user. */
  query: string;
}

/**
 * One plugin per country/agency data source. Each source is responsible for
 * calling its own upstream API and normalizing the result into the shared
 * SafetyIndex shape — the rest of the app never needs to know where the
 * numbers came from.
 */
export interface SafetySource {
  /** ISO 3166-1 alpha-2 country codes this source can answer for. */
  readonly countryCodes: string[];
  readonly sourceName: string;

  fetchByCountryCode(countryCode: string): Promise<SafetyIndex | null>;
  search(query: SafetySearchQuery): Promise<SafetyIndex[]>;
}
