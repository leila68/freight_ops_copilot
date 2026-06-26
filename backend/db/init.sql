-- This file runs automatically the FIRST time the Postgres container
-- initializes its data directory (i.e. on a fresh volume only).
-- If you change this file later, you must wipe the volume to re-run it:
--   docker compose down -v

-- Enable pgvector extension (needed later for RAG / embeddings)
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable uuid generation (used for primary keys)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table: staff and customer accounts
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('staff', 'customer')),
    company_name VARCHAR(255),              -- relevant mainly for customer role
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Keep updated_at fresh automatically on row updates
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();