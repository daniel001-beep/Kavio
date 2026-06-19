import { db } from "@/src/db";
import { workspaces, businesses, users } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type } = await req.json();

    if (type !== "freelancer" && type !== "employer") {
      return NextResponse.json({ error: "Invalid workspace type specified" }, { status: 400 });
    }

    // Check if workspace already exists for this user to prevent duplicates
    const existing = await db.query.workspaces.findFirst({
      where: and(eq(workspaces.userId, userId), eq(workspaces.type, type)),
    });

    if (existing) {
      return NextResponse.json({ success: true, workspace: existing });
    }

    // Create the workspace
    const newWorkspace = await db.insert(workspaces).values({
      userId,
      type,
      name: type === "employer" ? "Employer Workspace" : "Freelancer Workspace",
    }).returning();

    // Specific logic for employer: Ensure a business profile exists
    if (type === "employer") {
      const existingBusiness = await db.query.businesses.findFirst({
        where: eq(businesses.userId, userId),
      });
      if (!existingBusiness) {
        await db.insert(businesses).values({
          userId,
          name: "My Business",
          industry: "Other",
        });
      }
    }

    // Fallback: update legacy role field so other parts of the app don't break immediately
    await db.update(users).set({ role: type }).where(eq(users.id, userId));

    return NextResponse.json({ success: true, workspace: newWorkspace[0] });
  } catch (error: any) {
    console.error("Failed to create workspace:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userWorkspaces = await db.query.workspaces.findMany({
      where: eq(workspaces.userId, userId),
    });

    return NextResponse.json({ success: true, workspaces: userWorkspaces });
  } catch (error: any) {
    console.error("Failed to fetch workspaces:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
