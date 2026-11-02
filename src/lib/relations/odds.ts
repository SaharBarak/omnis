/** "1 in 263" for rare ties, "95% of pairs" for common ones. The one phrasing of a base rate. */
export function tieOdds(baseRate: number): string {
  if (baseRate >= 0.5) return `${Math.round(baseRate * 100)}% of pairs`
  return `1 in ${Math.round(1 / baseRate).toLocaleString('en-US')}`
}
