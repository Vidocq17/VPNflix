<!-- Page detail d'un titre (etape 11) : hero + disponibilites par provider/pays. -->
<script lang="ts">
	import AppShell from '$lib/components/layout/AppShell.svelte';
	import TitleAvailability from '$lib/components/search/TitleAvailability.svelte';
	import PosterCard from '$lib/components/ui/PosterCard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.title.title} - VPNflix</title>
</svelte:head>

<AppShell>
	<TitleAvailability title={data.title} groups={data.groups} trailer={data.trailer} />
	{#if data.similar.length > 0}
		<section class="mx-auto max-w-[1440px] px-5 pb-16 md:px-16" aria-labelledby="similar-title">
			<h2 id="similar-title" class="mb-6 text-3xl font-bold">Similaires</h2>
			<div class="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
				{#each data.similar as result (result.id)}
					<PosterCard {result} />
				{/each}
			</div>
		</section>
	{/if}
</AppShell>
