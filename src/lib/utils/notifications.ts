import type { Incident, NotificationSettings } from '$lib/types';
import { browser } from '$app/environment';

class NotificationManager {
	private permission: NotificationPermission = 'default';
	private settings: NotificationSettings = {
		enabled: true,
		p1_incidents: true,
		p2_incidents: true,
		sla_warnings: true,
		new_mentions: true
	};

	constructor() {
		if (browser && 'Notification' in window) {
			this.permission = Notification.permission;
		}
	}

	async requestPermission(): Promise<boolean> {
		if (!browser || !('Notification' in window)) {
			console.warn('Notifications not supported in this environment');
			return false;
		}

		if (this.permission === 'granted') {
			return true;
		}

		if (this.permission === 'denied') {
			return false;
		}

		try {
			this.permission = await Notification.requestPermission();
			return this.permission === 'granted';
		} catch (error) {
			console.error('Error requesting notification permission:', error);
			return false;
		}
	}

	updateSettings(newSettings: Partial<NotificationSettings>): void {
		this.settings = { ...this.settings, ...newSettings };
		
		// Save to localStorage
		if (browser) {
			localStorage.setItem('notification-settings', JSON.stringify(this.settings));
		}
	}

	loadSettings(): NotificationSettings {
		if (browser) {
			const saved = localStorage.getItem('notification-settings');
			if (saved) {
				try {
					this.settings = { ...this.settings, ...JSON.parse(saved) };
				} catch (error) {
					console.error('Error loading notification settings:', error);
				}
			}
		}
		return this.settings;
	}

	private async showNotification(
		title: string, 
		options: NotificationOptions & { onClick?: () => void } = {}
	): Promise<void> {
		if (!this.settings.enabled || this.permission !== 'granted') {
			return;
		}

		try {
			const { onClick, ...notificationOptions } = options;
			
			const notification = new Notification(title, {
				icon: '/favicon.png',
				badge: '/favicon.png',
				requireInteraction: false,
				...notificationOptions,
			});

			if (onClick) {
				notification.onclick = () => {
					onClick();
					notification.close();
				};
			}

			// Auto-close after 5 seconds
			setTimeout(() => {
				notification.close();
			}, 5000);

		} catch (error) {
			console.error('Error showing notification:', error);
		}
	}

	async notifyNewIncident(incident: Incident): Promise<void> {
		const shouldNotify = this.settings.enabled && (
			(incident.severity === 'p1' && this.settings.p1_incidents) ||
			(incident.severity === 'p2' && this.settings.p2_incidents)
		);

		if (!shouldNotify) return;

		const severity = incident.severity.toUpperCase();
		const title = `🚨 New ${severity} Incident`;
		const body = incident.title;

		await this.showNotification(title, {
			body,
			tag: `incident-${incident.id}`,
			icon: incident.severity === 'p1' ? '🔴' : '🟡',
			onClick: () => {
				if (incident.url) {
					window.open(incident.url, '_blank');
				}
			}
		});
	}

	async notifySLAWarning(incident: Incident): Promise<void> {
		if (!this.settings.enabled || !this.settings.sla_warnings) {
			return;
		}

		if (!incident.sla_timer || incident.sla_timer.remaining_seconds > 1800) {
			return; // Only notify if less than 30 minutes remaining
		}

		const remainingMinutes = Math.floor(incident.sla_timer.remaining_seconds / 60);
		const title = `⏰ SLA Warning`;
		const body = `${incident.title} - ${remainingMinutes} minutes remaining`;

		await this.showNotification(title, {
			body,
			tag: `sla-warning-${incident.id}`,
			icon: '⚠️',
			requireInteraction: true,
			onClick: () => {
				if (incident.url) {
					window.open(incident.url, '_blank');
				}
			}
		});
	}

	async notifySLABreach(incident: Incident): Promise<void> {
		if (!this.settings.enabled || !this.settings.sla_warnings) {
			return;
		}

		if (!incident.sla_timer?.breached) {
			return;
		}

		const title = `🔥 SLA BREACHED`;
		const body = `${incident.title} has breached its SLA`;

		await this.showNotification(title, {
			body,
			tag: `sla-breach-${incident.id}`,
			icon: '🔥',
			requireInteraction: true,
			onClick: () => {
				if (incident.url) {
					window.open(incident.url, '_blank');
				}
			}
		});
	}

	async notifyNewMention(channelName: string, message: string, permalink?: string): Promise<void> {
		if (!this.settings.enabled || !this.settings.new_mentions) {
			return;
		}

		const title = `💬 New Mention in #${channelName}`;
		const body = message.length > 100 ? message.substring(0, 100) + '...' : message;

		await this.showNotification(title, {
			body,
			tag: `mention-${channelName}`,
			icon: '💬',
			onClick: () => {
				if (permalink) {
					window.open(permalink, '_blank');
				}
			}
		});
	}

	async notifyTeamStatusChange(type: 'returning' | 'leaving', names: string[]): Promise<void> {
		if (!this.settings.enabled || names.length === 0) {
			return;
		}

		const icon = type === 'returning' ? '🎉' : '👋';
		const action = type === 'returning' ? 'returning' : 'starting vacation';
		const title = `${icon} Team Update`;
		const body = names.length === 1 
			? `${names[0]} is ${action} today`
			: `${names.length} team members are ${action} today`;

		await this.showNotification(title, {
			body,
			tag: `team-status-${type}`,
			icon,
		});
	}

	getSettings(): NotificationSettings {
		return { ...this.settings };
	}

	isSupported(): boolean {
		return browser && 'Notification' in window;
	}

	getPermission(): NotificationPermission {
		return this.permission;
	}
}

// Export singleton instance
export const notificationManager = new NotificationManager();

// Auto-load settings on initialization
if (browser) {
	notificationManager.loadSettings();
}