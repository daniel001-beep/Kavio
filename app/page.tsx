import { redirect } from "next/navigation";

export default function Home() {
  // Redirect root straight to the premium white dashboard workspace
  redirect("/dashboard");
}