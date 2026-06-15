import { NextResponse } from "next/server";
import { VerificationEngine } from "@/src/lib/verification-engine";
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
    
    if (!file) {
      return NextResponse.json({ error: "No receipt file uploaded" }, { status: 400 });
    }

    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    const userAgent = headersList.get("user-agent") || "Kavio Client Portal";

    // Buffer processing
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Call verification engine
    const result = await VerificationEngine.verifyReceipt(
      id,
      buffer,
      file.type,
      file.name,
      ipAddress,
      userAgent
    );

    if (result.error) {
      return NextResponse.json({ 
        error: result.error, 
        message: result.message 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: result.success,
      attemptId: result.attemptId,
      score: result.score,
      status: result.status,
      message: result.status === "AUTO_VERIFIED"
        ? "Payment Verified ✅"
        : (result.status === "MANUAL_REVIEW" ? "Payment Awaiting Manual Review ⏳" : "Receipt Rejected ❌")
    });

  } catch (error: any) {
    console.error("POST /api/invoices/[id]/verify-receipt error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
