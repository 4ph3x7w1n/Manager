<script lang="ts">
	import { theme } from '$lib/stores/theme';
	import { onMount } from 'svelte';

	let mounted = false;

	onMount(() => {
		mounted = true;
		theme.init();
	});

	function handleToggle() {
		theme.toggle();
	}

	$: currentTheme = $theme;
	$: isDark = currentTheme === 'dark' || (currentTheme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
</script>

{#if mounted}
	<button
		on:click={handleToggle}
		class="btn theme-toggle"
		aria-label="Toggle theme"
		title="Toggle between light and dark theme"
	>
		{#if isDark}
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="12" cy="12" r="5"/>
				<path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
			</svg>
		{:else}
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
			</svg>
		{/if}
	</button>
{/if}

<style>
	.theme-toggle {
		padding: var(--spacing-sm);
		min-width: 2.5rem;
		height: 2.5rem;
	}
	
	.theme-toggle:hover {
		transform: scale(1.05);
	}
	
	svg {
		transition: transform var(--transition-fast);
	}
</style>