# Quest — a Gen Z savings app that feels like a game

A design/frontend prototype built for a **Swiggy design take-home challenge**: make saving money and hitting financial goals feel as rewarding and visually spectacular as leveling up in a video game.

**Stack:** Vite + React 19 + TypeScript + Tailwind v4 + Framer Motion.

## Run it

```bash
npm install
npm run dev -- --port 5190
```

Open `http://localhost:5190`.

## Try the core flow

1. Open **Rainy Day Fund** (already at 95%).
2. Tap **Stash & finish**.
3. Watch the Level-Up celebration fire.

## Screens

- **Dashboard** — total stashed, an XP bar to the next level, a Swiggy-native "you skipped N orders" insight, goal buckets, and a "saving squad" social loop with one-tap nudges.
- **Goal Details** — a progress ring, streak/rate/projected-finish stats, a vertical "quest path" that turns 25/50/75/100% milestones into a level map, a contribution ledger, and quick-stash actions (skip an order, round-ups, manual boost).
- **Level-Up** — the 100%-complete celebration: gradient bloom, rotating rays, confetti, a spring-scaled badge, count-up stats, and a level bar snapping up.

## The core idea: Skip-to-Save

Every contribution in the data model (`src/data.ts`) carries a **source** — `auto` (recurring autopay), `roundup` (spare change), `skip` (a skipped food order), or `boost` (manual top-up). The Swiggy-native hook is **Skip-to-Save**: skipping an order (or choosing to cook) diverts the cash you'd have spent straight into a goal — turning a habit Swiggy already tracks (Campus Streaks, EatRight streaks) into a savings mechanic.

Money isn't stored as a single balance — a goal's `saved` total is derived from the sum of its contributions, so streaks, savings rate, and projected finish dates are all computed, not hand-set.
