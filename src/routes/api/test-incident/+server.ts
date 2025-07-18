import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ platform }) => {
	const env = platform?.env || {};
	const apiKey = env.INCIDENT_IO_API_KEY || '';
	const organization = env.INCIDENT_IO_ORGANIZATION || '';

	if (!apiKey) {
		return json({ error: 'No API key configured' }, { status: 400 });
	}

	try {
		// Simple test: just fetch incidents without any filters
		const response = await fetch('https://api.incident.io/v1/incidents?per_page=5', {
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
				statusText: response.statusText,
				responseText: responseText.substring(0, 500)
			}, { status: 500 });
		}

		if (!response.ok) {
			return json({
				error: 'API request failed',
				status: response.status,
				statusText: response.statusText,
				apiError: data
			}, { status: response.status });
		}

		return json({
			success: true,
			organization,
			rawResponse: data,
			responseKeys: Object.keys(data),
			incidentCount: data.data?.length || data.incidents?.length || data.length || 0,
			sampleIncident: data.data?.[0] || data.incidents?.[0] || data[0] || null,
			apiStructure: {
				hasData: !!data.data,
				hasIncidents: !!data.incidents,
				isArray: Array.isArray(data),
				hasPagination: !!data.pagination,
				fields: (data.data?.[0] || data.incidents?.[0] || data[0]) ? Object.keys(data.data?.[0] || data.incidents?.[0] || data[0]) : []
			}
		});
	} catch (error) {
		return json({
			error: 'Failed to connect to Incident.io',
			message: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};