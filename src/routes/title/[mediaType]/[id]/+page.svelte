<!-- Page detail d'un titre (etape 11) : hero + disponibilites par provider/pays. -->
<script lang="ts">
	import AppShell from '$lib/components/layout/AppShell.svelte';
	import TitleAvailability from '$lib/components/search/TitleAvailability.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.title.title} - VPNflix</title>
</svelte:head>

<AppShell>
	<TitleAvailability title={data.title} groups={data.groups} />
</AppShell>
