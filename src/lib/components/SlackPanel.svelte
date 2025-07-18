<script lang="ts">
	import type { DashboardData } from '$lib/types';

	export let data: DashboardData['slack'];

	$: messages = data.messages || [];
	$: lastUpdated = data.last_updated;
	$: error = data.error;

	function formatTimestamp(timestamp: string): string {
		if (!timestamp) return '';
		return new Date(timestamp).toLocaleTimeString();
	}

	function truncateText(text: string, maxLength: number = 100): string {
		if (text.length <= maxLength) return text;
		return text.substring(0, maxLength) + '...';
	}

	function getChannelDisplay(channelName?: string, channel?: string): string {
		return channelName ? `#${channelName}` : (channel ? `#${channel}` : 'Unknown Channel');
	}
</script>

<div class="slack-panel card">
	<div class="panel-header">
		<div class="panel-title">
			<div class="panel-icon">
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/>
					<path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
					<path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/>
					<path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"/>
					<path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z"/>
					<path d="M15.5 19H14v-1.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
					<path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z"/>
					<path d="M8.5 5H10v1.5C10 7.33 9.33 8 8.5 8S7 7.33 7 6.5 7.67 5 8.5 5z"/>
				</svg>
			</div>
			<h3>Slack Mentions</h3>
		</div>
		<div class="panel-status">
			{#if error}
				<span class="status-error" title="Error loading Slack data">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="10"/>
						<line x1="15" y1="9" x2="9" y2="15"/>
						<line x1="9" y1="9" x2="15" y2="15"/>
					</svg>
				</span>
			{:else}
				<span class="status-success" title="Connected to Slack">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="20 6 9 17 4 12"/>
					</svg>
				</span>
			{/if}
		</div>
	</div>

	<div class="panel-content">
		{#if error}
			<div class="error-state">
				<p class="error-message">Failed to load Slack mentions</p>
				<p class="error-details">{error}</p>
			</div>
		{:else if messages.length === 0}
			<div class="empty-state">
				<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
					<path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/>
					<path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
					<path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/>
					<path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"/>
				</svg>
				<p>No recent mentions</p>
				<p class="empty-subtitle">You're all caught up! 🎉</p>
			</div>
		{:else}
			<div class="messages-container">
				{#each messages.slice(0, 8) as message (message.id)}
					<div class="message-item">
						<div class="message-header">
							<span class="message-channel">
								{getChannelDisplay(message.channel_name, message.channel)}
							</span>
							<span class="message-time">
								{formatTimestamp(message.timestamp)}
							</span>
						</div>
						<div class="message-content">
							<span class="message-user">@{message.username || message.user}:</span>
							<span class="message-text">
								{truncateText(message.text)}
							</span>
						</div>
						{#if message.permalink}
							<div class="message-actions">
								<a href={message.permalink} target="_blank" class="message-link">
									View in Slack
									<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
										<polyline points="15,3 21,3 21,9"/>
										<line x1="10" y1="14" x2="21" y2="3"/>
									</svg>
								</a>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>

	{#if lastUpdated}
		<div class="panel-footer">
			<span class="last-updated">Last updated: {formatTimestamp(lastUpdated)}</span>
		</div>
	{/if}
</div>

<style>
	.slack-panel {
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-lg);
		padding-bottom: var(--spacing-md);
		border-bottom: 1px solid var(--color-border);
	}

	.panel-title {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.panel-icon {
		color: #4A154B;
	}

	.panel-title h3 {
		margin: 0;
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--color-foreground);
	}

	.panel-status {
		display: flex;
		align-items: center;
	}

	.status-success {
		color: var(--color-success);
	}

	.status-error {
		color: var(--color-destructive);
	}

	.panel-content {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.error-state,
	.empty-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: var(--spacing-xl);
		color: var(--color-muted-foreground);
	}

	.error-state svg,
	.empty-state svg {
		margin-bottom: var(--spacing-md);
		opacity: 0.5;
	}

	.error-message {
		font-weight: 500;
		color: var(--color-destructive);
		margin-bottom: var(--spacing-xs);
	}

	.error-details {
		font-size: var(--font-size-sm);
		opacity: 0.8;
	}

	.empty-subtitle {
		font-size: var(--font-size-sm);
		margin-top: var(--spacing-xs);
	}

	.messages-container {
		flex: 1;
		overflow-y: auto;
		max-height: 400px;
	}

	.message-item {
		padding: var(--spacing-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		margin-bottom: var(--spacing-sm);
		background-color: var(--color-surface);
		transition: all var(--transition-fast);
	}

	.message-item:hover {
		background-color: var(--color-card);
		border-color: var(--color-primary);
		transform: translateY(-1px);
	}

	.message-item:last-child {
		margin-bottom: 0;
	}

	.message-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-xs);
	}

	.message-channel {
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--color-primary);
	}

	.message-time {
		font-size: var(--font-size-xs);
		color: var(--color-muted-foreground);
	}

	.message-content {
		margin-bottom: var(--spacing-sm);
		line-height: 1.5;
	}

	.message-user {
		font-weight: 600;
		color: var(--color-foreground);
	}

	.message-text {
		color: var(--color-muted-foreground);
		margin-left: var(--spacing-xs);
	}

	.message-actions {
		display: flex;
		justify-content: flex-end;
	}

	.message-link {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-xs);
		font-size: var(--font-size-xs);
		color: var(--color-primary);
		text-decoration: none;
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-sm);
		transition: background-color var(--transition-fast);
	}

	.message-link:hover {
		background-color: var(--color-surface);
		text-decoration: none;
	}

	.panel-footer {
		margin-top: var(--spacing-md);
		padding-top: var(--spacing-md);
		border-top: 1px solid var(--color-border);
		text-align: center;
	}

	.last-updated {
		font-size: var(--font-size-xs);
		color: var(--color-muted-foreground);
	}

	@media (max-width: 768px) {
		.message-header {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--spacing-xs);
		}

		.messages-container {
			max-height: 300px;
		}
	}
</style>