<!-- Bouton de base (etape 14). Variants primary/secondary requis par les contraintes UI
     (etapes.md #14) ; seul "primary" est consomme pour l'instant (Rechercher). -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	let {
		variant = 'primary',
		class: className = '',
		children,
		...rest
	}: HTMLButtonAttributes & { variant?: 'primary' | 'secondary'; children?: Snippet } = $props();

	const variants = {
		primary: 'bg-primary-container text-white hover:bg-primary-container/90',
		secondary: 'border border-white/10 bg-white/5 text-on-surface hover:bg-white/10'
	};
</script>

<button
	{...rest}
	class="rounded-xl py-3 text-sm font-semibold transition {variants[variant]} {className}"
>
	{@render children?.()}
</button>
