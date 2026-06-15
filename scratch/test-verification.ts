import { fuzzyNameMatch, matchReceipt } from "../lib/receipt-matcher";
import { generateCsrfToken, verifyCsrfToken, verifyRequestSignature } from "../lib/security";
import * as crypto from "crypto";

function runTests() {
  console.log("=== Running Kavio Verification System Unit Tests ===");

  // Test 1: Fuzzy Name Matching logic
  console.log("\n[Test 1] Fuzzy Name Matching...");
  const namePairs = [
    { n1: "IDOWU DANIEL", n2: "Idowu O. Daniel", expected: true },
    { n1: "IDOWU DANIEL", n2: "DANIEL IDOWU", expected: true },
    { n1: "IDOWU DANIEL", n2: "IDOWU", expected: false }, // Only 1 word match
    { n1: "DANIEL", n2: "Daniel", expected: true },       // Exact single word
    { n1: "Idowu Daniel", n2: "idowu o. daniel", expected: true }
  ];

  let test1Passed = true;
  for (const pair of namePairs) {
    const res = fuzzyNameMatch(pair.n1, pair.n2);
    const passed = res === pair.expected;
    console.log(`  - fuzzyNameMatch("${pair.n1}", "${pair.n2}") = ${res} [Expected: ${pair.expected}] -> ${passed ? "PASS" : "FAIL"}`);
    if (!passed) test1Passed = false;
  }
  console.log(test1Passed ? "✅ Test 1 Passed" : "❌ Test 1 Failed");

  // Test 2: CSRF Token Generation & Verification
  console.log("\n[Test 2] CSRF Token Lifecycle...");
  const invoiceId = crypto.randomUUID();
  const clientIp = "192.168.1.100";
  
  const token = generateCsrfToken(invoiceId, clientIp);
  const isValid = verifyCsrfToken(token, invoiceId, clientIp);
  const isInvalidIp = verifyCsrfToken(token, invoiceId, "192.168.1.200");
  const isInvalidInvoice = verifyCsrfToken(token, crypto.randomUUID(), clientIp);

  console.log(`  - Token generated: ${token.substring(0, 30)}...`);
  console.log(`  - Verify with correct IP/Invoice: ${isValid} (Expected: true)`);
  console.log(`  - Verify with invalid IP: ${isInvalidIp} (Expected: false)`);
  console.log(`  - Verify with invalid Invoice ID: ${isInvalidInvoice} (Expected: false)`);

  const test2Passed = isValid && !isInvalidIp && !isInvalidInvoice;
  console.log(test2Passed ? "✅ Test 2 Passed" : "❌ Test 2 Failed");

  // Test 3: Request Signing and Replay Attack Protection
  console.log("\n[Test 3] Request Signature and Expiry window...");
  const fingerprint = "a1b2c3d4e5f6g7h8";
  const now = Date.now();
  const timestamp = now.toString();
  
  // Client calculates signature using CSRF token as the key
  const signature = crypto
    .createHmac("sha256", token)
    .update(`${timestamp}:${fingerprint}`)
    .digest("hex");

  // Server verifies signature
  const isSigValid = verifyRequestSignature(signature, timestamp, fingerprint, token);
  
  // Replay protection check: timestamp older than 5 minutes (e.g., 6 minutes ago)
  const oldTimestamp = (now - 6 * 60 * 1000).toString();
  const oldSignature = crypto
    .createHmac("sha256", token)
    .update(`${oldTimestamp}:${fingerprint}`)
    .digest("hex");
  const isOldSigRejected = !verifyRequestSignature(oldSignature, oldTimestamp, fingerprint, token);

  console.log(`  - Signature generated: ${signature.substring(0, 20)}...`);
  console.log(`  - Server verifies valid signature: ${isSigValid} (Expected: true)`);
  console.log(`  - Server rejects expired timestamp (6 min old): ${isOldSigRejected} (Expected: true)`);

  const test3Passed = isSigValid && isOldSigRejected;
  console.log(test3Passed ? "✅ Test 3 Passed" : "❌ Test 3 Failed");

  // Test 4: Score Calculation & Threshold Classification
  console.log("\n[Test 4] Scorer and Match Confirmation Scenarios...");
  
  const invoice = {
    amount: 150000,
    accountNumber: "0123456789",
    accountName: "Idowu Daniel"
  };

  const context = {
    isReferenceDuplicate: false,
    isFileModifiedRecently: false,
    failedAttemptsCount: 0
  };

  // Scenario 4a: Perfect Match (CONFIRMED)
  const extractPerfect = {
    amount: 150000,
    accountNumber: "0123456789",
    accountName: "Idowu Daniel",
    bankName: "OPay",
    transactionDate: "2026-06-15",
    transactionTime: "08:30",
    transactionReference: "REF12345",
    senderName: "Client Name",
    senderBank: "Zenith Bank",
    confidence: "HIGH" as const,
    receiptType: "opay" as const,
    rawAmountText: "150,000.00"
  };
  const resPerfect = matchReceipt(extractPerfect, invoice, context);
  console.log(`  - Scenario Perfect Match (Score: ${resPerfect.confidenceScore}) -> Outcome: ${resPerfect.overallMatch} (Expected: CONFIRMED)`);

  // Scenario 4b: Mismatched Account Number (Immediate FAILED)
  const extractBadAcc = { ...extractPerfect, accountNumber: "9999999999" };
  const resBadAcc = matchReceipt(extractBadAcc, invoice, context);
  console.log(`  - Scenario Account Number Mismatch (Score: ${resBadAcc.confidenceScore}) -> Outcome: ${resBadAcc.overallMatch} (Expected: FAILED)`);

  // Scenario 4c: Amount Within Tolerance (₦50 short) (CONFIRMED / PARTIAL depending on score)
  // Account number (+40) + Name Match (+20) + Amount Tolerance (+20) + Gemini HIGH (+10) + Reference (+5) = 95 -> CONFIRMED
  const extractTolAmount = { ...extractPerfect, amount: 149950 };
  const resTolAmount = matchReceipt(extractTolAmount, invoice, context);
  console.log(`  - Scenario Amount Within Tolerance (Score: ${resTolAmount.confidenceScore}) -> Outcome: ${resTolAmount.overallMatch} (Expected: CONFIRMED)`);

  // Scenario 4d: Amount ₦200 short (Immediate FAILED)
  const extractShortAmount = { ...extractPerfect, amount: 149800 };
  const resShortAmount = matchReceipt(extractShortAmount, invoice, context);
  console.log(`  - Scenario Amount Short by ₦200 (Score: ${resShortAmount.confidenceScore}) -> Outcome: ${resShortAmount.overallMatch} (Expected: FAILED)`);

  // Scenario 4e: Suspicious override (Duplicate Reference)
  const resDupRef = matchReceipt(extractPerfect, invoice, { ...context, isReferenceDuplicate: true });
  console.log(`  - Scenario Duplicate Reference (Score: ${resDupRef.confidenceScore}) -> Outcome: ${resDupRef.overallMatch} (Expected: SUSPICIOUS)`);

  // Scenario 4f: Suspicious override (Amount is ₦0)
  const extractZeroAmount = { ...extractPerfect, amount: 0 };
  const resZeroAmount = matchReceipt(extractZeroAmount, invoice, context);
  console.log(`  - Scenario Amount is ₦0 (Score: ${resZeroAmount.confidenceScore}) -> Outcome: ${resZeroAmount.overallMatch} (Expected: SUSPICIOUS)`);

  const test4Passed = 
    resPerfect.overallMatch === "CONFIRMED" &&
    resBadAcc.overallMatch === "FAILED" &&
    resTolAmount.overallMatch === "CONFIRMED" &&
    resShortAmount.overallMatch === "FAILED" &&
    resDupRef.overallMatch === "SUSPICIOUS" &&
    resZeroAmount.overallMatch === "SUSPICIOUS";
  console.log(test4Passed ? "✅ Test 4 Passed" : "❌ Test 4 Failed");

  console.log("\n=== Test Results Summary ===");
  if (test1Passed && test2Passed && test3Passed && test4Passed) {
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
  } else {
    console.error("❌ SOME TESTS FAILED. PLEASE AUDIT CODE.");
  }
}

runTests();
