## Cook To-Do Planner

AI-powered Cooking To-Do Planner that generates a one-day plan (breakfast, lunch, dinner) with a grocery list, substitutions, budget breakdown, and an interactive cooking checklist.

### Features

- One-day plan: breakfast, lunch, dinner (name, description, time, cost, ingredients, steps)
- Grocery list split into `available` vs `buy`
- Smart substitutions (only when appropriate)
- Budget breakdown (total, budget, remaining)
- Interactive cooking checklist
- Strict JSON validation and user-friendly errors

### Tech Stack

- Next.js (App Router) + TypeScript
- TailwindCSS
- Next.js Route Handlers (`app/api/...`)
- OpenAI API (server-side)

## Getting Started

### 1) Install

```bash
npm install
```

### 2) Configure environment variables

Create a `.env.local` file:

```bash
cp .env.example .env.local
```

Set:

- `OPENAI_API_KEY`
- (optional) `OPENAI_MODEL` (defaults to `gpt-4.1-mini`)

### 3) Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Scripts

```bash
npm run lint
npm run type-check
npm run build
```

### Folder Structure

- `app/` UI + API routes
- `components/` UI components
- `services/` server-side AI logic
- `types/` Zod schemas and types
- `utils/` sanitization helpers

### Deployment (Vercel)

- Add `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`) in Vercel Project Settings → Environment Variables.
- Deploy and verify the `/api/plan` route works in production.

### Notes

- The AI response is required to be valid JSON and is validated with Zod before rendering.
- If the plan exceeds the user budget, the server retries once with a more economical prompt.
