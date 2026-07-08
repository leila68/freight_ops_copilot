# Freight Ops Copilot

An AI-powered freight quoting and operations platform built for logistics companies. Staff manage lanes, equipment types, accessorials, and documents. Customers request instant freight quotes with live price breakdowns. An AI Copilot answers natural-language questions over both structured data (quotes, lanes, rates) and uploaded documents (policies, contracts) using LangGraph agents and RAG with pgvector.

---

## Tech Stack

**Backend**
- Python 3.12 + FastAPI
- PostgreSQL 16 + pgvector extension
- SQLAlchemy 2.0 (ORM) + Alembic (migrations)
- LangChain + LangGraph (AI agent orchestration)
- OpenAI `text-embedding-3-small` (document embeddings)
- Anthropic Claude (LLM for the Copilot)
- PyMuPDF (PDF text extraction)
- JWT authentication (python-jose + passlib/bcrypt)

**Frontend**
- React 18 + TypeScript + Vite
- Tailwind CSS
- React Router v6
- Axios

**Infrastructure**
- Docker + Docker Compose (Postgres + backend containerized)
- Vercel (frontend deployment)

---

## Project Structure

```
freight-ops-copilot/
├── backend/                        # Python FastAPI backend
│   ├── app/
│   │   ├── api/                    # Route modules
│   │   │   ├── auth.py             # Signup, login, /me
│   │   │   ├── freight.py          # Equipment types, accessorials, lanes
│   │   │   ├── quotes.py           # Quote preview, book, list
│   │   │   └── documents.py        # Document upload, list, delete
│   │   ├── core/
│   │   │   ├── config.py           # Settings loaded from environment
│   │   │   └── security.py         # Password hashing + JWT utilities
│   │   ├── db/
│   │   │   ├── session.py          # SQLAlchemy engine + session
│   │   │   └── models.py           # ORM models for all tables
│   │   ├── schemas/
│   │   │   ├── auth.py             # Pydantic schemas for auth
│   │   │   ├── freight.py          # Schemas for lanes, equipment, accessorials
│   │   │   ├── quotes.py           # Schemas for quote calculation
│   │   │   └── documents.py        # Schemas for document management
│   │   ├── services/
│   │   │   └── embeddings.py       # PDF extraction, chunking, OpenAI embeddings
│   │   ├── ai/                     # LangGraph agent (coming soon)
│   │   └── main.py                 # FastAPI app entrypoint
│   ├── alembic/                    # Database migrations
│   │   └── versions/
│   │       ├── 001_baseline.py
│   │       ├── 002_add_core_tables.py
│   │       ├── 003_add_settings_table.py
│   │       ├── 004_add_fuel_surcharge_percent.py
│   │       └── 005_add_documents_tables.py
│   ├── db/
│   │   └── init/
│   │       └── 001_init.sql        # Creates users table + pgvector extension on first run
│   ├── scripts/
│   │   └── seed_lanes.py           # Seeds all Canadian city-pair lanes
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/                       # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts           # Axios instance + JWT interceptor
│   │   │   ├── auth.ts             # Auth API calls
│   │   │   └── freight.ts          # Quotes, lanes, equipment, accessorials API
│   │   ├── components/
│   │   │   ├── ui/                 # Base UI components (Button, Input, Card, etc.)
│   │   │   ├── AppHeader.tsx       # Navigation header with role-based nav
│   │   │   ├── AppLayout.tsx       # Page layout wrapper
│   │   │   ├── PageHeader.tsx      # Page title + description + actions
│   │   │   ├── QuoteTable.tsx      # Reusable quote list with filters
│   │   │   └── ResourceManager.tsx # Generic CRUD table + modal (used by staff pages)
│   │   ├── context/
│   │   │   └── AuthContext.tsx     # Auth state, login/signup/logout
│   │   ├── data/
│   │   │   └── canadianCities.ts   # Canadian cities list + distance lookup table
│   │   ├── hooks/
│   │   │   └── useAsync.ts         # Data fetching hook with loading/error/refetch
│   │   ├── lib/
│   │   │   ├── format.ts           # Currency, number, date formatters
│   │   │   └── utils.ts            # cn() classname utility
│   │   ├── pages/
│   │   │   ├── AuthPage.tsx        # Login + signup page
│   │   │   ├── customer/
│   │   │   │   ├── CustomerDashboard.tsx   # Live quote form + history
│   │   │   │   ├── QuoteForm.tsx           # Shipment details form
│   │   │   │   └── QuoteBreakdownCard.tsx  # Live price breakdown + book button
│   │   │   └── staff/
│   │   │       ├── StaffQuotes.tsx         # All quotes across customers
│   │   │       ├── ManageLanes.tsx         # Lane CRUD with city search + auto-rate
│   │   │       ├── ManageEquipment.tsx     # Equipment type CRUD
│   │   │       ├── ManageAccessorials.tsx  # Accessorial CRUD
│   │   │       └── ManageDocuments.tsx     # PDF upload + embedding management
│   │   ├── types/
│   │   │   └── index.ts            # All shared TypeScript types
│   │   ├── App.tsx                 # Routes + role-based protected routing
│   │   └── main.tsx
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.example
│
├── docker-compose.yml              # Postgres (pgvector) + backend
├── .env.example
├── .gitignore
└── README.md
```

---

## Database Schema

| Table | Description |
|-------|-------------|
| `users` | Staff and customer accounts with role-based access |
| `lanes` | Origin-destination pairs with base rates and distances |
| `equipment_types` | Equipment categories (dry van, reefer, flatbed) with rate multipliers |
| `accessorials` | Optional service charges (liftgate, appointment, etc.) |
| `quotes` | Customer quote requests with full rate breakdown stored as JSON |
| `quote_accessorials` | Junction table — which accessorials were applied to each quote |
| `settings` | Key-value operational settings (e.g. fuel surcharge percentage) |
| `documents` | Uploaded PDF metadata |
| `document_chunks` | Semantic chunks of each document with pgvector embeddings |

---

## Getting Started

### Prerequisites
- Docker Desktop
- Node.js 18+
- An OpenAI API key (for document embeddings)
- An Anthropic API key (for the AI Copilot)

### 1. Clone the repository

```bash
git clone https://github.com/leila68/freight_ops_copilot.git
cd freight-ops-copilot
```

### 2. Configure environment variables

Copy the example env files and fill in your values:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Key variables to set in `backend/.env`:

```
POSTGRES_USER=freight_user
POSTGRES_PASSWORD=freight_pass
POSTGRES_DB=freight_ops
JWT_SECRET_KEY=your-long-random-secret
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
```

Key variables to set in `frontend/.env.local`:

```
VITE_API_URL=http://localhost:8000
```

### 3. Start the backend + database

```bash
docker compose up --build -d
```

This starts:
- PostgreSQL 16 with pgvector on port `5433`
- FastAPI backend on port `8000`

The `users` table and pgvector extension are created automatically on first run.

### 4. Run database migrations

```bash
docker compose exec backend alembic upgrade head
```

### 5. Seed lanes data

```bash
docker compose exec backend python scripts/seed_lanes.py
```

This inserts 60+ Canadian city-pair lanes with auto-calculated base rates.

### 6. Create a staff account

```bash
curl -s -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"staff@yourcompany.com","password":"yourpassword","full_name":"Your Name","role":"staff"}'
```

### 7. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` — log in with the staff account you just created.

---

## Key Features

### Staff dashboard
- Manage lanes with searchable Canadian city dropdowns and auto-calculated rates based on distance
- Manage equipment types with rate multipliers (dry van, reefer, flatbed)
- Manage accessorial charges (flat fee or percentage-based)
- Upload PDF documents (policies, contracts) — auto-chunked and embedded for AI Q&A
- View all customer quotes across the platform
- Settings: update fuel surcharge percentage (applied to all new quotes)

### Customer dashboard
- Live quote calculator — price breakdown updates in real time as fields are filled
- Searchable city dropdowns showing only cities with configured lanes
- Equipment type and accessorial selection
- Preview quote before booking — no DB save until confirmed
- Full quote history with filtering by status, date, and lane

### AI Copilot (in progress)
- Natural-language questions over structured data (quotes, lanes, rates) via SQL tools
- Document Q&A via RAG — semantic search over uploaded PDFs using pgvector
- LangGraph agent routes between SQL tools and RAG tool automatically
- Role-aware — customer queries scoped to their own data, staff see everything

---

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/signup` | Create account |
| POST | `/auth/login` | Login, returns JWT |
| GET | `/auth/me` | Get current user |

### Freight (auth required)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/equipment-types` | List equipment types |
| POST | `/equipment-types` | Create (staff only) |
| PUT | `/equipment-types/{id}` | Update (staff only) |
| DELETE | `/equipment-types/{id}` | Soft delete (staff only) |
| GET | `/accessorials` | List accessorials |
| POST | `/accessorials` | Create (staff only) |
| PUT | `/accessorials/{id}` | Update (staff only) |
| DELETE | `/accessorials/{id}` | Soft delete (staff only) |
| GET | `/lanes` | List lanes |
| POST | `/lanes` | Create (staff only) |
| PUT | `/lanes/{id}` | Update (staff only) |
| DELETE | `/lanes/{id}` | Soft delete (staff only) |

### Quotes (auth required)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/quotes/preview` | Calculate breakdown, not saved |
| POST | `/quotes/book` | Calculate + save to DB |
| GET | `/quotes` | List quotes (scoped by role) |

### Documents (staff only)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/documents` | List all documents |
| POST | `/documents` | Upload PDF (multipart/form-data) |
| DELETE | `/documents/{id}` | Delete document + chunks |

### Health
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | API liveness check |
| GET | `/health/db` | Database connectivity check |

---

## Rate Calculation Logic

```
final_rate = base_rate
           × equipment_multiplier        (e.g. ×1.3 for reefer)
           + weight_adjustment           ($0.10 per 100 lbs over 10,000 lbs)
           + fuel_surcharge              (configurable %, applied to base rate)
           + accessorials                (flat fee or % of base per item)
```

Base rates are calculated from distance: `base_rate = distance_km × $0.96/km`, with optional staff adjustment per lane.

---

## Deployment

**Frontend** → Vercel (connect GitHub repo, set `VITE_API_URL` to your backend URL)

**Backend + Database** → Docker-compatible hosts:
- [Railway](https://railway.app) — recommended, supports Docker Compose + Postgres with pgvector
- [Render](https://render.com) — Docker support, free Postgres for 90 days
- [Fly.io](https://fly.io) — generous free tier, native Docker container support

---

## Development Notes

- The backend runs with `--reload` inside Docker, so code changes on your Mac hot-reload the server automatically (volume mounted at `./backend:/app`)
- `alembic upgrade head` must be run after pulling new migrations
- The `fuel_surcharge_percent` in the `settings` table defaults to `8.00` — update via the staff Settings page
- Document embeddings are processed as a background task after upload — the chunk count updates once processing completes
- pgvector's IVFFlat index on `document_chunks.embedding` uses `lists = 10` — increase this as your document count grows (rule of thumb: `sqrt(row_count)`)