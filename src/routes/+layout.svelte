<script lang="ts">
	import '../app.css';
	import { theme } from '$lib/stores/theme';
	import { onMount } from 'svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import NotificationSettings from '$lib/components/NotificationSettings.svelte';

	onMount(() => {
		theme.init();
	});
</script>

<svelte:head>
	<title>Incident Management Console</title>
</svelte:head>

<div class="app">
	<a href="#main-content" class="skip-link">Skip to main content</a>
	
	<header class="header" role="banner">
		<div class="header-content">
			<div class="header-left">
				<h1 class="header-title">
					<span class="header-icon">🚨</span>
					Incident Management Console
				</h1>
			</div>
			<div class="header-right">
				<NotificationSettings />
				<ThemeToggle />
			</div>
		</div>
	</header>

	<main class="main" id="main-content" role="main">
		<slot />
	</main>
</div>

<style>
	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background-color: var(--color-background);
	}

	.header {
		background-color: var(--color-card);
		border-bottom: 1px solid var(--color-border);
		box-shadow: var(--shadow-sm);
		position: sticky;
		top: 0;
		z-index: 50;
	}

	.header-content {
		max-width: var(--max-content-width);
		margin: 0 auto;
		padding: 0 var(--spacing-lg);
		height: var(--header-height);
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
	}

	.header-title {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		margin: 0;
		font-size: var(--font-size-xl);
		font-weight: 600;
		color: var(--color-foreground);
	}

	.header-icon {
		font-size: var(--font-size-2xl);
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
	}

	.main {
		flex: 1;
		padding: var(--spacing-lg);
		max-width: var(--max-content-width);
		margin: 0 auto;
		width: 100%;
	}

	@media (max-width: 768px) {
		.header-content {
			padding: 0 var(--spacing-md);
		}

		.header-title {
			font-size: var(--font-size-lg);
		}

		.header-icon {
			font-size: var(--font-size-xl);
		}

		.main {
			padding: var(--spacing-md);
		}
	}

	@media (max-width: 480px) {
		.header-title span:last-child {
			display: none;
		}
	}
</style>