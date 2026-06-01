import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const userEmail = req.auth?.user?.email;
  
  const isFintechRoute = req.nextUrl.pathname.startsWith("/fintech");
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin") || req.nextUrl.pathname.startsWith("/fintech/admin");

  // Require login for all fintech routes
  if (isFintechRoute && !isLoggedIn) {
    return Response.redirect(new URL("/auth/signin", req.nextUrl));
  }

  // Strict Admin RBAC
  if (isAdminRoute) {
    if (!isLoggedIn) {
      return Response.redirect(new URL("/auth/signin", req.nextUrl));
    }
    
    // Only allow this exact email (case-insensitive and trimmed)
    const normalizedEmail = userEmail ? userEmail.toLowerCase().trim() : "";
    if (normalizedEmail !== "idowuisdaniel1@gmail.com") {
      return Response.redirect(new URL("/dashboard?error=unauthorized_admin", req.nextUrl));
    }
  }
});

export const config = {
  // Run middleware on /fintech and /admin routes
  matcher: ["/fintech/:path*", "/admin/:path*"],
};
