<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let loading = false;
	export let disabled = false;

	const dispatch = createEventDispatcher<{
		refresh: void;
	}>();

	function handleRefresh() {
		if (!loading && !disabled) {
			dispatch('refresh');
		}
	}
</script>

<button
	on:click={handleRefresh}
	class="btn refresh-btn"
	class:loading
	{disabled}
	aria-label="Refresh dashboard data"
	title="Refresh all dashboard data"
>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="refresh-icon"
		class:animate-spin={loading}
	>
		<polyline points="23 4 23 10 17 10"></polyline>
		<polyline points="1 20 1 14 7 14"></polyline>
		<path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
	</svg>
	{#if loading}
		Refreshing...
	{:else}
		Refresh
	{/if}
</button>

<style>
	.refresh-btn {
		background-color: var(--color-primary);
		border-color: var(--color-primary);
		color: white;
		font-weight: 500;
	}

	.refresh-btn:hover:not(:disabled) {
		background-color: var(--color-primary-hover);
		border-color: var(--color-primary-hover);
	}

	.refresh-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.refresh-btn.loading {
		cursor: wait;
	}

	.refresh-icon {
		transition: transform var(--transition-normal);
	}

	.animate-spin {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>