import { redirect } from "next/navigation";

export default function GlobalAdminRootPage() {
  redirect("/admin/db-status");
}
