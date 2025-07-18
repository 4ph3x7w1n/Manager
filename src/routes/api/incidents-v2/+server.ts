import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ platform }) => {
	const env = platform?.env || {};
	const apiKey = env.INCIDENT_IO_API_KEY || '';

	if (!apiKey) {
		return json({ error: 'No API key configured' }, { status: 400 });
	}

	try {
		// Fetch incidents from v2 API with enhanced data
		const incidentsResponse = await fetch('https://api.incident.io/v2/incidents?page_size=100', {
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Accept': 'application/json'
			}
		});

		if (!incidentsResponse.ok) {
			const errorText = await incidentsResponse.text();
			return json({
				error: 'Failed to fetch incidents',
				status: incidentsResponse.status,
				details: errorText
			}, { status: incidentsResponse.status });
		}

		const incidentsData = await incidentsResponse.json();
		const incidents = incidentsData.incidents || [];

		// Filter for P1/P2 incidents from last 3 months
		const threeMonthsAgo = new Date();
		threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

		const filteredIncidents = incidents.filter((inc: any) => {
			const severityName = inc.incident_status?.name?.toLowerCase() || inc.severity?.name?.toLowerCase();
			const isCorrectSeverity = severityName === 'p1' || severityName === 'p2';
			
			const incidentDate = new Date(inc.created_at);
			const isWithinTimeRange = incidentDate >= threeMonthsAgo;
			
			return isCorrectSeverity && isWithinTimeRange;
		});

		// For each incident, fetch detailed timing data if needed
		const enhancedIncidents = await Promise.all(
			filteredIncidents.slice(0, 20).map(async (incident: any) => {
				try {
					// Fetch incident timestamps for this specific incident
					const timestampsResponse = await fetch(
						`https://api.incident.io/v2/incident_timestamps?incident_id=${incident.id}`,
						{
							headers: {
								'Authorization': `Bearer ${apiKey}`,
								'Accept': 'application/json'
							}
						}
					);

					let timestampsData = null;
					if (timestampsResponse.ok) {
						timestampsData = await timestampsResponse.json();
					}

					// Extract enhanced timing data
					const timingMetrics: any = {};
					
					// Use duration_metrics if available
					if (incident.duration_metrics) {
						incident.duration_metrics.forEach((metric: any) => {
							timingMetrics[metric.name] = {
								value_seconds: metric.value_seconds,
								value_minutes: Math.round(metric.value_seconds / 60)
							};
						});
					}

					// Use incident_timestamp_values for timeline
					const timeline: any[] = [];
					if (incident.incident_timestamp_values) {
						incident.incident_timestamp_values.forEach((ts: any) => {
							if (ts.value) {
								timeline.push({
									name: ts.incident_timestamp?.name,
									timestamp: ts.value,
									description: ts.incident_timestamp?.description
								});
							}
						});
					}

					// Add detailed timestamps if we fetched them separately
					if (timestampsData?.incident_timestamps) {
						timestampsData.incident_timestamps.forEach((ts: any) => {
							if (ts.occurred_at || ts.last_occurred_at) {
								const existingTimelineEntry = timeline.find(t => t.name === ts.name);
								if (!existingTimelineEntry) {
									timeline.push({
										name: ts.name,
										timestamp: ts.last_occurred_at || ts.occurred_at,
										description: ts.description
									});
								}
							}
						});
					}

					// Sort timeline by timestamp
					timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

					return {
						id: incident.id,
						name: incident.name,
						summary: incident.summary,
						severity: incident.incident_status?.name?.toLowerCase() || incident.severity?.name?.toLowerCase(),
						status: incident.incident_status?.category?.toLowerCase() || 'open',
						created_at: incident.created_at,
						updated_at: incident.updated_at,
						duration_metrics: timingMetrics,
						timeline: timeline,
						product: incident.custom_field_entries?.find((cf: any) => 
							cf.custom_field?.name === 'Product'
						)?.values?.[0]?.value_catalog_entry?.name || 'Unknown',
						lead: incident.incident_role_assignments?.find((role: any) => 
							role.role?.role_type === 'lead'
						)?.assignee?.name || null,
						url: incident.permalink || `https://app.incident.io/yum/incidents/${incident.id}`
					};
				} catch (error) {
					console.error(`Error enhancing incident ${incident.id}:`, error);
					// Return basic incident data if enhancement fails
					return {
						id: incident.id,
						name: incident.name,
						summary: incident.summary,
						severity: incident.incident_status?.name?.toLowerCase() || incident.severity?.name?.toLowerCase(),
						status: incident.incident_status?.category?.toLowerCase() || 'open',
						created_at: incident.created_at,
						error: 'Failed to fetch enhanced timing data'
					};
				}
			})
		);

		// Calculate summary metrics
		const summary = {
			total_incidents: enhancedIncidents.length,
			p1_count: enhancedIncidents.filter(i => i.severity === 'p1').length,
			p2_count: enhancedIncidents.filter(i => i.severity === 'p2').length,
			with_timing_data: enhancedIncidents.filter(i => i.duration_metrics && Object.keys(i.duration_metrics).length > 0).length,
			with_timeline: enhancedIncidents.filter(i => i.timeline && i.timeline.length > 0).length
		};

		return json({
			success: true,
			message: 'Enhanced v2 incident data with timing metrics',
			summary,
			incidents: enhancedIncidents,
			api_info: {
				incidents_endpoint: '/v2/incidents',
				timestamps_endpoint: '/v2/incident_timestamps',
				data_enhancements: [
					'duration_metrics with pre-calculated timing values',
					'incident_timestamp_values for timeline',
					'separate incident_timestamps API for detailed timing'
				]
			}
		});

	} catch (error) {
		return json({
			error: 'Failed to fetch enhanced incident data',
			message: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};