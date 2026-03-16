/**
 * Tokenized Voucher — generates time-limited QR payloads to prevent screenshot fraud.
 *
 * The QR encodes: `barcode|timestamp|token`
 * - barcode: the voucher's unique code (VCH-XXXXXX-XXXXXX)
 * - timestamp: Unix seconds when the token was generated
 * - token: a short hash derived from barcode + timestamp + secret
 *
 * Tokens rotate every 60s. Staff scanner parses the payload and
 * validates that the token matches and is not older than 90s.
 */

const SECRET = 'cb-voucher-hmac-2024'; // In production, use env variable

/**
 * Simple hash function for client-side token generation.
 * For production, use a proper HMAC via crypto API or server-side generation.
 */
function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  // Convert to positive hex string, padded to 8 chars
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  return hex;
}

/**
 * Generate a tokenized QR payload for a voucher barcode.
 * Format: `barcode|timestamp|token`
 */
export function generateTokenizedPayload(barcode: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const token = simpleHash(`${barcode}:${timestamp}:${SECRET}`);
  return `${barcode}|${timestamp}|${token}`;
}

/**
 * Parse and validate a tokenized QR payload.
 * Returns the barcode if valid, or null if expired/invalid.
 */
export function parseTokenizedPayload(payload: string): {
  barcode: string;
  valid: boolean;
  error?: 'invalid_format' | 'expired' | 'invalid_token';
} {
  const parts = payload.split('|');

  // Fallback: if no pipe separator, treat as raw barcode (backward compat)
  if (parts.length === 1 && payload.startsWith('VCH-')) {
    return { barcode: payload, valid: true };
  }

  if (parts.length !== 3) {
    return { barcode: '', valid: false, error: 'invalid_format' };
  }

  const [barcode, timestampStr, token] = parts;
  const timestamp = parseInt(timestampStr, 10);
  const now = Math.floor(Date.now() / 1000);

  // Reject tokens older than 90 seconds
  if (now - timestamp > 90) {
    return { barcode, valid: false, error: 'expired' };
  }

  // Verify token
  const expectedToken = simpleHash(`${barcode}:${timestamp}:${SECRET}`);
  if (token !== expectedToken) {
    return { barcode, valid: false, error: 'invalid_token' };
  }

  return { barcode, valid: true };
}
