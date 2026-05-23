# BriefSync

BriefSync turns meeting transcripts into execution artifacts:

- structured action items
- escalation queue for uncertain items
- Notion task creation
- Slack DM delivery

## Quick Start

1. Install dependencies

```bash
npm install
```

1. Create environment file

```bash
cp .env.local.example .env.local
```

1. Start the app

```bash
npm run dev
```

Open <http://localhost:3000>.

## Routes

- `/` main processing UI
- `/settings` team directory input and env checklist
- `/history` in-session run history

## API Endpoints

- `POST /api/process` preprocess + extract + confidence routing
- `POST /api/execute` execute approved items to Notion/Slack
- `POST /api/settings/directory` upload team member CSV
- `GET /api/runs` list in-memory runs
- `POST /api/slack/webhook` handles Slack interactive callbacks

## Notes

- If `GEMINI_API_KEY` is absent, extraction uses a deterministic heuristic fallback.
- Without Notion/Slack env vars, processing still works and execution returns clear config errors.
- Sample test transcripts are in `docs/samples`.
