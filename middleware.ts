import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { cleanEnvVar } from './src/lib/env-cleaner';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = cleanEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = cleanEnvVar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  let isValidUrl = false;
  if (supabaseUrl && (supabaseUrl.startsWith("http://") || supabaseUrl.startsWith("https://"))) {
    try {
      new URL(supabaseUrl);
      isValidUrl = !supabaseUrl.includes("YOUR_SUPABASE_URL") && !supabaseUrl.includes("placeholder");
    } catch {
      isValidUrl = false;
    }
  }

  if (!isValidUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: DO NOT remove or modify supabase.auth.getUser() call.
  // This refreshes the session token and fetches the user object.
  let user: any = null;
  const localUserCookie = request.cookies.get('velox-local-user');
  if (localUserCookie?.value) {
    try {
      let val = localUserCookie.value.trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      let decoded = decodeURIComponent(val);
      if (decoded.includes('%')) {
        decoded = decodeURIComponent(decoded);
      }
      user = JSON.parse(decoded);
    } catch (e) {
      try {
        let val = localUserCookie.value.trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1);
        }
        user = JSON.parse(val);
      } catch (innerErr) {
        console.error('Failed to parse local user cookie', innerErr);
      }
    }
  }

  if (!user) {
    const authRes = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    user = authRes?.data?.user || null;
  }

  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth');
  const isFintechRoute = request.nextUrl.pathname.startsWith('/fintech');
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname === '/dashboard';
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/fintech/admin');

  // Any logged-in user is authorized to access general fintech routes
  const isAuthorized = !!user;
  const isProtectedRoute = isFintechRoute || isAdminRoute || isDashboardRoute;

  // 1. If not logged in and requesting a protected route, redirect to sign-in
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/signin';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // 2. If logged in but not authorized, redirect to sign-in with error and clear cookies
  if (user && !isAuthorized && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/signin';
    url.searchParams.set('error', 'registration_disabled');
    const response = NextResponse.redirect(url);
    response.cookies.delete('velox-local-user');
    response.cookies.delete('sb-access-token');
    return response;
  }

  // 3. If logged in, authorized, and requesting an auth route, redirect to /dashboard
  if (user && isAuthorized && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // 4. If logged in and hitting the legacy /fintech/dashboard, redirect to unified /dashboard
  if (user && isAuthorized && request.nextUrl.pathname === '/fintech/dashboard') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // 5. Strict Admin RBAC
  if (isAdminRoute) {
    const normalizedEmail = user?.email ? user.email.toLowerCase().trim() : "";
    const adminEmail = (process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").toLowerCase().trim();
    const isUserAdmin = normalizedEmail === adminEmail || 
                        normalizedEmail === 'admin@velox.com' || 
                        normalizedEmail === 'daniel@velox.com';
    if (!isUserAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      url.searchParams.set('error', 'unauthorized_admin');
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, icons, and logo assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
