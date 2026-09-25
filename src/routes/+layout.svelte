<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { excluded, favorites } from '$lib/persist.svelte';

	let { children } = $props();
	onMount(() => {
		favorites.load();
		excluded.load();
		document.documentElement.dataset.ready = ''; // signal d'hydratation pour les tests e2e
	});
	const desc =
		'Cherchez un film ou une serie et comparez les pays ou le titre est disponible sur les plateformes de streaming legales.';
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="description" content={desc} />
	<link rel="canonical" href={page.url.origin + page.url.pathname} />
	<meta property="og:site_name" content="VPNflix" />
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="fr_FR" />
	<meta property="og:title" content="VPNflix" />
	<meta property="og:description" content={desc} />
	<meta property="og:url" content={page.url.origin + page.url.pathname} />
	<meta name="twitter:card" content="summary" />
</svelte:head>
{@render children()}
