# Finance Dashboard

A finance tracking full-stack portfolio project with:

- React Native frontend (Expo)
- Node + Express backend
- SQLite database for transaction storage

## Structure

- `frontend/` — mobile app UI, charts, transaction entry
- `backend/` — API server, SQLite persistence, monthly expense summary

## Getting started

### Backend

1. `cd backend`
2. `npm install`
3. `npm run dev`

### Frontend

1. `cd frontend`
2. `npm install`
3. `npx expo start`

## Running on Physical Device with Expo Go

1. Ensure your computer and phone are on the same Wi-Fi network.
2. Find your computer's local IP address (e.g., `192.168.1.100`):
   - Linux: `ip addr show` or `hostname -I`
   - Replace `YOUR_LOCAL_IP` in `frontend/App.js` with your IP.
3. Start the backend: `cd backend && npm run dev`
4. Start the frontend: `cd frontend && npx expo start`
5. Scan the QR code with Expo Go on your Android device.

## Features to build next

- add authentication
- category filters and tags
- recurring payments
- monthly budget targets
- export transactions to CSV

## Branching and commit guidance

Use branches for anything larger than a small bug fix or documentation change.

- `main` — stable baseline
- `feature/<name>` — new features, screens, charts, or flows
- `fix/<name>` — bug fixes and cleanup
- `chore/<name>` — non-user-facing maintenance, dependency updates, formatting

Commit style:

- `feat:` for new functionality
- `fix:` for bug fixes
- `chore:` for project maintenance
- `docs:` for README or documentation updates

Recommended workflow:

1. Create a feature branch: `git checkout -b feature/add-chart-summary`
2. Make focused commits with clear messages
3. Push the branch: `git push -u origin feature/add-chart-summary`
4. Merge back to `main` after verifying functionality

