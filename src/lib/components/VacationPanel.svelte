<script lang="ts">
	import type { DashboardData, VacationEntry } from '$lib/types';

	export let data: DashboardData['vacation'];

	$: availability = data.availability;
	$: lastUpdated = data.last_updated;
	$: error = data.error;

	function formatTimestamp(timestamp: string): string {
		if (!timestamp) return '';
		return new Date(timestamp).toLocaleTimeString();
	}

	function formatDateRange(startDate: string, endDate: string): string {
		if (!startDate || !endDate) return '';
		
		const start = new Date(startDate);
		const end = new Date(endDate);
		
		const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		
		if (startStr === endStr) {
			return startStr;
		}
		
		return `${startStr} - ${endStr}`;
	}

	function getVacationTypeIcon(type: string): string {
		switch (type) {
			case 'vacation': return '🏖️';
			case 'sick': return '🤒';
			case 'personal': return '👤';
			case 'holiday': return '🎉';
			default: return '📅';
		}
	}

	function getVacationTypeColor(type: string): string {
		switch (type) {
			case 'vacation': return 'var(--color-info)';
			case 'sick': return 'var(--color-warning)';
			case 'personal': return 'var(--color-primary)';
			case 'holiday': return 'var(--color-success)';
			default: return 'var(--color-muted)';
		}
	}

	function isToday(date: string): boolean {
		if (!date) return false;
		const today = new Date();
		const checkDate = new Date(date);
		return today.toDateString() === checkDate.toDateString();
	}

	function isCurrentlyOff(entry: VacationEntry): boolean {
		const now = new Date();
		const start = new Date(entry.start_date);
		const end = new Date(entry.end_date);
		return now >= start && now <= end && entry.status === 'approved';
	}

	function sortByStartDate(entries: VacationEntry[]): VacationEntry[] {
		return entries.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
	}

	$: currentlyOff = availability.off_this_week?.filter(isCurrentlyOff) || [];
	$: upcomingThisWeek = availability.off_this_week?.filter(entry => !isCurrentlyOff(entry)) || [];
</script>

<div class="vacation-panel card">
	<div class="panel-header">
		<div class="panel-title">
			<div class="panel-icon">
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M8 2v4"/>
					<path d="M16 2v4"/>
					<rect width="18" height="18" x="3" y="4" rx="2"/>
					<path d="M3 10h18"/>
					<path d="M8 14h.01"/>
					<path d="M12 14h.01"/>
					<path d="M16 14h.01"/>
					<path d="M8 18h.01"/>
					<path d="M12 18h.01"/>
					<path d="M16 18h.01"/>
				</svg>
			</div>
			<h3>Team Availability</h3>
		</div>
		<div class="panel-status">
			{#if error}
				<span class="status-error" title="Error loading vacation data">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="10"/>
						<line x1="15" y1="9" x2="9" y2="15"/>
						<line x1="9" y1="9" x2="15" y2="15"/>
					</svg>
				</span>
			{:else}
				<span class="status-success" title="Connected to Vacation Tracker">
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
				<p class="error-message">Failed to load vacation data</p>
				<p class="error-details">{error}</p>
			</div>
		{:else}
			<div class="summary-stats">
				<div class="stat-item">
					<span class="stat-value">{availability.total_team_members}</span>
					<span class="stat-label">Team Size</span>
				</div>
				<div class="stat-item {availability.currently_off > 0 ? 'warning' : ''}">
					<span class="stat-value">{availability.currently_off}</span>
					<span class="stat-label">Currently Off</span>
				</div>
				<div class="stat-item">
					<span class="stat-value">{availability.returning_today?.length || 0}</span>
					<span class="stat-label">Returning Today</span>
				</div>
				<div class="stat-item">
					<span class="stat-value">{availability.leaving_today?.length || 0}</span>
					<span class="stat-label">Leaving Today</span>
				</div>
			</div>

			{#if availability.returning_today && availability.returning_today.length > 0}
				<div class="today-section">
					<h4 class="section-title">
						<span class="section-icon">🎉</span>
						Returning Today
					</h4>
					<div class="today-list">
						{#each availability.returning_today as person}
							<span class="person-tag returning">{person}</span>
						{/each}
					</div>
				</div>
			{/if}

			{#if availability.leaving_today && availability.leaving_today.length > 0}
				<div class="today-section">
					<h4 class="section-title">
						<span class="section-icon">👋</span>
						Leaving Today
					</h4>
					<div class="today-list">
						{#each availability.leaving_today as person}
							<span class="person-tag leaving">{person}</span>
						{/each}
					</div>
				</div>
			{/if}

			{#if currentlyOff.length === 0 && upcomingThisWeek.length === 0}
				<div class="empty-state">
					<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
						<path d="M8 2v4"/>
						<path d="M16 2v4"/>
						<rect width="18" height="18" x="3" y="4" rx="2"/>
						<path d="M3 10h18"/>
					</svg>
					<p>Full team availability</p>
					<p class="empty-subtitle">Everyone's in the office! 💪</p>
				</div>
			{:else}
				<div class="vacation-sections">
					{#if currentlyOff.length > 0}
						<div class="vacation-section">
							<h4 class="section-title">
								<span class="section-icon">🏖️</span>
								Currently Off ({currentlyOff.length})
							</h4>
							<div class="vacation-list">
								{#each sortByStartDate(currentlyOff) as entry (entry.id)}
									<div class="vacation-item current">
										<div class="vacation-header">
											<span class="vacation-name">{entry.employee_name}</span>
											<span class="vacation-type" style="color: {getVacationTypeColor(entry.type)}">
												{getVacationTypeIcon(entry.type)} {entry.type}
											</span>
										</div>
										<div class="vacation-dates">
											{formatDateRange(entry.start_date, entry.end_date)}
											{#if entry.days_count}
												<span class="vacation-duration">({entry.days_count} days)</span>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					{#if upcomingThisWeek.length > 0}
						<div class="vacation-section">
							<h4 class="section-title">
								<span class="section-icon">📅</span>
								Upcoming This Week ({upcomingThisWeek.length})
							</h4>
							<div class="vacation-list">
								{#each sortByStartDate(upcomingThisWeek) as entry (entry.id)}
									<div class="vacation-item upcoming">
										<div class="vacation-header">
											<span class="vacation-name">{entry.employee_name}</span>
											<span class="vacation-type" style="color: {getVacationTypeColor(entry.type)}">
												{getVacationTypeIcon(entry.type)} {entry.type}
											</span>
										</div>
										<div class="vacation-dates">
											{formatDateRange(entry.start_date, entry.end_date)}
											{#if entry.days_count}
												<span class="vacation-duration">({entry.days_count} days)</span>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
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
	.vacation-panel {
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
		color: var(--color-info);
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

	.stat-item.warning {
		background-color: rgba(245, 158, 11, 0.1);
		border-color: var(--color-warning);
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

	.today-section {
		margin-bottom: var(--spacing-lg);
	}

	.section-title {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		margin: 0 0 var(--spacing-md) 0;
		font-size: var(--font-size-base);
		font-weight: 600;
		color: var(--color-foreground);
	}

	.section-icon {
		font-size: var(--font-size-lg);
	}

	.today-list {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-sm);
	}

	.person-tag {
		padding: var(--spacing-xs) var(--spacing-md);
		border-radius: var(--radius-lg);
		font-size: var(--font-size-sm);
		font-weight: 500;
	}

	.person-tag.returning {
		background-color: rgba(34, 197, 94, 0.1);
		color: var(--color-success);
		border: 1px solid var(--color-success);
	}

	.person-tag.leaving {
		background-color: rgba(245, 158, 11, 0.1);
		color: var(--color-warning);
		border: 1px solid var(--color-warning);
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

	.vacation-sections {
		flex: 1;
		overflow-y: auto;
		max-height: 400px;
	}

	.vacation-section {
		margin-bottom: var(--spacing-lg);
	}

	.vacation-section:last-child {
		margin-bottom: 0;
	}

	.vacation-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.vacation-item {
		padding: var(--spacing-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background-color: var(--color-surface);
		transition: all var(--transition-fast);
	}

	.vacation-item:hover {
		background-color: var(--color-card);
		border-color: var(--color-primary);
		transform: translateY(-1px);
	}

	.vacation-item.current {
		border-left: 4px solid var(--color-info);
	}

	.vacation-item.upcoming {
		border-left: 4px solid var(--color-muted);
	}

	.vacation-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-xs);
	}

	.vacation-name {
		font-weight: 600;
		color: var(--color-foreground);
	}

	.vacation-type {
		font-size: var(--font-size-sm);
		font-weight: 500;
		text-transform: capitalize;
	}

	.vacation-dates {
		font-size: var(--font-size-sm);
		color: var(--color-muted-foreground);
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.vacation-duration {
		color: var(--color-muted);
		font-style: italic;
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

		.vacation-header {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--spacing-xs);
		}

		.vacation-dates {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--spacing-xs);
		}

		.vacation-sections {
			max-height: 300px;
		}
	}
</style>