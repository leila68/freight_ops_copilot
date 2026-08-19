# Freight Ops Copilot

An AI-powered freight quoting and operations platform built for logistics companies.

Freight Ops Copilot provides role-based workflows for **staff and customers**. Staff can manage freight lanes, equipment types, accessorial charges, operational settings, and uploaded documents. Customers can request freight quotes, review price breakdowns, and view quote history.

The platform also includes an **AI Freight Operations Copilot** that uses LangGraph, LangChain, OpenAI embeddings, PostgreSQL/pgvector, SQL tools, and RAG to answer natural-language questions over both structured freight data and uploaded documents.

---

# Tech Stack

## Backend

- Python 3.12
- FastAPI
- Uvicorn
- SQLAlchemy 2.0
- Alembic
- PostgreSQL
- pgvector
- Pydantic / Pydantic Settings
- JWT authentication
- `python-jose`
- Passlib / bcrypt
- LangChain
- LangGraph
- OpenAI API
- PyMuPDF
- Axios-compatible REST API consumed by the frontend

## Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- Lucide React

## AI

- LangChain
- LangGraph
- OpenAI API
- OpenAI `text-embedding-3-small`
- OpenAI `gpt-4.1-mini`
- RAG
- pgvector
- SQL tools
- Document semantic search

## Infrastructure

### Local development

- Docker
- Docker Compose
- PostgreSQL + pgvector
- FastAPI
- Vite

### Production

- **Supabase** — PostgreSQL database + pgvector
- **Render** — FastAPI backend
- **Vercel** — React/Vite frontend
- **GitHub** — source control and deployment trigger

---

# Architecture

```text
                    ┌──────────────────────────┐
                    │        User Browser      │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │        Vercel            │
                    │ React + TypeScript + Vite│
                    └────────────┬─────────────┘
                                 │
                         HTTPS REST API
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │         Render           │
                    │   FastAPI + Uvicorn      │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
          ┌──────────────────┐      ┌──────────────────┐
          │    Supabase      │      │    OpenAI API    │
          │ PostgreSQL       │      │ LLM + Embeddings │
          │ + pgvector       │      └──────────────────┘
          └──────────────────┘
```

---

# Project Structure

```text
freight-ops-copilot/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py
│   │   │   ├── freight.py
│   │   │   ├── quotes.py
│   │   │   ├── documents.py
│   │   │   └── chat.py
│   │   │
│   │   ├── ai/
│   │   │   ├── agent.py
│   │   │   └── ...
│   │   │
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   │
│   │   ├── db/
│   │   │   ├── session.py
│   │   │   └── models.py
│   │   │
│   │   ├── schemas/
│   │   │   ├── auth.py
│   │   │   ├── freight.py
│   │   │   ├── quotes.py
│   │   │   ├── documents.py
│   │   │   └── chat.py
│   │   │
│   │   ├── services/
│   │   │   └── embeddings.py
│   │   │
│   │   └── main.py
│   │
│   ├── alembic/
│   │   ├── versions/
│   │   │   ├── 001_baseline.py
│   │   │   ├── 002_add_core_tables.py
│   │   │   ├── 003_add_settings_table.py
│   │   │   ├── 004_add_fuel_surcharge_percent.py
│   │   │   ├── 005_add_documents_tables.py
│   │   │   └── 006_add_chat_tables.py
│   │   └── env.py
│   │
│   ├── scripts/
│   │   └── seed_lanes.py
│   │
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   ├── auth.ts
│   │   │   ├── freight.ts
│   │   │   └── ...
│   │   │
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── AppHeader.tsx
│   │   │   ├── AppLayout.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   ├── QuoteTable.tsx
│   │   │   └── ResourceManager.tsx
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   │
│   │   ├── data/
│   │   │   └── canadianCities.ts
│   │   │
│   │   ├── hooks/
│   │   │   └── useAsync.ts
│   │   │
│   │   ├── lib/
│   │   │   ├── format.ts
│   │   │   └── utils.ts
│   │   │
│   │   ├── pages/
│   │   │   ├── AuthPage.tsx
│   │   │   ├── customer/
│   │   │   └── staff/
│   │   │
│   │   ├── types/
│   │   │   └── index.ts
│   │   │
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.example
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

# Database

The project originally used a local PostgreSQL database running through Docker.

The production database was later migrated to **Supabase PostgreSQL**.

Supabase is now the production database used by the Render backend.

## Database tables

| Table | Purpose |
|---|---|
| `users` | Customer and staff accounts |
| `lanes` | Origin/destination freight lanes |
| `equipment_types` | Equipment types and rate multipliers |
| `accessorials` | Additional freight charges |
| `quotes` | Customer quote requests and calculated rates |
| `quote_accessorials` | Quote/accessorial relationship |
| `settings` | Operational configuration such as fuel surcharge |
| `documents` | Uploaded document metadata |
| `document_chunks` | Document chunks and vector embeddings |
| Chat tables | AI Copilot conversation/session data |

---

# PostgreSQL and pgvector

The application uses PostgreSQL as its primary relational database.

The `pgvector` extension is used for semantic document search.

The document pipeline is approximately:

```text
PDF Upload
    ↓
PyMuPDF
    ↓
Text Extraction
    ↓
Text Chunking
    ↓
OpenAI Embeddings
    ↓
text-embedding-3-small
    ↓
pgvector
    ↓
Semantic Search
    ↓
RAG
    ↓
LangGraph Agent
    ↓
LLM Response
```

---

# Environment Variables

There are environment variables at different levels of the project.

The important rule is:

> Never commit real secrets or API keys to GitHub.

Use `.env.example` files as templates.

---

# Backend Environment Variables

The backend reads environment variables using Pydantic Settings.

The main configuration is located at:

```text
backend/app/core/config.py
```

The backend supports both:

1. Local PostgreSQL configuration
2. Production `DATABASE_URL`

The production configuration uses `DATABASE_URL`.

## Backend `.env`

```env
DATABASE_URL=

POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=
POSTGRES_HOST=localhost
POSTGRES_PORT=5433

JWT_SECRET_KEY=
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

OPENAI_API_KEY=
OPENAI_LLM_MODEL=gpt-4.1-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

CHAT_MAX_HISTORY_MESSAGES=20
```

---

# Local Database Configuration

For local Docker development, PostgreSQL is exposed on port `5433` on the host.

Example:

```env
POSTGRES_USER=freight_user
POSTGRES_PASSWORD=freight_pass
POSTGRES_DB=freight_ops
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
```

The backend can construct the database URL from these values when `DATABASE_URL` is not provided.

Example:

```env
DATABASE_URL=
```

In this case the application uses:

```text
postgresql+psycopg2://USER:PASSWORD@HOST:PORT/DATABASE
```

---

# Production Database Configuration

Production uses Supabase PostgreSQL.

The Render backend should use the Supabase connection string as:

```env
DATABASE_URL=<SUPABASE_POSTGRES_CONNECTION_STRING>
```

The individual `POSTGRES_*` variables are not required when `DATABASE_URL` is provided.

The application prioritizes:

```text
DATABASE_URL
```

over the individual PostgreSQL settings.

---

# JWT Configuration

JWT is used for authentication.

```env
JWT_SECRET_KEY=<long-random-secret>
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440
```

`JWT_SECRET_KEY` must be different between development and production.

Never commit the production JWT secret.

---

# OpenAI Configuration

The AI functionality uses OpenAI.

```env
OPENAI_API_KEY=<your-openai-api-key>
OPENAI_LLM_MODEL=gpt-4.1-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

The embedding model is used for document embeddings.

The LLM model is used by the AI Copilot.

---

# Frontend Environment Variables

The frontend uses Vite environment variables.

The main API client is:

```text
frontend/src/api/client.ts
```

The API base URL is configured using:

```env
VITE_API_URL=
```

The TypeScript environment declaration is located in the frontend and defines:

```ts
interface ImportMetaEnv {
  readonly VITE_API_URL: string
}
```

---

# Local Frontend Environment

For local development:

```env
VITE_API_URL=http://localhost:8000
```

The frontend then sends API requests to the local FastAPI server.

---

# Production Frontend Environment

The Vercel frontend uses the deployed Render backend:

```env
VITE_API_URL=https://freight-ops-copilot.onrender.com
```

This variable is configured in the Vercel project settings.

Only frontend-safe variables such as `VITE_API_URL` should be exposed to the frontend.

Never put:

```text
OPENAI_API_KEY
JWT_SECRET_KEY
DATABASE_URL
POSTGRES_PASSWORD
```

in Vercel frontend environment variables.

---

# Local Development

## Prerequisites

Install:

- Docker Desktop
- Node.js 18+
- npm
- Git
- OpenAI API key

---

# 1. Clone Repository

```bash
git clone https://github.com/leila68/freight_ops_copilot.git
cd freight_ops_copilot
```

---

# 2. Configure Backend

Create:

```text
backend/.env
```

Example:

```env
DATABASE_URL=

POSTGRES_USER=freight_user
POSTGRES_PASSWORD=freight_pass
POSTGRES_DB=freight_ops
POSTGRES_HOST=localhost
POSTGRES_PORT=5433

JWT_SECRET_KEY=your-local-secret
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

OPENAI_API_KEY=your-openai-key
OPENAI_LLM_MODEL=gpt-4.1-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

CHAT_MAX_HISTORY_MESSAGES=20
```

---

# 3. Start Docker Services

From the project root:

```bash
docker compose up --build -d
```

This starts the local PostgreSQL/pgvector database and backend environment.

Typical ports:

```text
PostgreSQL → localhost:5433
FastAPI    → localhost:8000
```

---

# 4. Run Alembic Migrations

Run:

```bash
docker compose exec backend alembic upgrade head
```

This applies all database migrations.

After adding a new migration in the future, run:

```bash
docker compose exec backend alembic upgrade head
```

---

# 5. Seed Freight Lanes

The project includes a lane seed script containing Canadian city pairs.

Run:

```bash
docker compose exec backend python scripts/seed_lanes.py
```

The script:

- Inserts Canadian city-pair lanes
- Calculates base rates
- Uses `$0.96/km`
- Calculates transit days
- Skips lanes that already exist

The basic rate calculation is:

```text
base_rate = distance_km × 0.96
```

---

# 6. Seed Equipment Types

The `equipment_types` table should contain the equipment types required by the quote engine.

Example seed data:

```text
Dry Van
Reefer
Flatbed
```

Example multipliers:

```text
dry_van  → 1.00
reefer   → 1.30
flatbed  → 1.15
```

Equipment can also be managed through the staff interface.

---

# 7. Start Frontend

From the frontend directory:

```bash
cd frontend
npm install
npm run dev
```

The Vite development server normally runs at:

```text
http://localhost:5173
```

---

# Authentication

The application uses JWT authentication.

## Signup

```http
POST /auth/signup
```

Example:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "Test User",
  "role": "customer",
  "company_name": "Test Company"
}
```

A successful signup:

1. Creates the user in PostgreSQL
2. Hashes the password
3. Creates a JWT
4. Returns the access token

Example response:

```json
{
  "access_token": "JWT_TOKEN",
  "token_type": "bearer"
}
```

---

# Password Hashing

Passwords are never stored as plain text.

The backend hashes passwords before saving them to the database.

The project uses Passlib/bcrypt.

Important:

bcrypt has a maximum password input size of 72 bytes.

Therefore the application should validate passwords appropriately before passing them to bcrypt.

---

# Frontend JWT Flow

The frontend keeps the authentication token in memory.

The Axios client:

1. Stores the JWT token
2. Adds the token to authenticated requests
3. Sends:

```http
Authorization: Bearer <token>
```

4. Handles HTTP `401` responses
5. Clears the token
6. Notifies the authentication context

The implementation is located in:

```text
frontend/src/api/client.ts
```

---

# Role-Based Access

The application currently supports:

```text
customer
staff
```

Customers are redirected to:

```text
/customer
```

Staff users are redirected to:

```text
/staff
```

Backend endpoints also enforce role-based permissions.

---

# Staff Features

Staff users can:

- Manage freight lanes
- Manage equipment types
- Manage accessorials
- Manage operational settings
- Upload PDF documents
- Delete documents
- View customer quotes
- Manage freight configuration

---

# Customer Features

Customers can:

- Select origin and destination
- Select equipment
- Enter shipment information
- Select accessorials
- Preview a quote
- Book a quote
- View quote history

---

# Quote Calculation

The quote engine calculates the final freight price using multiple components.

Conceptually:

```text
final_rate =
    base_rate
    × equipment_multiplier
    + weight_adjustment
    + fuel_surcharge
    + accessorials
```

---

# Base Rate

Base rate is initially calculated from the lane distance.

```text
base_rate = distance_km × 0.96
```

Example:

```text
Distance = 500 km

Base rate =
500 × 0.96

= $480
```

Staff can adjust lane configuration when required.

---

# Equipment Multipliers

Example equipment configuration:

| Equipment | Multiplier |
|---|---:|
| Dry Van | 1.00 |
| Reefer | 1.30 |
| Flatbed | 1.15 |

Example:

```text
Base rate = $500
Equipment = Reefer
Multiplier = 1.30

Equipment-adjusted rate = $650
```

---

# Weight Adjustment

The quote engine can apply a weight surcharge for shipments over the configured threshold.

Example logic:

```text
$0.10 per 100 lbs
over 10,000 lbs
```

---

# Fuel Surcharge

Fuel surcharge is stored in the `settings` table.

The default value is:

```text
8.00%
```

The staff settings page can update this value.

---

# Accessorials

Accessorial charges can be represented as:

- Flat fees
- Percentage-based charges

Examples:

```text
Liftgate
Appointment
Inside Delivery
Residential Delivery
```

Accessorials selected for a quote are stored through:

```text
quote_accessorials
```

---

# Document Processing and RAG

The application supports PDF document uploads.

Typical documents include:

- Freight policies
- Contracts
- Operational documents
- Pricing policies
- Customer agreements

The processing flow is:

```text
PDF
 ↓
PyMuPDF
 ↓
Extract text
 ↓
Chunk text
 ↓
Generate embeddings
 ↓
OpenAI text-embedding-3-small
 ↓
Store vectors in pgvector
```

When the user asks a question:

```text
User Question
      ↓
Embedding
      ↓
pgvector similarity search
      ↓
Relevant document chunks
      ↓
LLM
      ↓
Answer
```

This is the RAG component of the project.

---

# AI Freight Operations Copilot

The AI Copilot is implemented using LangGraph.

The high-level workflow is:

```text
START
  ↓
Agent
  ↓
Tool Selection
  ↓
Tools
  ↓
Agent
  ↓
END
```

The agent can determine whether a question should be answered using:

- Structured SQL data
- Freight-related tools
- Document RAG
- Other available backend tools

---

# Structured Data Questions

The AI Copilot can use SQL-based tools to work with structured data.

For example:

```text
"What was the average quote rate from Toronto to Montreal?"
```

The agent can use a database tool to retrieve the relevant data rather than relying only on the LLM's internal knowledge.

---

# Document Questions

For document-related questions, the agent can use RAG.

Example:

```text
"What is our policy for liftgate charges?"
```

The system can:

1. Search document embeddings
2. Retrieve relevant chunks
3. Provide those chunks to the LLM
4. Generate an answer based on the retrieved information

---

# LangGraph Agent

The agent uses LangGraph to orchestrate the workflow.

Conceptually:

```text
START
  ↓
agent
  ↓
tools
  ↓
agent
  ↓
END
```

The agent node communicates with the LLM and determines whether a tool is required.

The tools node executes the selected backend tools.

---

# API Endpoints

## Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/signup` | Create account |
| POST | `/auth/login` | Login and receive JWT |
| GET | `/auth/me` | Return authenticated user |

---

# Freight

| Method | Endpoint | Description |
|---|---|---|
| GET | `/equipment-types` | List equipment |
| POST | `/equipment-types` | Create equipment |
| PUT | `/equipment-types/{id}` | Update equipment |
| DELETE | `/equipment-types/{id}` | Soft delete equipment |
| GET | `/accessorials` | List accessorials |
| POST | `/accessorials` | Create accessorial |
| PUT | `/accessorials/{id}` | Update accessorial |
| DELETE | `/accessorials/{id}` | Soft delete accessorial |
| GET | `/lanes` | List lanes |
| POST | `/lanes` | Create lane |
| PUT | `/lanes/{id}` | Update lane |
| DELETE | `/lanes/{id}` | Soft delete lane |

---

# Quotes

| Method | Endpoint | Description |
|---|---|---|
| POST | `/quotes/preview` | Calculate quote without saving |
| POST | `/quotes/book` | Calculate and save quote |
| GET | `/quotes` | Retrieve quotes based on role |

---

# Documents

| Method | Endpoint | Description |
|---|---|---|
| GET | `/documents` | List documents |
| POST | `/documents` | Upload PDF |
| DELETE | `/documents/{id}` | Delete document |

---

# Chat

The AI Copilot endpoints are located under:

```text
backend/app/api/chat.py
```

The chat implementation uses:

```text
LangGraph
LangChain
SQL tools
RAG
pgvector
OpenAI
```

---

# Health Checks

The backend provides:

```http
GET /health
```

and:

```http
GET /health/db
```

These are useful for checking whether:

1. The FastAPI application is running
2. The database connection is working

---

# Swagger API Documentation

FastAPI automatically provides Swagger documentation.

Local:

```text
http://localhost:8000/docs
```

Production:

```text
https://freight-ops-copilot.onrender.com/docs
```

The Swagger UI can be used to manually test API endpoints.

---

# Supabase Production Database Setup

The production database is hosted by Supabase.

The general setup process was:

1. Create a Supabase project
2. Enable PostgreSQL
3. Enable the `pgvector` extension
4. Obtain the PostgreSQL connection string
5. Set the connection string as `DATABASE_URL` in Render
6. Run Alembic migrations against the Supabase database
7. Seed required production data

---

# Running Migrations Against Supabase

The production database schema is managed by Alembic.

The important migration command is:

```bash
alembic upgrade head
```

When deploying a new migration, make sure the migration is committed to GitHub.

Then run the migration against the production database.

The database should not be manually modified when a schema change can be represented as an Alembic migration.

---

# Production Seed Data

Production requires initial freight configuration.

The required seed data includes:

- Canadian freight lanes
- Equipment types
- Equipment rate multipliers
- Accessorials
- Default operational settings

The lane seed script is:

```text
backend/scripts/seed_lanes.py
```

The production database can also be seeded directly through the Supabase SQL Editor when appropriate.

---

# Render Backend Deployment

The FastAPI backend is deployed on Render.

The Render service is configured as a:

```text
Web Service
```

with:

```text
Runtime: Docker
```

The backend Dockerfile is:

```text
backend/Dockerfile
```

---

# Render Configuration

The Render service uses:

```text
Environment: Production
Runtime: Docker
Branch: main
```

The backend root directory should point to:

```text
backend
```

if Render is configured to build from the backend directory.

The Render service exposes the FastAPI application on the port provided by Render.

The application runs Uvicorn with:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

# Important Render Docker Configuration

For production, the Docker command should not use development reload mode.

Local development may use:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Production should use:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The important difference is:

```text
--reload
```

is for development and should not be required in production.

---

# Render Environment Variables

The Render backend requires the following environment variables:

```env
DATABASE_URL=<SUPABASE_DATABASE_URL>

JWT_SECRET_KEY=<PRODUCTION_JWT_SECRET>
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

OPENAI_API_KEY=<OPENAI_API_KEY>
OPENAI_LLM_MODEL=gpt-4.1-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

CHAT_MAX_HISTORY_MESSAGES=20
```

The exact secret values must be configured directly in Render.

They should never be committed to GitHub.

---

# Render Deployment URL

The deployed backend currently uses:

```text
https://freight-ops-copilot.onrender.com
```

Swagger documentation:

```text
https://freight-ops-copilot.onrender.com/docs
```

Health check:

```text
https://freight-ops-copilot.onrender.com/health
```

---

# Render Automatic Deployment

Render is connected to the GitHub repository.

The production workflow is:

```text
Local changes
      ↓
Git commit
      ↓
Pull Request
      ↓
Merge into main
      ↓
GitHub
      ↓
Render detects main branch change
      ↓
Docker build
      ↓
Deploy
```

Therefore, future backend changes merged into `main` can automatically trigger a new Render deployment.

---

# Vercel Frontend Deployment

The React/Vite frontend is deployed on Vercel.

The Vercel project is connected to the GitHub repository.

The production frontend currently uses:

```text
https://freight-ops-copilot.vercel.app
```

---

# Vercel Environment Variable

The frontend requires:

```env
VITE_API_URL=https://freight-ops-copilot.onrender.com
```

This tells Axios where the FastAPI backend is located.

The value is consumed in:

```text
frontend/src/api/client.ts
```

The code uses:

```ts
const baseURL =
  import.meta.env.VITE_API_URL || "http://localhost:8000"
```

Therefore:

### Local

```env
VITE_API_URL=http://localhost:8000
```

### Production

```env
VITE_API_URL=https://freight-ops-copilot.onrender.com
```

---

# Vercel Environments

The Vercel project already provides standard environments:

```text
Production
Preview
Development
```

A custom pre-production environment is not required for this project.

Do not create a custom environment just for normal development because custom environments may require a Vercel Pro plan.

For this project, the standard Vercel environments are sufficient.

---

# Vercel Automatic Deployment

The frontend follows the GitHub deployment workflow:

```text
Local frontend changes
        ↓
Git commit
        ↓
Pull Request
        ↓
Merge into main
        ↓
GitHub
        ↓
Vercel detects main change
        ↓
Build
        ↓
Production deployment
```

Future frontend changes merged into `main` can therefore be automatically deployed to Vercel.

---

# CORS Configuration

Because the frontend and backend are deployed on different domains, CORS must be configured in FastAPI.

The production frontend origin is:

```text
https://freight-ops-copilot.vercel.app
```

The FastAPI backend must allow requests from the Vercel frontend.

Conceptually:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://freight-ops-copilot.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

This is required because browsers enforce the same-origin policy.

Without the correct CORS configuration, the browser can block requests such as:

```text
Vercel frontend
      ↓
POST /auth/login
      ↓
Render backend
```

with an error similar to:

```text
No 'Access-Control-Allow-Origin' header is present
```

---

# Deployment Troubleshooting

## Frontend cannot connect to backend

Check Vercel:

```text
VITE_API_URL
```

It should point to:

```text
https://freight-ops-copilot.onrender.com
```

Do not use:

```text
http://localhost:8000
```

in production.

---

# CORS Error

If the browser reports:

```text
blocked by CORS policy
```

check:

```text
backend/app/main.py
```

and verify that the Vercel production domain is included in `allow_origins`.

After changing backend CORS configuration:

1. Commit the change
2. Push to GitHub
3. Merge into `main`
4. Wait for Render to deploy
5. Refresh the Vercel application

---

# Render 500 Error

If an endpoint returns:

```text
500 Internal Server Error
```

check the Render logs.

Typical causes include:

- Missing environment variable
- Invalid `DATABASE_URL`
- Supabase connection issue
- Missing migration
- Missing API key
- Python dependency missing
- Application import error

---

# Database Connection Problems

Check:

```env
DATABASE_URL
```

in Render.

Make sure the connection string belongs to the Supabase project.

Do not use:

```text
localhost
```

for the production database.

`localhost` only refers to the Render container itself.

Production must connect to Supabase using the Supabase PostgreSQL connection string.

---

# Authentication Troubleshooting

If signup succeeds but login fails:

Check:

1. User exists in Supabase
2. Password hash was created
3. JWT secret is configured
4. JWT algorithm matches
5. Backend logs
6. Frontend `VITE_API_URL`
7. CORS configuration

---

# bcrypt Compatibility

The project previously encountered a Passlib/bcrypt compatibility issue where Passlib attempted to access:

```text
bcrypt.__about__.__version__
```

and newer bcrypt versions no longer exposed that attribute.

The project also encountered bcrypt's:

```text
password cannot be longer than 72 bytes
```

limitation.

If this issue appears again, inspect the installed versions of:

```text
passlib
bcrypt
```

and the password validation logic.

---

# PyMuPDF Warning

The project may show:

```text
The `fitz` API is deprecated and will be removed in the future.
Use `import pymupdf` instead.
```

The current implementation may still use:

```python
import fitz
```

This is a deprecation warning rather than an application startup failure.

The code should eventually be migrated to:

```python
import pymupdf
```

and the corresponding API calls updated.

---

# Git Workflow

The project uses GitHub for source control.

Recommended workflow:

```text
feature branch
      ↓
development
      ↓
commit
      ↓
push
      ↓
Pull Request
      ↓
review / test
      ↓
merge into main
      ↓
automatic deployment
```

---

# Example Commit Messages

Use clear and descriptive commit messages.

Examples:

```text
migrate database from local PostgreSQL to Supabase
```

```text
prepare backend for Render deployment
```

```text
add production CORS configuration
```

```text
add AI copilot chat workflow
```

```text
add document RAG pipeline
```

```text
update frontend API configuration
```

---

# Deployment Checklist

Before deploying backend changes:

- [ ] Code works locally
- [ ] Database migrations work
- [ ] New migration committed if schema changed
- [ ] Environment variables are documented
- [ ] No secrets are committed
- [ ] CORS is configured
- [ ] Docker build succeeds
- [ ] API endpoints work locally
- [ ] Pull Request created
- [ ] Pull Request merged into `main`
- [ ] Render deployment completed
- [ ] Production `/health` endpoint works

Before deploying frontend changes:

- [ ] Frontend works locally
- [ ] `VITE_API_URL` is correct
- [ ] API requests work locally
- [ ] No backend secrets are included in frontend
- [ ] Pull Request created
- [ ] Pull Request merged into `main`
- [ ] Vercel deployment completed
- [ ] Production login/signup tested
- [ ] Browser console checked for CORS errors

---

# Current Production Architecture

The current production system is:

```text
GitHub
  │
  ├───────────────┐
  │               │
  ▼               ▼
Vercel          Render
Frontend        FastAPI
  │               │
  │               │
  └───────┬───────┘
          │
          ▼
       Supabase
      PostgreSQL
       + pgvector
          │
          │
          ▼
       OpenAI API
```

---

# Production URLs

## Frontend

```text
https://freight-ops-copilot.vercel.app
```

## Backend

```text
https://freight-ops-copilot.onrender.com
```

## Backend Swagger

```text
https://freight-ops-copilot.onrender.com/docs
```

## Backend Health

```text
https://freight-ops-copilot.onrender.com/health
```

---

# Important Configuration Summary

## Local

### Backend

```env
DATABASE_URL=

POSTGRES_USER=freight_user
POSTGRES_PASSWORD=freight_pass
POSTGRES_DB=freight_ops
POSTGRES_HOST=localhost
POSTGRES_PORT=5433

JWT_SECRET_KEY=<local-secret>
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

OPENAI_API_KEY=<openai-key>
OPENAI_LLM_MODEL=gpt-4.1-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

### Frontend

```env
VITE_API_URL=http://localhost:8000
```

---

# Production

## Render

```env
DATABASE_URL=<supabase-database-url>

JWT_SECRET_KEY=<production-secret>
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

OPENAI_API_KEY=<openai-key>
OPENAI_LLM_MODEL=gpt-4.1-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

CHAT_MAX_HISTORY_MESSAGES=20
```

## Vercel

```env
VITE_API_URL=https://freight-ops-copilot.onrender.com
```

---

# Important Security Rules

Never commit:

```text
.env
.env.local
production database passwords
JWT secrets
OpenAI API keys
Supabase private credentials
```

Use:

```text
.env.example
```

to document required variables without including real values.

The frontend must never contain server-side secrets.

Anything beginning with:

```text
VITE_
```

is bundled into the frontend application and should be considered publicly accessible.

Therefore:

```text
VITE_API_URL          → safe
OPENAI_API_KEY        → NEVER put in Vercel frontend
DATABASE_URL          → NEVER put in Vercel frontend
JWT_SECRET_KEY        → NEVER put in Vercel frontend
POSTGRES_PASSWORD     → NEVER put in Vercel frontend
```

---

# Development vs Production

## Development

```text
React/Vite
    ↓
localhost:8000
    ↓
FastAPI
    ↓
Docker PostgreSQL
```

## Production

```text
React/Vite on Vercel
    ↓
HTTPS
    ↓
FastAPI on Render
    ↓
Supabase PostgreSQL
    ↓
pgvector
```

This separation is intentional.

Local development uses Docker for a reproducible development environment, while production uses managed infrastructure.

---

# Future Improvements

Potential future improvements include:

- Persistent AI conversation memory
- More sophisticated agent routing
- Multi-agent workflows
- Better document citation in RAG responses
- Streaming AI responses
- More advanced quote analytics
- Rate history and trend analysis
- Real-time freight market rates
- Improved authentication and account management
- Admin user provisioning
- Production document storage
- Background job processing
- Automated database migrations during deployment
- Automated test suite and CI pipeline
- More comprehensive monitoring and logging

---

# Project Goal

The goal of Freight Ops Copilot is to demonstrate a modern full-stack and AI-enabled software architecture combining:

```text
React
+
TypeScript
+
FastAPI
+
PostgreSQL
+
pgvector
+
Docker
+
JWT Authentication
+
LangChain
+
LangGraph
+
RAG
+
OpenAI
+
Vercel
+
Render
+
Supabase
```

The project demonstrates both traditional software engineering and modern AI application development, including:

- REST API development
- Database design
- Authentication
- Role-based authorization
- CRUD operations
- Rate calculation
- Document processing
- Vector search
- RAG
- LLM integration
- Agent orchestration
- Docker containerization
- Cloud deployment
- Environment configuration
- Frontend/backend integration
- Production database migration
- CI/CD through GitHub-connected deployments