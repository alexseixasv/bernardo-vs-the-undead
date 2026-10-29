export const STRESS_PRESETS = [14, 30, 50, 100, 200] as const;
export const STRESS_MAX = 200;

export interface DevFlags {
  perf: boolean;
  stress: number | null;
  bench: boolean;
}

export function readDevFlags(
  search: string = typeof window === 'undefined' ? '' : window.location.search,
  isDev: boolean = import.meta.env.DEV,
): DevFlags {
  if (!isDev) {
    return { perf: false, stress: null, bench: false };
  }

  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const stressRaw = params.get('stress');
  const parsed = stressRaw === null ? Number.NaN : Number(stressRaw);
  const stress =
    Number.isFinite(parsed) && parsed > 0 ? Math.min(STRESS_MAX, Math.floor(parsed)) : null;

  return {
    perf: params.has('perf'),
    stress,
    bench: params.has('bench'),
  };
}
