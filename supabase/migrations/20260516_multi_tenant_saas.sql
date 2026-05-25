-- ==========================================================
-- VELOX FINTECH: MULTI-TENANT SAAS MIGRATION (CORRECTED)
-- ==========================================================

DO $$ 
BEGIN
    -- 1. Add tenant_id to 'user' table
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'user' AND COLUMN_NAME = 'tenant_id') THEN
        ALTER TABLE "user" ADD COLUMN tenant_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    END IF;

    -- 2. Add tenant_id to 'transaction' table (Singular)
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'transaction' AND COLUMN_NAME = 'tenant_id') THEN
        ALTER TABLE "transaction" ADD COLUMN tenant_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    END IF;

    -- 3. Add tenant_id to 'product' table (Singular)
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'product' AND COLUMN_NAME = 'tenant_id') THEN
        ALTER TABLE "product" ADD COLUMN tenant_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    END IF;
END $$;

-- ENABLE RLS
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product" ENABLE ROW LEVEL SECURITY;

-- CREATE POLICIES
DROP POLICY IF EXISTS "tenant_isolation" ON "transaction";
CREATE POLICY "tenant_isolation" ON "transaction" FOR ALL TO authenticated USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

DROP POLICY IF EXISTS "tenant_isolation" ON "user";
CREATE POLICY "tenant_isolation" ON "user" FOR ALL TO authenticated USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

DROP POLICY IF EXISTS "tenant_isolation" ON "product";
CREATE POLICY "tenant_isolation" ON "product" FOR ALL TO authenticated USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

-- ENABLE REALTIME FOR TRANSACTIONS SAFELY (Error-Proof)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_rel pr
        JOIN pg_publication p ON p.oid = pr.prpubid
        JOIN pg_class c ON c.oid = pr.prrelid
        WHERE p.pubname = 'supabase_realtime' 
          AND c.relname = 'transaction'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE "transaction";
    END IF;
END $$;
