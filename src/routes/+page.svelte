<!-- Interface de recherche (etape 10). Formulaire GET natif : la soumission navigue
     vers /?query=...&type=...&country=...&providers=... et SvelteKit re-execute
     +page.ts, sans JS de fetch cote client. -->
<script lang="ts">
	import AppShell from '$lib/components/layout/AppShell.svelte';
	import SearchBox from '$lib/components/search/SearchBox.svelte';
	import SearchFilters from '$lib/components/search/SearchFilters.svelte';
	import SearchResultList from '$lib/components/search/SearchResultList.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>VPNflix - Trouver ou regarder vos films et series legalement</title>
	{#if data.query}<meta name="robots" content="noindex" />{/if}
</svelte:head>

<AppShell>
	<main class="mx-auto max-w-[1440px] px-5 pb-16 pt-28 md:px-16">
		<form method="GET" class="flex flex-col gap-10">
			<h1 class="sr-only">Rechercher un film ou une serie</h1>
			<SearchBox value={data.query} />

			<div class="grid grid-cols-1 gap-8 md:grid-cols-12">
				<aside class="md:col-span-3">
					<SearchFilters
						type={data.type}
						country={data.country}
						countries={data.countries}
						providers={data.availableProviders}
						selectedProviders={data.providers}
					/>
					<Button type="submit" variant="primary" class="mt-6 w-full">Rechercher</Button>
				</aside>

				<div class="md:col-span-9">
					<SearchResultList
						results={data.results}
						query={data.query}
						errorMessage={data.errorMessage}
					/>
				</div>
			</div>
		</form>
	</main>
</AppShell>
