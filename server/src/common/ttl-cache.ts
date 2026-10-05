/**
 * Tiny in-process cache for read-mostly queries (home payload, listing
 * counts, category/brand lookups). Concurrent callers for a missing key share
 * one in-flight promise, failures are never cached, and the oldest entries
 * are evicted past `maxEntries`. Per-instance only: with several API
 * replicas each keeps its own copy, which is fine for data that may be up to
 * `ttlMs` stale.
 */
export class TtlCache<T> {
  private readonly entries = new Map<
    string,
    { at: number; value: Promise<T> }
  >();

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries = 500,
  ) {}

  get(key: string, load: () => Promise<T>): Promise<T> {
    const hit = this.entries.get(key);
    if (hit && Date.now() - hit.at < this.ttlMs) return hit.value;

    const value = load();
    this.entries.delete(key);
    this.entries.set(key, { at: Date.now(), value });
    if (this.entries.size > this.maxEntries) {
      this.entries.delete(this.entries.keys().next().value as string);
    }
    value.catch(() => {
      if (this.entries.get(key)?.value === value) this.entries.delete(key);
    });
    return value;
  }
}
