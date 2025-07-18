import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ platform }) => {
	const env = platform?.env || {};
	const apiKey = env.INCIDENT_IO_API_KEY || '';

	if (!apiKey) {
		return json({ error: 'No API key configured' }, { status: 400 });
	}

	try {
		// Test v2 API
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
				responseText: responseText.substring(0, 500)
			}, { status: 500 });
		}

		if (!response.ok) {
			return json({
				error: 'V2 API request failed',
				status: response.status,
				apiError: data
			}, { status: response.status });
		}

		return json({
			success: true,
			apiVersion: 'v2',
			rawResponse: data,
			responseKeys: Object.keys(data),
			incidentCount: data.incidents?.length || 0,
			sampleIncident: data.incidents?.[0] || null
		});
	} catch (error) {
		return json({
			error: 'Failed to connect to Incident.io v2',
			message: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};