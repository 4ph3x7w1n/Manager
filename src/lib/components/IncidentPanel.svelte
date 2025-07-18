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

	function formatDate(timestamp: string): string {
		if (!timestamp) return '';
		return new Date(timestamp).toLocaleDateString('en-US', { 
			month: 'short', 
			day: 'numeric',
			year: 'numeric'
		});
	}

	function formatDuration(seconds?: number): string {
		if (!seconds) return 'Ongoing';
		
		const hours = Math.floor(seconds / 3600);
		const days = Math.floor(hours / 24);
		
		if (days > 0) {
			const remainingHours = hours % 24;
			return `${days}d ${remainingHours}h`;
		}
		
		const minutes = Math.floor((seconds % 3600) / 60);
		if (hours > 0) {
			return `${hours}h ${minutes}m`;
		}
		
		return `${minutes}m`;
	}

	function formatTimingMetric(seconds?: number): string {
		if (!seconds) return 'N/A';
		
		if (seconds < 60) {
			return `${seconds}s`;
		}
		
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) {
			return `${minutes}m`;
		}
		
		const hours = Math.floor(minutes / 60);
		const remainingMinutes = minutes % 60;
		return `${hours}h ${remainingMinutes}m`;
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

	function getStatusBadge(status: string): string {
		switch (status) {
			case 'live':
			case 'active': return 'active';
			case 'closed':
			case 'resolved': return 'resolved';
			case 'declined': return 'declined';
			default: return 'unknown';
		}
	}

	// Sort incidents by created date (newest first) - P1/P2 only
	$: sortedIncidents = incidents
		.filter(incident => incident.severity === 'p1' || incident.severity === 'p2')
		.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

	// Statistics
	$: p1Count = sortedIncidents.filter(i => i.severity === 'p1').length;
	$: p2Count = sortedIncidents.filter(i => i.severity === 'p2').length;
	$: activeCount = sortedIncidents.filter(i => ['live', 'active'].includes(i.status)).length;
	$: totalLast3Months = sortedIncidents.length;
	$: uptimePercentage = summary?.uptime_percentage || 100;
	$: avgMitigationTime = summary?.average_time_to_mitigate_minutes || 0;

	// Selected incident for detail view
	let selectedIncident: typeof sortedIncidents[0] | null = null;

	function selectIncident(incident: typeof sortedIncidents[0]) {
		selectedIncident = incident;
	}

	function closeIncidentDetail() {
		selectedIncident = null;
	}

	function formatSummary(summary?: string): string {
		if (!summary) return 'No summary available';
		
		// Clean up markdown-style formatting
		return summary
			.replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
			.replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
			.replace(/#{1,6}\s+/g, '') // Remove markdown headers
			.replace(/^>\s+/gm, '') // Remove blockquotes
			.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text only
			.replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines
			.trim();
	}
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
			<h3>P1/P2 Incidents (Last 3 Months)</h3>
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
					<span class="stat-value">{totalLast3Months}</span>
					<span class="stat-label">Total (3 months)</span>
				</div>
				<div class="stat-item critical">
					<span class="stat-value">{p1Count}</span>
					<span class="stat-label">P1 Incidents</span>
				</div>
				<div class="stat-item warning">
					<span class="stat-value">{p2Count}</span>
					<span class="stat-label">P2 Incidents</span>
				</div>
				<div class="stat-item {activeCount > 0 ? 'active' : ''}">
					<span class="stat-value">{activeCount}</span>
					<span class="stat-label">Currently Active</span>
				</div>
				<div class="stat-item uptime">
					<span class="stat-value">{uptimePercentage.toFixed(2)}%</span>
					<span class="stat-label">Uptime (3 months)</span>
				</div>
				<div class="stat-item mttr">
					<span class="stat-value">{avgMitigationTime}m</span>
					<span class="stat-label">Avg MTTR</span>
				</div>
			</div>

			{#if sortedIncidents.length === 0}
				<div class="empty-state">
					<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="20 6 9 17 4 12"/>
					</svg>
					<p>No P1/P2 incidents in the last 3 months</p>
					<p class="empty-subtitle">Great job maintaining stability! 🎉</p>
				</div>
			{:else}
				<div class="incidents-table-container">
					<table class="incidents-table">
						<thead>
							<tr>
								<th>Priority</th>
								<th>Incident #</th>
								<th>Title</th>
								<th>Product</th>
								<th>TTD</th>
								<th>TTA</th>
								<th>TTM</th>
								<th>TTR</th>
								<th>Created</th>
								<th>Lead</th>
								<th>Status</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each sortedIncidents as incident (incident.id)}
								<tr class="incident-row" class:active={['live', 'active'].includes(incident.status)} on:click={() => selectIncident(incident)}>
									<td class="severity-cell">
										<span class="severity-badge" style="color: {getSeverityColor(incident.severity)}">
											{incident.severity.toUpperCase()}
										</span>
									</td>
									<td class="reference-cell">
										<span class="incident-reference">{incident.reference || incident.id.slice(-8)}</span>
									</td>
									<td class="title-cell">
										<span class="incident-title">
											{incident.title}
										</span>
									</td>
									<td class="product-cell">
										{incident.product?.name || 'Unknown'}
									</td>
									<td class="timing-cell" title="Time to Detect">
										{formatTimingMetric(incident.timings?.time_to_detect_seconds)}
									</td>
									<td class="timing-cell" title="Time to Acknowledge">
										{formatTimingMetric(incident.timings?.time_to_acknowledge_seconds)}
									</td>
									<td class="timing-cell" title="Time to Mitigate">
										{formatTimingMetric(incident.timings?.time_to_mitigate_seconds)}
									</td>
									<td class="timing-cell" title="Time to Resolve">
										{formatTimingMetric(incident.timings?.time_to_resolve_seconds)}
									</td>
									<td class="date-cell">
										{formatDate(incident.created_at)}
									</td>
									<td class="lead-cell">
										{incident.lead?.name || 'Unassigned'}
									</td>
									<td class="status-cell">
										<span class="status-badge {getStatusBadge(incident.status)}">
											{incident.status}
										</span>
									</td>
									<td class="actions-cell" on:click|stopPropagation>
										<div class="action-buttons">
											<a href={incident.url} target="_blank" class="action-link" title="View Incident">
												<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
													<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
													<polyline points="15,3 21,3 21,9"/>
													<line x1="10" y1="14" x2="21" y2="3"/>
												</svg>
											</a>
											{#if incident.postmortem_url}
												<a href={incident.postmortem_url} target="_blank" class="action-link postmortem" title="View Post-mortem">
													<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
														<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
														<polyline points="14 2 14 8 20 8"/>
														<line x1="16" y1="13" x2="8" y2="13"/>
														<line x1="16" y1="17" x2="8" y2="17"/>
														<polyline points="10 9 9 9 8 9"/>
													</svg>
												</a>
											{/if}
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}

			<!-- Incident Detail Modal -->
			{#if selectedIncident}
				<div class="incident-detail-overlay" on:click={closeIncidentDetail}>
					<div class="incident-detail-modal" on:click|stopPropagation>
						<div class="modal-header">
							<div class="modal-title">
								<span class="severity-badge" style="color: {getSeverityColor(selectedIncident.severity)}">
									{selectedIncident.severity.toUpperCase()}
								</span>
								<h3>{selectedIncident.title}</h3>
							</div>
							<button class="close-button" on:click={closeIncidentDetail}>
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<line x1="18" y1="6" x2="6" y2="18"/>
									<line x1="6" y1="6" x2="18" y2="18"/>
								</svg>
							</button>
						</div>

						<div class="modal-content">
							<div class="incident-summary">
								<h4>Summary</h4>
								<div class="summary-content">
									{@html formatSummary(selectedIncident.summary).replace(/\n/g, '<br>')}
								</div>
							</div>

							<div class="incident-metrics">
								<h4>Timing Metrics</h4>
								<div class="metrics-grid">
									<div class="metric-item">
										<span class="metric-label">Time to Detect</span>
										<span class="metric-value">{formatTimingMetric(selectedIncident.timings?.time_to_detect_seconds)}</span>
									</div>
									<div class="metric-item">
										<span class="metric-label">Time to Acknowledge</span>
										<span class="metric-value">{formatTimingMetric(selectedIncident.timings?.time_to_acknowledge_seconds)}</span>
									</div>
									<div class="metric-item">
										<span class="metric-label">Time to Mitigate</span>
										<span class="metric-value">{formatTimingMetric(selectedIncident.timings?.time_to_mitigate_seconds)}</span>
									</div>
									<div class="metric-item">
										<span class="metric-label">Time to Resolve</span>
										<span class="metric-value">{formatTimingMetric(selectedIncident.timings?.time_to_resolve_seconds)}</span>
									</div>
								</div>
							</div>

							<div class="incident-details">
								<h4>Details</h4>
								<div class="detail-grid">
									<div class="detail-item">
										<span class="detail-label">Product</span>
										<span class="detail-value">{selectedIncident.product?.name || 'Unknown'}</span>
									</div>
									<div class="detail-item">
										<span class="detail-label">Lead</span>
										<span class="detail-value">{selectedIncident.lead?.name || 'Unassigned'}</span>
									</div>
									<div class="detail-item">
										<span class="detail-label">Status</span>
										<span class="detail-value">
											<span class="status-badge {getStatusBadge(selectedIncident.status)}">
												{selectedIncident.status}
											</span>
										</span>
									</div>
									<div class="detail-item">
										<span class="detail-label">Created</span>
										<span class="detail-value">{formatDate(selectedIncident.created_at)} at {formatTimestamp(selectedIncident.created_at)}</span>
									</div>
								</div>
							</div>

							{#if selectedIncident.updates && selectedIncident.updates.length > 0}
								<div class="incident-updates">
									<h4>Update Chain</h4>
									<div class="updates-list">
										{#each selectedIncident.updates as update (update.id)}
											<div class="update-item">
												<div class="update-header">
													<span class="update-author">{update.author.name}</span>
													<span class="update-time">{formatTimestamp(update.timestamp)}</span>
												</div>
												<div class="update-message">{update.message}</div>
											</div>
										{/each}
									</div>
								</div>
							{/if}

							<div class="modal-actions">
								<a href={selectedIncident.url} target="_blank" class="action-button primary">
									View in Incident.io
								</a>
								{#if selectedIncident.postmortem_url}
									<a href={selectedIncident.postmortem_url} target="_blank" class="action-button secondary">
										View Post-mortem
									</a>
								{/if}
							</div>
						</div>
					</div>
				</div>
			{/if}

			{#if sortedIncidents.some(i => !i.postmortem_url)}
				<div class="info-note">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="10"/>
						<line x1="12" y1="16" x2="12" y2="12"/>
						<line x1="12" y1="8" x2="12.01" y2="8"/>
					</svg>
					<span>Post-mortem links not found. Check if your Incident.io uses custom fields: 'postmortem', 'post_mortem', or 'postmortem_url'</span>
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
		overflow: hidden;
	}

	.summary-stats {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
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

	.stat-item.info {
		background-color: rgba(156, 163, 175, 0.1);
		border-color: var(--color-muted);
	}

	.stat-item.active {
		background-color: rgba(59, 130, 246, 0.1);
		border-color: var(--color-info);
	}

	.stat-item.uptime {
		background-color: rgba(34, 197, 94, 0.1);
		border-color: var(--color-success);
	}

	.stat-item.mttr {
		background-color: rgba(168, 85, 247, 0.1);
		border-color: #a855f7;
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

	.incidents-table-container {
		flex: 1;
		overflow: auto;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background-color: var(--color-surface);
	}

	.incidents-table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--font-size-sm);
	}

	.incidents-table thead {
		position: sticky;
		top: 0;
		background-color: var(--color-card);
		z-index: 10;
	}

	.incidents-table th {
		padding: var(--spacing-sm) var(--spacing-md);
		text-align: left;
		font-weight: 600;
		color: var(--color-foreground);
		border-bottom: 2px solid var(--color-border);
		white-space: nowrap;
	}

	.incidents-table tbody tr {
		transition: background-color var(--transition-fast);
		border-bottom: 1px solid var(--color-border);
	}

	.incidents-table tbody tr:hover {
		background-color: var(--color-surface);
		cursor: pointer;
	}

	.incidents-table tbody tr.active {
		background-color: rgba(59, 130, 246, 0.05);
	}

	.incidents-table td {
		padding: var(--spacing-sm) var(--spacing-md);
		vertical-align: middle;
	}

	.severity-badge {
		font-weight: 700;
		font-size: var(--font-size-xs);
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-sm);
		background-color: rgba(0, 0, 0, 0.1);
		display: inline-block;
	}

	.incident-title {
		color: var(--color-foreground);
		font-weight: 500;
		display: block;
		max-width: 300px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.timing-cell {
		font-family: monospace;
		font-size: var(--font-size-sm);
		text-align: center;
		color: var(--color-muted-foreground);
	}

	.status-badge {
		font-size: var(--font-size-xs);
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-sm);
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.status-badge.active {
		background-color: rgba(59, 130, 246, 0.1);
		color: var(--color-info);
	}

	.status-badge.resolved {
		background-color: rgba(34, 197, 94, 0.1);
		color: var(--color-success);
	}

	.status-badge.declined {
		background-color: rgba(156, 163, 175, 0.1);
		color: var(--color-muted);
	}

	.action-buttons {
		display: flex;
		gap: var(--spacing-sm);
		align-items: center;
	}

	.action-link {
		color: var(--color-muted-foreground);
		transition: color var(--transition-fast);
		padding: var(--spacing-xs);
		border-radius: var(--radius-sm);
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.action-link:hover {
		color: var(--color-primary);
		background-color: var(--color-surface);
	}

	.action-link.postmortem {
		color: var(--color-info);
	}

	.info-note {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-md);
		padding: var(--spacing-md);
		background-color: rgba(59, 130, 246, 0.1);
		color: var(--color-info);
		border-radius: var(--radius);
		font-size: var(--font-size-sm);
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

	@media (max-width: 1200px) {
		.incidents-table {
			font-size: var(--font-size-xs);
		}

		.incidents-table th,
		.incidents-table td {
			padding: var(--spacing-xs) var(--spacing-sm);
		}

		.incident-title-link {
			max-width: 250px;
		}
	}

	/* Modal Styles */
	.incident-detail-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-lg);
	}

	.incident-detail-modal {
		background-color: var(--color-card);
		border-radius: var(--radius-lg);
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
		max-width: 800px;
		width: 100%;
		max-height: 90vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-lg);
		border-bottom: 1px solid var(--color-border);
	}

	.modal-title {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
	}

	.modal-title h3 {
		margin: 0;
		font-size: var(--font-size-xl);
		color: var(--color-foreground);
	}

	.close-button {
		background: none;
		border: none;
		color: var(--color-muted-foreground);
		cursor: pointer;
		padding: var(--spacing-sm);
		border-radius: var(--radius);
		transition: background-color var(--transition-fast);
	}

	.close-button:hover {
		background-color: var(--color-surface);
		color: var(--color-foreground);
	}

	.modal-content {
		flex: 1;
		overflow-y: auto;
		padding: var(--spacing-lg);
	}

	.modal-content h4 {
		margin: 0 0 var(--spacing-md) 0;
		font-size: var(--font-size-lg);
		color: var(--color-foreground);
		border-bottom: 1px solid var(--color-border);
		padding-bottom: var(--spacing-sm);
	}

	.incident-summary .summary-content {
		color: var(--color-muted-foreground);
		line-height: 1.6;
		margin-bottom: var(--spacing-lg);
		background-color: var(--color-surface);
		padding: var(--spacing-md);
		border-radius: var(--radius);
		border: 1px solid var(--color-border);
		max-height: 200px;
		overflow-y: auto;
		white-space: pre-wrap;
	}

	.reference-cell {
		font-family: monospace;
		font-size: var(--font-size-sm);
		color: var(--color-muted-foreground);
		font-weight: 600;
	}

	.incident-reference {
		background-color: var(--color-surface);
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border);
	}

	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-lg);
	}

	.metric-item {
		display: flex;
		flex-direction: column;
		padding: var(--spacing-md);
		background-color: var(--color-surface);
		border-radius: var(--radius);
		border: 1px solid var(--color-border);
	}

	.metric-label {
		font-size: var(--font-size-sm);
		color: var(--color-muted-foreground);
		margin-bottom: var(--spacing-xs);
	}

	.metric-value {
		font-size: var(--font-size-xl);
		font-weight: 600;
		color: var(--color-foreground);
		font-family: monospace;
	}

	.detail-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-lg);
	}

	.detail-item {
		display: flex;
		flex-direction: column;
	}

	.detail-label {
		font-size: var(--font-size-sm);
		color: var(--color-muted-foreground);
		margin-bottom: var(--spacing-xs);
	}

	.detail-value {
		font-weight: 500;
		color: var(--color-foreground);
	}

	.updates-list {
		max-height: 300px;
		overflow-y: auto;
		margin-bottom: var(--spacing-lg);
	}

	.update-item {
		padding: var(--spacing-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		margin-bottom: var(--spacing-sm);
		background-color: var(--color-surface);
	}

	.update-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-xs);
	}

	.update-author {
		font-weight: 600;
		color: var(--color-foreground);
		font-size: var(--font-size-sm);
	}

	.update-time {
		font-size: var(--font-size-xs);
		color: var(--color-muted-foreground);
	}

	.update-message {
		color: var(--color-muted-foreground);
		line-height: 1.5;
	}

	.modal-actions {
		display: flex;
		gap: var(--spacing-md);
		padding-top: var(--spacing-lg);
		border-top: 1px solid var(--color-border);
	}

	.action-button {
		text-decoration: none;
		padding: var(--spacing-sm) var(--spacing-lg);
		border-radius: var(--radius);
		font-weight: 500;
		transition: all var(--transition-fast);
		border: 1px solid;
	}

	.action-button.primary {
		background-color: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}

	.action-button.primary:hover {
		opacity: 0.9;
	}

	.action-button.secondary {
		background-color: transparent;
		color: var(--color-primary);
		border-color: var(--color-primary);
	}

	.action-button.secondary:hover {
		background-color: var(--color-primary);
		color: white;
	}

	@media (max-width: 768px) {
		.summary-stats {
			grid-template-columns: repeat(3, 1fr);
		}

		.incidents-table-container {
			overflow-x: auto;
		}

		.incidents-table {
			min-width: 900px;
		}

		.metrics-grid,
		.detail-grid {
			grid-template-columns: 1fr;
		}

		.incident-detail-overlay {
			padding: var(--spacing-md);
		}

		.modal-actions {
			flex-direction: column;
		}
	}
</style>