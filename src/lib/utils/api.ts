import type { 
	SlackMessage, 
	Incident, 
	JiraIssue, 
	VacationEntry, 
	ApiResponse,
	DashboardData 
} from '$lib/types';

// API Configuration
interface ApiConfig {
	slack?: {
		botToken: string;
		userId?: string;
	};
	incidentIo?: {
		apiKey: string;
		organization: string;
	};
	jira?: {
		baseUrl: string;
		username: string;
		apiToken: string;
		jqlQuery?: string;
	};
	vacationTracker?: {
		apiKey: string;
		teamId?: string;
	};
}

class ApiClient {
	private config: ApiConfig;

	constructor(config: ApiConfig) {
		this.config = config;
	}

	private async makeRequest<T>(
		url: string, 
		options: RequestInit = {}
	): Promise<ApiResponse<T>> {
		try {
			const response = await fetch(url, {
				...options,
				headers: {
					'Content-Type': 'application/json',
					...options.headers,
				},
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const data = await response.json();
			
			return {
				success: true,
				data,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			console.error('API request failed:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: new Date().toISOString(),
			};
		}
	}

	// Slack API Methods
	async getSlackMentions(): Promise<ApiResponse<SlackMessage[]>> {
		if (!this.config.slack?.botToken) {
			return {
				success: false,
				error: 'Slack bot token not configured',
				timestamp: new Date().toISOString(),
			};
		}

		// For now, return mock data
		// TODO: Implement actual Slack API integration
		const mockData: SlackMessage[] = [
			{
				id: '1',
				text: 'Hey team, we have a critical issue with the payment service',
				user: 'U123456',
				username: 'sarah.manager',
				channel: 'C789012',
				channel_name: 'incidents',
				timestamp: new Date(Date.now() - 1800000).toISOString(),
				mentions: ['@incident-team'],
				permalink: 'https://example.slack.com/archives/C789012/p1234567890'
			}
		];

		return {
			success: true,
			data: mockData,
			timestamp: new Date().toISOString(),
		};
	}

	// Incident.io API Methods
	async getIncidents(): Promise<ApiResponse<{ incidents: Incident[]; summary: any }>> {
		if (!this.config.incidentIo?.apiKey) {
			return {
				success: false,
				error: 'Incident.io API key not configured',
				timestamp: new Date().toISOString(),
			};
		}

		// For now, return mock data
		// TODO: Implement actual Incident.io API integration
		const mockIncidents: Incident[] = [
			{
				id: 'INC-001',
				title: 'Payment Gateway Timeout Issues',
				status: 'open',
				severity: 'p1',
				created_at: new Date(Date.now() - 3600000).toISOString(),
				updated_at: new Date(Date.now() - 1800000).toISOString(),
				sla_timer: {
					duration_seconds: 14400,
					remaining_seconds: 10800,
					breached: false
				},
				assignee: {
					id: 'USR-001',
					name: 'John Smith',
					email: 'john.smith@company.com'
				},
				product: {
					id: 'PROD-001',
					name: 'Payment Service'
				},
				url: 'https://company.incident.io/incidents/INC-001'
			}
		];

		const summary = {
			total_open: mockIncidents.length,
			p1_count: mockIncidents.filter(i => i.severity === 'p1').length,
			p2_count: mockIncidents.filter(i => i.severity === 'p2').length,
			sla_breached: mockIncidents.filter(i => i.sla_timer?.breached).length,
			by_product: [
				{ product: 'Payment Service', count: 1 }
			]
		};

		return {
			success: true,
			data: { incidents: mockIncidents, summary },
			timestamp: new Date().toISOString(),
		};
	}

	// Jira API Methods
	async getJiraIssues(): Promise<ApiResponse<{ issues: JiraIssue[]; summary: any }>> {
		if (!this.config.jira?.baseUrl || !this.config.jira?.apiToken) {
			return {
				success: false,
				error: 'Jira configuration incomplete',
				timestamp: new Date().toISOString(),
			};
		}

		// For now, return mock data
		// TODO: Implement actual Jira API integration
		const mockIssues: JiraIssue[] = [
			{
				id: '10001',
				key: 'PROJ-123',
				summary: 'Implement new user authentication flow',
				status: {
					name: 'In Progress',
					category: 'In Progress'
				},
				priority: {
					name: 'High',
					id: '2'
				},
				assignee: {
					displayName: 'Jane Doe',
					emailAddress: 'jane.doe@company.com',
					accountId: 'acc-001'
				},
				updated: new Date(Date.now() - 7200000).toISOString(),
				created: new Date(Date.now() - 86400000).toISOString(),
				project: {
					key: 'PROJ',
					name: 'Project Alpha'
				},
				url: 'https://company.atlassian.net/browse/PROJ-123'
			}
		];

		const summary = {
			total_open: mockIssues.length,
			by_priority: [
				{ priority: 'High', count: 1 }
			],
			by_assignee: [
				{ assignee: 'Jane Doe', count: 1 }
			]
		};

		return {
			success: true,
			data: { issues: mockIssues, summary },
			timestamp: new Date().toISOString(),
		};
	}

	// Vacation Tracker API Methods
	async getVacationData(): Promise<ApiResponse<any>> {
		if (!this.config.vacationTracker?.apiKey) {
			return {
				success: false,
				error: 'Vacation Tracker API key not configured',
				timestamp: new Date().toISOString(),
			};
		}

		// For now, return mock data
		// TODO: Implement actual Vacation Tracker API integration
		const mockVacations: VacationEntry[] = [
			{
				id: 'VAC-001',
				employee_name: 'Mike Johnson',
				employee_email: 'mike.johnson@company.com',
				start_date: new Date().toISOString().split('T')[0],
				end_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
				type: 'vacation',
				status: 'approved',
				days_count: 4
			}
		];

		const availability = {
			total_team_members: 12,
			currently_off: 1,
			returning_today: ['Sarah Wilson'],
			leaving_today: [],
			off_this_week: mockVacations
		};

		return {
			success: true,
			data: availability,
			timestamp: new Date().toISOString(),
		};
	}

	// Combined method to fetch all dashboard data
	async getAllDashboardData(): Promise<DashboardData> {
		const [slackResponse, incidentsResponse, jiraResponse, vacationResponse] = await Promise.all([
			this.getSlackMentions(),
			this.getIncidents(),
			this.getJiraIssues(),
			this.getVacationData(),
		]);

		return {
			slack: {
				messages: slackResponse.success ? slackResponse.data || [] : [],
				last_updated: slackResponse.timestamp,
				error: slackResponse.success ? undefined : slackResponse.error,
			},
			incidents: {
				incidents: incidentsResponse.success ? incidentsResponse.data?.incidents || [] : [],
				summary: incidentsResponse.success ? incidentsResponse.data?.summary || {
					total_open: 0,
					p1_count: 0,
					p2_count: 0,
					sla_breached: 0,
					by_product: []
				} : {
					total_open: 0,
					p1_count: 0,
					p2_count: 0,
					sla_breached: 0,
					by_product: []
				},
				last_updated: incidentsResponse.timestamp,
				error: incidentsResponse.success ? undefined : incidentsResponse.error,
			},
			jira: {
				issues: jiraResponse.success ? jiraResponse.data?.issues || [] : [],
				summary: jiraResponse.success ? jiraResponse.data?.summary || {
					total_open: 0,
					by_priority: [],
					by_assignee: []
				} : {
					total_open: 0,
					by_priority: [],
					by_assignee: []
				},
				last_updated: jiraResponse.timestamp,
				error: jiraResponse.success ? undefined : jiraResponse.error,
			},
			vacation: {
				availability: vacationResponse.success ? vacationResponse.data || {
					total_team_members: 0,
					currently_off: 0,
					returning_today: [],
					leaving_today: [],
					off_this_week: []
				} : {
					total_team_members: 0,
					currently_off: 0,
					returning_today: [],
					leaving_today: [],
					off_this_week: []
				},
				last_updated: vacationResponse.timestamp,
				error: vacationResponse.success ? undefined : vacationResponse.error,
			},
		};
	}
}

// Export a singleton instance
let apiClient: ApiClient | null = null;

export function initializeApiClient(config: ApiConfig): ApiClient {
	apiClient = new ApiClient(config);
	return apiClient;
}

export function getApiClient(): ApiClient {
	if (!apiClient) {
		// Initialize with empty config for development
		apiClient = new ApiClient({});
	}
	return apiClient;
}

export { ApiClient };
export type { ApiConfig };