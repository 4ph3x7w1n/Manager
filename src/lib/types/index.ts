// Slack API Types
export interface SlackMessage {
	id: string;
	text: string;
	user: string;
	username?: string;
	channel: string;
	channel_name?: string;
	timestamp: string;
	permalink?: string;
	mentions: string[];
	thread_ts?: string;
}

export interface SlackChannel {
	id: string;
	name: string;
	is_private: boolean;
}

// Incident.io API Types
export interface IncidentTimings {
	time_to_detect_seconds?: number;
	time_to_acknowledge_seconds?: number;
	time_to_resolve_seconds?: number;
	time_to_mitigate_seconds?: number;
}

export interface IncidentUpdate {
	id: string;
	message: string;
	timestamp: string;
	author: {
		name: string;
		email?: string;
	};
}

export interface Incident {
	id: string;
	reference?: string;
	title: string;
	summary?: string;
	status: 'open' | 'closed' | 'resolved' | 'declined' | 'live' | 'active';
	severity: 'p1' | 'p2' | 'p3' | 'p4';
	created_at: string;
	updated_at: string;
	closed_at?: string;
	duration_seconds?: number;
	timings?: IncidentTimings;
	sla_timer?: {
		duration_seconds: number;
		remaining_seconds: number;
		breached: boolean;
	};
	lead?: {
		id: string;
		name: string;
		email: string;
	};
	assignee?: {
		id: string;
		name: string;
		email: string;
	};
	product?: {
		id: string;
		name: string;
	};
	postmortem_url?: string;
	url: string;
	updates?: IncidentUpdate[];
}

export interface IncidentSummary {
	total_open: number;
	p1_count: number;
	p2_count: number;
	sla_breached: number;
	uptime_percentage: number;
	average_time_to_mitigate_minutes: number;
	by_product: Array<{
		product: string;
		count: number;
	}>;
}

// Jira API Types
export interface JiraIssue {
	id: string;
	key: string;
	summary: string;
	status: {
		name: string;
		category: string;
	};
	priority: {
		name: string;
		id: string;
	};
	assignee?: {
		displayName: string;
		emailAddress: string;
		accountId: string;
	};
	updated: string;
	created: string;
	project: {
		key: string;
		name: string;
	};
	url: string;
}

export interface JiraSummary {
	total_open: number;
	by_priority: Array<{
		priority: string;
		count: number;
	}>;
	by_assignee: Array<{
		assignee: string;
		count: number;
	}>;
}

// Vacation Tracker Types
export interface VacationEntry {
	id: string;
	employee_name: string;
	employee_email: string;
	start_date: string;
	end_date: string;
	type: 'vacation' | 'sick' | 'personal' | 'holiday';
	status: 'approved' | 'pending' | 'denied';
	days_count: number;
}

export interface TeamAvailability {
	total_team_members: number;
	currently_off: number;
	returning_today: string[];
	leaving_today: string[];
	off_this_week: VacationEntry[];
}

// Dashboard State Types
export interface DashboardData {
	slack: {
		messages: SlackMessage[];
		last_updated: string;
		error?: string;
	};
	incidents: {
		incidents: Incident[];
		summary: IncidentSummary;
		last_updated: string;
		error?: string;
	};
	jira: {
		issues: JiraIssue[];
		summary: JiraSummary;
		last_updated: string;
		error?: string;
	};
	vacation: {
		availability: TeamAvailability;
		last_updated: string;
		error?: string;
	};
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system';

// Notification Types
export interface NotificationSettings {
	enabled: boolean;
	p1_incidents: boolean;
	p2_incidents: boolean;
	sla_warnings: boolean;
	new_mentions: boolean;
}

// API Response Types
export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
	timestamp: string;
}

// Configuration Types
export interface IntegrationConfig {
	slack: {
		enabled: boolean;
		bot_token?: string;
		channels?: string[];
		user_id?: string;
	};
	incident_io: {
		enabled: boolean;
		api_key?: string;
		organization?: string;
	};
	jira: {
		enabled: boolean;
		base_url?: string;
		username?: string;
		api_token?: string;
		jql_query?: string;
	};
	vacation_tracker: {
		enabled: boolean;
		api_key?: string;
		team_id?: string;
	};
}