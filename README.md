# Incident Management Console

A comprehensive dashboard for incident management team leaders with integrations for Slack, Incident.io, Jira, and vacation tracking.

## Features

- **Slack Integration**: View @mentions and team tags
- **Incident.io Integration**: Monitor P1/P2 incidents with SLA timers
- **Jira Integration**: Track open project tickets with customizable JQL queries
- **Vacation Tracker**: See team availability and vacation schedules
- **Real-time Notifications**: Browser notifications for urgent incidents
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Theme**: System preference detection with manual toggle
- **Accessibility**: WCAG compliant with keyboard navigation

## Tech Stack

- **Framework**: SvelteKit with TypeScript
- **Deployment**: Cloudflare Workers
- **Styling**: Custom CSS with CSS Grid and Flexbox
- **State Management**: Svelte stores

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Cloudflare Workers account (for deployment)
- API access to your integrations:
  - Slack Bot Token
  - Incident.io API Key
  - Jira API Token
  - Vacation Tracker API Key

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd incident-management-console
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `wrangler.toml`:
   ```toml
   [vars]
   SLACK_BOT_TOKEN = "your-slack-token"
   INCIDENT_IO_API_KEY = "your-incident-io-key"
   JIRA_API_TOKEN = "your-jira-token"
   VACATION_TRACKER_API_KEY = "your-vacation-tracker-key"
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

### Deployment

1. Configure Cloudflare Workers:
   ```bash
   npm run cf-typegen
   ```

2. Deploy to Cloudflare Workers:
   ```bash
   npm run deploy
   ```

## Configuration

### Slack Integration

1. Create a Slack Bot in your workspace
2. Add the bot token to your environment variables
3. Grant necessary permissions:
   - `channels:read`
   - `users:read`
   - `chat:write`

### Incident.io Integration

1. Generate an API key from your Incident.io organization
2. Add the API key and organization name to environment variables

### Jira Integration

1. Create a Jira API token
2. Configure your Jira base URL and credentials
3. Customize the JQL query to filter relevant tickets

### Vacation Tracker Integration

1. Get API access to vacationtracker.com
2. Add your API key and team ID to environment variables

## Development

### Project Structure

```
src/
├── lib/
│   ├── components/     # Svelte components
│   ├── stores/         # State management
│   ├── types/          # TypeScript interfaces
│   └── utils/          # Utility functions
├── routes/             # SvelteKit pages
└── app.css            # Global styles
```

### Adding New Integrations

1. Define TypeScript interfaces in `src/lib/types/`
2. Implement API client methods in `src/lib/utils/api.ts`
3. Create UI components in `src/lib/components/`
4. Add to dashboard in `src/routes/+page.svelte`

### Customizing Styles

- Modify CSS custom properties in `src/app.css`
- Component-specific styles are scoped within each `.svelte` file
- Theme colors are defined as CSS custom properties

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Security

- All API tokens are stored as environment variables
- No sensitive data is logged or exposed to the client
- CORS headers are properly configured
- Content Security Policy headers are set

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For questions or issues:
1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information