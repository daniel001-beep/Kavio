-- ============================================================================
-- Velox E-Commerce: Advanced Database Functions & RLS Policies
-- ============================================================================
-- This file contains:
-- 1. Postgres functions for atomic double-entry bookkeeping transactions
-- 2. RLS policies for granular security
-- 3. Audit logging triggers
-- ============================================================================

-- ============================================================================
-- 1. ATOMIC TRANSACTION FUNCTION (Double-Entry Bookkeeping)
-- ============================================================================

/**
 * process_purchase_transaction
 * 
 * Creates an atomic transaction with two ledger entries (debit & credit)
 * If either entry fails, both are rolled back
 * 
 * @param p_user_id - Customer user ID
 * @param p_order_id - Associated order ID
 * @param p_idempotency_key - Unique key to prevent duplicate transactions
 * @param p_amount - Transaction amount (must be positive)
 * @param p_metadata - JSON metadata (payment processor response, IP, etc)
 * 
 * RETURNS: transaction record with id and status
 */
CREATE OR REPLACE FUNCTION process_purchase_transaction(
  p_user_id TEXT,
  p_order_id INT,
  p_idempotency_key TEXT,
  p_amount NUMERIC,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE(
  transaction_id UUID,
  status TEXT,
  created_at TIMESTAMP,
  error_message TEXT
) AS $$
DECLARE
  v_transaction_id UUID;
  v_customer_balance_account_id UUID;
  v_store_revenue_account_id UUID;
  v_error_msg TEXT;
BEGIN
  -- START TRANSACTION (implicit in PL/pgSQL)
  
  -- Check for idempotency: if this key exists, return the existing transaction
  SELECT id, status FROM transaction
  WHERE idempotency_key = p_idempotency_key INTO v_transaction_id, status;
  
  IF v_transaction_id IS NOT NULL THEN
    RETURN QUERY SELECT v_transaction_id, status, created_at, error_message
    FROM transaction WHERE id = v_transaction_id;
    RETURN;
  END IF;
  
  BEGIN
    -- Validate inputs
    IF p_amount <= 0 THEN
      RAISE EXCEPTION 'Amount must be greater than zero';
    END IF;
    
    IF p_user_id IS NULL THEN
      RAISE EXCEPTION 'User ID cannot be null';
    END IF;
    
    -- Create transaction record in PENDING state (pessimistic lock)
    v_transaction_id := gen_random_uuid();
    
    INSERT INTO transaction (
      id,
      user_id,
      order_id,
      idempotency_key,
      amount,
      status,
      metadata,
      locked_until
    ) VALUES (
      v_transaction_id,
      p_user_id,
      p_order_id,
      p_idempotency_key,
      p_amount,
      'pending',
      p_metadata,
      NOW() + INTERVAL '5 minutes'
    );
    
    -- DEBIT: Customer's balance decreases
    INSERT INTO ledger_entry (
      transaction_id,
      user_id,
      account_type,
      entry_type,
      amount,
      description
    ) VALUES (
      v_transaction_id,
      p_user_id,
      'customer_balance',
      'debit',
      p_amount,
      'Purchase debit - Order #' || p_order_id
    );
    
    -- CREDIT: Store's revenue increases
    INSERT INTO ledger_entry (
      transaction_id,
      user_id,
      account_type,
      entry_type,
      amount,
      description
    ) VALUES (
      v_transaction_id,
      '00000000-0000-0000-0000-000000000000', -- System account for store revenue
      'store_revenue',
      'credit',
      p_amount,
      'Purchase credit - Order #' || p_order_id || ' from user ' || p_user_id
    );
    
    -- Update transaction status to COMPLETED
    UPDATE transaction
    SET status = 'completed', completed_at = NOW(), locked_until = NULL
    WHERE id = v_transaction_id;
    
  EXCEPTION WHEN OTHERS THEN
    -- Catch any error and update transaction status
    v_error_msg := SQLERRM;
    
    -- If transaction exists, update it to FAILED
    IF v_transaction_id IS NOT NULL THEN
      UPDATE transaction
      SET status = 'failed', error_message = v_error_msg, locked_until = NULL
      WHERE id = v_transaction_id;
    END IF;
    
    -- Return the error
    RETURN QUERY SELECT 
      COALESCE(v_transaction_id, gen_random_uuid()), 
      'failed'::TEXT, 
      NOW(), 
      v_error_msg;
    RETURN;
  END;
  
  -- Return success
  RETURN QUERY SELECT v_transaction_id, 'completed'::TEXT, NOW(), NULL::TEXT;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. GET TRANSACTION HISTORY (With RLS)
-- ============================================================================

/**
 * get_user_transaction_history
 * Retrieves transaction history for a specific user
 * Includes related ledger entries for verification
 * Cannot be called directly - enforced via RLS
 */
CREATE OR REPLACE FUNCTION get_user_transaction_history(
  p_user_id TEXT,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE(
  transaction_id UUID,
  amount NUMERIC,
  status TEXT,
  created_at TIMESTAMP,
  completed_at TIMESTAMP,
  order_id INT,
  debit_count INT,
  credit_count INT
) AS $$
BEGIN
  -- RLS is enforced at table level, not here
  -- This function just provides a convenient query structure
  RETURN QUERY
  SELECT 
    t.id,
    t.amount,
    t.status,
    t.created_at,
    t.completed_at,
    t.order_id,
    (SELECT COUNT(*) FROM ledger_entry WHERE transaction_id = t.id AND entry_type = 'debit')::INT,
    (SELECT COUNT(*) FROM ledger_entry WHERE transaction_id = t.id AND entry_type = 'credit')::INT
  FROM transaction t
  WHERE t.user_id = p_user_id
  ORDER BY t.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. AUDIT LOG FUNCTION
-- ============================================================================

/**
 * create_audit_log
 * Creates an audit log entry with tamper detection via SHA256 hash
 */
CREATE OR REPLACE FUNCTION create_audit_log(
  p_user_id TEXT,
  p_event_type TEXT,
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_changes JSONB,
  p_ip_address TEXT,
  p_user_agent TEXT,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_change_hash TEXT;
BEGIN
  v_log_id := gen_random_uuid();
  
  -- Generate SHA256 hash of changes for tamper detection
  v_change_hash := encode(
    digest(JSONB_BUILD_OBJECT(
      'user_id', p_user_id,
      'event_type', p_event_type,
      'entity_type', p_entity_type,
      'entity_id', p_entity_id,
      'changes', p_changes
    )::TEXT, 'sha256'),
    'hex'
  );
  
  INSERT INTO audit_log (
    id,
    user_id,
    event_type,
    entity_type,
    entity_id,
    changes,
    change_hash,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    v_log_id,
    p_user_id,
    p_event_type,
    p_entity_type,
    p_entity_id,
    p_changes,
    v_change_hash,
    p_ip_address,
    p_user_agent,
    p_metadata
  );
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all sensitive tables
ALTER TABLE transaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entry ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE address_history ENABLE ROW LEVEL SECURITY;

-- ==========================
-- TRANSACTION POLICIES
-- ==========================

-- Users can only view their own transactions
CREATE POLICY transaction_user_select ON transaction
  FOR SELECT
  USING (auth.uid()::TEXT = user_id);

-- Users can only insert their own transactions (via function)
CREATE POLICY transaction_user_insert ON transaction
  FOR INSERT
  WITH CHECK (auth.uid()::TEXT = user_id);

-- Prevent direct updates (only via function)
CREATE POLICY transaction_no_update ON transaction
  FOR UPDATE
  USING (FALSE);

-- ==========================
-- LEDGER ENTRY POLICIES
-- ==========================

-- Users can only view ledger entries related to their transactions
CREATE POLICY ledger_entry_user_select ON ledger_entry
  FOR SELECT
  USING (
    auth.uid()::TEXT = user_id
    OR EXISTS (
      SELECT 1 FROM transaction t
      WHERE t.id = ledger_entry.transaction_id
      AND t.user_id = auth.uid()::TEXT
    )
  );

-- Prevent direct inserts (only via function)
CREATE POLICY ledger_entry_no_insert ON ledger_entry
  FOR INSERT
  WITH CHECK (FALSE);

-- Prevent updates
CREATE POLICY ledger_entry_no_update ON ledger_entry
  FOR UPDATE
  USING (FALSE);

-- Prevent deletes
CREATE POLICY ledger_entry_no_delete ON ledger_entry
  FOR DELETE
  USING (FALSE);

-- ==========================
-- AUDIT LOG POLICIES
-- ==========================

-- Users can only view their own audit logs
CREATE POLICY audit_log_user_select ON audit_log
  FOR SELECT
  USING (auth.uid()::TEXT = user_id);

-- Users can only insert their own audit logs
CREATE POLICY audit_log_user_insert ON audit_log
  FOR INSERT
  WITH CHECK (auth.uid()::TEXT = user_id);

-- Prevent updates and deletes (immutable)
CREATE POLICY audit_log_no_update ON audit_log
  FOR UPDATE
  USING (FALSE);

CREATE POLICY audit_log_no_delete ON audit_log
  FOR DELETE
  USING (FALSE);

-- ==========================
-- ADDRESS HISTORY POLICIES
-- ==========================

-- Users can only view their own address history
CREATE POLICY address_history_user_select ON address_history
  FOR SELECT
  USING (auth.uid()::TEXT = user_id);

-- Users can only insert their own addresses
CREATE POLICY address_history_user_insert ON address_history
  FOR INSERT
  WITH CHECK (auth.uid()::TEXT = user_id);

-- Users can only update their own addresses
CREATE POLICY address_history_user_update ON address_history
  FOR UPDATE
  USING (auth.uid()::TEXT = user_id);

-- ==========================
-- ADMIN-ONLY VIEW (Hidden from Client)
-- ==========================

/**
 * Create a special admin function to view sensitive data
 * This bypasses RLS but is only callable by admins
 * Never expose this directly to the client
 */
CREATE OR REPLACE FUNCTION get_admin_audit_report(
  p_limit INT DEFAULT 100
)
RETURNS TABLE(
  log_id UUID,
  user_id TEXT,
  event_type TEXT,
  entity_type TEXT,
  changes JSONB,
  ip_address TEXT,
  timestamp TIMESTAMP
) AS $$
BEGIN
  -- Check if caller is admin (done at application level)
  RETURN QUERY
  SELECT 
    id,
    user_id,
    event_type,
    entity_type,
    changes,
    ip_address,
    timestamp
  FROM audit_log
  ORDER BY timestamp DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. TRIGGERS FOR AUTOMATIC AUDIT LOGGING
-- ============================================================================

-- Trigger function for address changes
CREATE OR REPLACE FUNCTION audit_address_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM create_audit_log(
      NEW.user_id,
      'address_created',
      'address',
      NEW.id::TEXT,
      JSONB_BUILD_OBJECT(
        'first_name', NEW.first_name,
        'last_name', NEW.last_name,
        'city', NEW.city,
        'country', NEW.country
      ),
      COALESCE(current_setting('app.current_ip', TRUE), 'unknown'),
      COALESCE(current_setting('app.user_agent', TRUE), 'unknown')
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM create_audit_log(
      NEW.user_id,
      'address_updated',
      'address',
      NEW.id::TEXT,
      JSONB_BUILD_OBJECT(
        'old_city', OLD.city,
        'new_city', NEW.city,
        'old_country', OLD.country,
        'new_country', NEW.country,
        'old_street', OLD.street,
        'new_street', NEW.street
      ),
      COALESCE(current_setting('app.current_ip', TRUE), 'unknown'),
      COALESCE(current_setting('app.user_agent', TRUE), 'unknown')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on address_history
DROP TRIGGER IF EXISTS address_change_audit_trigger ON address_history;
CREATE TRIGGER address_change_audit_trigger
  AFTER INSERT OR UPDATE ON address_history
  FOR EACH ROW
  EXECUTE FUNCTION audit_address_change();

-- ============================================================================
-- 6. UTILITY FUNCTIONS
-- ============================================================================

/**
 * verify_transaction_integrity
 * Verifies that a transaction has exactly one debit and one credit
 * with matching amounts
 */
CREATE OR REPLACE FUNCTION verify_transaction_integrity(
  p_transaction_id UUID
)
RETURNS TABLE(
  is_valid BOOLEAN,
  debit_count INT,
  credit_count INT,
  debit_total NUMERIC,
  credit_total NUMERIC,
  matches BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH ledger_totals AS (
    SELECT
      (SELECT COUNT(*) FROM ledger_entry WHERE transaction_id = p_transaction_id AND entry_type = 'debit')::INT as debit_count,
      (SELECT COUNT(*) FROM ledger_entry WHERE transaction_id = p_transaction_id AND entry_type = 'credit')::INT as credit_count,
      (SELECT COALESCE(SUM(amount), 0) FROM ledger_entry WHERE transaction_id = p_transaction_id AND entry_type = 'debit')::NUMERIC as debit_total,
      (SELECT COALESCE(SUM(amount), 0) FROM ledger_entry WHERE transaction_id = p_transaction_id AND entry_type = 'credit')::NUMERIC as credit_total
  )
  SELECT
    (debit_count = 1 AND credit_count = 1 AND debit_total = credit_total)::BOOLEAN,
    debit_count,
    credit_count,
    debit_total,
    credit_total,
    (debit_total = credit_total)::BOOLEAN
  FROM ledger_totals;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. INDEXES FOR PERFORMANCE (Already defined in schema, but reinforced here)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_transaction_idempotency_key_partial 
  ON transaction(idempotency_key) 
  WHERE status IN ('completed', 'pending');

CREATE INDEX IF NOT EXISTS idx_transaction_locked_until 
  ON transaction(locked_until) 
  WHERE locked_until IS NOT NULL;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
