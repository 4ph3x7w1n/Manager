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
		// Fetch incidents from Incident.io API
		const response = await fetch('https://api.incident.io/v1/incidents?per_page=10', {
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
				error: 'API request failed',
				status: response.status,
				apiError: data
			}, { status: response.status });
		}

		// Get the first incident for detailed analysis
		const firstIncident = data.incidents?.[0];

		return json({
			success: true,
			organization,
			total_incidents: data.incidents?.length || 0,
			response_structure: {
				root_keys: Object.keys(data),
				has_incidents_array: !!data.incidents,
				has_pagination: !!data.pagination
			},
			first_incident_analysis: firstIncident ? {
				id: firstIncident.id,
				name: firstIncident.name,
				reference: firstIncident.reference,
				summary_type: typeof firstIncident.summary,
				summary_preview: firstIncident.summary ? firstIncident.summary.substring(0, 200) + '...' : null,
				status: firstIncident.status,
				severity: {
					name: firstIncident.severity?.name,
					rank: firstIncident.severity?.rank,
					full_object: firstIncident.severity
				},
				timestamps: {
					count: firstIncident.timestamps?.length || 0,
					timestamp_names: firstIncident.timestamps?.map((ts: any) => ({
						name: ts.name,
						has_last_occurred_at: !!ts.last_occurred_at,
						last_occurred_at: ts.last_occurred_at
					})) || []
				},
				incident_role_assignments: {
					count: firstIncident.incident_role_assignments?.length || 0,
					roles: firstIncident.incident_role_assignments?.map((role: any) => ({
						role_name: role.role?.name,
						role_type: role.role?.role_type,
						assignee_name: role.assignee?.name,
						assignee_email: role.assignee?.email
					})) || []
				},
				custom_field_entries: {
					count: firstIncident.custom_field_entries?.length || 0,
					fields: firstIncident.custom_field_entries?.map((field: any) => ({
						field_name: field.custom_field?.name,
						field_type: field.custom_field?.field_type,
						values_count: field.values?.length || 0,
						sample_value: field.values?.[0]
					})) || []
				},
				all_root_fields: Object.keys(firstIncident)
			} : null,
			full_first_incident: firstIncident,
			sample_incidents: data.incidents?.slice(0, 3).map((inc: any) => ({
				id: inc.id,
				name: inc.name,
				status: inc.status,
				severity: inc.severity?.name,
				created_at: inc.created_at,
				has_summary: !!inc.summary,
				summary_length: inc.summary?.length || 0,
				timestamps_with_data: inc.timestamps?.filter((ts: any) => ts.last_occurred_at).length || 0,
				total_timestamps: inc.timestamps?.length || 0
			})) || []
		});
	} catch (error) {
		return json({
			error: 'Failed to connect to Incident.io',
			message: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};