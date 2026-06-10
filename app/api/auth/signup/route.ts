import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = body.email?.toLowerCase().trim();
    const password = body.password;
    const name = body.name;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // 1. Check if user already exists with retry
    const MAX_RETRIES = 2;
    let existingUser;
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        existingUser = await db.query.users.findFirst({
          where: eq(users.email, email),
        });
        break;
      } catch (error) {
        if (i === MAX_RETRIES - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 3. Create user with retry
    let newUser;
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        const results = await db.insert(users).values({
          id: crypto.randomUUID(),
          email,
          password: hashedPassword,
          name: name || email.split("@")[0],
          isAdmin: false,
        }).returning();
        newUser = results[0];
        break;
      } catch (error) {
        if (i === MAX_RETRIES - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return NextResponse.json(
      { message: "User created successfully", userId: newUser.id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
