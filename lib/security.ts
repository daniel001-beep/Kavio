import * as crypto from "crypto";
import sharp from "sharp";

const SECRET = process.env.NEXTAUTH_SECRET || "kavio-secure-fallback-secret-minimum-32-chars";

/**
 * Generates a signed CSRF token for a given invoice and client IP.
 * The token format is: expiry_timestamp:signature
 */
export function generateCsrfToken(invoiceId: string, clientIp: string): string {
  // Token is valid for 2 hours (7200 seconds)
  const expiry = Date.now() + 2 * 60 * 60 * 1000;
  const payload = `${invoiceId}:${expiry}:${clientIp}`;
  const signature = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${expiry}:${signature}`;
}

/**
 * Verifies that the client-provided CSRF token is authentic, corresponds to the current invoice and IP, and is not expired.
 */
export function verifyCsrfToken(token: string, invoiceId: string, clientIp: string): boolean {
  try {
    if (!token || !token.includes(":")) return false;
    const [expiryStr, signature] = token.split(":");
    const expiry = Number(expiryStr);
    
    if (isNaN(expiry) || expiry < Date.now()) {
      return false; // Expired or invalid format
    }

    const payload = `${invoiceId}:${expiry}:${clientIp}`;
    const expectedSignature = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
    
    // Constant time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch (e) {
    return false;
  }
}

/**
 * Verifies the cryptographic request signature sent by the client.
 * The signature is an HMAC-SHA256 hash of the timestamp + fingerprint, using the CSRF token as the secret.
 */
export function verifyRequestSignature(
  signature: string,
  timestampStr: string,
  fingerprint: string,
  csrfToken: string
): boolean {
  try {
    if (!signature || !timestampStr || !fingerprint || !csrfToken) return false;
    
    const timestamp = Number(timestampStr);
    if (isNaN(timestamp)) return false;

    // Enforce request signing expiration: reject requests older than 5 minutes
    const diff = Math.abs(Date.now() - timestamp);
    if (diff > 5 * 60 * 1000) {
      return false;
    }

    const payload = `${timestampStr}:${fingerprint}`;
    const expectedSignature = crypto
      .createHmac("sha256", csrfToken)
      .update(payload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch (e) {
    return false;
  }
}

/**
 * Scans image files for metadata tampering or editing software signatures before stripping.
 */
export async function checkFileMetadataSuspicious(
  buffer: Buffer,
  mimeType: string
): Promise<{ suspicious: boolean; reason?: string }> {
  // Only image formats are supported by sharp metadata extraction
  if (!mimeType.startsWith("image/")) {
    return { suspicious: false };
  }

  try {
    const metadata = await sharp(buffer).metadata();
    
    // Look for EXIF/IPTC/XMP indicators containing editing software signatures
    if (metadata.exif) {
      const exifStr = metadata.exif.toString("utf-8").toLowerCase();
      const suspiciousSoftware = [
        "photoshop",
        "gimp",
        "canva",
        "illustrator",
        "paint.net",
        "coreldraw",
        "figma",
        "pixelmator",
        "snapseed"
      ];
      
      for (const software of suspiciousSoftware) {
        if (exifStr.includes(software)) {
          return {
            suspicious: true,
            reason: `Image file metadata contains references to editing software: ${software}`
          };
        }
      }
    }
    
    return { suspicious: false };
  } catch (e) {
    // If it fails to parse, it could be a corrupted or malformed image, which is suspicious in itself
    return { 
      suspicious: true, 
      reason: "Failed to read image metadata. The file structure may be altered or corrupted." 
    };
  }
}

/**
 * Sanitizes image files by stripping all EXIF metadata.
 */
export async function sanitizeImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
  if (!mimeType.startsWith("image/")) {
    return buffer; // Return PDF or non-image buffer as is
  }
  
  try {
    // sharp's default toBuffer() strips metadata automatically
    return await sharp(buffer).toBuffer();
  } catch (e) {
    throw new Error("Image sanitization failed. The image format might be invalid.");
  }
}
