import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { getResilientSession } from "@/src/lib/auth-session";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

/**
 * API Route: POST /api/user/settings
 * Safely changes user's password and/or full name inside the database.
 */
export async function POST(req: Request) {
  try {
    const session = await getResilientSession();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, oldPassword, newPassword } = body;

    // Retrieve the user from database
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    const updates: Partial<typeof users.$inferInsert> = {};

    // 1. Profile Details Update (Name)
    if (name && name.trim()) {
      updates.name = name.trim();
    }

    // 2. Password Change Logic
    if (newPassword) {
      if (!oldPassword) {
        return NextResponse.json({ error: "Current password is required to set a new password" }, { status: 400 });
      }

      // If user had a password saved, verify it first
      if (existingUser.password) {
        let isOldPasswordValid = false;
        
        // Match bcrypt or plain text fallback
        if (
          existingUser.password.startsWith("$2a$") ||
          existingUser.password.startsWith("$2b$") ||
          existingUser.password.length > 30
        ) {
          isOldPasswordValid = await bcrypt.compare(oldPassword, existingUser.password);
        } else {
          isOldPasswordValid = existingUser.password === oldPassword;
        }

        if (!isOldPasswordValid) {
          return NextResponse.json({ error: "Current password provided is incorrect" }, { status: 400 });
        }
      }

      // Hash the new password securely
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      updates.password = hashedPassword;
    }

    // Perform database updates
    if (Object.keys(updates).length > 0) {
      await db.update(users)
        .set(updates)
        .where(eq(users.id, userId));
    }

    return NextResponse.json({
      success: true,
      message: "Settings successfully updated in database",
      user: {
        id: userId,
        name: updates.name || existingUser.name,
        email: existingUser.email
      }
    });

  } catch (error: any) {
    console.error("Settings Update Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
