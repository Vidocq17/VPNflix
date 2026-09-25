<!-- Topbar (design Stitch) : marque + liens Accueil, Films, Series. Pas de compte/favoris (retires du MVP). -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	const link = (p: string) =>
		`pb-1 text-base font-bold ${page.url.pathname === p ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant hover:text-on-surface'}`;
</script>

<header class="fixed top-0 z-50 w-full border-b border-white/10 bg-surface/80 backdrop-blur-xl">
	<nav class="mx-auto flex max-w-[1440px] items-center gap-8 px-5 py-4 md:px-16">
		<a href={resolve('/')} class="text-2xl font-extrabold tracking-tighter text-primary">VPNflix</a>
		<a href={resolve('/')} class={link('/')}>Accueil</a>
		<a href={resolve('/movies')} class={link('/movies')}>Films</a>
		<a href={resolve('/series')} class={link('/series')}>Series</a>
	</nav>
</header>
