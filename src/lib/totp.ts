// TOTP (Time-based One-Time Password) utilities for 2FA
// Using a simple implementation without external crypto dependencies

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateSecret(length = 20): string {
  const buffer = new Uint8Array(length);
  crypto.getRandomValues(buffer);
  let secret = '';
  for (let i = 0; i < length; i++) {
    secret += BASE32_CHARS[buffer[i] % 32];
  }
  return secret;
}

export function generateBackupCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const buffer = new Uint8Array(4);
    crypto.getRandomValues(buffer);
    const code = Array.from(buffer)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

export function generateQRCodeUrl(secret: string, email: string, issuer = 'HarmonyCentral'): string {
  const otpauth = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauth)}`;
}

// Base32 decode helper
function base32Decode(encoded: string): Uint8Array {
  const cleaned = encoded.toUpperCase().replace(/[^A-Z2-7]/g, '');
  const output = new Uint8Array(Math.floor(cleaned.length * 5 / 8));
  let bits = 0;
  let value = 0;
  let index = 0;
  
  for (const char of cleaned) {
    const charIndex = BASE32_CHARS.indexOf(char);
    if (charIndex === -1) continue;
    
    value = (value << 5) | charIndex;
    bits += 5;
    
    if (bits >= 8) {
      bits -= 8;
      output[index++] = (value >>> bits) & 0xff;
    }
  }
  
  return output.slice(0, index);
}

// HMAC-SHA1 implementation using Web Crypto API
async function hmacSha1(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const keyBuffer = key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength) as ArrayBuffer;
  const dataBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer);
  return new Uint8Array(signature);
}

// Generate TOTP code
export async function generateTOTP(secret: string, timeStep = 30): Promise<string> {
  const key = base32Decode(secret);
  const counter = Math.floor(Date.now() / 1000 / timeStep);
  
  // Convert counter to 8-byte big-endian
  const counterBytes = new Uint8Array(8);
  let temp = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = temp & 0xff;
    temp = Math.floor(temp / 256);
  }
  
  const hmac = await hmacSha1(key, counterBytes);
  
  // Dynamic truncation
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  ) % 1000000;
  
  return code.toString().padStart(6, '0');
}

// Verify TOTP code with window for clock drift
export async function verifyTOTP(secret: string, code: string, window = 1): Promise<boolean> {
  const timeStep = 30;
  const currentTime = Math.floor(Date.now() / 1000 / timeStep);
  
  for (let i = -window; i <= window; i++) {
    const counter = currentTime + i;
    const counterBytes = new Uint8Array(8);
    let temp = counter;
    for (let j = 7; j >= 0; j--) {
      counterBytes[j] = temp & 0xff;
      temp = Math.floor(temp / 256);
    }
    
    const key = base32Decode(secret);
    const hmac = await hmacSha1(key, counterBytes);
    
    const offset = hmac[hmac.length - 1] & 0x0f;
    const generated = (
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)
    ) % 1000000;
    
    if (generated.toString().padStart(6, '0') === code) {
      return true;
    }
  }
  
  return false;
}

// Hash backup code for storage
export async function hashBackupCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code.toUpperCase().replace(/-/g, ''));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Verify backup code against hashed codes
export async function verifyBackupCode(code: string, hashedCodes: string[]): Promise<number> {
  const hashed = await hashBackupCode(code);
  return hashedCodes.indexOf(hashed);
}
