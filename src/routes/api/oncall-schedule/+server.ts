import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ platform }) => {
	const env = platform?.env || {};
	const apiKey = env.INCIDENT_IO_API_KEY || '';

	if (!apiKey) {
		return json({ error: 'No API key configured' }, { status: 400 });
	}

	try {
		// First, get all schedules to find REOPS Response
		const schedulesResponse = await fetch('https://api.incident.io/v2/schedules', {
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Accept': 'application/json'
			}
		});

		if (!schedulesResponse.ok) {
			const errorText = await schedulesResponse.text();
			return json({
				error: 'Failed to fetch schedules',
				status: schedulesResponse.status,
				details: errorText
			}, { status: schedulesResponse.status });
		}

		const schedulesData = await schedulesResponse.json();
		const schedules = schedulesData.schedules || [];

		// Find REOPS Response schedule
		const reopsSchedule = schedules.find((schedule: any) => 
			schedule.name?.toLowerCase().includes('reops') || 
			schedule.name?.toLowerCase().includes('response')
		);

		if (!reopsSchedule) {
			return json({
				error: 'REOPS Response schedule not found',
				available_schedules: schedules.map((s: any) => ({
					id: s.id,
					name: s.name,
					timezone: s.timezone
				}))
			}, { status: 404 });
		}

		// Get current on-call information for REOPS schedule
		const now = new Date().toISOString();
		const entriesResponse = await fetch(
			`https://api.incident.io/v2/schedule_entries?schedule_id=${reopsSchedule.id}&at=${now}`,
			{
				headers: {
					'Authorization': `Bearer ${apiKey}`,
					'Accept': 'application/json'
				}
			}
		);

		let currentOnCall: any[] = [];
		let upcomingShifts: any[] = [];

		if (entriesResponse.ok) {
			const entriesData = await entriesResponse.json();
			const scheduleEntries = entriesData.schedule_entries || [];

			// Process current on-call
			currentOnCall = scheduleEntries
				.filter((entry: any) => {
					const startTime = new Date(entry.start_at).getTime();
					const endTime = new Date(entry.end_at).getTime();
					const currentTime = new Date().getTime();
					return startTime <= currentTime && currentTime <= endTime;
				})
				.map((entry: any) => ({
					id: entry.id,
					user: {
						name: entry.user?.name || 'Unknown',
						email: entry.user?.email,
						id: entry.user?.id
					},
					layer: entry.layer?.name || 'Default',
					start_at: entry.start_at,
					end_at: entry.end_at,
					duration_hours: Math.round((new Date(entry.end_at).getTime() - new Date(entry.start_at).getTime()) / (1000 * 60 * 60))
				}));

			// Get upcoming shifts (next 7 days)
			const nextWeek = new Date();
			nextWeek.setDate(nextWeek.getDate() + 7);
			
			upcomingShifts = scheduleEntries
				.filter((entry: any) => {
					const startTime = new Date(entry.start_at).getTime();
					const currentTime = new Date().getTime();
					const nextWeekTime = nextWeek.getTime();
					return startTime > currentTime && startTime <= nextWeekTime;
				})
				.map((entry: any) => ({
					id: entry.id,
					user: {
						name: entry.user?.name || 'Unknown',
						email: entry.user?.email,
						id: entry.user?.id
					},
					layer: entry.layer?.name || 'Default',
					start_at: entry.start_at,
					end_at: entry.end_at,
					starts_in_hours: Math.round((new Date(entry.start_at).getTime() - new Date().getTime()) / (1000 * 60 * 60)),
					duration_hours: Math.round((new Date(entry.end_at).getTime() - new Date(entry.start_at).getTime()) / (1000 * 60 * 60))
				}))
				.sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
				.slice(0, 10); // Limit to next 10 shifts
		}

		// Get schedule layers for additional info
		const layers = reopsSchedule.layers?.map((layer: any) => ({
			id: layer.id,
			name: layer.name,
			users_count: layer.users?.length || 0
		})) || [];

		return json({
			success: true,
			schedule: {
				id: reopsSchedule.id,
				name: reopsSchedule.name,
				timezone: reopsSchedule.timezone,
				layers: layers
			},
			current_oncall: currentOnCall,
			upcoming_shifts: upcomingShifts,
			summary: {
				currently_oncall_count: currentOnCall.length,
				unique_oncall_users: [...new Set(currentOnCall.map(oc => oc.user.name))],
				next_shift_starts_in_hours: upcomingShifts.length > 0 
					? upcomingShifts[0].starts_in_hours 
					: null,
				total_upcoming_shifts: upcomingShifts.length
			},
			metadata: {
				lookup_time: now,
				api_endpoint: `/v2/schedule_entries?schedule_id=${reopsSchedule.id}&at=${now}`,
				timezone: reopsSchedule.timezone || 'UTC'
			}
		});

	} catch (error) {
		return json({
			error: 'Failed to fetch on-call schedule data',
			message: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};