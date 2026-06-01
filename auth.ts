import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Founder Access",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "founder@velox.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Demo Mode Authentication
        // Accepting any password for the presentation to avoid login friction
        if (credentials?.email && credentials?.password) {
          return {
            id: "vc-demo-id-1",
            name: "Velox Founder",
            email: credentials.email as string,
            isAdmin: true,
          };
        }
        return null;
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
    jwt: ({ token, user }: any) => {
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin;
        token.email = user.email; // explicitly store email in token
      }
      // Grant admin rights if the email matches the environment variable
      if (token.email && process.env.ADMIN_EMAIL && token.email === process.env.ADMIN_EMAIL) {
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
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "development_secret_fallback_for_velox_ledger_32_characters",
});
