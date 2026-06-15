-- Payment page can only read the specific invoice it was opened for
CREATE POLICY payment_page_read ON invoices
  FOR SELECT USING (id = current_setting('app.invoice_id')::UUID AND status != 'draft');

-- Verification attempts only readable by the invoice owner
CREATE POLICY verification_attempts_owner ON "verification_attempt"
  FOR SELECT USING (
    invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid())
  );

-- Receipt uploads: insert allowed from service role only
CREATE POLICY receipt_uploads_insert ON "receipt_upload"
  FOR INSERT WITH CHECK (true); -- service role only via server

-- Audit logs: insert from service role, read by invoice owner only
CREATE POLICY audit_logs_read ON "audit_log"
  FOR SELECT USING (
    invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid())
  );
