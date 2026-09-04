-- ==============================================================================
-- Community OS - Database Initialization Script
-- ==============================================================================
-- Enable required PostgreSQL extensions for high-performance enterprise multi-tenancy

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Ensure timezone is set to UTC
SET TIME ZONE 'UTC';
