import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import CreateWorkspaceClient from "../components/CreateWorkspaceClient";

export default async function VerificationGate({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/auth/signin");
  }

  // Verify they are a freelancer
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    redirect("/onboarding");
  }

  // Verify they have a freelancer workspace
  const workspace = await db.query.workspaces.findFirst({
    where: (ws, { eq, and }) => and(eq(ws.userId, userId), eq(ws.type, "freelancer")),
  });

  if (!workspace) {
    return <CreateWorkspaceClient type="freelancer" />;
  }

  // Set Sentry Context dynamically
  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.setUser({
      id: user.id,
      email: user.email || undefined,
      username: user.name || undefined,
    });
    Sentry.setTag("workspace_type", "freelancer");
    Sentry.setTag("current_plan", user.plan_type || "free");
  } catch (e) {}

  return <>{children}</>;
}
