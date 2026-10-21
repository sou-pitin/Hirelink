// Input validation utilities — client-side validation for form fields.
// Server-side validation is enforced by RLS policies and edge function checks.

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number.' };
  }
  return { valid: true };
}

export function validateRequired(value: string, fieldName: string): { valid: boolean; message?: string } {
  if (!value || value.trim().length === 0) {
    return { valid: false, message: `${fieldName} is required.` };
  }
  return { valid: true };
}

export function validateMaxLength(
  value: string,
  max: number,
  fieldName: string
): { valid: boolean; message?: string } {
  if (value.length > max) {
    return { valid: false, message: `${fieldName} must be ${max} characters or less.` };
  }
  return { valid: true };
}

export function sanitizeText(value: string): string {
  return value.trim().replace(/\0/g, '');
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Simple rate limiter for client-side actions (prevents accidental rapid-fire submissions).
// Real rate limiting is enforced server-side via the edge function.
const actionTimestamps: Record<string, number[]> = {};

export function rateLimit(
  action: string,
  maxCalls: number = 5,
  windowMs: number = 60000
): { allowed: boolean; message?: string } {
  const now = Date.now();
  if (!actionTimestamps[action]) {
    actionTimestamps[action] = [];
  }
  actionTimestamps[action] = actionTimestamps[action].filter(
    (ts) => now - ts < windowMs
  );
  if (actionTimestamps[action].length >= maxCalls) {
    return {
      allowed: false,
      message: 'Too many requests. Please wait a minute and try again.',
    };
  }
  actionTimestamps[action].push(now);
  return { allowed: true };
}
