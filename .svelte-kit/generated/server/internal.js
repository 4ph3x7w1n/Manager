
import root from '../root.svelte';
import { set_building, set_prerendering } from '__sveltekit/environment';
import { set_assets } from '__sveltekit/paths';
import { set_manifest, set_read_implementation } from '__sveltekit/server';
import { set_private_env, set_public_env, set_safe_public_env } from '../../../node_modules/@sveltejs/kit/src/runtime/shared-server.js';

export const options = {
	app_template_contains_nonce: false,
	csp: {"mode":"auto","directives":{"upgrade-insecure-requests":false,"block-all-mixed-content":false},"reportOnly":{"upgrade-insecure-requests":false,"block-all-mixed-content":false}},
	csrf_check_origin: true,
	embedded: false,
	env_public_prefix: 'PUBLIC_',
	env_private_prefix: '',
	hash_routing: false,
	hooks: null, // added lazily, via `get_hooks`
	preload_strategy: "modulepreload",
	root,
	service_worker: false,
	templates: {
		app: ({ head, body, assets, nonce, env }) => "<!doctype html>\n<html lang=\"en\" data-theme=\"system\">\n\t<head>\n\t\t<meta charset=\"utf-8\" />\n\t\t<link rel=\"icon\" href=\"" + assets + "/favicon.png\" />\n\t\t<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n\t\t<meta name=\"description\" content=\"Incident Management Console for team leaders with Slack, Incident.io, Jira, and vacation tracker integrations\" />\n\t\t<meta name=\"keywords\" content=\"incident management, dashboard, slack integration, jira, incident.io, vacation tracker\" />\n\t\t<meta name=\"author\" content=\"Incident Management Team\" />\n\t\t\n\t\t<!-- Open Graph / Facebook -->\n\t\t<meta property=\"og:type\" content=\"website\" />\n\t\t<meta property=\"og:url\" content=\"" + (env["PUBLIC_SITE_URL"] ?? "") + "\" />\n\t\t<meta property=\"og:title\" content=\"Incident Management Console\" />\n\t\t<meta property=\"og:description\" content=\"Comprehensive dashboard for incident management team leaders\" />\n\t\t<meta property=\"og:image\" content=\"" + assets + "/og-image.png\" />\n\n\t\t<!-- Twitter -->\n\t\t<meta property=\"twitter:card\" content=\"summary_large_image\" />\n\t\t<meta property=\"twitter:url\" content=\"" + (env["PUBLIC_SITE_URL"] ?? "") + "\" />\n\t\t<meta property=\"twitter:title\" content=\"Incident Management Console\" />\n\t\t<meta property=\"twitter:description\" content=\"Comprehensive dashboard for incident management team leaders\" />\n\t\t<meta property=\"twitter:image\" content=\"" + assets + "/twitter-image.png\" />\n\n\t\t<!-- Theme and appearance -->\n\t\t<meta name=\"theme-color\" content=\"#1a1a1a\" />\n\t\t<meta name=\"color-scheme\" content=\"light dark\" />\n\t\t\n\t\t<!-- Preload critical fonts -->\n\t\t<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\" />\n\t\t<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin />\n\t\t\n\t\t<!-- Security headers -->\n\t\t<meta http-equiv=\"X-Content-Type-Options\" content=\"nosniff\" />\n\t\t<meta http-equiv=\"X-XSS-Protection\" content=\"1; mode=block\" />\n\t\t\n\t\t" + head + "\n\t</head>\n\t<body data-sveltekit-preload-data=\"hover\" class=\"bg-background text-foreground\">\n\t\t<div style=\"display: contents\">" + body + "</div>\n\t\t\n\t\t<script>\n\t\t\t// Theme initialization to prevent flash\n\t\t\t(function() {\n\t\t\t\tconst theme = localStorage.getItem('theme') || \n\t\t\t\t\t(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');\n\t\t\t\tdocument.documentElement.setAttribute('data-theme', theme);\n\t\t\t})();\n\t\t</script>\n\t</body>\n</html>",
		error: ({ status, message }) => "<!doctype html>\n<html lang=\"en\">\n\t<head>\n\t\t<meta charset=\"utf-8\" />\n\t\t<title>" + message + "</title>\n\n\t\t<style>\n\t\t\tbody {\n\t\t\t\t--bg: white;\n\t\t\t\t--fg: #222;\n\t\t\t\t--divider: #ccc;\n\t\t\t\tbackground: var(--bg);\n\t\t\t\tcolor: var(--fg);\n\t\t\t\tfont-family:\n\t\t\t\t\tsystem-ui,\n\t\t\t\t\t-apple-system,\n\t\t\t\t\tBlinkMacSystemFont,\n\t\t\t\t\t'Segoe UI',\n\t\t\t\t\tRoboto,\n\t\t\t\t\tOxygen,\n\t\t\t\t\tUbuntu,\n\t\t\t\t\tCantarell,\n\t\t\t\t\t'Open Sans',\n\t\t\t\t\t'Helvetica Neue',\n\t\t\t\t\tsans-serif;\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t\tjustify-content: center;\n\t\t\t\theight: 100vh;\n\t\t\t\tmargin: 0;\n\t\t\t}\n\n\t\t\t.error {\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t\tmax-width: 32rem;\n\t\t\t\tmargin: 0 1rem;\n\t\t\t}\n\n\t\t\t.status {\n\t\t\t\tfont-weight: 200;\n\t\t\t\tfont-size: 3rem;\n\t\t\t\tline-height: 1;\n\t\t\t\tposition: relative;\n\t\t\t\ttop: -0.05rem;\n\t\t\t}\n\n\t\t\t.message {\n\t\t\t\tborder-left: 1px solid var(--divider);\n\t\t\t\tpadding: 0 0 0 1rem;\n\t\t\t\tmargin: 0 0 0 1rem;\n\t\t\t\tmin-height: 2.5rem;\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t}\n\n\t\t\t.message h1 {\n\t\t\t\tfont-weight: 400;\n\t\t\t\tfont-size: 1em;\n\t\t\t\tmargin: 0;\n\t\t\t}\n\n\t\t\t@media (prefers-color-scheme: dark) {\n\t\t\t\tbody {\n\t\t\t\t\t--bg: #222;\n\t\t\t\t\t--fg: #ddd;\n\t\t\t\t\t--divider: #666;\n\t\t\t\t}\n\t\t\t}\n\t\t</style>\n\t</head>\n\t<body>\n\t\t<div class=\"error\">\n\t\t\t<span class=\"status\">" + status + "</span>\n\t\t\t<div class=\"message\">\n\t\t\t\t<h1>" + message + "</h1>\n\t\t\t</div>\n\t\t</div>\n\t</body>\n</html>\n"
	},
	version_hash: "1vglnr2"
};

export async function get_hooks() {
	let handle;
	let handleFetch;
	let handleError;
	let init;
	

	let reroute;
	let transport;
	

	return {
		handle,
		handleFetch,
		handleError,
		init,
		reroute,
		transport
	};
}

export { set_assets, set_building, set_manifest, set_prerendering, set_private_env, set_public_env, set_read_implementation, set_safe_public_env };
