# Reqlens Web

Next.js frontend for Reqlens. It contains the public marketing page, auth screens, and the protected dashboard for projects, request logs, problem calls, statistics, settings, and alert configuration.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Better Auth client
- Recharts
- React Toastify
- React Icons

## Local Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Default web URL: `http://localhost:3000`

The API should be running at `http://localhost:3001`.

## Environment

```txt
NEXT_PUBLIC_REQLENS_API_URL=http://localhost:3001
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build production app |
| `npm run typecheck` | Typecheck without emitting files |
| `npm run start` | Start built production app |

## Main Pages

| Route | Purpose |
| --- | --- |
| `/` | Public landing page |
| `/login` | Login |
| `/signup` | Account creation |
| `/forgot-password` | Password reset request |
| `/reset-password` | Password reset form |
| `/accept-invite` | Project invite acceptance |
| `/dashboard` | Overview |
| `/dashboard/projects` | Project list |
| `/dashboard/projects/[projectId]` | Project details, alerts, API key, members, danger zone |
| `/dashboard/requests` | Paginated request logs |
| `/dashboard/errors` | Paginated problem calls |
| `/dashboard/statistics` | Traffic, status, method, route, and project statistics |
| `/dashboard/settings` | Account settings and default alert settings |

## Dashboard Highlights

- Recent requests across projects
- Problem call filtering by errors or latency alerts
- Server-side pagination for large log tables
- Project API key reveal/copy/regenerate controls
- Alert recipient and digest settings
- Statistics timeframe selection
- Recharts traffic and mix charts
- Account defaults for new projects

## Development Notes

- Dashboard routes require an authenticated Better Auth session.
- API requests use `credentials: "include"` for cookie auth.
- Public assets live in `public/images`.
- Shared UI components live in `components/ui`.
- Protected dashboard components live under `app/(protected)/dashboard`.
