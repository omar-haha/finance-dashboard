# Finance Dashboard

A personal finance tracker for Android. Log income and expenses, visualise spending by category, and track monthly balance — all from your phone.

**Stack:** React Native (Expo) · Node.js + Express · PostgreSQL  
**Deployed:** Backend on Render · Database on Neon · App updates via Expo EAS

---

## Features

- Add and delete transactions (income or expense)
- Native date picker
- Monthly income vs expense bar chart
- Net balance tracking
- Spending breakdown by category with proportional bars
- Filter transactions by category, type, and date range
- Bottom tab navigation (Dashboard · Transactions · Add)
- OTA updates — new code ships to the phone without reinstalling

---

## Project structure

```
finance-dashboard/
├── backend/          Node.js + Express REST API
│   └── src/
│       ├── db/       PostgreSQL connection pool
│       └── routes/   Transaction endpoints
└── frontend/         React Native app (Expo SDK 54)
    └── screens/      DashboardScreen, TransactionsScreen, AddTransactionScreen
```

---

## Running locally

### Backend

```bash
cd backend
cp .env.example .env          # fill in your DATABASE_URL
npm install
npm run dev                   # starts on port 4000
```

Requires a PostgreSQL database. Get one free at [neon.tech](https://neon.tech).

### Frontend

```bash
cd frontend
npm install
npx expo start
```

Update `local` in `frontend/config.js` to your machine's local IP if testing on a physical device.

---

## Deployment

| Service | Purpose | Cost |
|---|---|---|
| [Neon](https://neon.tech) | PostgreSQL database | Free |
| [Render](https://render.com) | Express backend | Free tier |
| [Expo EAS](https://expo.dev/eas) | Android APK + OTA updates | Free tier |

### Pushing an update to the phone

```bash
cd frontend
eas update --branch main --message "describe what changed"
```

The app picks up the new JS bundle automatically on next launch.

---

## API endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/transactions` | All transactions — filter by `?category=`, `?type=`, `?from=`, `?to=` |
| `POST` | `/api/transactions` | Create a transaction |
| `DELETE` | `/api/transactions/:id` | Delete a transaction |
| `GET` | `/api/transactions/summary/monthly` | Income vs expenses grouped by month |
| `GET` | `/api/transactions/summary/categories` | Expense totals grouped by category |

---

## Git workflow

| Branch prefix | Used for |
|---|---|
| `feature/` | New screens, charts, or user-facing functionality |
| `fix/` | Bug fixes |
| `chore/` | Dependencies, config, non-user-facing maintenance |
| `docs/` | README and documentation only |

Commit style: `feat:` · `fix:` · `chore:` · `docs:`

---

## Planned features

- Monthly budget limits per category with progress tracking
- CSV export
