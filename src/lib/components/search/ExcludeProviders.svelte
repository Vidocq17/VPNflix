<!-- Menu depliant natif : plateformes a exclure (sauvegarde localStorage, applique globalement). -->
<script lang="ts">
	import { excluded, MAX_EXCLUDED } from '$lib/persist.svelte';
	import type { WatchProvider } from '$lib/catalog/types';

	let { providers = [] }: { providers?: WatchProvider[] } = $props();
	let capped = $derived(new Set(providers.flatMap((p) => p.ids ?? [p.id])).size > MAX_EXCLUDED);
</script>

<details class="rounded-2xl border border-white/10 bg-white/5 p-4">
	<summary class="cursor-pointer font-semibold text-on-surface">
		Plateformes a exclure{excluded.ids.length ? ` (${excluded.ids.length})` : ''}
	</summary>
	<div class="mt-4 flex max-h-64 flex-wrap gap-2 overflow-y-auto overflow-x-hidden pr-1">
		{#each providers as provider (provider.id)}
			<button
				type="button"
				aria-pressed={excluded.has(provider.id)}
				onclick={() => excluded.toggle(provider)}
				class="rounded-full border px-4 py-2 text-sm font-medium transition {excluded.has(
					provider.id
				)
					? 'border-red-500/40 text-on-surface-variant/50 line-through'
					: 'border-outline-variant text-on-surface-variant hover:text-on-surface'}"
			>
				{provider.name}
			</button>
		{/each}
	</div>
	<p class="mt-4 text-xs text-on-surface-variant/70">
		Astuce : « Tout exclure », puis clique sur les plateformes que tu veux voir pour les reinclure.
	</p>
	{#if capped}
		<p class="mt-1 text-xs text-on-surface-variant/70">
			Limite de {MAX_EXCLUDED} exclusions : « Tout exclure » ne couvre que les premieres plateformes de
			la liste.
		</p>
	{/if}
	<div class="mt-3 flex gap-4">
		<button
			type="button"
			onclick={() => excluded.excludeAll(providers)}
			class="text-sm font-semibold text-primary"
		>
			Tout exclure
		</button>
		<button
			type="button"
			onclick={() => excluded.clear()}
			disabled={excluded.ids.length === 0}
			class="text-sm font-semibold text-primary disabled:opacity-40"
		>
			Tout inclure
		</button>
	</div>
</details>
