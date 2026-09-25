<!-- Export / import JSON des donnees locales. Tout reste dans le navigateur (aucun envoi serveur). -->
<script lang="ts">
	import { applyBackup, buildBackup, MAX_BACKUP_BYTES, parseBackup } from '$lib/backup';
	import Button from './Button.svelte';
	import GlassPanel from './GlassPanel.svelte';

	let message = $state<{ ok: boolean; text: string } | null>(null);

	function download() {
		const blob = new Blob([JSON.stringify(buildBackup(), null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'vpnflix-sauvegarde.json';
		a.click();
		URL.revokeObjectURL(url);
		message = { ok: true, text: 'Sauvegarde telechargee.' };
	}

	async function upload(e: Event & { currentTarget: HTMLInputElement }) {
		const input = e.currentTarget;
		const file = input.files?.[0];
		input.value = ''; // permet de re-choisir le meme fichier
		if (!file) return;
		if (file.size > MAX_BACKUP_BYTES) {
			message = { ok: false, text: 'Fichier trop volumineux (500 Ko maximum).' };
			return;
		}
		const parsed = parseBackup(await file.text());
		if (!parsed.ok) {
			message = { ok: false, text: parsed.error };
			return;
		}
		applyBackup(parsed.data);
		const d = parsed.data;
		message = {
			ok: true,
			text: `Import reussi : ${d.favorites.length} favoris, ${d.watchlist.length} a voir, ${d.seen.length} vus, ${d.excluded.length} exclusions.`
		};
	}
</script>

<section class="mx-auto max-w-[1440px] px-5 pb-12 md:px-16" aria-labelledby="backup-title">
	<GlassPanel class="flex flex-col gap-4 p-8">
		<h2 id="backup-title" class="text-2xl font-bold">Sauvegarde de tes donnees</h2>
		<p class="max-w-xl text-sm text-on-surface-variant">
			Favoris, listes « A voir » et « Vus », filtres et plateformes exclues sont stockes dans ce
			navigateur. Exporte-les en JSON ou importe un fichier (remplace les donnees actuelles). Rien
			n'est envoye a un serveur.
		</p>
		<div class="flex flex-wrap items-center gap-4">
			<Button type="button" variant="primary" class="px-6" onclick={download}
				>Telecharger la sauvegarde</Button
			>
			<label class="text-sm font-semibold text-on-surface">
				Importer un fichier
				<input
					type="file"
					accept="application/json,.json"
					onchange={upload}
					class="ml-2 text-sm font-normal text-on-surface-variant"
				/>
			</label>
		</div>
		{#if message}
			<p
				role={message.ok ? 'status' : 'alert'}
				class={message.ok ? 'text-primary' : 'text-red-400'}
			>
				{message.text}
			</p>
		{/if}
	</GlassPanel>
</section>
