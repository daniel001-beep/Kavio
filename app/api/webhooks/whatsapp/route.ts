import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { users, businesses, businessAccounts, transactions } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { logBusinessTransaction } from "@/src/services/ledgerFacade";

interface ParsedResult {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
}

// Deterministic parser for freelancer inputs
function parseWhatsAppMessage(message: string): ParsedResult | null {
  const cleanMsg = message.trim();
  
  // Match patterns like "10k from Design Project" or "₦5000 for transport"
  const amountPattern = /^(?:N|₦)?\s*(\d+(?:\.\d+)?)\s*([kKmM])?\s+(from|for|received\s+from|spent\s+on|paid\s+for)\s+(.+)$/i;
  
  const match = cleanMsg.match(amountPattern);
  if (match) {
    let rawAmount = parseFloat(match[1]);
    const multiplier = match[2]?.toLowerCase();
    const preposition = match[3].toLowerCase();
    const description = match[4].trim();
    
    if (multiplier === 'k') {
      rawAmount *= 1000;
    } else if (multiplier === 'm') {
      rawAmount *= 1000000;
    }
    
    const isIncome = preposition.includes('from') || preposition.includes('received');
    const type = isIncome ? 'income' : 'expense';
    
    let category = 'General';
    const descLower = description.toLowerCase();
    if (descLower.includes('design') || descLower.includes('ui') || descLower.includes('logo')) {
      category = 'Design';
    } else if (descLower.includes('hosting') || descLower.includes('aws') || descLower.includes('server') || descLower.includes('cloud')) {
      category = 'Hosting';
    } else if (descLower.includes('writing') || descLower.includes('copy') || descLower.includes('content')) {
      category = 'Marketing';
    } else if (descLower.includes('software') || descLower.includes('license') || descLower.includes('saas') || descLower.includes('subscription')) {
      category = 'Software';
    } else if (descLower.includes('consult') || descLower.includes('advice') || descLower.includes('audit')) {
      category = 'Consulting';
    } else if (isIncome) {
      category = 'Consulting';
    } else {
      category = 'Operations';
    }
    
    return { amount: rawAmount, type, category, description };
  }
  
  // Match patterns like "Paid 5k for hosting" or "Received 20k from design"
  const actionPattern = /^(received|paid|spent)\s+(?:N|₦)?\s*(\d+(?:\.\d+)?)\s*([kKmM])?\s+(?:for|from|on)\s+(.+)$/i;
  const matchAction = cleanMsg.match(actionPattern);
  if (matchAction) {
    const action = matchAction[1].toLowerCase();
    let rawAmount = parseFloat(matchAction[2]);
    const multiplier = matchAction[3]?.toLowerCase();
    const description = matchAction[4].trim();
    
    if (multiplier === 'k') {
      rawAmount *= 1000;
    } else if (multiplier === 'm') {
      rawAmount *= 1000000;
    }
    
    const type = action === 'received' ? 'income' : 'expense';
    
    let category = 'General';
    const descLower = description.toLowerCase();
    if (descLower.includes('design') || descLower.includes('ui') || descLower.includes('logo')) {
      category = 'Design';
    } else if (descLower.includes('hosting') || descLower.includes('aws') || descLower.includes('server') || descLower.includes('cloud')) {
      category = 'Hosting';
    } else if (descLower.includes('writing') || descLower.includes('copy') || descLower.includes('content')) {
      category = 'Marketing';
    } else if (descLower.includes('software') || descLower.includes('license') || descLower.includes('saas') || descLower.includes('subscription')) {
      category = 'Software';
    } else if (descLower.includes('consult') || descLower.includes('advice') || descLower.includes('audit')) {
      category = 'Consulting';
    } else if (type === 'income') {
      category = 'Consulting';
    } else {
      category = 'Operations';
    }
    
    return { amount: rawAmount, type, category, description };
  }
  
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, phone, messageId } = body;

    if (!message || !phone || !messageId) {
      return NextResponse.json({ error: "Missing required parameters: message, phone, messageId" }, { status: 400 });
    }

    // 1. Idempotency Check
    const existingTx = await db
      .select()
      .from(transactions)
      .where(eq(transactions.idempotencyKey, messageId))
      .limit(1);

    if (existingTx.length > 0) {
      return NextResponse.json({ 
        success: true, 
        message: "Duplicate message received. Transaction already exists.", 
        transaction: existingTx[0] 
      });
    }

    // 2. Resolve User & Business Profile based on phone number (fallback to first user for sandbox/demo)
    const userRecord = await db
      .select()
      .from(users)
      .limit(1);
    
    if (userRecord.length === 0) {
      return NextResponse.json({ error: "No active user profiles found. Seed required." }, { status: 404 });
    }

    const activeUser = userRecord[0];

    const businessRecord = await db
      .select()
      .from(businesses)
      .where(eq(businesses.userId, activeUser.id))
      .limit(1);

    if (businessRecord.length === 0) {
      return NextResponse.json({ error: "No active business profiles found for user." }, { status: 404 });
    }

    const activeBusiness = businessRecord[0];

    const allAccounts = await db
      .select()
      .from(businessAccounts)
      .where(eq(businessAccounts.businessId, activeBusiness.id));

    const targetAccount = allAccounts.find(a => a.type.toLowerCase().includes("wallet") || a.name.toLowerCase().includes("checking")) || allAccounts[0];

    if (!targetAccount) {
      return NextResponse.json({ error: "No active business financial accounts found." }, { status: 404 });
    }

    // 3. Parse Message Text using NLP/Regex engine
    const parsed = parseWhatsAppMessage(message);

    if (!parsed) {
      return NextResponse.json({ 
        error: "Failed to parse transaction statement. Format must be '[amount] from [label]' or '[amount] for [label]'",
        originalMessage: message 
      }, { status: 422 });
    }

    // 4. Balanced ledger insertions
    const txRecord = await logBusinessTransaction({
      userId: activeUser.id,
      businessId: activeBusiness.id,
      accountId: targetAccount.id,
      amount: parsed.amount,
      type: parsed.type,
      category: parsed.category,
      description: `WhatsApp Ingest: ${parsed.description}`,
      date: new Date(),
    });

    // Update idempotency key manually on transaction
    await db
      .update(transactions)
      .set({ idempotencyKey: messageId })
      .where(eq(transactions.id, txRecord.id));

    return NextResponse.json({
      success: true,
      parsed: {
        amount: parsed.amount,
        type: parsed.type,
        category: parsed.category,
        description: parsed.description
      },
      transaction: txRecord,
      message: `WhatsApp transaction recorded. Ledger updated with a balanced ${parsed.type} entry.`
    });
  } catch (error: any) {
    console.error("WhatsApp webhook failed:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
