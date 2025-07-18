import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ platform }) => {
	const env = platform?.env || {};
	const apiKey = env.INCIDENT_IO_API_KEY || '';

	if (!apiKey) {
		return json({ error: 'No API key configured' }, { status: 400 });
	}

	try {
		// Fetch incidents from v2 API
		const incidentsResponse = await fetch('https://api.incident.io/v2/incidents?page_size=10', {
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Accept': 'application/json'
			}
		});

		if (!incidentsResponse.ok) {
			return json({ error: 'Failed to fetch incidents' }, { status: 500 });
		}

		const incidentsData = await incidentsResponse.json();
		const incidents = incidentsData.incidents || [];

		// Debug the filtering logic
		const threeMonthsAgo = new Date();
		threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

		const debugResults = incidents.map((inc: any) => {
			// Test both severity field locations
			const incidentStatusSeverity = inc.incident_status?.name?.toLowerCase();
			const severitySeverity = inc.severity?.name?.toLowerCase();
			
			const incidentDate = new Date(inc.created_at);
			const isWithinTimeRange = incidentDate >= threeMonthsAgo;
			
			// Test the current filter logic
			const severityName = inc.incident_status?.name?.toLowerCase() || inc.severity?.name?.toLowerCase();
			const isCorrectSeverity = severityName === 'p1' || severityName === 'p2' || severityName === 'p3';
			
			return {
				id: inc.id,
				reference: inc.reference,
				name: inc.name,
				created_at: inc.created_at,
				
				// Debug severity fields
				severity_field_raw: inc.severity,
				incident_status_field_raw: inc.incident_status,
				
				// Extracted values
				incident_status_severity: incidentStatusSeverity,
				severity_severity: severitySeverity,
				final_severity_name: severityName,
				
				// Filter results
				is_correct_severity: isCorrectSeverity,
				is_within_time_range: isWithinTimeRange,
				would_pass_filter: isCorrectSeverity && isWithinTimeRange,
				
				// Date calculations
				incident_date: incidentDate.toISOString(),
				three_months_ago: threeMonthsAgo.toISOString(),
				days_old: Math.floor((new Date().getTime() - incidentDate.getTime()) / (1000 * 60 * 60 * 24))
			};
		});

		return json({
			success: true,
			message: 'Debugging incident filtering logic',
			three_months_ago_cutoff: threeMonthsAgo.toISOString(),
			total_incidents_fetched: incidents.length,
			incidents_that_would_pass: debugResults.filter(r => r.would_pass_filter).length,
			severity_breakdown: debugResults.reduce((acc: any, inc: any) => {
				const severity = inc.final_severity_name || 'unknown';
				acc[severity] = (acc[severity] || 0) + 1;
				return acc;
			}, {}),
			time_range_breakdown: {
				within_3_months: debugResults.filter(r => r.is_within_time_range).length,
				older_than_3_months: debugResults.filter(r => !r.is_within_time_range).length
			},
			debug_incidents: debugResults
		});

	} catch (error) {
		return json({
			error: 'Failed to debug filter logic',
			message: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};