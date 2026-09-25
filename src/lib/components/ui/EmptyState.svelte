<!-- Etat vide generique (recherche : pas de query / aucun resultat, disponibilites : aucun
     provider). Pas de notion de favoris (retire avec Supabase). -->
<script lang="ts">
	let {
		title,
		description = '',
		compact = false
	}: { title: string; description?: string; compact?: boolean } = $props();
</script>

{#if compact}
	<div class="rounded-2xl border border-white/10 bg-white/5 px-6 py-8 text-center">
		<p class="text-sm text-[#c4c5d9]/70">{title}</p>
		{#if description}
			<p class="mt-1 text-sm text-[#c4c5d9]/60">{description}</p>
		{/if}
	</div>
{:else}
	<div
		class="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-24 text-center"
	>
		<p class="text-lg font-semibold text-[#e5e2e1]">{title}</p>
		{#if description}
			<p class="text-sm text-[#c4c5d9]/60">{description}</p>
		{/if}
	</div>
{/if}
