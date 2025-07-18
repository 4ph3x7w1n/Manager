import type { 
	SlackMessage, 
	Incident, 
	IncidentTimings,
	IncidentUpdate,
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
					// Only add Content-Type for non-GET requests
					...(options.method && options.method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
					...options.headers,
				},
			});

			if (!response.ok) {
				// Try to get error details from response body
				let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
				try {
					const errorData = await response.json();
					if (errorData.error) {
						errorMessage = `${errorMessage} - ${errorData.error}`;
					}
					if (errorData.errors) {
						errorMessage = `${errorMessage} - ${JSON.stringify(errorData.errors)}`;
					}
					console.error('API Error Response:', errorData);
				} catch (e) {
					// Response might not be JSON
				}
				throw new Error(errorMessage);
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

		try {
			// Calculate date 3 months ago for filtering
			const threeMonthsAgo = new Date();
			threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

			// Use v2 API for richer incident data
			const url = `https://api.incident.io/v2/incidents?page_size=100`;
			console.log('Fetching incidents from v2 API:', url);

			const response = await this.makeRequest<any>(
				url,
				{
					method: 'GET',
					headers: {
						'Authorization': `Bearer ${this.config.incidentIo.apiKey}`,
						'Accept': 'application/json'
					}
				}
			);

			if (!response.success || !response.data) {
				return {
					success: false,
					error: response.error || 'Failed to fetch incidents',
					timestamp: new Date().toISOString(),
				};
			}

			// Transform Incident.io v2 response to our format
			const incidentsData = response.data.incidents || [];
			
			const incidents: Incident[] = incidentsData
				.filter((inc: any) => {
					// Filter for P1 and P2 incidents only (use severity field, not incident_status)
					const severityName = inc.severity?.name?.toLowerCase();
					const isCorrectSeverity = severityName === 'p1' || severityName === 'p2';
					
					// Filter by creation date (last 3 months)
					const incidentDate = new Date(inc.created_at);
					const isWithinTimeRange = incidentDate >= threeMonthsAgo;
					
					return isCorrectSeverity && isWithinTimeRange;
				})
				.map((inc: any) => {
					// Use v2 duration_metrics if available
					let duration_seconds: number | undefined;
					if (inc.duration_metrics) {
						// Check for different duration metric types
						const durationMetric = inc.duration_metrics.find((dm: any) => 
							dm.name === 'resolution_time' || dm.name === 'total_duration' || dm.name === 'time_to_resolve'
						);
						if (durationMetric?.value_seconds) {
							duration_seconds = durationMetric.value_seconds;
						}
					}

					// Fallback to calculating from incident_timestamp_values if no duration metrics
					if (!duration_seconds) {
						const closedTimestamp = inc.incident_timestamp_values?.find((ts: any) => 
							ts.incident_timestamp?.name === 'closed' || ts.incident_timestamp?.name === 'resolved'
						);
						if (closedTimestamp?.value) {
							const created = new Date(inc.created_at).getTime();
							const closed = new Date(closedTimestamp.value).getTime();
							duration_seconds = Math.floor((closed - created) / 1000);
						}
					}

					// Calculate timing metrics using v2 data structure
					const timings = this.calculateIncidentTimingsV2(inc);

					// Extract incident updates using v2 structure
					const updates = this.extractIncidentUpdatesV2(inc);

					// Find Product from custom fields
					const productField = inc.custom_field_entries?.find((cf: any) => 
						cf.custom_field?.name === 'Product'
					);
					
					// Extract product name from values array
					const productName = productField?.values?.[0]?.value_catalog_entry?.name || 'Unknown';

					// Find post-mortem URL from custom fields
					const postmortemField = inc.custom_field_entries?.find((cf: any) => {
						const fieldName = cf.custom_field?.name?.toLowerCase() || '';
						return fieldName.includes('postmortem') || fieldName.includes('post_mortem');
					});

					// Find Incident Lead from role assignments
					const leadRole = inc.incident_role_assignments?.find((role: any) => 
						role.role?.role_type === 'lead'
					);
					const leadPerson = leadRole?.assignee;

					// Use v2 incident status structure
					const status = inc.incident_status?.category?.toLowerCase() || 'open';
					const isResolved = status === 'closed' || status === 'resolved';

					return {
						id: inc.id,
						reference: inc.reference,
						title: inc.name,
						summary: inc.summary || undefined, // v2 still has summary at root level
						status: status,
						severity: inc.severity?.name?.toLowerCase() || 'p4',
						created_at: inc.created_at,
						updated_at: inc.updated_at || inc.created_at,
						closed_at: isResolved ? (inc.incident_timestamp_values?.find((ts: any) => 
							ts.incident_timestamp?.name === 'closed' || ts.incident_timestamp?.name === 'resolved'
						)?.value || null) : null,
						duration_seconds,
						timings,
						sla_timer: undefined, // TODO: Implement if needed
						lead: leadPerson ? {
							id: leadPerson.id,
							name: leadPerson.name,
							email: leadPerson.email || ''
						} : undefined,
						assignee: undefined,
						product: {
							id: 'custom',
							name: productName
						},
						postmortem_url: postmortemField?.value_text || postmortemField?.value_link || undefined,
						url: inc.permalink || `https://app.incident.io/${this.config.incidentIo.organization}/incidents/${inc.id}`,
						updates
					};
				});

			// Calculate uptime and MTTR metrics
			const uptimeMetrics = this.calculateUptimeMetrics(incidents);
			
			// Calculate summary
			const summary = {
				total_open: incidents.length,
				p1_count: incidents.filter(i => i.severity === 'p1').length,
				p2_count: incidents.filter(i => i.severity === 'p2').length,
				sla_breached: incidents.filter(i => i.sla_timer?.breached).length,
				uptime_percentage: uptimeMetrics.uptime_percentage,
				average_time_to_mitigate_minutes: uptimeMetrics.average_time_to_mitigate_minutes,
				by_product: this.groupByProduct(incidents)
			};

			return {
				success: true,
				data: { incidents, summary },
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			console.error('Incident.io API error:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: new Date().toISOString(),
			};
		}
	}

	private calculateSLATimer(incident: any): Incident['sla_timer'] | undefined {
		// Check if incident has SLA information
		const sla = incident.timestamps?.find((ts: any) => ts.name === 'sla_breach');
		if (!sla) return undefined;

		const createdAt = new Date(incident.created_at).getTime();
		const breachAt = new Date(sla.value).getTime();
		const now = Date.now();

		const duration_seconds = Math.floor((breachAt - createdAt) / 1000);
		const remaining_seconds = Math.floor((breachAt - now) / 1000);
		const breached = now > breachAt;

		return {
			duration_seconds,
			remaining_seconds: breached ? 0 : remaining_seconds,
			breached
		};
	}

	// V2 API timing calculation using incident_timestamp_values and duration_metrics
	private calculateIncidentTimingsV2(incident: any): IncidentTimings {
		const timings: IncidentTimings = {};
		
		// First try to use pre-calculated duration_metrics from v2 API
		if (incident.duration_metrics) {
			const ttd = incident.duration_metrics.find((dm: any) => dm.duration_metric?.name === 'Time to detect');
			const tta = incident.duration_metrics.find((dm: any) => dm.duration_metric?.name === 'Time to acknowledge');
			const ttm = incident.duration_metrics.find((dm: any) => dm.duration_metric?.name === 'Time to mitigate');
			const ttr = incident.duration_metrics.find((dm: any) => dm.duration_metric?.name === 'Time to recovery');
			
			if (ttd?.value_seconds !== undefined) timings.time_to_detect_seconds = ttd.value_seconds;
			if (tta?.value_seconds !== undefined) timings.time_to_acknowledge_seconds = tta.value_seconds;
			if (ttm?.value_seconds !== undefined) timings.time_to_mitigate_seconds = ttm.value_seconds;
			if (ttr?.value_seconds !== undefined) timings.time_to_resolve_seconds = ttr.value_seconds;
			
			return timings;
		}
		
		// Fallback to calculating from incident_timestamp_values
		const createdAt = new Date(incident.created_at).getTime();
		
		// Find relevant timestamps with actual values
		const acknowledgedTimestamp = incident.incident_timestamp_values?.find((ts: any) => {
			const name = ts.incident_timestamp?.name;
			return (name === 'acknowledged' || name === 'investigating' || name === 'accepted') && ts.value;
		});
		const detectedTimestamp = incident.incident_timestamp_values?.find((ts: any) => {
			const name = ts.incident_timestamp?.name;
			return (name === 'detected' || name === 'started' || name === 'reported') && ts.value;
		});
		const mitigatedTimestamp = incident.incident_timestamp_values?.find((ts: any) => {
			const name = ts.incident_timestamp?.name;
			return (name === 'mitigated' || name === 'fixed' || name === 'identified') && ts.value;
		});
		const resolvedTimestamp = incident.incident_timestamp_values?.find((ts: any) => {
			const name = ts.incident_timestamp?.name;
			return (name === 'closed' || name === 'resolved') && ts.value;
		});

		// Calculate timing metrics
		if (detectedTimestamp?.value) {
			const detectedAt = new Date(detectedTimestamp.value).getTime();
			const timeDiff = Math.floor((detectedAt - createdAt) / 1000);
			timings.time_to_detect_seconds = timeDiff > 60 ? timeDiff : 0;
		}

		if (acknowledgedTimestamp?.value) {
			const acknowledgedAt = new Date(acknowledgedTimestamp.value).getTime();
			timings.time_to_acknowledge_seconds = Math.floor((acknowledgedAt - createdAt) / 1000);
		}

		if (mitigatedTimestamp?.value) {
			const mitigatedAt = new Date(mitigatedTimestamp.value).getTime();
			timings.time_to_mitigate_seconds = Math.floor((mitigatedAt - createdAt) / 1000);
		}

		if (resolvedTimestamp?.value) {
			const resolvedAt = new Date(resolvedTimestamp.value).getTime();
			timings.time_to_resolve_seconds = Math.floor((resolvedAt - createdAt) / 1000);
		}

		return timings;
	}

	// V1 API timing calculation (legacy)
	private calculateIncidentTimings(incident: any): IncidentTimings {
		const timings: IncidentTimings = {};
		const createdAt = new Date(incident.created_at).getTime();
		
		// Find relevant timestamps with actual values
		const acknowledgedTimestamp = incident.timestamps?.find((ts: any) => 
			(ts.name === 'acknowledged' || ts.name === 'investigating' || ts.name === 'accepted') && ts.last_occurred_at
		);
		const detectedTimestamp = incident.timestamps?.find((ts: any) => 
			(ts.name === 'detected' || ts.name === 'started' || ts.name === 'reported') && ts.last_occurred_at
		);
		const mitigatedTimestamp = incident.timestamps?.find((ts: any) => 
			(ts.name === 'mitigated' || ts.name === 'fixed' || ts.name === 'identified') && ts.last_occurred_at
		);
		const resolvedTimestamp = incident.timestamps?.find((ts: any) => 
			(ts.name === 'closed' || ts.name === 'resolved') && ts.last_occurred_at
		);

		// Calculate Time to Detect (using 'reported' timestamp if different from creation)
		if (detectedTimestamp?.last_occurred_at) {
			const detectedAt = new Date(detectedTimestamp.last_occurred_at).getTime();
			const timeDiff = Math.floor((detectedAt - createdAt) / 1000);
			// Only set if there's a meaningful difference (more than 1 minute)
			if (timeDiff > 60) {
				timings.time_to_detect_seconds = timeDiff;
			} else {
				timings.time_to_detect_seconds = 0; // Immediate detection
			}
		}

		// Calculate Time to Acknowledge
		if (acknowledgedTimestamp?.last_occurred_at) {
			const acknowledgedAt = new Date(acknowledgedTimestamp.last_occurred_at).getTime();
			timings.time_to_acknowledge_seconds = Math.floor((acknowledgedAt - createdAt) / 1000);
		}

		// Calculate Time to Mitigate
		if (mitigatedTimestamp?.last_occurred_at) {
			const mitigatedAt = new Date(mitigatedTimestamp.last_occurred_at).getTime();
			timings.time_to_mitigate_seconds = Math.floor((mitigatedAt - createdAt) / 1000);
		}

		// Calculate Time to Resolve
		if (resolvedTimestamp?.last_occurred_at) {
			const resolvedAt = new Date(resolvedTimestamp.last_occurred_at).getTime();
			timings.time_to_resolve_seconds = Math.floor((resolvedAt - createdAt) / 1000);
		}

		return timings;
	}

	// V2 API incident updates extraction
	private extractIncidentUpdatesV2(incident: any): IncidentUpdate[] {
		const updates: IncidentUpdate[] = [];
		
		// Extract updates from incident timeline/updates if available
		if (incident.incident_updates?.length > 0) {
			incident.incident_updates.forEach((update: any, index: number) => {
				updates.push({
					id: update.id || `update-${index}`,
					message: update.message || update.body || 'Status update',
					timestamp: update.created_at || update.updated_at,
					author: {
						name: update.created_by?.name || 'System',
						email: update.created_by?.email
					}
				});
			});
		}

		// Add timeline events from incident_timestamp_values - only for events that actually occurred
		if (incident.incident_timestamp_values?.length > 0) {
			incident.incident_timestamp_values.forEach((ts: any, index: number) => {
				if (ts.value) {
					const name = ts.incident_timestamp?.name || '';
					let message = '';
					switch (name.toLowerCase()) {
						case 'reported':
							message = 'Incident reported and created';
							break;
						case 'accepted':
							message = 'Incident accepted and being triaged';
							break;
						case 'acknowledged':
							message = 'Incident acknowledged by team';
							break;
						case 'investigating':
							message = 'Investigation started';
							break;
						case 'identified':
							message = 'Root cause identified';
							break;
						case 'fixed':
							message = 'Fix implemented';
							break;
						case 'mitigated':
							message = 'Issue mitigated';
							break;
						case 'closed':
							message = 'Incident closed';
							break;
						case 'resolved':
							message = 'Incident resolved';
							break;
						default:
							message = `Status changed to: ${name}`;
					}

					updates.push({
						id: `timeline-v2-${index}`,
						message: message,
						timestamp: ts.value?.value || ts.value,
						author: {
							name: 'System'
						}
					});
				}
			});
		}

		// If no timeline updates, add the initial creation as an update
		if (updates.length === 0) {
			updates.push({
				id: 'initial',
				message: 'Incident created',
				timestamp: incident.created_at,
				author: {
					name: 'System'
				}
			});
		}

		// Sort updates by timestamp (newest first)
		return updates.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
	}

	// V1 API incident updates extraction (legacy)
	private extractIncidentUpdates(incident: any): IncidentUpdate[] {
		const updates: IncidentUpdate[] = [];
		
		// Extract updates from incident timeline/updates if available
		if (incident.incident_updates?.length > 0) {
			incident.incident_updates.forEach((update: any, index: number) => {
				updates.push({
					id: update.id || `update-${index}`,
					message: update.message || update.body || 'Status update',
					timestamp: update.created_at || update.updated_at,
					author: {
						name: update.created_by?.name || 'System',
						email: update.created_by?.email
					}
				});
			});
		}

		// Add timeline events as updates - only for events that actually occurred
		if (incident.timestamps?.length > 0) {
			incident.timestamps.forEach((ts: any, index: number) => {
				if (ts.last_occurred_at) {
					// Create more descriptive messages for timeline events
					let message = '';
					switch (ts.name.toLowerCase()) {
						case 'reported':
							message = 'Incident reported and created';
							break;
						case 'accepted':
							message = 'Incident accepted and being triaged';
							break;
						case 'acknowledged':
							message = 'Incident acknowledged by team';
							break;
						case 'investigating':
							message = 'Investigation started';
							break;
						case 'identified':
							message = 'Root cause identified';
							break;
						case 'fixed':
							message = 'Fix implemented';
							break;
						case 'mitigated':
							message = 'Issue mitigated';
							break;
						case 'closed':
							message = 'Incident closed';
							break;
						case 'resolved':
							message = 'Incident resolved';
							break;
						case 'last_activity':
							message = 'Last activity recorded';
							break;
						default:
							message = `Status changed to: ${ts.name}`;
					}

					updates.push({
						id: `timeline-${index}`,
						message: message,
						timestamp: ts.last_occurred_at,
						author: {
							name: 'System'
						}
					});
				}
			});
		}

		// If no timeline updates, add the initial creation as an update
		if (updates.length === 0) {
			updates.push({
				id: 'initial',
				message: 'Incident created',
				timestamp: incident.created_at,
				author: {
					name: 'System'
				}
			});
		}

		// Sort updates by timestamp (newest first)
		return updates.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
	}

	private calculateUptimeMetrics(incidents: Incident[]): { uptime_percentage: number; average_time_to_mitigate_minutes: number } {
		const threeMonthsInMs = 3 * 30 * 24 * 60 * 60 * 1000; // Approximate 3 months in milliseconds
		
		// Calculate total downtime from incidents
		let totalDowntimeSeconds = 0;
		let mitigatedIncidents = 0;
		let totalMitigationTimeSeconds = 0;
		let resolvedIncidents = 0;
		let totalResolutionTimeSeconds = 0;

		incidents.forEach(incident => {
			// For uptime calculation, use time to mitigate if available, 
			// otherwise use duration, otherwise estimate based on severity
			let downtimeSeconds = 0;
			
			if (incident.timings?.time_to_mitigate_seconds) {
				downtimeSeconds = incident.timings.time_to_mitigate_seconds;
			} else if (incident.duration_seconds) {
				downtimeSeconds = incident.duration_seconds;
			} else if (['live', 'active', 'open'].includes(incident.status)) {
				// For active incidents without resolution, estimate ongoing downtime
				const now = Date.now();
				const createdAt = new Date(incident.created_at).getTime();
				downtimeSeconds = Math.floor((now - createdAt) / 1000);
			}
			
			if (downtimeSeconds > 0) {
				totalDowntimeSeconds += downtimeSeconds;
			}

			// Track mitigation times for average calculation
			if (incident.timings?.time_to_mitigate_seconds) {
				totalMitigationTimeSeconds += incident.timings.time_to_mitigate_seconds;
				mitigatedIncidents++;
			} else if (incident.timings?.time_to_resolve_seconds) {
				// Use resolution time if mitigation time is not available
				totalResolutionTimeSeconds += incident.timings.time_to_resolve_seconds;
				resolvedIncidents++;
			}
		});

		// Calculate uptime percentage
		const totalDowntimeMs = totalDowntimeSeconds * 1000;
		const uptimeMs = Math.max(0, threeMonthsInMs - totalDowntimeMs);
		const uptime_percentage = (uptimeMs / threeMonthsInMs) * 100;

		// Calculate average time to mitigate in minutes
		let average_time_to_mitigate_minutes = 0;
		if (mitigatedIncidents > 0) {
			average_time_to_mitigate_minutes = Math.round(totalMitigationTimeSeconds / mitigatedIncidents / 60);
		} else if (resolvedIncidents > 0) {
			// Fall back to resolution time if no mitigation times available
			average_time_to_mitigate_minutes = Math.round(totalResolutionTimeSeconds / resolvedIncidents / 60);
		}

		return {
			uptime_percentage: Math.round(uptime_percentage * 100) / 100, // Round to 2 decimal places
			average_time_to_mitigate_minutes
		};
	}

	private groupByProduct(incidents: Incident[]): Array<{ product: string; count: number }> {
		const productMap = new Map<string, number>();
		
		incidents.forEach(incident => {
			const productName = incident.product?.name || 'Unassigned';
			productMap.set(productName, (productMap.get(productName) || 0) + 1);
		});

		return Array.from(productMap.entries())
			.map(([product, count]) => ({ product, count }))
			.sort((a, b) => b.count - a.count);
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
					uptime_percentage: 100,
					average_time_to_mitigate_minutes: 0,
					by_product: []
				} : {
					total_open: 0,
					p1_count: 0,
					p2_count: 0,
					sla_breached: 0,
					uptime_percentage: 100,
					average_time_to_mitigate_minutes: 0,
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