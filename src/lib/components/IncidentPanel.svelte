<script lang="ts">
	import type { DashboardData, Incident } from '$lib/types';

	export let data: DashboardData['incidents'];

	$: incidents = data.incidents || [];
	$: summary = data.summary;
	$: lastUpdated = data.last_updated;
	$: error = data.error;

	function formatTimestamp(timestamp: string): string {
		if (!timestamp) return '';
		return new Date(timestamp).toLocaleTimeString();
	}

	function formatSLATimer(timer?: { duration_seconds: number; remaining_seconds: number; breached: boolean }): string {
		if (!timer) return '';
		
		if (timer.breached) return 'BREACHED';
		
		const hours = Math.floor(timer.remaining_seconds / 3600);
		const minutes = Math.floor((timer.remaining_seconds % 3600) / 60);
		
		if (hours > 0) {
			return `${hours}h ${minutes}m`;
		}
		return `${minutes}m`;
	}

	function getSeverityColor(severity: string): string {
		switch (severity) {
			case 'p1': return 'var(--color-destructive)';
			case 'p2': return 'var(--color-warning)';
			case 'p3': return 'var(--color-info)';
			case 'p4': return 'var(--color-muted)';
			default: return 'var(--color-muted)';
		}
	}

	function getSLAStatus(timer?: { duration_seconds: number; remaining_seconds: number; breached: boolean }): 'breached' | 'warning' | 'ok' {
		if (!timer) return 'ok';
		if (timer.breached) return 'breached';
		if (timer.remaining_seconds < 1800) return 'warning'; // Less than 30 minutes
		return 'ok';
	}

	function getRelativeTime(timestamp: string): string {
		if (!timestamp) return '';
		const now = new Date();
		const time = new Date(timestamp);
		const diffMs = now.getTime() - time.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMins / 60);
		const diffDays = Math.floor(diffHours / 24);

		if (diffDays > 0) return `${diffDays}d ago`;
		if (diffHours > 0) return `${diffHours}h ago`;
		if (diffMins > 0) return `${diffMins}m ago`;
		return 'Just now';
	}

	// Filter for P1 and P2 incidents only
	$: criticalIncidents = incidents.filter(incident => 
		incident.severity === 'p1' || incident.severity === 'p2'
	);
</script>

<div class="incident-panel card">
	<div class="panel-header">
		<div class="panel-title">
			<div class="panel-icon">
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="m21 14-3 3L7 6l3-3zm-9 3 3 3 6-6-3-3z"/>
					<path d="M7 17a3 3 0 1 0-6 0 3 3 0 0 0 6 0z"/>
				</svg>
			</div>
			<h3>Incidents (P1/P2)</h3>
		</div>
		<div class="panel-status">
			{#if error}
				<span class="status-error" title="Error loading incident data">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="10"/>
						<line x1="15" y1="9" x2="9" y2="15"/>
						<line x1="9" y1="9" x2="15" y2="15"/>
					</svg>
				</span>
			{:else}
				<span class="status-success" title="Connected to Incident.io">
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
				<p class="error-message">Failed to load incident data</p>
				<p class="error-details">{error}</p>
			</div>
		{:else}
			<div class="summary-stats">
				<div class="stat-item">
					<span class="stat-value">{summary.total_open}</span>
					<span class="stat-label">Total Open</span>
				</div>
				<div class="stat-item critical">
					<span class="stat-value">{summary.p1_count}</span>
					<span class="stat-label">P1</span>
				</div>
				<div class="stat-item warning">
					<span class="stat-value">{summary.p2_count}</span>
					<span class="stat-label">P2</span>
				</div>
				<div class="stat-item {summary.sla_breached > 0 ? 'breached' : ''}">
					<span class="stat-value">{summary.sla_breached}</span>
					<span class="stat-label">SLA Breached</span>
				</div>
			</div>

			{#if criticalIncidents.length === 0}
				<div class="empty-state">
					<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="20 6 9 17 4 12"/>
					</svg>
					<p>No critical incidents</p>
					<p class="empty-subtitle">All P1/P2 incidents are resolved! 🎉</p>
				</div>
			{:else}
				<div class="incidents-container">
					{#each criticalIncidents.slice(0, 6) as incident (incident.id)}
						<div class="incident-item" class:breached={incident.sla_timer?.breached}>
							<div class="incident-header">
								<div class="incident-severity" style="color: {getSeverityColor(incident.severity)}">
									{incident.severity.toUpperCase()}
								</div>
								<div class="incident-status">
									{incident.status}
								</div>
								{#if incident.sla_timer}
									<div class="sla-timer {getSLAStatus(incident.sla_timer)}">
										{formatSLATimer(incident.sla_timer)}
									</div>
								{/if}
							</div>
							
							<div class="incident-title">
								{incident.title}
							</div>
							
							<div class="incident-meta">
								{#if incident.product}
									<span class="incident-product">
										{incident.product.name}
									</span>
								{/if}
								{#if incident.assignee}
									<span class="incident-assignee">
										@{incident.assignee.name}
									</span>
								{/if}
								<span class="incident-time">
									{getRelativeTime(incident.created_at)}
								</span>
							</div>
							
							{#if incident.url}
								<div class="incident-actions">
									<a href={incident.url} target="_blank" class="incident-link">
										View Incident
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
		{/if}
	</div>

	{#if lastUpdated}
		<div class="panel-footer">
			<span class="last-updated">Last updated: {formatTimestamp(lastUpdated)}</span>
		</div>
	{/if}
</div>

<style>
	.incident-panel {
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
		color: var(--color-destructive);
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

	.summary-stats {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-lg);
	}

	.stat-item {
		text-align: center;
		padding: var(--spacing-md);
		background-color: var(--color-surface);
		border-radius: var(--radius);
		border: 1px solid var(--color-border);
	}

	.stat-item.critical {
		background-color: rgba(239, 68, 68, 0.1);
		border-color: var(--color-destructive);
	}

	.stat-item.warning {
		background-color: rgba(245, 158, 11, 0.1);
		border-color: var(--color-warning);
	}

	.stat-item.breached {
		background-color: rgba(239, 68, 68, 0.2);
		border-color: var(--color-destructive);
		animation: pulse 2s infinite;
	}

	.stat-value {
		display: block;
		font-size: var(--font-size-2xl);
		font-weight: 700;
		color: var(--color-foreground);
	}

	.stat-label {
		font-size: var(--font-size-xs);
		color: var(--color-muted-foreground);
		text-transform: uppercase;
		letter-spacing: 0.5px;
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

	.incidents-container {
		flex: 1;
		overflow-y: auto;
		max-height: 400px;
	}

	.incident-item {
		padding: var(--spacing-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		margin-bottom: var(--spacing-sm);
		background-color: var(--color-surface);
		transition: all var(--transition-fast);
	}

	.incident-item:hover {
		background-color: var(--color-card);
		border-color: var(--color-primary);
		transform: translateY(-1px);
	}

	.incident-item.breached {
		border-color: var(--color-destructive);
		background-color: rgba(239, 68, 68, 0.05);
	}

	.incident-item:last-child {
		margin-bottom: 0;
	}

	.incident-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-sm);
		flex-wrap: wrap;
	}

	.incident-severity {
		font-size: var(--font-size-sm);
		font-weight: 700;
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-sm);
		background-color: rgba(255, 255, 255, 0.1);
	}

	.incident-status {
		font-size: var(--font-size-xs);
		color: var(--color-muted-foreground);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.sla-timer {
		font-size: var(--font-size-sm);
		font-weight: 600;
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-sm);
		margin-left: auto;
	}

	.sla-timer.ok {
		color: var(--color-success);
		background-color: rgba(34, 197, 94, 0.1);
	}

	.sla-timer.warning {
		color: var(--color-warning);
		background-color: rgba(245, 158, 11, 0.1);
		animation: pulse 2s infinite;
	}

	.sla-timer.breached {
		color: var(--color-destructive);
		background-color: rgba(239, 68, 68, 0.1);
		animation: pulse 2s infinite;
	}

	.incident-title {
		font-weight: 600;
		color: var(--color-foreground);
		margin-bottom: var(--spacing-sm);
		line-height: 1.4;
	}

	.incident-meta {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-sm);
		flex-wrap: wrap;
	}

	.incident-product {
		font-size: var(--font-size-sm);
		color: var(--color-primary);
		background-color: rgba(59, 130, 246, 0.1);
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-sm);
	}

	.incident-assignee {
		font-size: var(--font-size-sm);
		color: var(--color-muted-foreground);
	}

	.incident-time {
		font-size: var(--font-size-xs);
		color: var(--color-muted-foreground);
		margin-left: auto;
	}

	.incident-actions {
		display: flex;
		justify-content: flex-end;
	}

	.incident-link {
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

	.incident-link:hover {
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

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.7; }
	}

	@media (max-width: 768px) {
		.summary-stats {
			grid-template-columns: repeat(2, 1fr);
		}

		.incident-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.sla-timer {
			margin-left: 0;
		}

		.incident-meta {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--spacing-xs);
		}

		.incident-time {
			margin-left: 0;
		}

		.incidents-container {
			max-height: 300px;
		}
	}
</style>