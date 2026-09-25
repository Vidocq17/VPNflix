// Rate limit en memoire (fenetre fixe). Suffisant tant que le process reste chaud.
// ponytail: par instance ; passer a Upstash Redis si deploiement serverless multi-instances.
const hits = new Map<string, { count: number; reset: number }>();
const WINDOW_MS = 60_000;

/** Retourne true si la requete depasse `limit` par minute pour `key`. */
export function isRateLimited(key: string, limit: number, now = Date.now()): boolean {
	if (hits.size > 10_000) for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
	let entry = hits.get(key);
	if (!entry || entry.reset <= now) {
		entry = { count: 0, reset: now + WINDOW_MS };
		hits.set(key, entry);
	}
	return ++entry.count > limit;
}
