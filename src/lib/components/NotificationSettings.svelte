<script lang="ts">
	import { onMount } from 'svelte';
	import { notificationManager } from '$lib/utils/notifications';
	import type { NotificationSettings } from '$lib/types';

	let settings: NotificationSettings;
	let permission: NotificationPermission = 'default';
	let isSupported = false;
	let showSettings = false;

	onMount(() => {
		isSupported = notificationManager.isSupported();
		permission = notificationManager.getPermission();
		settings = notificationManager.getSettings();
	});

	async function requestPermission() {
		const granted = await notificationManager.requestPermission();
		permission = notificationManager.getPermission();
		
		if (granted) {
			settings.enabled = true;
			updateSettings();
		}
	}

	function updateSettings() {
		notificationManager.updateSettings(settings);
	}

	function toggleSettings() {
		showSettings = !showSettings;
	}

	$: canShowNotifications = isSupported && permission === 'granted';
</script>

<div class="notification-settings">
	<button 
		class="btn notification-toggle" 
		on:click={toggleSettings}
		title="Notification settings"
		aria-label="Toggle notification settings"
	>
		<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
			<path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
		</svg>
		{#if canShowNotifications && settings.enabled}
			<span class="notification-indicator active"></span>
		{:else if permission === 'denied'}
			<span class="notification-indicator blocked"></span>
		{/if}
	</button>

	{#if showSettings}
		<div class="notification-panel">
			<div class="panel-header">
				<h4>Notification Settings</h4>
				<button class="btn-close" on:click={toggleSettings} aria-label="Close settings">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="18" y1="6" x2="6" y2="18"/>
						<line x1="6" y1="6" x2="18" y2="18"/>
					</svg>
				</button>
			</div>

			<div class="panel-content">
				{#if !isSupported}
					<div class="notification-status error">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="12" cy="12" r="10"/>
							<line x1="15" y1="9" x2="9" y2="15"/>
							<line x1="9" y1="9" x2="15" y2="15"/>
						</svg>
						<span>Notifications not supported in this browser</span>
					</div>
				{:else if permission === 'denied'}
					<div class="notification-status error">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="12" cy="12" r="10"/>
							<line x1="15" y1="9" x2="9" y2="15"/>
							<line x1="9" y1="9" x2="15" y2="15"/>
						</svg>
						<span>Notifications blocked. Please enable in browser settings.</span>
					</div>
				{:else if permission === 'default'}
					<div class="notification-status warning">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
							<line x1="12" y1="9" x2="12" y2="13"/>
							<line x1="12" y1="17" x2="12.01" y2="17"/>
						</svg>
						<div>
							<p>Enable notifications to receive alerts for urgent incidents and mentions.</p>
							<button class="btn btn-primary" on:click={requestPermission}>
								Enable Notifications
							</button>
						</div>
					</div>
				{:else}
					<div class="notification-status success">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<polyline points="20 6 9 17 4 12"/>
						</svg>
						<span>Notifications enabled</span>
					</div>

					<div class="notification-controls">
						<label class="control-item">
							<input 
								type="checkbox" 
								bind:checked={settings.enabled}
								on:change={updateSettings}
							/>
							<span class="control-label">Enable all notifications</span>
						</label>

						{#if settings.enabled}
							<div class="sub-controls">
								<label class="control-item">
									<input 
										type="checkbox" 
										bind:checked={settings.p1_incidents}
										on:change={updateSettings}
									/>
									<span class="control-label">P1 Incidents</span>
								</label>

								<label class="control-item">
									<input 
										type="checkbox" 
										bind:checked={settings.p2_incidents}
										on:change={updateSettings}
									/>
									<span class="control-label">P2 Incidents</span>
								</label>

								<label class="control-item">
									<input 
										type="checkbox" 
										bind:checked={settings.sla_warnings}
										on:change={updateSettings}
									/>
									<span class="control-label">SLA Warnings</span>
								</label>

								<label class="control-item">
									<input 
										type="checkbox" 
										bind:checked={settings.new_mentions}
										on:change={updateSettings}
									/>
									<span class="control-label">Slack Mentions</span>
								</label>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.notification-settings {
		position: relative;
	}

	.notification-toggle {
		position: relative;
		padding: var(--spacing-sm);
		min-width: 2.5rem;
		height: 2.5rem;
	}

	.notification-indicator {
		position: absolute;
		top: 4px;
		right: 4px;
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}

	.notification-indicator.active {
		background-color: var(--color-success);
		box-shadow: 0 0 0 2px var(--color-card);
	}

	.notification-indicator.blocked {
		background-color: var(--color-destructive);
		box-shadow: 0 0 0 2px var(--color-card);
	}

	.notification-panel {
		position: absolute;
		top: calc(100% + var(--spacing-sm));
		right: 0;
		width: 320px;
		background-color: var(--color-card);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		z-index: 100;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-md);
		border-bottom: 1px solid var(--color-border);
	}

	.panel-header h4 {
		margin: 0;
		font-size: var(--font-size-base);
		font-weight: 600;
		color: var(--color-foreground);
	}

	.btn-close {
		background: none;
		border: none;
		color: var(--color-muted-foreground);
		cursor: pointer;
		padding: var(--spacing-xs);
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}

	.btn-close:hover {
		background-color: var(--color-surface);
		color: var(--color-foreground);
	}

	.panel-content {
		padding: var(--spacing-md);
	}

	.notification-status {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-md);
		border-radius: var(--radius);
		margin-bottom: var(--spacing-md);
	}

	.notification-status.success {
		background-color: rgba(34, 197, 94, 0.1);
		color: var(--color-success);
	}

	.notification-status.warning {
		background-color: rgba(245, 158, 11, 0.1);
		color: var(--color-warning);
		flex-direction: column;
		align-items: flex-start;
	}

	.notification-status.error {
		background-color: rgba(239, 68, 68, 0.1);
		color: var(--color-destructive);
	}

	.notification-status.warning p {
		margin: var(--spacing-sm) 0;
		font-size: var(--font-size-sm);
	}

	.notification-controls {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.control-item {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		cursor: pointer;
		user-select: none;
	}

	.control-item input[type="checkbox"] {
		accent-color: var(--color-primary);
	}

	.control-label {
		font-size: var(--font-size-sm);
		color: var(--color-foreground);
	}

	.sub-controls {
		margin-left: var(--spacing-lg);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.sub-controls .control-label {
		color: var(--color-muted-foreground);
	}

	/* Close panel when clicking outside */
	:global(body) {
		--notification-panel-z-index: 100;
	}

	@media (max-width: 480px) {
		.notification-panel {
			right: -var(--spacing-md);
			left: -var(--spacing-md);
			width: auto;
		}
	}
</style>