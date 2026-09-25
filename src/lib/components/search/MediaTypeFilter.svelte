<!-- Filtre Tous / Films / Series. Boutons radio natifs, stylises en pills (via has-[:checked]). -->
<script lang="ts">
	let { value = 'all' }: { value?: 'all' | 'movie' | 'tv' } = $props();

	const options = [
		{ value: 'all', label: 'Tous' },
		{ value: 'movie', label: 'Films' },
		{ value: 'tv', label: 'Series' }
	] as const;
</script>

<fieldset class="flex flex-wrap gap-2">
	<legend class="sr-only">Type de titre</legend>
	{#each options as option (option.value)}
		<label
			class="cursor-pointer rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-on-surface-variant transition has-[:checked]:border-primary-container has-[:checked]:bg-primary-container/20 has-[:checked]:text-on-surface"
		>
			<input
				type="radio"
				name="type"
				value={option.value}
				checked={value === option.value}
				class="sr-only"
			/>
			{option.label}
		</label>
	{/each}
</fieldset>
