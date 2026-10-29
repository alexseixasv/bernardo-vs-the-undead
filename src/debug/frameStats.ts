export function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const clamped = Math.min(1, Math.max(0, p));
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(clamped * sorted.length) - 1));
  return sorted[index] ?? 0;
}

export function median(values: readonly number[]): number {
  return percentile(values, 0.5);
}

export function average(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }

  let sum = 0;
  for (const value of values) {
    sum += value;
  }
  return sum / values.length;
}
