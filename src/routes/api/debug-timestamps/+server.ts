import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ platform, url }) => {
	const env = platform?.env || {};
	const apiKey = env.INCIDENT_IO_API_KEY || '';

	if (!apiKey) {
		return json({ error: 'No API key configured' }, { status: 400 });
	}

	// Get incident_id from query params if provided
	const incidentId = url.searchParams.get('incident_id');

	try {
		// First, get a recent incident ID if none provided
		let targetIncidentId = incidentId;
		
		if (!targetIncidentId) {
			const incidentsResponse = await fetch('https://api.incident.io/v2/incidents?page_size=1', {
				headers: {
					'Authorization': `Bearer ${apiKey}`,
					'Accept': 'application/json'
				}
			});
			
			if (incidentsResponse.ok) {
				const incidentsData = await incidentsResponse.json();
				targetIncidentId = incidentsData.incidents?.[0]?.id;
			}
		}

		if (!targetIncidentId) {
			return json({ error: 'No incident ID available for timestamp testing' }, { status: 400 });
		}

		// Fetch incident timestamps from v2 API
		const response = await fetch(`https://api.incident.io/v2/incident_timestamps?incident_id=${targetIncidentId}`, {
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Accept': 'application/json'
			}
		});

		const responseText = await response.text();
		let data;
		
		try {
			data = JSON.parse(responseText);
		} catch (e) {
			return json({
				error: 'Invalid JSON response',
				status: response.status,
				responseText: responseText.substring(0, 1000)
			}, { status: 500 });
		}

		if (!response.ok) {
			return json({
				error: 'Incident timestamps API request failed',
				status: response.status,
				apiError: data,
				attempted_incident_id: targetIncidentId
			}, { status: response.status });
		}

		// Analyze timestamps response structure
		return json({
			success: true,
			incident_id: targetIncidentId,
			api_endpoint: `/v2/incident_timestamps?incident_id=${targetIncidentId}`,
			response_structure: {
				root_keys: Object.keys(data),
				has_incident_timestamps: !!data.incident_timestamps,
				timestamps_count: data.incident_timestamps?.length || 0
			},
			timestamps_analysis: data.incident_timestamps?.map((ts: any) => ({
				id: ts.id,
				name: ts.name,
				occurred_at: ts.occurred_at,
				last_occurred_at: ts.last_occurred_at,
				all_fields: Object.keys(ts)
			})) || [],
			full_timestamps_data: data.incident_timestamps || [],
			pagination: data.pagination || null
		});
	} catch (error) {
		return json({
			error: 'Failed to connect to incident timestamps API',
			message: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};