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

		// Filter for recent incidents from last 3 months (ALL severities for testing)
		const threeMonthsAgo = new Date();
		threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

		const filteredIncidents = incidents.filter((inc: any) => {
			const incidentDate = new Date(inc.created_at);
			const isWithinTimeRange = incidentDate >= threeMonthsAgo;
			return isWithinTimeRange; // No severity filter - show all
		});

		// Transform incidents to show key data
		const transformedIncidents = filteredIncidents.map((incident: any) => {
			// Extract timing data
			const timingMetrics: any = {};
			if (incident.duration_metrics) {
				incident.duration_metrics.forEach((metric: any) => {
					if (metric.value_seconds !== undefined) {
						timingMetrics[metric.duration_metric.name] = {
							value_seconds: metric.value_seconds,
							value_minutes: Math.round(metric.value_seconds / 60)
						};
					}
				});
			}

			// Extract timeline
			const timeline: any[] = [];
			if (incident.incident_timestamp_values) {
				incident.incident_timestamp_values.forEach((ts: any) => {
					if (ts.value) {
						timeline.push({
							name: ts.incident_timestamp?.name,
							timestamp: ts.value.value,
							rank: ts.incident_timestamp?.rank
						});
					}
				});
			}

			// Sort timeline by rank/timestamp
			timeline.sort((a, b) => (a.rank || 999) - (b.rank || 999));

			return {
				id: incident.id,
				reference: incident.reference,
				name: incident.name,
				summary: incident.summary ? incident.summary.substring(0, 200) + '...' : null,
				severity: incident.severity?.name || 'Unknown',
				status: incident.incident_status?.category || 'unknown',
				status_name: incident.incident_status?.name || 'Unknown',
				created_at: incident.created_at,
				updated_at: incident.updated_at,
				duration_metrics: timingMetrics,
				timeline_count: timeline.length,
				first_timeline_event: timeline[0]?.name || null,
				last_timeline_event: timeline[timeline.length - 1]?.name || null,
				product: incident.custom_field_entries?.find((cf: any) => 
					cf.custom_field?.name === 'Product'
				)?.values?.[0]?.value_catalog_entry?.name || 'Unknown',
				team: incident.custom_field_entries?.find((cf: any) => 
					cf.custom_field?.name === 'Team'
				)?.values?.[0]?.value_catalog_entry?.name || 'Unknown',
				lead: incident.incident_role_assignments?.find((role: any) => 
					role.role?.role_type === 'lead'
				)?.assignee?.name || null,
				url: incident.permalink || `https://app.incident.io/yum/incidents/${incident.id}`
			};
		});

		// Group by severity
		const severityBreakdown = filteredIncidents.reduce((acc: any, inc: any) => {
			const severity = inc.severity?.name || 'Unknown';
			acc[severity] = (acc[severity] || 0) + 1;
			return acc;
		}, {});

		// Group by status
		const statusBreakdown = filteredIncidents.reduce((acc: any, inc: any) => {
			const status = inc.incident_status?.name || 'Unknown';
			acc[status] = (acc[status] || 0) + 1;
			return acc;
		}, {});

		return json({
			success: true,
			message: 'All incidents from last 3 months (no severity filter)',
			summary: {
				total_incidents: transformedIncidents.length,
				severity_breakdown: severityBreakdown,
				status_breakdown: statusBreakdown,
				with_timing_data: transformedIncidents.filter(i => Object.keys(i.duration_metrics).length > 0).length,
				with_timeline: transformedIncidents.filter(i => i.timeline_count > 0).length
			},
			incidents: transformedIncidents.slice(0, 20), // Limit to first 20 for readability
			note: "This endpoint shows ALL severities to help debug the filtering issue"
		});

	} catch (error) {
		return json({
			error: 'Failed to fetch all incident data',
			message: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};