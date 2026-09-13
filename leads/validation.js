// Contact validation (Claude Code)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[1-9]\d{7,14}$/; // loose E.164

export function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_RE.test(email.trim());
}

export function isValidPhone(phone) {
  return typeof phone === 'string' && PHONE_RE.test(phone.replace(/[\s()-]/g, ''));
}
