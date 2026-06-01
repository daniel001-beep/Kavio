import { getResilientSession } from "@/src/lib/auth-session";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getResilientSession();
  const isAdmin = session?.user?.isAdmin;
  const adminEmail = (process.env.ADMIN_EMAIL || "idowuisdaniel1@gmail.com").toLowerCase().trim();
  const isAuthorizedEmail = session?.user?.email && session.user.email.toLowerCase().trim() === adminEmail;

  // Enforce strict administrator authorization
  if (!isAdmin && !isAuthorizedEmail) {
    redirect("/dashboard?error=unauthorized_admin");
  }

  return <>{children}</>;
}
