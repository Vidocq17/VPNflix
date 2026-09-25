<script lang="ts">
	import { resolve } from '$app/paths';
	import TopNav from './TopNav.svelte';

	let { children } = $props();
</script>

<div class="min-h-screen bg-[#131313] text-[#e5e2e1]">
	<TopNav />
	{@render children?.()}
	<footer class="px-5 pb-8 text-center text-sm text-[#c4c5d7] md:px-16">
		<a href={resolve('/legal')} class="underline">Mentions legales</a> ·
		<a href={resolve('/privacy')} class="underline">Confidentialite</a>
	</footer>
</div>
