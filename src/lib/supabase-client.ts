import { createBrowserClient } from '@supabase/ssr';
import { cleanEnvVar } from './env-cleaner';

export function createClient() {
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
    return createBrowserClient(
      "https://placeholder.supabase.co",
      "placeholder-key"
    );
  }

  try {
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error("Failed to create Supabase browser client:", err);
    return createBrowserClient(
      "https://placeholder.supabase.co",
      "placeholder-key"
    );
  }
}

// Retain a singleton client instance for general convenience
export const supabase = createClient();
