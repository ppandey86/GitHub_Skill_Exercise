# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep route components focused on each capability and use the shared `src/api/client.ts` helper for every API request. Render explicit loading, empty, success, and accessible error states without moving data or business logic into components.
- Logic tier decision: Keep Express routes thin and place validation and data orchestration in explicit service functions in `src/services/octofitService.ts`. Return deliberate 4xx responses for invalid identifiers or missing records, and reserve 500 responses for unexpected server errors.
- Data tier decision: Encode required fields and references in Mongoose schemas in `src/models`, while keeping stable demo records and reconciliation in `src/scripts/seed.ts`.
- Activity tracking approach: Validate `userId`, `teamId`, `type`, and `minutes`; verify that both ObjectIds exist; create an activity with a valid minute-based points value and the current occurred-at timestamp; expose list and create behavior from dedicated services.
- Team management approach: Require `name` and `mascot` in Mongoose validation and service validation, default members to an empty array, and preserve submitted member ObjectIds when creating a team.
- Leaderboard approach: Aggregate activity `points` by team, sort totals from highest to lowest, attach the team name, and assign a 1-based rank to each entry.
- Workout suggestions approach: Find the seeded or created user by the decoded email address, match a workout to the user's fitness goal or recent activity focus, include a short reason, and return a deliberate 4xx when no user exists.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
  - Baseline: 1 passed, 4 failed.
  - Meaning: The seed test passes, but User, Team, Activity, and Workout Mongoose schemas do not yet enforce their required fields.
- API command: `npm run test:api --prefix octofit-tracker/backend`
  - Baseline: 4 failed.
  - Meaning: Activity and team creation are not implemented; leaderboard aggregation is empty; workout suggestions do not match a user's goal or recent activity and instead return an arbitrary workout.
- Frontend command: `npm test --prefix octofit-tracker/frontend`
  - Baseline: 15 failed.
  - Meaning: The capability components are placeholders and do not yet fetch or render API data, loading/empty/error states, or the user-specific workout request.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
  - Baseline: Passes.
  - Meaning: Existing TypeScript source compiles, but passing the build does not verify the incomplete runtime contracts.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
  - Baseline: Passes.
  - Meaning: Existing React/TypeScript source and Vite bundle compile, but passing the build does not verify the presentation contract.
