export interface SafetyIndexFactor {
  label: string;
  score: number;
}

export interface SafetyIndex {
  countryCode: string;
  countryName: string;
  regionName?: string;
  score: number;
  updatedAt: string;
  sourceName: string;
  factors: SafetyIndexFactor[];
}

/** Weighted average of factor scores, rounded to one decimal place. */
export function computeOverallScore(
  factors: Array<SafetyIndexFactor & { weight?: number }>,
): number {
  if (factors.length === 0) return 0;
  const totalWeight = factors.reduce((sum, f) => sum + (f.weight ?? 1), 0);
  const weighted = factors.reduce((sum, f) => sum + f.score * (f.weight ?? 1), 0);
  return Math.round((weighted / totalWeight) * 10) / 10;
}
