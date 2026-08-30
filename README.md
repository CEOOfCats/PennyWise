# Pennywise (No more updates)

A full-stack expense tracker built to learn backend API design, authentication and containerized deployment using Docker. Built from scratch using FastAPI, PostgreSQL, and a vanilla JavaScript frontend. This will probably be abandoned

> ⚠️ **Status: the live deployment is now down.** Render's 30-day trial for the hosted PostgreSQL database has ended, so the backend API and therefore the live app and Swagger docs no longer respond. The code itself still works fine; see **Running Locally** below to run it on your own machine.

**Live app:** ~~https://pennywise-1-kinq.onrender.com~~ *(offline — Render trial expired)*

**API docs (Swagger):** ~~https://pennywise-jigf.onrender.com/docs~~ *(offline — Render trial expired)*

## Features

- Full CRUD on expenses (add, edit, delete, view)
- Dashboard with at-a-glance stats: total spending, total items, average cost per item, and number of categories
- Charts (Chart.js): spending-by-category doughnut chart and a 30-day spending trend line chart
- Widget on the dashboard for fast expense entry without opening the full form
- Recent expenses preview on the dashboard, linking through to the full list
- Dedicated Expenses page with:
  - Search by description or category
  - Filtering by category, price range and date range
  - Sorting by price, category, date or amount (ascending/descending)
  - Add/edit expenses via modal
  - Delete with confirmation
  - CSV export of the current filtered view
- Toast notifications for success/error/warning feedback
- Responsive layout with a collapsible sidebar and mobile header
- User accounts with JWT-based authentication
- Every user's data is fully isolated, enforced at the database query level, not just hidden in the UI
- Session handling via `sessionStorage`

## Tech Stack

**Backend:** FastAPI · SQLAlchemy (ORM) · PostgreSQL · Pydantic
**Authentication:** JWT (PyJWT) · Argon2 password hashing (pwdlib) · OAuth2 Password Flow
**Frontend:** HTML · CSS · vanilla JavaScript · Chart.js
**Infrastructure:** Docker · Docker Compose · deployed on Render

## Architecture

```
frontend/
  index.html          → login / registration page
  dashboard.html       → dashboard: stats, charts, quick add, recent expenses
  expenses.html        → full expense management: filters, sorting, CRUD, CSV export
  css/style.css        → shared styling
  js/
    api.js             → API request helpers, auth token storage
    auth.js            → login/register form logic
    common.js          → shared helpers (auth guard, toasts, formatting, sidebar toggle)
    dashboard.js        → dashboard page logic (stats, charts, quick add)
    expenses.js          → expenses page logic (filtering, sorting, CRUD, export)
main.py                → FastAPI app, routes
db_models.py           → SQLAlchemy ORM models (Users and Expenses)
schemas.py             → Pydantic request/response schemas
database.py            → DB engine/session setup
Dockerfile             → builds the API into a container
docker-compose.yaml    → API + PostgreSQL, together, for local development
```

## Running Locally

Since the hosted version is offline, this is currently the only way to use the app.

### Option A - Docker Compose (matches production setup)

1. Clone the repo:
   ```
   git clone https://github.com/CEOOfCats/PennyWise.git
   cd PennyWise
   ```
2. Copy `.env.example` to `.env` and fill in real values (generate a JWT secret as explained in `.env.example`).
3. Run:
   ```
   docker compose up --build
   ```
4. API available at `http://localhost:8000`, docs at `http://localhost:8000/docs`.
5. Open `frontend/index.html` directly in your browser (or use a tool like VS Code's Live Server).

### Option B - Manual setup (no Docker)

1. Create and activate a virtual environment:
   ```
   python -m venv .venv
   .venv\Scripts\activate      # Windows
   source .venv/bin/activate   # macOS/Linux
   ```
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Make sure PostgreSQL is running locally, and set up `.env` (see `.env.example`) with a `DATABASE_URL` pointing to it.
4. Run the API:
   ```
   uvicorn main:app --reload
   ```
5. Open `frontend/index.html` in your browser. If your frontend isn't served from `http://127.0.0.1:5500`, update the `origins` list in `main.py` to match (or requests will be blocked by CORS).

## Environment Variables

See `.env.example` for the full list. At minimum you need `DATABASE_URL` and `JWT_SECRET_KEY`.
`POSTGRES_USER`, `POSTGRES_PASSWORD` and `POSTGRES_DB` are only needed if using Docker Compose.

## Known Limitations

- **Live deployment is offline** — Render's free-tier database trial ended, and the app has not been redeployed
- No refresh tokens — sessions expire after 30 minutes and require a fresh login (an intentional simplification)
- No pagination on the expenses list
- Automated tests not yet written

## Roadmap

- [x] Full CRUD, filtering, sorting, stats
- [x] JWT authentication with per-user data isolation
- [x] Dockerized, deployed to Render
- [x] Data visualization for stats (charts instead of raw numbers)
- [x] Redesigned frontend — dashboard, dedicated expenses page, CSV export
- [ ] Redeploy backend (Render trial expired) or move to a different host (I doubt I'll continue this)
- [ ] Automated tests
- [ ] Refresh tokens
