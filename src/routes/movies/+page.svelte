<script lang="ts">
	import BrowsePage from '$lib/components/browse/BrowsePage.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<BrowsePage {data} kind="movies" />
