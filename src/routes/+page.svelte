<script lang="ts">
	import { onMount } from 'svelte';
	import { dashboardData, isLoading, lastRefresh } from '$lib/stores/dashboard';
	import { getApiClient } from '$lib/utils/api';
	import { notificationManager } from '$lib/utils/notifications';
	import SlackPanel from '$lib/components/SlackPanel.svelte';
	import IncidentPanel from '$lib/components/IncidentPanel.svelte';
	import JiraPanel from '$lib/components/JiraPanel.svelte';
	import VacationPanel from '$lib/components/VacationPanel.svelte';
	import RefreshButton from '$lib/components/RefreshButton.svelte';

	let refreshInterval: NodeJS.Timeout;

	onMount(() => {
		// Initial data load
		refreshAllData();
		
		// Set up auto-refresh every 4 hours (14400000 ms)
		refreshInterval = setInterval(refreshAllData, 14400000);
		
		return () => {
			if (refreshInterval) {
				clearInterval(refreshInterval);
			}
		};
	});

	async function refreshAllData() {
		isLoading.set(true);
		try {
			// Fetch from our API endpoint
			const response = await fetch('/api/dashboard');
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}
			const newData = await response.json();
			
			// Check for new incidents to notify about
			const currentIncidents = $dashboardData.incidents.incidents;
			const newIncidents = newData.incidents.incidents.filter(incident => 
				!currentIncidents.find(current => current.id === incident.id)
			);
			
			// Send notifications for new incidents
			for (const incident of newIncidents) {
				if (incident.severity === 'p1' || incident.severity === 'p2') {
					await notificationManager.notifyNewIncident(incident);
				}
			}
			
			// Check for SLA warnings/breaches
			for (const incident of newData.incidents.incidents) {
				if (incident.sla_timer?.breached) {
					await notificationManager.notifySLABreach(incident);
				} else if (incident.sla_timer && incident.sla_timer.remaining_seconds < 1800) {
					await notificationManager.notifySLAWarning(incident);
				}
			}
			
			// Update dashboard data
			dashboardData.set(newData);
			lastRefresh.set(new Date());
		} catch (error) {
			console.error('Failed to refresh data:', error);
		} finally {
			isLoading.set(false);
		}
	}

	$: data = $dashboardData;
	$: loading = $isLoading;
	$: lastUpdate = $lastRefresh;
</script>

<svelte:head>
	<title>Dashboard - Incident Management Console</title>
	<meta name="description" content="Real-time incident management dashboard with Slack, Incident.io, Jira, and vacation tracker integrations" />
</svelte:head>

<div class="dashboard">
	<div class="dashboard-header">
		<div class="dashboard-title">
			<h2>Dashboard Overview</h2>
			<p class="dashboard-subtitle">
				Last updated: {lastUpdate.toLocaleTimeString()}
			</p>
		</div>
		<div class="dashboard-actions">
			<RefreshButton on:refresh={refreshAllData} {loading} />
		</div>
	</div>

	<div class="dashboard-grid" class:loading>
		<div class="grid-item slack-panel">
			<SlackPanel data={data.slack} />
		</div>
		
		<div class="grid-item incident-panel">
			<IncidentPanel data={data.incidents} />
		</div>
		
		<div class="grid-item jira-panel">
			<JiraPanel data={data.jira} />
		</div>
		
		<div class="grid-item vacation-panel">
			<VacationPanel data={data.vacation} />
		</div>
	</div>

	{#if loading}
		<div class="loading-overlay">
			<div class="loading-spinner">
				<div class="spinner"></div>
				<p>Refreshing data...</p>
			</div>
		</div>
	{/if}
</div>

<style>
	.dashboard {
		position: relative;
		width: 100%;
		min-height: calc(100vh - var(--header-height) - var(--spacing-lg) * 2);
	}

	.dashboard-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--spacing-xl);
		gap: var(--spacing-lg);
	}

	.dashboard-title h2 {
		margin: 0 0 var(--spacing-xs) 0;
		font-size: var(--font-size-3xl);
		font-weight: 700;
		color: var(--color-foreground);
	}

	.dashboard-subtitle {
		margin: 0;
		font-size: var(--font-size-sm);
		color: var(--color-muted-foreground);
	}

	.dashboard-actions {
		display: flex;
		gap: var(--spacing-md);
		align-items: center;
	}

	.dashboard-grid {
		display: grid;
		gap: var(--spacing-lg);
		transition: opacity var(--transition-normal);
	}

	.dashboard-grid.loading {
		opacity: 0.7;
		pointer-events: none;
	}

	.grid-item {
		min-height: 300px;
		transition: transform var(--transition-fast);
	}

	.grid-item:hover {
		transform: translateY(-2px);
	}

	/* Incident panel takes full width and more height */
	.incident-panel {
		grid-column: 1 / -1;
		min-height: 600px;
	}

	/* Other panels in a row below */
	.slack-panel,
	.jira-panel,
	.vacation-panel {
		min-height: 400px;
	}

	/* Specific panel positioning for larger screens */
	@media (min-width: 1200px) {
		.dashboard-grid {
			grid-template-columns: repeat(3, 1fr);
			grid-template-rows: auto auto;
		}

		.incident-panel {
			grid-column: 1 / -1;
			grid-row: 1;
		}

		.slack-panel {
			grid-column: 1;
			grid-row: 2;
		}

		.jira-panel {
			grid-column: 2;
			grid-row: 2;
		}

		.vacation-panel {
			grid-column: 3;
			grid-row: 2;
		}
	}

	/* Medium screens */
	@media (min-width: 768px) and (max-width: 1199px) {
		.dashboard-grid {
			grid-template-columns: 1fr 1fr;
		}

		.incident-panel {
			grid-column: 1 / -1;
		}
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.dashboard-grid {
			grid-template-columns: 1fr;
			gap: var(--spacing-md);
		}

		.dashboard-header {
			flex-direction: column;
			align-items: stretch;
			gap: var(--spacing-md);
		}

		.dashboard-title h2 {
			font-size: var(--font-size-2xl);
		}
	}

	@media (max-width: 480px) {
		.dashboard-grid {
			grid-template-columns: 1fr;
			gap: var(--spacing-sm);
		}
	}

	.loading-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.3);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		backdrop-filter: blur(2px);
	}

	.loading-spinner {
		background-color: var(--color-card);
		padding: var(--spacing-xl);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-md);
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid var(--color-border);
		border-top: 4px solid var(--color-primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.loading-spinner p {
		margin: 0;
		font-size: var(--font-size-sm);
		color: var(--color-muted-foreground);
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>