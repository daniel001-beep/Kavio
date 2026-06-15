"use client";

import { useSession } from "@/app/context/AuthContext";

/**
 * HeaderUser — displays the logged-in user's name, email, and a
 * live green pulse dot indicating the Supabase WebSocket is connected.
 */
export default function HeaderUser() {
  const { data: session } = useSession();

  const name = session?.user?.name || session?.user?.email?.split("@")[0] || "User";
  const firstName = name.trim().split(" ")[0];
  const initials = name
    .trim()
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const email = session?.user?.email || "";

  return (
    <div className="flex items-center gap-3 h-8">
      {/* Avatar with live pulse indicator */}
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-emerald-700 text-xs shrink-0">
          {initials}
        </div>
        {/* Live WebSocket indicator */}
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm">
          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
        </span>
      </div>

      <div className="text-left hidden sm:block">
        <p className="text-sm font-extrabold text-slate-900 leading-tight capitalize">{firstName}</p>
      </div>
    </div>
  );
}
