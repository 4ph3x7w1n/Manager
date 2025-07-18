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
		const response = await fetch('https://api.incident.io/v2/incidents?page_size=5', {
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
				error: 'V2 API request failed',
				status: response.status,
				apiError: data
			}, { status: response.status });
		}

		// Analyze v2 response structure
		const firstIncident = data.incidents?.[0];

		return json({
			success: true,
			api_version: 'v2',
			total_incidents: data.incidents?.length || 0,
			response_structure: {
				root_keys: Object.keys(data),
				has_incidents_array: !!data.incidents,
				has_pagination: !!data.pagination
			},
			first_incident_v2_structure: firstIncident ? {
				id: firstIncident.id,
				name: firstIncident.name,
				summary: firstIncident.summary,
				status: firstIncident.status,
				severity: firstIncident.severity,
				all_root_fields: Object.keys(firstIncident),
				has_timestamps: !!firstIncident.timestamps,
				has_incident_updates: !!firstIncident.incident_updates,
				has_custom_field_entries: !!firstIncident.custom_field_entries,
				timestamps_count: firstIncident.timestamps?.length || 0,
				incident_updates_count: firstIncident.incident_updates?.length || 0,
				custom_fields_count: firstIncident.custom_field_entries?.length || 0
			} : null,
			sample_v2_incidents: data.incidents?.slice(0, 2) || [],
			pagination_info: data.pagination || null
		});
	} catch (error) {
		return json({
			error: 'Failed to connect to Incident.io v2',
			message: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};