import { beforeEach, describe, expect, it } from 'vitest';
import {
	excluded,
	favorites,
	loadBrowseFilters,
	loadFilters,
	saveBrowseFilters,
	saveFilters
} from './persist.svelte';

const store = new Map<string, string>();
beforeEach(() => {
	store.clear();
	favorites.items = [];
	globalThis.localStorage = {
		getItem: (k: string) => store.get(k) ?? null,
		setItem: (k: string, v: string) => void store.set(k, v)
	} as unknown as Storage;
});

const dune = {
	mediaType: 'movie',
	id: 1,
	title: 'Dune',
	posterPath: '/d.jpg',
	overview: 'x'
} as const;

describe('filtres', () => {
	it('aller-retour et rejet des donnees invalides', () => {
		expect(loadFilters()).toBeNull();
		saveFilters({ type: 'tv', country: 'FR', providers: ['8'] });
		expect(loadFilters()).toEqual({ type: 'tv', country: 'FR', providers: ['8'] });
		store.set('vpnflix:filters', '{"type":"bad","country":"","providers":[]}');
		expect(loadFilters()).toBeNull();
		store.set('vpnflix:filters', 'pas du json');
		expect(loadFilters()).toBeNull();
	});
	it('ignore un localStorage qui leve', () => {
		globalThis.localStorage = {
			getItem: () => {
				throw new Error('x');
			},
			setItem: () => {
				throw new Error('x');
			}
		} as unknown as Storage;
		expect(loadFilters()).toBeNull();
		expect(() => saveFilters({ type: 'all', country: '', providers: [] })).not.toThrow();
	});
});

describe('filtres films/series', () => {
	const f = { genres: ['28'], yearFrom: '2000', yearTo: '', country: 'FR', providers: ['8'] };
	it('une cle par page, aller-retour, rejet des donnees invalides', () => {
		expect(loadBrowseFilters('movies')).toBeNull();
		saveBrowseFilters('movies', f);
		expect(loadBrowseFilters('movies')).toEqual(f);
		expect(loadBrowseFilters('series')).toBeNull();
		expect(store.has('vpnflix:filters:movies')).toBe(true);
		store.set(
			'vpnflix:filters:series',
			'{"genres":["x"],"yearFrom":"","yearTo":"","country":"","providers":[]}'
		);
		expect(loadBrowseFilters('series')).toBeNull();
	});
});

describe('plateformes exclues', () => {
	beforeEach(() => excluded.clear());
	it('toggle exclut tous les ids equivalents, persiste, se recharge, reinitialise', () => {
		excluded.toggle({ id: 119, ids: [9, 119] });
		expect(excluded.has(9) && excluded.has(119)).toBe(true);
		expect(JSON.parse(store.get('vpnflix:excluded-providers')!)).toEqual(['9', '119']);
		excluded.ids = [];
		excluded.load();
		expect(excluded.ids).toEqual(['9', '119']);
		excluded.toggle({ id: 119, ids: [9, 119] });
		expect(excluded.ids).toEqual([]);
		excluded.toggle({ id: 8 });
		excluded.clear();
		expect(excluded.ids).toEqual([]);
	});
	it('excludeAll : tous les ids, plafonne a 200 et signale', () => {
		expect(excluded.excludeAll([{ id: 119, ids: [9, 119] }, { id: 8 }])).toBe(false);
		expect(excluded.ids).toEqual(['9', '119', '8']);
		const many = Array.from({ length: 250 }, (_, i) => ({ id: i + 1 }));
		expect(excluded.excludeAll(many)).toBe(true);
		expect(excluded.ids).toHaveLength(200);
		expect(JSON.parse(store.get('vpnflix:excluded-providers')!)).toHaveLength(200);
		excluded.toggle({ id: 1 }); // reinclure
		expect(excluded.has(1)).toBe(false);
	});
	it('load ignore les donnees invalides', () => {
		store.set('vpnflix:excluded-providers', '["x"]');
		excluded.load();
		expect(excluded.ids).toEqual([]);
	});
});

describe('favoris', () => {
	it('toggle ajoute puis retire, ne stocke que les champs utiles, persiste', () => {
		favorites.toggle(dune);
		expect(favorites.has('movie', 1)).toBe(true);
		expect(favorites.has('tv', 1)).toBe(false);
		expect(JSON.parse(store.get('vpnflix:favorites')!)).toEqual([
			{ mediaType: 'movie', id: 1, title: 'Dune', posterPath: '/d.jpg' }
		]);
		favorites.items = [];
		favorites.load();
		expect(favorites.items).toHaveLength(1);
		favorites.toggle(dune);
		expect(favorites.items).toEqual([]);
	});
	it('load repart de zero si les donnees sont corrompues', () => {
		store.set('vpnflix:favorites', '[{"id":"a"}]');
		favorites.load();
		expect(favorites.items).toEqual([]);
	});
});
