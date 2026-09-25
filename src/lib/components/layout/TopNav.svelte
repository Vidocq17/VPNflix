<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<!-- Topbar : nom de l'app uniquement. Pas de compte/connexion (Supabase retire du MVP). -->
<header class="fixed top-0 z-50 w-full border-b border-white/10 bg-[#131313]/80 backdrop-blur-xl">
	<nav class="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 md:px-16">
		<a href={resolve('/')} class="text-xl font-extrabold tracking-tight text-[#b8c3ff]">VPNflix</a>
	</nav>
</header>
