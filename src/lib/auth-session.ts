import { cookies } from "next/headers";
import { auth } from "@/auth";

export async function getResilientSession() {
  try {
    const cookieStore = await cookies();
    const localUserCookie = cookieStore.get('velox-local-user');
    if (localUserCookie?.value) {
      let val = localUserCookie.value.trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      let decoded = decodeURIComponent(val);
      if (decoded.includes('%')) {
        decoded = decodeURIComponent(decoded);
      }
      let user = JSON.parse(decoded);
      if (typeof user === 'string') {
        user = JSON.parse(user);
      }
      if (user && user.id) {
        return {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            isAdmin: !!user.isAdmin
          }
        };
      }
    }
  } catch (e) {
    console.error("Error reading local user cookie in resilient session parser:", e);
  }
  
  // Fallback to NextAuth session
  try {
    return await auth();
  } catch (e) {
    console.error("NextAuth auth() failed in resilient session fallback:", e);
    return null;
  }
}
