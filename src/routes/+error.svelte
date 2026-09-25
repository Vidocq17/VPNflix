<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>Erreur {page.status} - VPNflix</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="mx-auto max-w-2xl px-5 pt-28 text-[#e5e2e1]">
	<h1 class="text-2xl font-bold">Erreur {page.status}</h1>
	<p class="mt-4">{page.error?.message}</p>
	<a href={resolve('/')} class="mt-6 inline-block text-[#b8c3ff] underline">Retour a l'accueil</a>
</main>
