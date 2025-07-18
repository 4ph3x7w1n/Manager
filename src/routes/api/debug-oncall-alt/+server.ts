import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ platform }) => {
	const env = platform?.env || {};
	const apiKey = env.INCIDENT_IO_API_KEY || '';

	if (!apiKey) {
		return json({ error: 'No API key configured' }, { status: 400 });
	}

	try {
		// Try different approaches to get on-call information
		const results: any = {};

		// 1. Try to get all schedules first
		try {
			const schedulesResponse = await fetch('https://api.incident.io/v2/schedules', {
				headers: {
					'Authorization': `Bearer ${apiKey}`,
					'Accept': 'application/json'
				}
			});
			
			if (schedulesResponse.ok) {
				const schedulesData = await schedulesResponse.json();
				results.schedules = {
					success: true,
					count: schedulesData.schedules?.length || 0,
					schedules: schedulesData.schedules?.map((s: any) => ({
						id: s.id,
						name: s.name,
						timezone: s.timezone
					})) || []
				};

				// Find REOPS schedule
				const reopsSchedule = schedulesData.schedules?.find((schedule: any) => 
					schedule.name?.toLowerCase().includes('reops') || 
					schedule.name?.toLowerCase().includes('response')
				);

				if (reopsSchedule) {
					results.reops_schedule = reopsSchedule;

					// 2. Try different endpoints for on-call data
					const now = new Date().toISOString();
					
					// Try schedule_entries
					try {
						const entriesResponse = await fetch(`https://api.incident.io/v2/schedule_entries?schedule_id=${reopsSchedule.id}`, {
							headers: {
								'Authorization': `Bearer ${apiKey}`,
								'Accept': 'application/json'
							}
						});
						
						if (entriesResponse.ok) {
							const entriesData = await entriesResponse.json();
							results.schedule_entries_attempt = {
								success: true,
								raw_response: entriesData,
								structure: {
									root_keys: Object.keys(entriesData),
									entries_type: typeof entriesData.schedule_entries,
									entries_is_array: Array.isArray(entriesData.schedule_entries)
								}
							};
						} else {
							results.schedule_entries_attempt = {
								success: false,
								status: entriesResponse.status,
								error: await entriesResponse.text()
							};
						}
					} catch (e) {
						results.schedule_entries_attempt = {
							success: false,
							error: e instanceof Error ? e.message : 'Unknown error'
						};
					}

					// Try on_call endpoint if it exists
					try {
						const onCallResponse = await fetch(`https://api.incident.io/v2/on_call?schedule_id=${reopsSchedule.id}`, {
							headers: {
								'Authorization': `Bearer ${apiKey}`,
								'Accept': 'application/json'
							}
						});
						
						if (onCallResponse.ok) {
							const onCallData = await onCallResponse.json();
							results.on_call_attempt = {
								success: true,
								raw_response: onCallData
							};
						} else {
							results.on_call_attempt = {
								success: false,
								status: onCallResponse.status,
								error: await onCallResponse.text()
							};
						}
					} catch (e) {
						results.on_call_attempt = {
							success: false,
							error: e instanceof Error ? e.message : 'Unknown error'
						};
					}
				}
			} else {
				results.schedules = {
					success: false,
					status: schedulesResponse.status,
					error: await schedulesResponse.text()
				};
			}
		} catch (e) {
			results.schedules = {
				success: false,
				error: e instanceof Error ? e.message : 'Unknown error'
			};
		}

		return json({
			success: true,
			message: 'Alternative on-call debugging results',
			results
		});

	} catch (error) {
		return json({
			error: 'Failed to debug on-call APIs',
			message: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};