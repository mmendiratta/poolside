# PoolSide

Private prediction pools for any occasion. Create an event, share a link, make picks, settle scores.

---

## Setup

### 1. Clone & install

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free project
2. In your project dashboard, go to **SQL Editor**
3. Paste and run the contents of `supabase/migrations/001_initial_schema.sql`

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role secret key |
| `MANAGER_SECRET` | Any random 32+ character string |

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

```bash
npx vercel
```

Add the same environment variables in Vercel → Project Settings → Environment Variables.

---

## Project Structure

```
src/
  app/
    page.tsx              # Landing page
    create/page.tsx       # Create event flow
    e/[slug]/page.tsx     # Event page (participant + manager view)
    api/
      events/route.ts     # POST - create event
      participants/route.ts # POST - join event
      picks/route.ts      # POST - submit pick
      resolve/route.ts    # POST - resolve pool (manager only)
  components/
    Countdown.tsx         # Live countdown timer
  lib/
    supabase.ts           # Supabase clients
    database.types.ts     # TypeScript types
    utils.ts              # Helpers, session management
```

---

## How it works

- **Event creator** gets a manager token stored in their browser's localStorage
- **Participants** join with just a name — session stored in localStorage
- **Picks** lock automatically when `closes_at` is reached
- **Resolution** is manual — manager marks the winning option, leaderboard updates
- **No money** handled in-app — use Venmo/Splitwise to settle with winners

---

## Roadmap ideas (post-MVP)

- Real-time leaderboard updates via Supabase Realtime subscriptions
- Numeric pool scoring (closest wins, partial points)
- Event templates (wedding, baby shower, etc.)
- Manager can edit/add pools after creation
- Optional email notifications when pools resolve
- Payment integration (Venmo deep links for winner payouts)
