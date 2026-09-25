<!-- Etat de chargement generique. Non consomme pour l'instant : la recherche passe par
     PageLoad (SvelteKit load()) execute avant le rendu, pas de fetch cote client a couvrir
     dans ce MVP. Fourni pour completude de l'etape 14 (voir etapes.md #14). -->
<script lang="ts">
	let { label = 'Chargement...' }: { label?: string } = $props();
</script>

<div
	class="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-24 text-center"
>
	<div
		class="size-6 animate-spin rounded-full border-2 border-white/20 border-t-primary-container"
	></div>
	<p class="text-sm text-on-surface-variant/70">{label}</p>
</div>
