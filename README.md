# Freight Ops Copilot

An AI-powered freight quoting and operations platform built with React, TypeScript, FastAPI, PostgreSQL, and LangGraph.

**Live application:** [freight-ops-copilot.vercel.app](https://freight-ops-copilot.vercel.app)  
**API documentation:** [View Swagger UI](https://freight-ops-copilot.onrender.com/docs)

Freight Ops Copilot is a full-stack application designed to simplify freight quoting and day-to-day logistics operations. It provides separate workflows for staff and customers, along with an AI assistant that can answer questions using structured freight data and uploaded documents.

Demo access is available on request.

## Key Features

### Customer portal
- Request freight quotes by selecting origin, destination, equipment, and shipment details.
- Preview quote calculations before booking.
- View quote history.

### Staff portal
- Manage freight lanes and equipment types.
- Configure accessorial charges and operational settings.
- Upload and manage PDF documents.
- View customer quotes.

### AI Freight Operations Copilot
- Answer natural-language questions about freight operations.
- Retrieve information from structured PostgreSQL data using SQL-based tools.
- Search uploaded PDF documents using semantic search and RAG.
- Use LangGraph to orchestrate the agent and its available tools.

## Technology Stack

| Area | Technologies |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Python 3.12, FastAPI, SQLAlchemy |
| Database | PostgreSQL, Supabase, pgvector |
| Authentication | JWT, Passlib, bcrypt |
| AI and orchestration | LangChain, LangGraph, OpenAI API |
| Embeddings | OpenAI `text-embedding-3-small` |
| LLM | OpenAI `gpt-4.1-mini` |
| Document processing | PyMuPDF |
| Migrations | Alembic |
| Local development | Docker, Docker Compose |
| Deployment | Vercel, Render, Supabase |

## Architecture

The application uses a separate frontend and backend, communicating through a REST API.

```text
                 User Browser
                      |
                      v
              React + TypeScript
                   (Vercel)
                      |
                  REST API
                      |
                      v
                FastAPI Backend
                   (Render)
                  /         \
                 v           v
          PostgreSQL       OpenAI API
          + pgvector       LLM + Embeddings
          (Supabase)
```

- **Vercel** hosts the React frontend.
- **Render** hosts the FastAPI backend.
- **Supabase** provides the production PostgreSQL database with pgvector.
- **OpenAI** provides language model and embedding capabilities.

## AI Implementation

One of the main parts of this project is the AI Freight Operations Copilot. It combines structured database queries with document retrieval so that responses can use application data rather than relying only on the language model's general knowledge.

### 1. Document processing and RAG

Staff can upload PDF documents, such as freight policies, contracts, and operational documents.

The processing pipeline:

1. Extract text from PDFs using PyMuPDF.
2. Split the extracted text into smaller chunks.
3. Generate embeddings using OpenAI `text-embedding-3-small`.
4. Store the embeddings in PostgreSQL using pgvector.
5. Retrieve relevant document chunks through semantic similarity search when a question is asked.

```text
PDF Upload
    |
    v
PyMuPDF Text Extraction
    |
    v
Text Chunking
    |
    v
OpenAI Embeddings
    |
    v
PostgreSQL + pgvector
    |
    v
Semantic Search
    |
    v
Retrieved Context for RAG
```

### 2. Agent workflow with LangGraph

The Copilot uses LangGraph to coordinate the interaction between the language model and backend tools.

Depending on the question, the agent can use:

- **SQL tools** to retrieve structured freight and quote information.
- **Document retrieval** to search uploaded documents.
- **Freight-related backend tools** to access application functionality.

For example:

- "What was the average quote rate from Toronto to Montreal?"
- "What is our policy for liftgate charges?"

The first question can use structured database data, while the second can use document retrieval.

This combines traditional database operations with retrieval-augmented generation in one application.

## Database Design

PostgreSQL is the primary relational database. The main tables include:

| Table | Purpose |
|---|---|
| `users` | Customer and staff accounts |
| `lanes` | Origin and destination freight lanes |
| `equipment_types` | Equipment types and rate multipliers |
| `accessorials` | Additional freight charges |
| `quotes` | Customer quote requests and calculated rates |
| `quote_accessorials` | Relationship between quotes and accessorials |
| `settings` | Operational configuration |
| `documents` | Uploaded document metadata |
| `document_chunks` | Document chunks and vector embeddings |
| Chat tables | AI conversation and session data |

Database schema changes are managed through Alembic migrations.

## Authentication and Authorization

The application uses JWT-based authentication and role-based access control.

- Users can create accounts through the public signup page.
- All new registrations are automatically assigned the customer role.
- Role selection is not available during signup.
- The admin account is provisioned directly in the database.
- Customers have access to the customer dashboard, while admin users can access the administrative dashboard.
- Backend endpoints enforce role-based permissions.


## Freight Quote Calculation

The quote engine calculates freight prices using configurable components, including:

- Lane base rates and distance.
- Equipment multipliers.
- Weight adjustments.
- Fuel surcharge.
- Additional accessorial charges.

Staff can manage freight configuration through the staff interface.

## API Overview

The FastAPI backend exposes REST endpoints for the main application workflows.

| Area | Example endpoints |
|---|---|
| Authentication | `/auth/signup`, `/auth/login`, `/auth/me` |
| Freight | `/lanes`, `/equipment-types`, `/accessorials` |
| Quotes | `/quotes/preview`, `/quotes/book`, `/quotes` |
| Documents | `/documents` |
| Health checks | `/health`, `/health/db` |

Interactive API documentation is available through FastAPI Swagger UI:

[https://freight-ops-copilot.onrender.com/docs](https://freight-ops-copilot.onrender.com/docs)

## Project Structure

```text
freight-ops-copilot/
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── ai/           # LangGraph agent and AI workflows
│   │   ├── core/         # Configuration and security
│   │   ├── db/           # Database models and sessions
│   │   ├── schemas/      # Request and response schemas
│   │   └── services/    # Shared services, including embeddings
│   ├── alembic/          # Database migrations
│   ├── scripts/          # Seed scripts
│   └── Dockerfile
├── frontend/
│   └── src/
│       ├── api/          # API clients
│       ├── components/   # Reusable UI components
│       ├── context/      # Authentication context
│       ├── pages/        # Customer and staff pages
│       └── types/        # TypeScript types
├── docker-compose.yml
└── README.md
```

## Run Locally

### Prerequisites

- Docker Desktop
- Node.js 18+
- npm
- Git
- OpenAI API key

### 1. Clone the repository

```bash
git clone https://github.com/leila68/freight_ops_copilot.git
cd freight_ops_copilot
```

### 2. Configure the backend

Create `backend/.env` using `backend/.env.example` as a template.

Configure the required database, JWT, and OpenAI settings. For local development, the project uses PostgreSQL through Docker Compose.

### 3. Start the backend and database

From the project root:

```bash
docker compose up --build -d
```

Apply database migrations:

```bash
docker compose exec backend alembic upgrade head
```

Seed the initial freight lanes:

```bash
docker compose exec backend python scripts/seed_lanes.py
```

The backend is available at:

`http://localhost:8000`

### 4. Configure and start the frontend

Create `frontend/.env` and configure the API URL:

```env
VITE_API_URL=http://localhost:8000
```

Then run:

```bash
cd frontend
npm install
npm run dev
```

The frontend is available at:

`http://localhost:5173`

## Deployment

The application is deployed using managed cloud services:

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** Supabase PostgreSQL with pgvector

The frontend and backend are connected to GitHub. Changes pushed to the configured deployment branch can trigger automatic builds and deployments.

Production environment variables are configured in the respective hosting platforms. Secrets such as database credentials, JWT signing keys, and OpenAI API keys are kept out of the frontend and source repository.

## Future Improvements

Potential areas for further development include:

- More advanced agent routing and workflows.
- Better document citations in RAG responses.
- Streaming AI responses.
- More advanced quote analytics and rate history.
- Background processing for document ingestion.
- Persistent document storage.
- Automated tests and a CI pipeline.
- Improved monitoring and logging.

## About the Project

Freight Ops Copilot brings together full-stack development, database design, authentication, document processing, vector search, and AI agent orchestration in a deployed application.

It was built to explore how AI capabilities such as RAG and tool-calling agents can be integrated into a practical logistics workflow.