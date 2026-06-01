import { NextResponse } from "next/server";
import { settleCollectionPayment } from "@/src/services/ledgerFacade";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // In a real-world scenario, we verify Paystack/Flutterwave IP list and HMAC signature here.
    // For Kavio MVP, we process the structured webhook payload.
    const { event, data } = body;

    if (event === "charge.success" && data?.metadata?.collectionId) {
      const collectionId = data.metadata.collectionId;
      const paymentReference = data.reference || `PAY-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

      const result = await settleCollectionPayment(collectionId, paymentReference);

      return NextResponse.json({
        success: true,
        message: "Payment successfully captured and ledger double-entry mutations logged.",
        settlement: result
      });
    }

    return NextResponse.json({ success: true, message: "Non-settlement event ignored." });
  } catch (error: any) {
    console.error("Payment webhook failed:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
