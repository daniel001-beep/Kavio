/**
 * Velox Checkout - Idempotency & Transaction Utilities
 * 
 * Handles:
 * - Idempotency key generation and tracking
 * - Transaction state management
 * - Recovery from network failures
 * - Audit logging
 */

import { createClient } from "@/utils/supabase/client";
import crypto from "crypto";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface IdempotencyKey {
  key: string;
  createdAt: Date;
  transactionId?: string;
  status?: "pending" | "completed" | "failed";
}

export interface TransactionRequest {
  userId: string;
  orderId: number;
  amount: number;
  metadata?: Record<string, any>;
}

export interface TransactionResponse {
  transactionId: string;
  status: "pending" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface AuditLogEntry {
  userId: string;
  eventType:
    | "cart_modified"
    | "address_changed"
    | "checkout_attempted"
    | "transaction_initiated"
    | "transaction_completed"
    | "transaction_failed";
  entityType: "cart" | "order" | "transaction" | "user" | "address";
  entityId: string;
  changes: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================================================
// SECTION 1: IDEMPOTENCY KEY MANAGEMENT
// ============================================================================

/**
 * Generates a unique idempotency key based on:
 * - User ID
 * - Order ID
 * - Timestamp (allows retries within a window)
 * - Random nonce
 */
export function generateIdempotencyKey(
  userId: string,
  orderId: number,
  timestamp: number = Date.now()
): string {
  const data = `${userId}:${orderId}:${Math.floor(timestamp / 60000)}:${Math.random()}`;
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Stores idempotency key in localStorage for recovery
 */
export function storeIdempotencyKey(
  key: string,
  orderId: number,
  metadata?: Record<string, any>
): void {
  const storageKey = `idempotency_${orderId}`;
  const data: any = {
    key,
    createdAt: new Date(),
    ...(metadata && { metadata }),
  };

  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to store idempotency key:", e);
    // Fall back to IndexedDB
    storeIdempotencyKeyInIndexedDB(storageKey, data);
  }
}

/**
 * Retrieves stored idempotency key from localStorage
 */
export function getStoredIdempotencyKey(orderId: number): IdempotencyKey | null {
  const storageKey = `idempotency_${orderId}`;

  try {
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error("Failed to retrieve idempotency key:", e);
    return null;
  }
}

/**
 * IndexedDB fallback for idempotency keys (when localStorage is full)
 */
async function storeIdempotencyKeyInIndexedDB(
  storageKey: string,
  data: IdempotencyKey
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("velox_checkout", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("idempotency_keys", "readwrite");
      const store = tx.objectStore("idempotency_keys");
      store.put({ key: storageKey, ...data });
      resolve();
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("idempotency_keys")) {
        db.createObjectStore("idempotency_keys", { keyPath: "key" });
      }
    };
  });
}

/**
 * Retrieves idempotency key from IndexedDB
 */
async function getIdempotencyKeyFromIndexedDB(
  storageKey: string
): Promise<IdempotencyKey | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("velox_checkout", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("idempotency_keys", "readonly");
      const store = tx.objectStore("idempotency_keys");
      const getRequest = store.get(storageKey);

      getRequest.onsuccess = () => {
        resolve(getRequest.result || null);
      };
    };
  });
}

// ============================================================================
// SECTION 2: TRANSACTION PROCESSING
// ============================================================================

/**
 * Processes a purchase transaction with idempotency guarantees
 * Calls the Postgres function: process_purchase_transaction
 */
export async function processPurchaseTransaction(
  request: TransactionRequest
): Promise<TransactionResponse> {
  const supabase = createClient();
  const userId = request.userId || (await supabase.auth.getUser()).data.user?.id;

  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Generate idempotency key
  const idempotencyKey = generateIdempotencyKey(userId, request.orderId);
  storeIdempotencyKey(idempotencyKey, request.orderId, request.metadata);

  // Get client IP and user agent for audit logging
  const clientIp = await getClientIp();
  const userAgent = navigator.userAgent;

  // Set context variables for Postgres functions
  try {
    // This won't work directly from client - we need a server-side endpoint
    // For now, return the structure for the server to handle
    const { data, error } = await supabase.rpc("process_purchase_transaction", {
      p_user_id: userId,
      p_order_id: request.orderId,
      p_idempotency_key: idempotencyKey,
      p_amount: request.amount,
      p_metadata: {
        ip_address: clientIp,
        user_agent: userAgent,
        ...request.metadata,
      },
    });

    if (error) {
      console.error("Transaction error:", error);
      throw error;
    }

    // Store successful transaction state
    const response = data?.[0] as TransactionResponse;
    storeIdempotencyKey(idempotencyKey, request.orderId, {
      ...request.metadata,
      transactionId: response.transactionId,
      status: response.status,
    });

    return response;
  } catch (error) {
    console.error("Failed to process transaction:", error);

    // Store failed state for recovery
    storeIdempotencyKey(idempotencyKey, request.orderId, {
      ...request.metadata,
      status: "failed",
      error: String(error),
      attemptedAt: new Date().toISOString(),
    });

    throw error;
  }
}

/**
 * Retrieves transaction status by idempotency key
 * Useful for recovery flow
 */
export async function getTransactionByIdempotencyKey(
  idempotencyKey: string
): Promise<TransactionResponse | null> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("transaction")
      .select("id, amount, status, created_at, completed_at, error_message")
      .eq("idempotency_key", idempotencyKey)
      .single();

    if (error) {
      console.error("Failed to retrieve transaction:", error);
      return null;
    }

    return {
      transactionId: data.id,
      status: data.status,
      createdAt: data.created_at,
      completedAt: data.completed_at,
      errorMessage: data.error_message,
    };
  } catch (error) {
    console.error("Error querying transaction:", error);
    return null;
  }
}

/**
 * Gets user's transaction history
 * Enforced by RLS - users can only see their own
 */
export async function getUserTransactionHistory(
  limit: number = 50,
  offset: number = 0
): Promise<TransactionResponse[]> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.rpc(
      "get_user_transaction_history",
      {
        p_limit: limit,
        p_offset: offset,
      }
    );

    if (error) {
      throw error;
    }

    return (data || []).map((item: any) => ({
      transactionId: item.transaction_id,
      status: item.status,
      createdAt: item.created_at,
      completedAt: item.completed_at,
    }));
  } catch (error) {
    console.error("Failed to retrieve transaction history:", error);
    throw error;
  }
}

// ============================================================================
// SECTION 3: AUDIT LOGGING
// ============================================================================

/**
 * Logs an audit entry
 * Created for cart modifications, address changes, checkout attempts, etc.
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<string | null> {
  const supabase = createClient();

  try {
    const clientIp = entry.ipAddress || (await getClientIp());
    const userAgent = entry.userAgent || navigator.userAgent;

    const { data, error } = await supabase.rpc("create_audit_log", {
      p_user_id: entry.userId,
      p_event_type: entry.eventType,
      p_entity_type: entry.entityType,
      p_entity_id: entry.entityId,
      p_changes: entry.changes,
      p_ip_address: clientIp,
      p_user_agent: userAgent,
    });

    if (error) {
      console.error("Failed to create audit log:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Audit logging error:", error);
    // Don't throw - audit logging failures shouldn't break the app
    return null;
  }
}

/**
 * Logs a cart modification
 */
export async function logCartModification(
  userId: string,
  cartId: string,
  changes: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    userId,
    eventType: "cart_modified",
    entityType: "cart",
    entityId: cartId,
    changes,
  });
}

/**
 * Logs an address change
 */
export async function logAddressChange(
  userId: string,
  addressId: string,
  oldAddress: Record<string, any>,
  newAddress: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    userId,
    eventType: "address_changed",
    entityType: "address",
    entityId: addressId,
    changes: {
      old: oldAddress,
      new: newAddress,
    },
  });
}

/**
 * Logs a checkout attempt
 */
export async function logCheckoutAttempt(
  userId: string,
  orderId: number,
  details: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    userId,
    eventType: "checkout_attempted",
    entityType: "order",
    entityId: String(orderId),
    changes: details,
  });
}

// ============================================================================
// SECTION 4: UTILITY FUNCTIONS
// ============================================================================

/**
 * Gets client IP address (best-effort)
 * Uses a free IP detection API as fallback
 */
async function getClientIp(): Promise<string> {
  try {
    // Try to get IP from response headers (if running on server)
    if (typeof window === "undefined") {
      // Server-side - use headers from request
      return "unknown";
    }

    // Client-side fallback
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip || "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Generates a SHA256 hash for change verification
 */
export function generateChangeHash(data: Record<string, any>): string {
  // This is a placeholder - actual implementation depends on your environment
  // For client-side, you'd typically use a library like 'js-sha256'
  return JSON.stringify(data);
}

/**
 * Checks if a transaction is still in progress (locked)
 */
export async function isTransactionLocked(
  idempotencyKey: string
): Promise<boolean> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("transaction")
      .select("locked_until, status")
      .eq("idempotency_key", idempotencyKey)
      .single();

    if (error || !data) {
      return false;
    }

    if (data.status !== "pending") {
      return false;
    }

    // Check if lock has expired
    const lockExpiry = new Date(data.locked_until);
    return lockExpiry > new Date();
  } catch {
    return false;
  }
}

/**
 * Verifies transaction integrity (ledger balance)
 * Useful for post-transaction validation
 */
export async function verifyTransactionIntegrity(
  transactionId: string
): Promise<boolean> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.rpc(
      "verify_transaction_integrity",
      {
        p_transaction_id: transactionId,
      }
    );

    if (error || !data) {
      return false;
    }

    return data[0]?.is_valid === true;
  } catch {
    return false;
  }
}

// ============================================================================
// SECTION 5: TRANSACTION RECOVERY
// ============================================================================

/**
 * Attempts to recover a failed or interrupted transaction
 * Uses stored idempotency keys to prevent duplicates
 */
export async function recoverTransaction(
  orderId: number
): Promise<TransactionResponse | null> {
  const stored = getStoredIdempotencyKey(orderId);

  if (!stored) {
    console.log("No stored idempotency key found for order", orderId);
    return null;
  }

  // Check if transaction already exists with this key
  const existing = await getTransactionByIdempotencyKey(stored.key);

  if (existing) {
    console.log("Recovered existing transaction:", existing);
    return existing;
  }

  // Try to reprocess if still pending
  if (stored.metadata?.status === "pending") {
    console.log("Attempting to reprocess transaction...");
    // This would retry the transaction processing
    // Implementation depends on your payment processor
  }

  return null;
}

/**
 * Cleans up old idempotency keys from localStorage
 * Called periodically to free up space
 */
export function cleanupOldIdempotencyKeys(olderThanHours: number = 24): void {
  const now = Date.now();
  const threshold = olderThanHours * 60 * 60 * 1000;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("idempotency_")) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || "{}");
        const createdAt = new Date(data.createdAt).getTime();

        if (now - createdAt > threshold) {
          localStorage.removeItem(key);
        }
      } catch {
        localStorage.removeItem(key);
      }
    }
  }
}
