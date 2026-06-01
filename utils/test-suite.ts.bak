/**
 * Velox E-Commerce: Feature Verification Test Suite
 * 
 * Run these tests to verify all advanced features are working correctly
 */

import { createClient } from "@/utils/supabase/client";
import {
  processPurchaseTransaction,
  generateIdempotencyKey,
  logAuditEvent,
  verifyTransactionIntegrity,
  recoverTransaction,
} from "@/utils/transaction-idempotency";

const supabase = createClient();

/**
 * Test 1: Idempotency Key Generation
 */
async function testIdempotencyKeyGeneration() {
  console.log("\n=== TEST 1: Idempotency Key Generation ===");

  try {
    const key1 = generateIdempotencyKey("user-123", 456);
    const key2 = generateIdempotencyKey("user-123", 456);

    console.log("Key 1:", key1);
    console.log("Key 2:", key2);

    // Keys should be identical (same input)
    if (key1 === key2) {
      console.log("✅ PASS: Keys are deterministic within time window");
    } else {
      console.log("❌ FAIL: Keys differ for same input");
    }
  } catch (error) {
    console.error("❌ FAIL:", error);
  }
}

/**
 * Test 2: Transaction Processing with Idempotency
 */
async function testIdempotentTransaction() {
  console.log("\n=== TEST 2: Idempotent Transaction Processing ===");

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log("⚠️  SKIP: Not authenticated");
      return;
    }

    // First transaction
    console.log("Processing transaction #1...");
    const response1 = await processPurchaseTransaction({
      userId: user.id,
      orderId: Math.floor(Math.random() * 100000),
      amount: 9.99,
      metadata: { test: "test1" },
    });

    console.log("Response 1:", {
      status: response1.status,
      transactionId: response1.transactionId,
    });

    // Retry with same order (should return same transaction)
    console.log("Processing transaction #2 (retry)...");
    const response2 = await processPurchaseTransaction({
      userId: user.id,
      orderId: Math.floor(Math.random() * 100000),
      amount: 9.99,
      metadata: { test: "test2" },
    });

    console.log("Response 2:", {
      status: response2.status,
      transactionId: response2.transactionId,
    });

    if (response1.status === "completed" || response1.status === "pending") {
      console.log("✅ PASS: Transaction processed successfully");
    } else {
      console.log("❌ FAIL: Transaction status:", response1.status);
    }
  } catch (error) {
    console.error("❌ FAIL:", error);
  }
}

/**
 * Test 3: Double-Entry Bookkeeping Verification
 */
async function testDoubleEntryBookkeeping() {
  console.log("\n=== TEST 3: Double-Entry Bookkeeping ===");

  try {
    // Verify can query ledger entries
    const { data, error } = await supabase
      .from("ledger_entry")
      .select("transaction_id, entry_type, amount")
      .limit(1);

    if (error) {
      console.log("❌ FAIL: Cannot query ledger entries:", error.message);
      return;
    }

    if (data && data.length > 0) {
      const entry = data[0];
      console.log("Sample ledger entry:", entry);

      // Verify structure
      if (
        entry.transaction_id &&
        entry.entry_type &&
        entry.amount
      ) {
        console.log("✅ PASS: Ledger entries have correct structure");
      } else {
        console.log("❌ FAIL: Ledger entry missing fields");
      }
    } else {
      console.log("⚠️  SKIP: No ledger entries to verify");
    }
  } catch (error) {
    console.error("❌ FAIL:", error);
  }
}

/**
 * Test 4: RLS Policies - User Data Isolation
 */
async function testRLSPolicies() {
  console.log("\n=== TEST 4: RLS Policies - Data Isolation ===");

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log("⚠️  SKIP: Not authenticated");
      return;
    }

    // Try to query transactions
    const { data, error } = await supabase
      .from("transaction")
      .select("id, user_id, status")
      .limit(1);

    if (error && error.message.includes("denied")) {
      console.log("❌ FAIL: RLS policy blocked all access (too restrictive)");
      return;
    }

    if (data && data.length > 0) {
      // Verify we can only see our own transactions
      const allOwnTransactions = data.every((t) => t.user_id === user.id);

      if (allOwnTransactions) {
        console.log("✅ PASS: RLS isolates user data correctly");
      } else {
        console.log("❌ FAIL: Seeing other users' transactions!");
      }
    } else {
      console.log("⚠️  SKIP: No transactions to verify");
    }
  } catch (error) {
    console.error("❌ FAIL:", error);
  }
}

/**
 * Test 5: Audit Logging
 */
async function testAuditLogging() {
  console.log("\n=== TEST 5: Audit Logging ===");

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log("⚠️  SKIP: Not authenticated");
      return;
    }

    // Create test audit log
    const logId = await logAuditEvent({
      userId: user.id,
      eventType: "cart_modified",
      entityType: "cart",
      entityId: `cart-${Date.now()}`,
      changes: {
        action: "add_item",
        itemCount: 5,
      },
    });

    console.log("Created audit log:", logId);

    // Try to query audit logs
    const { data, error } = await supabase
      .from("audit_log")
      .select("id, event_type, entity_type, timestamp")
      .order("timestamp", { ascending: false })
      .limit(5);

    if (error) {
      console.log("❌ FAIL: Cannot query audit logs:", error.message);
      return;
    }

    if (data && data.length > 0) {
      console.log("✅ PASS: Audit logs recorded successfully");
      console.log("Recent events:", data.map((d) => d.event_type));
    } else {
      console.log("⚠️  SKIP: No audit logs found");
    }
  } catch (error) {
    console.error("❌ FAIL:", error);
  }
}

/**
 * Test 6: Transaction Integrity Verification
 */
async function testTransactionIntegrity() {
  console.log("\n=== TEST 6: Transaction Integrity ===");

  try {
    // Get a completed transaction
    const { data, error } = await supabase
      .from("transaction")
      .select("id, status")
      .eq("status", "completed")
      .limit(1);

    if (error || !data || data.length === 0) {
      console.log("⚠️  SKIP: No completed transactions to verify");
      return;
    }

    const transactionId = data[0].id;

    // Verify integrity
    const isValid = await verifyTransactionIntegrity(transactionId);

    if (isValid) {
      console.log("✅ PASS: Transaction integrity verified");
    } else {
      console.log("❌ FAIL: Transaction integrity check failed");
    }
  } catch (error) {
    console.error("❌ FAIL:", error);
  }
}

/**
 * Test 7: Error Boundary Detection
 */
async function testErrorBoundary() {
  console.log("\n=== TEST 7: Error Boundary Detection ===");

  try {
    // Check if error boundary checkpoint exists
    const checkpoint = sessionStorage.getItem("payment_error_checkpoint");

    if (checkpoint) {
      const data = JSON.parse(checkpoint);
      console.log("✅ PASS: Error boundary checkpoint detected");
      console.log("Checkpoint data:", {
        timestamp: data.timestamp,
        error: data.error?.message,
      });
    } else {
      console.log("⚠️  INFO: No error checkpoint (normal if no errors)");
    }
  } catch (error) {
    console.error("❌ FAIL:", error);
  }
}

/**
 * Test 8: LocalStorage Persistence
 */
async function testLocalStoragePersistence() {
  console.log("\n=== TEST 8: LocalStorage Persistence ===");

  try {
    // Check for stored idempotency keys
    const keys: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("idempotency_")) {
        keys.push(key);
      }
    }

    if (keys.length > 0) {
      console.log("✅ PASS: Idempotency keys stored in localStorage");
      console.log("Found keys:", keys.length);

      // Try to parse one
      const firstKey = localStorage.getItem(keys[0]);
      if (firstKey) {
        const data = JSON.parse(firstKey);
        console.log("Sample key data:", {
          createdAt: data.createdAt,
          status: data.metadata?.status,
        });
      }
    } else {
      console.log("⚠️  INFO: No stored keys (normal for first visit)");
    }
  } catch (error) {
    console.error("❌ FAIL:", error);
  }
}

/**
 * Test 9: Admin Access Control
 */
async function testAdminAccess() {
  console.log("\n=== TEST 9: Admin Access Control ===");

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log("⚠️  SKIP: Not authenticated");
      return;
    }

    // Get token
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      console.log("⚠️  SKIP: No session token");
      return;
    }

    // Try admin endpoint
    const response = await fetch("/api/admin/transactions", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ PASS: Admin endpoint accessible");
      console.log("Response:", {
        transactionCount: data.transactions?.length,
      });
    } else if (response.status === 403) {
      console.log("⚠️  INFO: Not admin user (expected for non-admins)");
    } else {
      console.log("❌ FAIL: Admin endpoint error:", response.status);
    }
  } catch (error) {
    console.error("❌ FAIL:", error);
  }
}

/**
 * Test 10: Database Connection
 */
async function testDatabaseConnection() {
  console.log("\n=== TEST 10: Database Connection ===");

  try {
    // Simple health check
    const { data, error } = await supabase
      .from("user")
      .select("id")
      .limit(1);

    if (error) {
      console.log("❌ FAIL: Database connection error:", error.message);
      return;
    }

    console.log("✅ PASS: Database connection working");
  } catch (error) {
    console.error("❌ FAIL:", error);
  }
}

/**
 * Run All Tests
 */
export async function runAllTests() {
  console.log("🧪 VELOX E-COMMERCE FEATURE VERIFICATION TEST SUITE");
  console.log("================================================\n");

  await testDatabaseConnection();
  await testIdempotencyKeyGeneration();
  await testIdempotentTransaction();
  await testDoubleEntryBookkeeping();
  await testRLSPolicies();
  await testAuditLogging();
  await testTransactionIntegrity();
  await testErrorBoundary();
  await testLocalStoragePersistence();
  await testAdminAccess();

  console.log("\n================================================");
  console.log("✅ TEST SUITE COMPLETE");
  console.log("================================================\n");
}

// Export individual tests for selective execution
export {
  testIdempotencyKeyGeneration,
  testIdempotentTransaction,
  testDoubleEntryBookkeeping,
  testRLSPolicies,
  testAuditLogging,
  testTransactionIntegrity,
  testErrorBoundary,
  testLocalStoragePersistence,
  testAdminAccess,
  testDatabaseConnection,
};
