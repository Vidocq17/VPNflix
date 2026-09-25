<script lang="ts">
	import { resolve } from '$app/paths';
	import TopNav from './TopNav.svelte';

	let { children } = $props();
</script>

<div class="flex min-h-screen flex-col bg-surface text-on-surface">
	<TopNav />
	<div class="flex-1">{@render children?.()}</div>
	<footer class="border-t border-white/10">
		<div
			class="mx-auto flex max-w-[1440px] flex-col gap-6 px-5 py-10 md:flex-row md:items-end md:justify-between md:px-16"
		>
			<div>
				<span class="text-2xl font-extrabold tracking-tighter text-primary">VPNflix</span>
				<p class="mt-2 text-xs text-on-surface-variant">
					Donnees fournies par TMDB. Ce produit n'est ni certifie ni approuve par TMDB.
				</p>
			</div>
			<div class="flex gap-6 text-xs text-on-surface-variant">
				<a href={resolve('/legal')} class="hover:text-on-surface">Mentions legales</a>
				<a href={resolve('/privacy')} class="hover:text-on-surface">Confidentialite</a>
			</div>
		</div>
	</footer>
</div>
