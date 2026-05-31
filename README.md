# Finance Dashboard

A personal finance tracker for Android. Log income and expenses, visualise spending by category, and track your monthly balance — all from your phone.

**Stack:** React Native (Expo SDK 54) · Node.js + Express · PostgreSQL  
**Deployed:** Backend on Render · Database on Neon · App updates via Expo EAS

---

## Features

- Add and delete transactions (income or expense) with confirmation prompts
- User-defined categories with a bottom-sheet picker — create and delete categories in-app
- Native Android date picker
- Dashboard with large net balance hero, income/expense stats, and monthly bar chart
- Spending by category — toggle between proportional bar view and a donut chart
- Filter transactions by category (pill dropdown), type, and date range
- Transactions grouped by date with WealthSimple-style activity layout
- Bottom tab navigation (Dashboard · Transactions · Add Transaction)
- Full dark theme throughout
- OTA updates — new JS ships to the phone without reinstalling the APK

---

## Project structure

```
finance-dashboard/
├── backend/
│   ├── scripts/
│   │   └── seed.js          Sample data for local/dev use
│   └── src/
│       ├── db/              PostgreSQL connection and table init
│       └── routes/          transactions.js · categories.js
└── frontend/
    ├── screens/
    │   ├── DashboardScreen.js
    │   ├── TransactionsScreen.js
    │   └── AddTransactionScreen.js
    ├── App.js               Navigator shell (SafeAreaProvider + bottom tabs)
    └── config.js            API base URL (dev/prod switch via __DEV__)
```

---

## Running locally

### Backend

```bash
cd backend
cp .env.example .env    # add your DATABASE_URL (get a free DB at neon.tech)
npm install
npm run dev             # starts on port 4000
```

Seed sample data (optional):

```bash
npm run seed            # inserts 9 categories + 22 sample transactions
```

### Frontend

```bash
cd frontend
npm install
npx expo start
```

Update `localBase` in `frontend/config.js` to your machine's local IP when testing on a physical device.

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

The app downloads the new JS bundle on next launch and applies it on the following open.

### First-time APK build

```bash
cd frontend
eas build --platform android --profile preview
```

---

## API reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/transactions` | All transactions — filter via `?category=`, `?type=`, `?from=`, `?to=` |
| `POST` | `/api/transactions` | Create a transaction |
| `DELETE` | `/api/transactions/:id` | Delete a transaction |
| `GET` | `/api/transactions/summary/monthly` | Income vs expenses grouped by month |
| `GET` | `/api/transactions/summary/categories` | Expense totals grouped by category |
| `GET` | `/api/categories` | All user-defined categories |
| `POST` | `/api/categories` | Create a category |
| `DELETE` | `/api/categories/:id` | Delete a category |

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
