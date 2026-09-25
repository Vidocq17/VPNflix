<!-- Panneau glassmorphism reutilisable (etape 14, introduit a l'etape 11 pour les providers). -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let { class: className = '', children }: { class?: string; children?: Snippet } = $props();
</script>

<div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl {className}">
	{@render children?.()}
</div>
