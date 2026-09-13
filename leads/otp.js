// OTP generation + verification (Claude Code)
// CAP-001 hard rule #4: never promise a turnaround — only "someone will follow up."

import { pool } from '../db/pool.js';

const OTP_TTL_MINUTES = 10;

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function issueOtp(leadId) {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  await pool.query(
    `UPDATE leads SET otp_code = $1, otp_expires_at = $2 WHERE id = $3`,
    [code, expiresAt, leadId]
  );
  return { code, expiresAt };
}

export async function verifyOtp(leadId, submittedCode) {
  const { rows } = await pool.query(
    `SELECT otp_code, otp_expires_at FROM leads WHERE id = $1`,
    [leadId]
  );
  const lead = rows[0];
  if (!lead) return { ok: false, reason: 'not_found' };
  if (!lead.otp_code || new Date(lead.otp_expires_at) < new Date()) {
    return { ok: false, reason: 'expired' };
  }
  if (lead.otp_code !== submittedCode) {
    return { ok: false, reason: 'mismatch' };
  }
  await pool.query(
    `UPDATE leads SET verified = true, verified_at = now(), status = 'verified' WHERE id = $1`,
    [leadId]
  );
  return { ok: true };
}
