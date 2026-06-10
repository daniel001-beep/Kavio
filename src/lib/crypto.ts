import crypto from 'crypto';

/**
 * Calculates a SHA-256 hash for a ledger transaction to ensure audit integrity.
 * 
 * @param amount - The transaction amount in cents/kobo (BigInt).
 * @param userId - The ID of the user.
 * @param timestamp - The timestamp of the transaction.
 * @param previousHash - The hash of the user's previous transaction.
 * @returns The resulting SHA-256 hash string.
 */
export function generateTransactionHash(
  amount: bigint,
  userId: string,
  timestamp: Date,
  previousHash: string | null
): string {
  const dataString = `${amount.toString()}|${userId}|${timestamp.toISOString()}|${previousHash || 'GENESIS'}`;
  return crypto.createHash('sha256').update(dataString).digest('hex');
}
