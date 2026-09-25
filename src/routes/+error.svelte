<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>Erreur {page.status} - VPNflix</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="mx-auto max-w-2xl px-5 pt-28 text-on-surface">
	<h1 class="text-2xl font-bold">Erreur {page.status}</h1>
	<p class="mt-4">{page.error?.message}</p>
	<a href={resolve('/')} class="mt-6 inline-block text-primary underline">Retour a l'accueil</a>
</main>
