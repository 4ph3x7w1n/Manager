import type { RequestHandler } from '@sveltejs/kit';
import { getApiClient, initializeApiClient } from '$lib/utils/api';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ platform }) => {
	// Get environment variables from Cloudflare Workers
	const env = platform?.env || {};
	
	// Initialize API client with credentials
	const apiClient = initializeApiClient({
		incidentIo: {
			apiKey: env.INCIDENT_IO_API_KEY || '',
			organization: env.INCIDENT_IO_ORGANIZATION || '',
		},
		slack: {
			botToken: env.SLACK_BOT_TOKEN || '',
		},
		jira: {
			baseUrl: env.JIRA_BASE_URL || '',
			username: env.JIRA_USERNAME || '',
			apiToken: env.JIRA_API_TOKEN || '',
			jqlQuery: env.JIRA_JQL_QUERY || 'project = PROJ AND status != Done ORDER BY priority DESC',
		},
		vacationTracker: {
			apiKey: env.VACATION_TRACKER_API_KEY || '',
			teamId: env.VACATION_TRACKER_TEAM_ID || '',
		},
	});

	try {
		// Fetch all dashboard data
		const dashboardData = await apiClient.getAllDashboardData();
		
		return json(dashboardData);
	} catch (error) {
		console.error('Dashboard API error:', error);
		return json({
			error: 'Failed to fetch dashboard data',
			message: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};