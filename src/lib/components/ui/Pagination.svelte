<!-- Pagination : Premiere / Precedent, page courante + 2 suivantes, Suivant / Derniere, et
     "Aller a la page" (formulaire GET natif). `href(n)` construit le lien en gardant les filtres ;
     `params` (filtres courants) est reinjecte en champs caches dans le formulaire. -->
<script lang="ts">
	import { pageWindow } from '$lib/pagination';

	let {
		page,
		total,
		href,
		action,
		params = []
	}: {
		page: number;
		total: number;
		href: (n: number) => string;
		action: string;
		params?: [string, string][];
	} = $props();

	const link = 'font-semibold text-primary hover:underline';
</script>

<nav class="mt-10 flex flex-wrap items-center justify-between gap-4" aria-label="Pagination">
	<div class="flex flex-wrap items-center gap-4">
		{#if page > 1}
			<!-- eslint-disable svelte/no-navigation-without-resolve -- href construit avec resolve() par l'appelant -->
			<a href={href(1)} class={link}>Premiere</a>
			<a href={href(page - 1)} class={link}>Precedent</a>
		{/if}
		{#each pageWindow(page, total) as n (n)}
			{#if n === page}
				<span aria-current="page" class="rounded-md bg-primary-container/30 px-3 py-1 font-bold"
					>{n}</span
				>
			{:else}
				<a href={href(n)} class={link}>{n}</a>
			{/if}
		{/each}
		{#if page < total}
			<a href={href(page + 1)} class={link}>Suivant</a>
			<a href={href(total)} class={link}>Derniere page</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		{/if}
	</div>
	<form method="GET" {action} class="flex items-center gap-2">
		{#each params as [k, v], i (i)}<input type="hidden" name={k} value={v} />{/each}
		<label for="goto-page" class="text-sm text-on-surface-variant">Page</label>
		<input
			id="goto-page"
			type="number"
			name="page"
			min="1"
			max={total}
			value={page}
			required
			class="w-20 rounded-xl border border-white/10 bg-surface-container px-3 py-2 text-on-surface"
		/>
		<button type="submit" class="font-semibold text-primary">Aller</button>
		<span class="text-sm text-on-surface-variant">/ {total}</span>
	</form>
</nav>
