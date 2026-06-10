/**
 * Centralized, bulletproof utility to sanitize environment variables.
 * It splits by quotes, spaces, and trims trailing/leading junk or parentheses
 * introduced by environment variable parsers or copy-paste issues.
 */
export function cleanEnvVar(val: string | undefined): string {
  if (!val) return "";
  const parts = val.split(/["'\s]/);
  for (const part of parts) {
    const trimmed = part.trim();
    if (
      trimmed.startsWith("postgres://") ||
      trimmed.startsWith("postgresql://") ||
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://")
    ) {
      return trimmed.replace(/[()]+$/g, "").trim();
    }
  }
  
  // If it's a key or token (looks like jwt or anon key, has no protocol)
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed && trimmed.length > 20 && !trimmed.includes("key") && !trimmed.includes("production")) {
      return trimmed.replace(/[()]+$/g, "").trim();
    }
  }

  return val.trim().replace(/^["'()]+|["'()]+$/g, "").trim();
}
