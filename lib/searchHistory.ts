const COUNTS_KEY = "mhs_search_counts";

export function recordSearchQuery(rawQuery: string) {
  const query = rawQuery.trim().toLowerCase();
  if (query.length < 2) return;
  try {
    const stored = localStorage.getItem(COUNTS_KEY);
    const counts: Record<string, number> = stored ? JSON.parse(stored) : {};
    counts[query] = (counts[query] || 0) + 1;
    localStorage.setItem(COUNTS_KEY, JSON.stringify(counts));
  } catch {}
}

export function getTopSearchQueries(limit = 8): string[] {
  try {
    const stored = localStorage.getItem(COUNTS_KEY);
    if (!stored) return [];
    const counts: Record<string, number> = JSON.parse(stored);
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([q]) => q);
  } catch {
    return [];
  }
}
