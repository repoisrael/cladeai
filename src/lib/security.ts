/**
 * Security utilities for XSS prevention, input sanitization, and CSRF protection
 * Implements enterprise-grade security patterns
 */

import DOMPurify from 'isomorphic-dompurify';

// ============================================================================
// XSS PREVENTION
// ============================================================================

/**
 * Sanitize HTML content to prevent XSS attacks
 * Uses DOMPurify to strip malicious tags while preserving safe formatting
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize plain text (removes ALL HTML tags)
 * Use for usernames, titles, search queries
 */
export function sanitizeText(text: string): string {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
}

/**
 * Sanitize URL to prevent javascript: and data: URIs
 */
export function sanitizeUrl(url: string): string {
  const cleaned = url.trim();
  
  // Block dangerous protocols
  if (
    cleaned.startsWith('javascript:') ||
    cleaned.startsWith('data:') ||
    cleaned.startsWith('vbscript:')
  ) {
    return '';
  }
  
  // Only allow http, https, mailto
  if (!cleaned.match(/^(https?:|mailto:)/i) && !cleaned.startsWith('/')) {
    return '';
  }
  
  return cleaned;
}

// ============================================================================
// INPUT VALIDATION
// ============================================================================

/**
 * Validate username (alphanumeric, underscore, hyphen only)
 */
export function validateUsername(username: string): {
  valid: boolean;
  error?: string;
} {
  if (!username || username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  
  if (username.length > 30) {
    return { valid: false, error: 'Username must be less than 30 characters' };
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return {
      valid: false,
      error: 'Username can only contain letters, numbers, underscores, and hyphens',
    };
  }
  
  return { valid: true };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): {
  valid: boolean;
  error?: string;
} {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  return { valid: true };
}

/**
 * Validate post/comment content
 */
export function validateContent(content: string, maxLength = 10000): {
  valid: boolean;
  error?: string;
} {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: 'Content cannot be empty' };
  }
  
  if (content.length > maxLength) {
    return {
      valid: false,
      error: `Content must be less than ${maxLength} characters`,
    };
  }
  
  // Check for excessive special characters (potential spam)
  const specialCharCount = (content.match(/[^a-zA-Z0-9\s]/g) || []).length;
  if (specialCharCount / content.length > 0.5) {
    return { valid: false, error: 'Content contains too many special characters' };
  }
  
  return { valid: true };
}

/**
 * Detect and block SQL injection attempts
 */
export function detectSqlInjection(input: string): boolean {
  const sqlKeywords = [
    'DROP TABLE',
    'DELETE FROM',
    'INSERT INTO',
    'UPDATE ',
    'SELECT *',
    'UNION SELECT',
    'OR 1=1',
    "OR '1'='1",
    '; --',
    'xp_cmdshell',
    'exec(',
    'execute(',
  ];
  
  const upperInput = input.toUpperCase();
  return sqlKeywords.some((keyword) => upperInput.includes(keyword));
}

/**
 * Sanitize search query (remove SQL and special chars)
 */
export function sanitizeSearchQuery(query: string): string {
  // Remove SQL injection patterns
  if (detectSqlInjection(query)) {
    return '';
  }
  
  // Remove special chars except spaces, hyphens, apostrophes
  return query.replace(/[^\w\s'-]/g, '').trim();
}

// ============================================================================
// CSRF PROTECTION
// ============================================================================

/**
 * Generate CSRF token (client-side)
 * Store in sessionStorage and send with mutations
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const token = Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  
  sessionStorage.setItem('csrf_token', token);
  return token;
}

/**
 * Get current CSRF token
 */
export function getCsrfToken(): string | null {
  return sessionStorage.getItem('csrf_token');
}

/**
 * Validate CSRF token (compare with stored token)
 */
export function validateCsrfToken(token: string): boolean {
  const storedToken = getCsrfToken();
  return storedToken !== null && token === storedToken;
}

// ============================================================================
// RATE LIMITING (CLIENT-SIDE)
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check if action is rate-limited (client-side prevention)
 * Returns true if allowed, false if rate limited
 */
export function checkRateLimit(
  action: string,
  maxCount: number,
  windowMs: number
): { allowed: boolean; resetIn?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(action);
  
  // No entry or expired window
  if (!entry || now >= entry.resetTime) {
    rateLimitStore.set(action, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true };
  }
  
  // Within window, check count
  if (entry.count >= maxCount) {
    return {
      allowed: false,
      resetIn: Math.ceil((entry.resetTime - now) / 1000),
    };
  }
  
  // Increment count
  entry.count += 1;
  return { allowed: true };
}

/**
 * Clear rate limit for action (use on successful server response)
 */
export function clearRateLimit(action: string): void {
  rateLimitStore.delete(action);
}

// ============================================================================
// CONTENT SECURITY POLICY (CSP) HELPERS
// ============================================================================

/**
 * Generate nonce for inline scripts (CSP)
 * Should be passed to script tags and CSP header
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

// ============================================================================
// SECURE DATA HANDLING
// ============================================================================

/**
 * Escape special characters for safe display
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Strip all HTML tags (more aggressive than sanitizeText)
 */
export function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

/**
 * Validate file upload (check type and size)
 */
export function validateFileUpload(
  file: File,
  allowedTypes: string[],
  maxSizeMB: number
): { valid: boolean; error?: string } {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }
  
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }
  
  return { valid: true };
}

// ============================================================================
// SECURE STORAGE
// ============================================================================

/**
 * Securely store sensitive data (encrypted in localStorage)
 * Note: NOT truly secure (client-side), use only for non-critical data
 */
export function secureStore(key: string, value: string): void {
  const encrypted = btoa(value); // Basic obfuscation
  localStorage.setItem(`secure_${key}`, encrypted);
}

/**
 * Retrieve securely stored data
 */
export function secureRetrieve(key: string): string | null {
  const encrypted = localStorage.getItem(`secure_${key}`);
  if (!encrypted) return null;
  
  try {
    return atob(encrypted);
  } catch {
    return null;
  }
}

/**
 * Clear secure storage
 */
export function secureClear(key: string): void {
  localStorage.removeItem(`secure_${key}`);
}

// ============================================================================
// PASSWORD STRENGTH VALIDATION
// ============================================================================

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  valid: boolean;
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;
  
  // Length check
  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters');
  } else {
    score += 1;
  }
  
  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    feedback.push('Include at least one uppercase letter');
  } else {
    score += 1;
  }
  
  // Lowercase check
  if (!/[a-z]/.test(password)) {
    feedback.push('Include at least one lowercase letter');
  } else {
    score += 1;
  }
  
  // Number check
  if (!/\d/.test(password)) {
    feedback.push('Include at least one number');
  } else {
    score += 1;
  }
  
  // Special char check
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    feedback.push('Include at least one special character');
  } else {
    score += 1;
  }
  
  // Common password check
  const commonPasswords = ['password', '12345678', 'qwerty', 'admin', 'letmein'];
  if (commonPasswords.includes(password.toLowerCase())) {
    feedback.push('Password is too common');
    score = 0;
  }
  
  return {
    score: Math.min(score, 4),
    feedback,
    valid: score >= 3 && password.length >= 8,
  };
}
