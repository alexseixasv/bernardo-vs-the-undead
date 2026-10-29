export interface DevFlags {
  perf: boolean;
  stress: number | null;
}

export function readDevFlags(
  search: string = typeof window === 'undefined' ? '' : window.location.search,
  isDev: boolean = import.meta.env.DEV,
): DevFlags {
  if (!isDev) {
    return { perf: false, stress: null };
  }

  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const stressRaw = params.get('stress');
  const parsed = stressRaw === null ? Number.NaN : Number(stressRaw);
  return {
    perf: params.has('perf'),
    stress: Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null,
  };
}
