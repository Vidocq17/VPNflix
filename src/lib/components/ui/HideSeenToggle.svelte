<!-- Masque les titres "Vus" dans les grilles (preference locale). Sans `name` : jamais soumis avec un formulaire GET. -->
<script lang="ts">
	import { seen } from '$lib/persist.svelte';
</script>

<label class="flex cursor-pointer items-center gap-2 text-sm text-on-surface-variant">
	<input
		type="checkbox"
		checked={seen.hide}
		onchange={(e) => seen.setHide(e.currentTarget.checked)}
	/>
	Masquer les titres deja vus
</label>
