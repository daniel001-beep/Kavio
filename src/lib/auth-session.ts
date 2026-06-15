import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { eq } from "drizzle-orm";

export async function getResilientSession() {
  try {
    const authObject = await auth();
    const userId = authObject.userId;

    if (!userId) {
      return null;
    }

    // Query database with a 1.2-second timeout to handle paused Supabase DBs gracefully
    const dbQueryPromise = db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), 1200);
    });

    let dbUser = null;
    try {
      dbUser = await Promise.race([dbQueryPromise, timeoutPromise]);
    } catch (dbError) {
      console.warn("Database query failed, falling back to Clerk:", dbError);
    }

    // Sync on-demand or fallback if the user record is not retrieved within timeout
    if (!dbUser) {
      try {
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);
        const email = clerkUser.emailAddresses[0]?.emailAddress || "";
        const name = clerkUser.fullName || clerkUser.firstName || email.split("@")[0];

        const adminEmail = (process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").toLowerCase().trim();
        const isAdmin = adminEmail && email.toLowerCase().trim() === adminEmail;

        // Try to insert user, wrapped in a 1-second timeout
        const insertPromise = db
          .insert(users)
          .values({
            id: userId,
            email: email.toLowerCase().trim(),
            name: name,
            isAdmin: !!isAdmin,
          })
          .returning();

        const insertTimeoutPromise = new Promise<null>((resolve) => {
          setTimeout(() => resolve(null), 1000);
        });

        const insertResult = await Promise.race([insertPromise, insertTimeoutPromise]).catch(() => null);

        if (insertResult && insertResult[0]) {
          dbUser = insertResult[0];
        } else {
          // If insert failed or timed out, use fallback session from Clerk metadata
          return {
            user: {
              id: userId,
              email: email,
              name: name,
              isAdmin: !!isAdmin,
            },
          };
        }
      } catch (syncError) {
        console.error("Error syncing Clerk user to local DB:", syncError);
        // Fallback session object even if database sync fails (so app doesn't crash)
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);
        const email = clerkUser.emailAddresses[0]?.emailAddress || "";
        return {
          user: {
            id: userId,
            email: email,
            name: clerkUser.fullName || clerkUser.firstName || email.split("@")[0],
            isAdmin: false,
          }
        };
      }
    }

    return {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        isAdmin: dbUser.isAdmin,
      },
    };
  } catch (error) {
    console.error("Error retrieving resilient session via Clerk:", error);
    return null;
  }
}
