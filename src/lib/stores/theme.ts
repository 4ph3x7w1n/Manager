import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import type { Theme } from '$lib/types';

function createThemeStore() {
	const { subscribe, set, update } = writable<Theme>('system');

	return {
		subscribe,
		init: () => {
			if (!browser) return;
			
			const stored = localStorage.getItem('theme') as Theme;
			if (stored && ['light', 'dark', 'system'].includes(stored)) {
				set(stored);
				applyTheme(stored);
			} else {
				set('system');
				applyTheme('system');
			}
		},
		setTheme: (theme: Theme) => {
			if (!browser) return;
			
			set(theme);
			localStorage.setItem('theme', theme);
			applyTheme(theme);
		},
		toggle: () => {
			update(current => {
				const newTheme = current === 'light' ? 'dark' : 'light';
				if (browser) {
					localStorage.setItem('theme', newTheme);
					applyTheme(newTheme);
				}
				return newTheme;
			});
		}
	};
}

function applyTheme(theme: Theme) {
	if (!browser) return;
	
	const root = document.documentElement;
	
	if (theme === 'system') {
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
	} else {
		root.setAttribute('data-theme', theme);
	}
}

export const theme = createThemeStore();

// Listen for system theme changes
if (browser) {
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
		theme.subscribe(currentTheme => {
			if (currentTheme === 'system') {
				applyTheme('system');
			}
		})();
	});
}