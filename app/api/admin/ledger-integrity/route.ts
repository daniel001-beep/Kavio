import { NextResponse } from "next/server";
import { db } from "@/src/db";
export const dynamic = "force-dynamic";
import { transactions } from "@/src/db/schema";
import { asc, eq } from "drizzle-orm";
import * as crypto from "crypto";
import { getResilientSession } from "@/src/lib/auth-session";

export async function GET() {
  try {
    const session = await getResilientSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Invalid user session context. Unauthorized access blocked by Zero-Trust API gateway." }, { status: 401 });
    }

    console.log("[Ledger Integrity Audit] Beginning full-chain cryptographic audit...");
    
    // Fetch all transactions chronologically for this user only
    const rawTxList = await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(asc(transactions.createdAt));
    
    const auditChain: any[] = [];
    let isChainValid = true;
    let expectedPrevHash = "GENESIS_BLOCK";
    let tamperedBlockId: string | null = null;

    for (let i = 0; i < rawTxList.length; i++) {
      const tx = rawTxList[i];
      const txId = tx.id;
      const amount = tx.amount?.toString() || "0";
      const userId = tx.userId || "";
      const createdAt = tx.createdAt ? new Date(tx.createdAt).toISOString() : new Date().toISOString();
      
      // Extract stored hash metadata
      let meta = tx.metadata as any;
      if (typeof meta === "string") {
        try {
          meta = JSON.parse(meta);
        } catch (e) {
          meta = {};
        }
      } else if (!meta) {
        meta = {};
      }

      const storedHash = meta.hash || "MISSING";
      const storedPrevHash = meta.previous_hash || "MISSING";

      // Recalculate hash based on properties and expected previous hash in chain
      const dataToHash = `${txId}-${amount}-${userId}-${createdAt}-${expectedPrevHash}`;
      const recalculatedHash = crypto.createHash("sha256").update(dataToHash).digest("hex");

      // Verify block integrity
      const isBlockIntegrityValid = (storedHash === recalculatedHash) && (storedPrevHash === expectedPrevHash);
      
      let blockStatus: "VALID" | "TAMPERED" | "CORRUPTED" = "VALID";
      if (!isBlockIntegrityValid) {
        blockStatus = "TAMPERED";
        isChainValid = false;
        if (!tamperedBlockId) {
          tamperedBlockId = txId;
        }
      }

      auditChain.push({
        id: txId,
        amount: Number(amount) / 100,
        createdAt: tx.createdAt,
        storedHash,
        recalculatedHash,
        previousHash: storedPrevHash,
        expectedPrevHash,
        status: blockStatus,
      });

      // Move forward in the chain
      // If a block is valid, we use its stored hash. If it's tampered/missing, we pass forward the recalculated hash
      expectedPrevHash = storedHash !== "MISSING" ? storedHash : recalculatedHash;
    }

    return NextResponse.json({
      status: "SUCCESS",
      isValid: isChainValid,
      tamperedBlockId,
      totalBlocks: auditChain.length,
      auditChain,
    }, { status: 200 });

  } catch (err: any) {
    console.error("❌ Ledger Integrity Audit Error:", err);
    return NextResponse.json({
      status: "ERROR",
      message: "Internal server error during audit.",
      details: err.message,
    }, { status: 500 });
  }
}
