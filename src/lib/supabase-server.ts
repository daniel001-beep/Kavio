import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { cleanEnvVar } from './env-cleaner';

/**
 * Creates a Supabase client for use in Server Actions and Server Components.
 * This client automatically handles authentication state via cookies.
 */
export async function createClient() {
  const cookieStore = await cookies();

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
    // Return a dummy client or throw a more descriptive error that we can catch
    console.error("Supabase environment variables are missing or invalid!");
    return null as any;
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  );
}
