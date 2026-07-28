# Pennywise

A full-stack expense tracker built to learn backend API design, authentication, and containerized deployment using docker. Built from scratch (no starter templates) using FastAPI, PostgreSQL, and a vanilla JavaScript frontend.

**Live app:** https://pennywise-1-kinq.onrender.com
**API docs (Swagger):** https://pennywise-jigf.onrender.com/docs

> Note: the backend is hosted on Render's free tier, which means it spins down after a period of inactivity. The first request after idling may take upto a minute to respond while the server wakes up.

## Features

- Full CRUD on expenses (add, edit, delete, view)
- Filtering by category, price range, and date range
- Sorting by price, category, date, or amount
- Aggregate stats: total spending, expense count, spending by category, spending by date range
- User accounts with JWT-based authentication
- Every user's data is fully isolated — enforced at the database query level, not just hidden in the UI
- Password visibility toggle, logout, and session handling via `sessionStorage`

## Tech Stack

**Backend:** FastAPI · SQLAlchemy (ORM) · PostgreSQL · Pydantic
**Authentication:** JWT (PyJWT) · Argon2 password hashing (pwdlib) · OAuth2 Password Flow
**Frontend:** HTML · CSS · vanilla JavaScript
**Infrastructure:** Docker · Docker Compose · deployed on Render

## Architecture

```
frontend/              → static HTML/CSS/JS, deployed as a Render Static Site
main.py                → FastAPI app, routes
db_models.py           → SQLAlchemy ORM models (Users and Expenses)
schemas.py             → Pydantic request/response schemas
database.py            → DB engine/session setup
Dockerfile             → builds the API into a container
docker-compose.yaml    → API + PostgreSQL, together, for local development
```

## Running Locally

### Option A — Docker Compose (matches production setup)

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

### Option B — Manual setup (no Docker)

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
5. Open `frontend/index.html` in your browser. If your frontend isn't served from `http://127.0.0.1:5500`, update the `origins` list in `main.py` to match (or requests will be blocked by CORS)

## Environment Variables

See `.env.example` for the full list. At minimum you need `DATABASE_URL` and `JWT_SECRET_KEY`.
`POSTGRES_USER`, `POSTGRES_PASSWORD` and `POSTGRES_DB` are only needed if using Docker Compose.

## Known Limitations

- No refresh tokens — sessions expire after 30 minutes and require a fresh login (an intentional simplification)
- No pagination on the expenses list
- Free-tier hosting means occasional cold starts

## Roadmap

- [x] Full CRUD, filtering, sorting, stats
- [x] JWT authentication with per-user data isolation
- [x] Dockerized, deployed to Render
- [ ] Data visualization for stats (charts instead of raw numbers)
- [ ] Automated tests
- [ ] Refresh tokens