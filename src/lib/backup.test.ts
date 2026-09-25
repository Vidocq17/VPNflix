import { beforeEach, describe, expect, it } from 'vitest';
import { applyBackup, buildBackup, MAX_BACKUP_BYTES, parseBackup } from './backup';
import { excluded, favorites, seen, watchlist } from './persist.svelte';

const store = new Map<string, string>();
beforeEach(() => {
	store.clear();
	globalThis.localStorage = {
		getItem: (k: string) => store.get(k) ?? null,
		setItem: (k: string, v: string) => void store.set(k, v)
	} as unknown as Storage;
	for (const l of [favorites, watchlist, seen]) l.items = [];
	seen.hide = false;
	excluded.ids = [];
});

const dune = { mediaType: 'movie', id: 1, title: 'Dune', posterPath: '/d.jpg' } as const;
const filters = { type: 'tv', country: 'FR', providers: ['8'] };

describe('sauvegarde', () => {
	it('export -> import : aller-retour complet', () => {
		favorites.toggle(dune);
		watchlist.toggle({ ...dune, id: 2 });
		seen.toggle({ ...dune, id: 3 });
		seen.setHide(true);
		excluded.replace(['8', '9']);
		store.set('vpnflix:filters', JSON.stringify(filters));
		const text = JSON.stringify(buildBackup());

		store.clear();
		for (const l of [favorites, watchlist, seen]) l.items = [];
		seen.hide = false;
		excluded.ids = [];
		const parsed = parseBackup(text);
		expect(parsed.ok).toBe(true);
		if (parsed.ok) applyBackup(parsed.data);
		expect(favorites.items).toEqual([dune]);
		expect(watchlist.items.map((i) => i.id)).toEqual([2]);
		expect(seen.items.map((i) => i.id)).toEqual([3]);
		expect(seen.hide).toBe(true);
		expect(excluded.ids).toEqual(['8', '9']);
		expect(JSON.parse(store.get('vpnflix:filters')!)).toEqual(filters);
		expect(JSON.parse(store.get('vpnflix:favorites')!)).toEqual([dune]); // persiste
	});

	const valid = () => JSON.parse(JSON.stringify(buildBackup()));
	it.each([
		['pas du JSON', 'x{'],
		['objet inconnu', JSON.stringify({ ...valid(), extra: 1 })],
		['version', JSON.stringify({ ...valid(), version: 2 })],
		['favori avec champ en trop', JSON.stringify({ ...valid(), favorites: [{ ...dune, x: 1 }] })],
		['id exclu invalide', JSON.stringify({ ...valid(), excluded: ['abc'] })],
		['filtre invalide', JSON.stringify({ ...valid(), filters: { ...filters, type: 'x' } })],
		['tableau', '[]'],
		['trop gros', ' '.repeat(MAX_BACKUP_BYTES + 1)]
	])('rejette : %s (message clair, rien d ecrit)', (_n, text) => {
		const res = parseBackup(text);
		expect(res.ok).toBe(false);
		if (!res.ok) expect(res.error.length).toBeGreaterThan(10);
		expect(store.size).toBe(0);
	});

	it('trop de favoris (201) rejete', () => {
		const items = Array.from({ length: 201 }, (_, i) => ({ ...dune, id: i + 1 }));
		expect(parseBackup(JSON.stringify({ ...valid(), favorites: items })).ok).toBe(false);
	});
});
