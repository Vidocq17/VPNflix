/** Fenetre de pages : la page courante + les 2 suivantes, bornees au total. */
export function pageWindow(current: number, total: number): number[] {
	const last = Math.max(1, total);
	const start = Math.min(Math.max(1, current), last);
	return Array.from({ length: Math.min(3, last - start + 1) }, (_, i) => start + i);
}
