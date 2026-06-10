import { NextResponse } from "next/server";
import { VerificationEngine } from "@/src/services/verification";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    
    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const submittedRef = formData.get("submittedRef") as string || "";
    
    if (!file) {
      return NextResponse.json({ error: "No receipt file uploaded" }, { status: 400 });
    }

    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    const userAgent = headersList.get("user-agent") || "Kavio Client Portal";

    // Call verification engine
    const result = await VerificationEngine.verifyReceipt(
      id,
      file,
      submittedRef,
      ipAddress,
      userAgent
    );

    return NextResponse.json({
      success: result.success,
      attemptId: result.attemptId,
      score: result.score.totalScore,
      status: result.score.status,
      fraudFlags: result.score.fraudFlags,
      extractedAmount: result.extracted.amount,
      extractedRef: result.extracted.transaction_reference,
      reason: result.extracted.confidence_score < 70 ? "Gemini extraction confidence is low. Sent to manual review." : "OCR processing complete.",
      message: result.score.status === "AUTO_VERIFIED"
        ? "Payment Verified ✅"
        : (result.score.status === "MANUAL_REVIEW" ? "Payment Awaiting Manual Review ⏳" : "Receipt Rejected ❌")
    });

  } catch (error: any) {
    console.error("POST /api/invoices/[id]/verify-receipt error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
