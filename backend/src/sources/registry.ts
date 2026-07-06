import { DataGoKrSource } from './kr/dataGoKrSource';
import { PlaceholderGlobalSource } from './global/placeholderSource';
import { SafetySource } from './types';

/**
 * Ordered list of sources. The first source whose `countryCodes` includes
 * the requested country wins; `search` queries fan out to every source and
 * merge the results. Add a new country's real API by implementing
 * SafetySource and listing it here ahead of the placeholder fallback.
 */
export function buildSourceRegistry(): SafetySource[] {
  return [new DataGoKrSource(process.env.DATA_GO_KR_SERVICE_KEY), new PlaceholderGlobalSource()];
}
