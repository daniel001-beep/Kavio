-- ==========================================================
-- VELOX FINTECH: EVENT AUDIT LOGS DATABASE SCHEMA
-- ==========================================================

-- 1. Create the audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_tenant TEXT NOT NULL,
    action_event TEXT NOT NULL,
    location_ip VARCHAR(45) NOT NULL, -- Supports both IPv4 and IPv6 lengths
    device_info TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create optimized performance indexes for multi-tenancy sorting
-- Fast lookups for active tenant dashboards and time-series audits
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created 
ON audit_logs (user_tenant, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
ON audit_logs (created_at DESC);

-- 3. Enable Row Level Security (RLS) for privacy
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. Create secure access policies
-- Allow the backend service role or route handler to insert events (handled via bypass or service key)
DROP POLICY IF EXISTS "Allow service role insert" ON audit_logs;
CREATE POLICY "Allow service role insert" ON audit_logs 
    FOR INSERT 
    WITH CHECK (true);

-- Allow users/tenants to read ONLY their own event logs for multi-tenant privacy
-- Matches active auth user email or tenant ID in JWT claims
DROP POLICY IF EXISTS "Allow tenant select" ON audit_logs;
CREATE POLICY "Allow tenant select" ON audit_logs 
    FOR SELECT 
    TO authenticated 
    USING (
        user_tenant = auth.jwt()->>'email' 
        OR user_tenant = (SELECT email FROM "user" WHERE id = auth.uid()::text LIMIT 1)
    );
