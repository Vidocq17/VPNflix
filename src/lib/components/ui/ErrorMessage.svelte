<!-- Message d'erreur generique. Le texte doit toujours dire quoi faire ensuite (contrainte
     etape 14) : c'est deja le cas du texte appelant (ex: "Reessaie dans un instant."). -->
<script lang="ts">
	let { message }: { message: string } = $props();
</script>

<p class="rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-sm text-red-200">
	{message}
</p>
