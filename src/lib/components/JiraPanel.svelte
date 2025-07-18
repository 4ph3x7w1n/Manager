<script lang="ts">
	import type { DashboardData, JiraIssue } from '$lib/types';

	export let data: DashboardData['jira'];

	$: issues = data.issues || [];
	$: summary = data.summary;
	$: lastUpdated = data.last_updated;
	$: error = data.error;

	function formatTimestamp(timestamp: string): string {
		if (!timestamp) return '';
		return new Date(timestamp).toLocaleTimeString();
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

	function getPriorityColor(priority: string): string {
		switch (priority.toLowerCase()) {
			case 'highest':
			case 'critical': return 'var(--color-destructive)';
			case 'high': return 'var(--color-warning)';
			case 'medium': return 'var(--color-info)';
			case 'low':
			case 'lowest': return 'var(--color-muted)';
			default: return 'var(--color-muted)';
		}
	}

	function getStatusColor(category: string): string {
		switch (category.toLowerCase()) {
			case 'done': return 'var(--color-success)';
			case 'in progress': return 'var(--color-info)';
			case 'to do': return 'var(--color-muted)';
			default: return 'var(--color-muted-foreground)';
		}
	}

	function truncateText(text: string, maxLength: number = 80): string {
		if (text.length <= maxLength) return text;
		return text.substring(0, maxLength) + '...';
	}
</script>

<div class="jira-panel card">
	<div class="panel-header">
		<div class="panel-title">
			<div class="panel-icon">
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
					<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
					<path d="M9 9h6"/>
					<path d="M9 13h6"/>
					<path d="M9 17h6"/>
				</svg>
			</div>
			<h3>Jira Issues</h3>
		</div>
		<div class="panel-status">
			{#if error}
				<span class="status-error" title="Error loading Jira data">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="10"/>
						<line x1="15" y1="9" x2="9" y2="15"/>
						<line x1="9" y1="9" x2="15" y2="15"/>
					</svg>
				</span>
			{:else}
				<span class="status-success" title="Connected to Jira">
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
				<p class="error-message">Failed to load Jira issues</p>
				<p class="error-details">{error}</p>
			</div>
		{:else}
			<div class="summary-stats">
				<div class="stat-item">
					<span class="stat-value">{summary.total_open}</span>
					<span class="stat-label">Total Open</span>
				</div>
				{#each summary.by_priority.slice(0, 3) as priorityGroup}
					<div class="stat-item">
						<span class="stat-value">{priorityGroup.count}</span>
						<span class="stat-label">{priorityGroup.priority}</span>
					</div>
				{/each}
			</div>

			{#if issues.length === 0}
				<div class="empty-state">
					<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="20 6 9 17 4 12"/>
					</svg>
					<p>No open issues</p>
					<p class="empty-subtitle">All caught up! 🎉</p>
				</div>
			{:else}
				<div class="issues-container">
					{#each issues.slice(0, 8) as issue (issue.id)}
						<div class="issue-item">
							<div class="issue-header">
								<div class="issue-key">
									{issue.key}
								</div>
								<div class="issue-priority" style="color: {getPriorityColor(issue.priority.name)}">
									{issue.priority.name}
								</div>
								<div class="issue-status" style="color: {getStatusColor(issue.status.category)}">
									{issue.status.name}
								</div>
							</div>
							
							<div class="issue-summary">
								{truncateText(issue.summary)}
							</div>
							
							<div class="issue-meta">
								<span class="issue-project">
									{issue.project.key}
								</span>
								{#if issue.assignee}
									<span class="issue-assignee">
										@{issue.assignee.displayName}
									</span>
								{:else}
									<span class="issue-assignee unassigned">
										Unassigned
									</span>
								{/if}
								<span class="issue-time">
									Updated {getRelativeTime(issue.updated)}
								</span>
							</div>
							
							{#if issue.url}
								<div class="issue-actions">
									<a href={issue.url} target="_blank" class="issue-link">
										View Issue
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
	.jira-panel {
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
		color: #0052CC;
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

	.issues-container {
		flex: 1;
		overflow-y: auto;
		max-height: 400px;
	}

	.issue-item {
		padding: var(--spacing-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		margin-bottom: var(--spacing-sm);
		background-color: var(--color-surface);
		transition: all var(--transition-fast);
	}

	.issue-item:hover {
		background-color: var(--color-card);
		border-color: var(--color-primary);
		transform: translateY(-1px);
	}

	.issue-item:last-child {
		margin-bottom: 0;
	}

	.issue-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-sm);
		flex-wrap: wrap;
	}

	.issue-key {
		font-size: var(--font-size-sm);
		font-weight: 700;
		color: var(--color-primary);
		background-color: rgba(59, 130, 246, 0.1);
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-sm);
	}

	.issue-priority {
		font-size: var(--font-size-xs);
		font-weight: 600;
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-sm);
		background-color: rgba(255, 255, 255, 0.1);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.issue-status {
		font-size: var(--font-size-xs);
		color: var(--color-muted-foreground);
		margin-left: auto;
	}

	.issue-summary {
		font-weight: 600;
		color: var(--color-foreground);
		margin-bottom: var(--spacing-sm);
		line-height: 1.4;
	}

	.issue-meta {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-sm);
		flex-wrap: wrap;
	}

	.issue-project {
		font-size: var(--font-size-sm);
		color: var(--color-muted-foreground);
		background-color: var(--color-surface);
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border);
	}

	.issue-assignee {
		font-size: var(--font-size-sm);
		color: var(--color-muted-foreground);
	}

	.issue-assignee.unassigned {
		color: var(--color-warning);
		font-style: italic;
	}

	.issue-time {
		font-size: var(--font-size-xs);
		color: var(--color-muted-foreground);
		margin-left: auto;
	}

	.issue-actions {
		display: flex;
		justify-content: flex-end;
	}

	.issue-link {
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

	.issue-link:hover {
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
		.summary-stats {
			grid-template-columns: repeat(2, 1fr);
		}

		.issue-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.issue-status {
			margin-left: 0;
		}

		.issue-meta {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--spacing-xs);
		}

		.issue-time {
			margin-left: 0;
		}

		.issues-container {
			max-height: 300px;
		}
	}
</style>