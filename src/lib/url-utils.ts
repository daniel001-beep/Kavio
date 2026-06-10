/**
 * Dynamic Base URL Utility
 * 
 * Provides the correct base URL for the current environment.
 * Priority: 
 * 1. NEXT_PUBLIC_SITE_URL (Manual override)
 * 2. NEXT_PUBLIC_VERCEL_URL (Automatic Vercel deployment URL)
 * 3. Default production URL
 */
export const getBaseUrl = () => {
  if (typeof window !== 'undefined') return ''; // browser should use relative url
  
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  
  // Default fallback for Velox Fintech
  return 'https://velox-fintech.vercel.app';
};
