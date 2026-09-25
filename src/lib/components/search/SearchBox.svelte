<!-- Champ de recherche principal par titre. Champ non controle (name="query") : la
     soumission du <form> parent (methode GET) declenche la navigation SvelteKit qui
     recharge +page.ts avec le nouveau parametre d'URL. -->
<script lang="ts">
	import Search from 'lucide-svelte/icons/search';

	let { value = '' }: { value?: string } = $props();
</script>

<div class="relative mx-auto w-full max-w-2xl">
	<Search
		class="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-[#c4c5d9]"
	/>
	<input
		type="search"
		name="query"
		{value}
		placeholder="Chercher un film ou une serie..."
		aria-label="Rechercher un titre"
		class="w-full rounded-full border border-white/10 bg-white/5 py-4 pl-14 pr-6 text-lg text-[#e5e2e1] backdrop-blur-2xl transition placeholder:text-[#c4c5d9]/50 focus:outline-none focus:ring-2 focus:ring-[#2e5bff]/40"
	/>
</div>
