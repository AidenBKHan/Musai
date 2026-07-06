export type SafetyStatus = 'safe' | 'caution' | 'warning' | 'avoid';

export const STATUS_LABELS: Record<SafetyStatus, string> = {
  safe: '안전',
  caution: '유의 필요',
  warning: '위험',
  avoid: '여행 자제 권고',
};

/**
 * Provisional score→status thresholds. The proposal notes the real weights
 * and cutoffs are "향후 관계 부처 협의를 거쳐 최종 확정될 예정" (to be
 * finalized with the relevant ministries) — these bands only exist so the
 * widget has something to render before that happens.
 */
export function statusFor(score: number): SafetyStatus {
  if (score >= 85) return 'safe';
  if (score >= 65) return 'caution';
  if (score >= 40) return 'warning';
  return 'avoid';
}

/** One input to the safety-check-index formula (e.g. "여행경보 단계"). */
export interface RiskComponent {
  label: string;
  /** 0–100, higher = riskier. */
  riskScore: number;
  /** Relative weight; weights across all components should sum to 1. */
  weight: number;
}

export interface SafetyIndexFactor {
  label: string;
  score: number;
}

export interface SafetyIndex {
  countryCode: string;
  countryName: string;
  regionName?: string;
  /** 안전체크 지수, 0–100 — higher is safer. */
  score: number;
  status: SafetyStatus;
  statusLabel: string;
  /**
   * Safe-How action guide — 3 short, immediately actionable sentences per
   * the proposal's 처리 흐름 spec ("핵심 위험요약, 행동가이드 3개").
   */
  safeHowTips: string[];
  updatedAt: string;
  sourceName: string;
  factors: SafetyIndexFactor[];
}

/**
 * 종합위험점수 = weighted average of risk components (0–100, higher = riskier).
 * 안전체크 지수 = 100 − 종합위험점수 (+ optional real-time event correction,
 * e.g. mass protests, airport closures, epidemic spread, flight cancellations).
 */
export function computeSafetyCheckIndex(
  components: RiskComponent[],
  realtimeEventCorrection = 0,
): number {
  if (components.length === 0) return 100;
  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
  const compositeRisk =
    components.reduce((sum, c) => sum + c.riskScore * c.weight, 0) / totalWeight;
  const score = 100 - compositeRisk - realtimeEventCorrection;
  return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
}

/** Back-compat helper for sources that just want a plain weighted average of scores (higher = better). */
export function computeOverallScore(
  factors: Array<SafetyIndexFactor & { weight?: number }>,
): number {
  if (factors.length === 0) return 0;
  const totalWeight = factors.reduce((sum, f) => sum + (f.weight ?? 1), 0);
  const weighted = factors.reduce((sum, f) => sum + f.score * (f.weight ?? 1), 0);
  return Math.round((weighted / totalWeight) * 10) / 10;
}
