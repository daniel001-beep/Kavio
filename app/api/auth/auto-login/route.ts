import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const adminEmail = (process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || "idowuisdaniel1@gmail.com").toLowerCase().trim();
  
  try {
    let adminUser = await db.query.users.findFirst({
      where: eq(users.email, adminEmail),
    });

    if (!adminUser) {
      // Create admin user dynamically using pre-hashed password
      const hashedPassword = "$2b$12$uiLSU1F9Qhrhe45xGT3c1uXfXC6GoSJiDeh5.9Apj9uoySpuv8v3u";
      const [newAdmin] = await db.insert(users).values({
        id: "user_seed",
        name: "Daniel Idowu",
        email: adminEmail,
        password: hashedPassword,
        isAdmin: true,
      }).returning();
      adminUser = newAdmin;
    } else {
      // Ensure isAdmin is true
      if (!adminUser.isAdmin) {
        await db.update(users)
          .set({ isAdmin: true })
          .where(eq(users.id, adminUser.id));
        adminUser.isAdmin = true;
      }
    }

    // Set cookies to auto-login
    const cookieStore = await cookies();
    cookieStore.set('velox-local-user', encodeURIComponent(JSON.stringify({
      id: adminUser.id,
      email: adminEmail,
      name: adminUser.name || "Daniel Idowu",
      isAdmin: true
    })), {
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    cookieStore.set('sb-access-token', 'mock-token', { path: '/' });

    // Redirect to dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (err: any) {
    console.error("Auto-login error:", err);
    return NextResponse.json({ error: err.message || "Failed to auto-login" }, { status: 500 });
  }
}
