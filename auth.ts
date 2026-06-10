import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "Founder Access",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "founder@velox.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

        try {
          const { db } = await import("@/src/db");
          const { users } = await import("@/src/db/schema");
          const { eq } = await import("drizzle-orm");

          const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email),
          });

          if (!existingUser) {
            // dynamic registration of new user
            const userId = `usr_${Math.random().toString(36).substring(2, 11)}`;
            const adminEmail = (process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase().trim();
            const isAdmin = adminEmail && email === adminEmail;
            
            const bcrypt = await import("bcryptjs");
            const hashedPassword = await bcrypt.hash(password, 12);

            const [newUser] = await db.insert(users).values({
              id: userId,
              email: email,
              name: email.split("@")[0],
              password: hashedPassword,
              isAdmin: !!isAdmin,
            }).returning();

            return {
              id: newUser.id,
              name: newUser.name,
              email: newUser.email,
              isAdmin: newUser.isAdmin,
            };
          } else {
            const adminEmail = (process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase().trim();
            const shouldBeAdmin = adminEmail && email === adminEmail;

            // Sync the admin flag in Drizzle if not set
            if (shouldBeAdmin && !existingUser.isAdmin) {
              await db.update(users)
                .set({ isAdmin: true })
                .where(eq(users.id, existingUser.id));
              existingUser.isAdmin = true;
            }

            // If no password saved yet (first time via OAuth/seed), save their password securely
            if (!existingUser.password) {
              const bcrypt = await import("bcryptjs");
              const hashedPassword = await bcrypt.hash(password, 12);

              await db.update(users)
                .set({ password: hashedPassword })
                .where(eq(users.id, existingUser.id));

              return {
                id: existingUser.id,
                name: existingUser.name,
                email: existingUser.email,
                isAdmin: existingUser.isAdmin,
              };
            }

            // Verify password matches what was saved
            let isPasswordValid = false;
            if (existingUser.password.startsWith("$2a$") || existingUser.password.startsWith("$2b$") || existingUser.password.length > 30) {
              const bcrypt = await import("bcryptjs");
              isPasswordValid = await bcrypt.compare(password, existingUser.password);
            } else {
              isPasswordValid = existingUser.password === password;
              if (isPasswordValid) {
                // Auto-upgrade legacy plain-text password to secure bcrypt hash
                try {
                  const bcrypt = await import("bcryptjs");
                  const hashedPassword = await bcrypt.hash(password, 12);
                  await db.update(users)
                    .set({ password: hashedPassword })
                    .where(eq(users.id, existingUser.id));
                  console.log(`[Auth] Upgraded plain-text password to bcrypt for ${email}`);
                } catch (upgradeErr) {
                  console.error("[Auth] Failed to upgrade legacy password:", upgradeErr);
                }
              }
            }

            if (isPasswordValid) {
              return {
                id: existingUser.id,
                name: existingUser.name,
                email: existingUser.email,
                isAdmin: existingUser.isAdmin,
              };
            }

            // Wrong password
            return null;
          }
        } catch (err) {
          console.error("Authorization database query error:", err);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }: any) {
      if (user && user.email) {
        try {
          const { db } = await import("@/src/db");
          const { auditLogs } = await import("@/src/db/schema");
          const { headers } = await import("next/headers");
          
          let locationIp = "127.0.0.1";
          let userAgent = "Velox Auth";
          try {
            const headersList = await headers();
            const xForwardedFor = headersList.get("x-forwarded-for") || "";
            locationIp = xForwardedFor ? xForwardedFor.split(",")[0].trim() : "127.0.0.1";
            userAgent = headersList.get("user-agent") || "Velox Auth";
          } catch (headerErr) {}

          await db.insert(auditLogs).values({
            userId: user.id || null,
            eventType: "AUTH_SUCCESS",
            entityType: "user",
            entityId: user.id || "unknown",
            ipAddress: locationIp,
            userAgent: userAgent,
            metadata: { email: user.email, provider: account?.provider || "credentials" }
          });
        } catch (e) {
          console.error("[Auth Callback] Failed to insert AUTH_SUCCESS audit log:", e);
        }
      }
      return true;
    },
    jwt: ({ token, user }: any) => {
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin;
        token.email = user.email; // explicitly store email in token
      }
      // Grant admin rights if the email matches the environment variable or explicit admin accounts
      const adminEmail = (process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase().trim();
      if (token.email && adminEmail && token.email.toLowerCase().trim() === adminEmail) {
        token.isAdmin = true;
      }
      return token;
    },
    session: ({ session, token }: any) => {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.email = token.email as string; // explicitly surface email to middleware
      }
      return session;
    },
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
});
