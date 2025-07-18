import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ platform }) => {
	const env = platform?.env || {};
	const apiKey = env.INCIDENT_IO_API_KEY || '';

	if (!apiKey) {
		return json({ error: 'No API key configured' }, { status: 400 });
	}

	try {
		// Fetch schedules from v2 API
		const response = await fetch('https://api.incident.io/v2/schedules', {
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
				error: 'Schedules API request failed',
				status: response.status,
				apiError: data
			}, { status: response.status });
		}

		// Look for REOPS Response schedule specifically
		const reopsSchedule = data.schedules?.find((schedule: any) => 
			schedule.name?.toLowerCase().includes('reops') || 
			schedule.name?.toLowerCase().includes('response')
		);

		return json({
			success: true,
			total_schedules: data.schedules?.length || 0,
			response_structure: {
				root_keys: Object.keys(data),
				has_schedules_array: !!data.schedules
			},
			reops_schedule_found: !!reopsSchedule,
			reops_schedule: reopsSchedule ? {
				id: reopsSchedule.id,
				name: reopsSchedule.name,
				timezone: reopsSchedule.timezone,
				all_fields: Object.keys(reopsSchedule)
			} : null,
			all_schedule_names: data.schedules?.map((s: any) => ({
				id: s.id,
				name: s.name,
				timezone: s.timezone
			})) || [],
			sample_schedule_structure: data.schedules?.[0] ? {
				all_fields: Object.keys(data.schedules[0]),
				has_layers: !!data.schedules[0].layers,
				layers_count: data.schedules[0].layers?.length || 0
			} : null,
			pagination: data.pagination || null
		});
	} catch (error) {
		return json({
			error: 'Failed to connect to schedules API',
			message: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};