import { writable } from 'svelte/store';
import type { DashboardData, NotificationSettings } from '$lib/types';

const initialDashboardData: DashboardData = {
	slack: {
		messages: [],
		last_updated: '',
		error: undefined
	},
	incidents: {
		incidents: [],
		summary: {
			total_open: 0,
			p1_count: 0,
			p2_count: 0,
			sla_breached: 0,
			by_product: []
		},
		last_updated: '',
		error: undefined
	},
	jira: {
		issues: [],
		summary: {
			total_open: 0,
			by_priority: [],
			by_assignee: []
		},
		last_updated: '',
		error: undefined
	},
	vacation: {
		availability: {
			total_team_members: 0,
			currently_off: 0,
			returning_today: [],
			leaving_today: [],
			off_this_week: []
		},
		last_updated: '',
		error: undefined
	}
};

const initialNotificationSettings: NotificationSettings = {
	enabled: true,
	p1_incidents: true,
	p2_incidents: true,
	sla_warnings: true,
	new_mentions: true
};

export const dashboardData = writable<DashboardData>(initialDashboardData);
export const notificationSettings = writable<NotificationSettings>(initialNotificationSettings);
export const isLoading = writable<boolean>(false);
export const lastRefresh = writable<Date>(new Date());