<!-- TODO(etape 14): bouton de base (variants primary/secondary). -->
<script lang="ts">
	let { children } = $props();
</script>

<button>{@render children?.()}</button>
