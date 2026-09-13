// Lead capture + routing to support (Claude Code)
// CAP-001 fallback flow: collect contact -> verify one method via OTP -> route.

import { pool } from '../db/pool.js';
import { isValidEmail, isValidPhone } from './validation.js';
import { issueOtp } from './otp.js';
import { sendOtpEmail, sendOtpSms } from './delivery.js';

async function audit(eventType, sessionId, detail) {
  await pool.query(
    `INSERT INTO audit_log (event_type, session_id, detail) VALUES ($1, $2, $3)`,
    [eventType, sessionId ?? null, detail ?? {}]
  );
}

export async function createLead({ sessionId, name, email, phone, querySummary }) {
  const contactMethod = isValidEmail(email) ? 'email' : isValidPhone(phone) ? 'phone' : null;
  if (!contactMethod) {
    throw new Error('A valid email or phone number is required');
  }

  const { rows } = await pool.query(
    `INSERT INTO leads (session_id, name, email, phone, contact_method, query_summary)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [sessionId ?? null, name ?? null, email ?? null, phone ?? null, contactMethod, querySummary ?? null]
  );
  const leadId = rows[0].id;

  const { code } = await issueOtp(leadId);
  const result =
    contactMethod === 'email' ? await sendOtpEmail(email, code) : await sendOtpSms(phone, code);

  await audit('lead_created', sessionId, { leadId, contactMethod, delivered: result.delivered });

  return { leadId, contactMethod };
}

export async function routeToSupport(leadId) {
  const { rows } = await pool.query(`SELECT * FROM leads WHERE id = $1`, [leadId]);
  const lead = rows[0];
  if (!lead) throw new Error('Lead not found');
  if (!lead.verified) throw new Error('Lead is not verified — cannot route');

  await pool.query(`UPDATE leads SET status = 'routed' WHERE id = $1`, [leadId]);
  await audit('lead_routed', lead.session_id, { leadId });

  // Dashboard queue is the source of truth (leads table, status='routed').
  // Email/SMS support alerting reuses leads/delivery.js when a support inbox is configured.
  console.log(`Lead ${leadId} routed to support queue — someone will follow up.`);

  return { leadId, status: 'routed' };
}
