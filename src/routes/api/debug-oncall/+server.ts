import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ platform, url }) => {
	const env = platform?.env || {};
	const apiKey = env.INCIDENT_IO_API_KEY || '';

	if (!apiKey) {
		return json({ error: 'No API key configured' }, { status: 400 });
	}

	// Get schedule_id from query params
	const scheduleId = url.searchParams.get('schedule_id');

	try {
		// First, find the REOPS schedule if no ID provided
		let targetScheduleId = scheduleId;
		let scheduleName = '';

		if (!targetScheduleId) {
			const schedulesResponse = await fetch('https://api.incident.io/v2/schedules', {
				headers: {
					'Authorization': `Bearer ${apiKey}`,
					'Accept': 'application/json'
				}
			});
			
			if (schedulesResponse.ok) {
				const schedulesData = await schedulesResponse.json();
				const reopsSchedule = schedulesData.schedules?.find((schedule: any) => 
					schedule.name?.toLowerCase().includes('reops') || 
					schedule.name?.toLowerCase().includes('response')
				);
				
				if (reopsSchedule) {
					targetScheduleId = reopsSchedule.id;
					scheduleName = reopsSchedule.name;
				} else if (schedulesData.schedules?.[0]) {
					// Fall back to first schedule
					targetScheduleId = schedulesData.schedules[0].id;
					scheduleName = schedulesData.schedules[0].name;
				}
			}
		}

		if (!targetScheduleId) {
			return json({ error: 'No schedule ID available for on-call testing' }, { status: 400 });
		}

		// Get current time for on-call lookup
		const now = new Date().toISOString();

		// Fetch current on-call information
		const response = await fetch(`https://api.incident.io/v2/schedule_entries?schedule_id=${targetScheduleId}&at=${now}`, {
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
				error: 'Schedule entries API request failed',
				status: response.status,
				apiError: data,
				attempted_schedule_id: targetScheduleId
			}, { status: response.status });
		}

		// Analyze on-call response structure
		const scheduleEntries = Array.isArray(data.schedule_entries) ? data.schedule_entries : [];
		
		return json({
			success: true,
			schedule_id: targetScheduleId,
			schedule_name: scheduleName,
			lookup_time: now,
			api_endpoint: `/v2/schedule_entries?schedule_id=${targetScheduleId}&at=${now}`,
			raw_response: data, // Show the full response to debug structure
			response_structure: {
				root_keys: Object.keys(data),
				has_schedule_entries: !!data.schedule_entries,
				schedule_entries_type: typeof data.schedule_entries,
				schedule_entries_is_array: Array.isArray(data.schedule_entries),
				entries_count: scheduleEntries.length
			},
			current_oncall_analysis: scheduleEntries.map((entry: any) => ({
				id: entry.id,
				start_at: entry.start_at,
				end_at: entry.end_at,
				user_name: entry.user?.name,
				user_email: entry.user?.email,
				layer_name: entry.layer?.name,
				all_entry_fields: Object.keys(entry),
				user_fields: entry.user ? Object.keys(entry.user) : []
			})),
			full_oncall_data: data.schedule_entries || null,
			pagination: data.pagination || null
		});
	} catch (error) {
		return json({
			error: 'Failed to connect to schedule entries API',
			message: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};