// OTP + notification delivery (Claude Code)
// Uses SendGrid/Twilio REST APIs directly (no extra SDK deps) — falls back to
// console logging when credentials are absent, so local dev never blocks on them.

import axios from 'axios';

export async function sendOtpEmail(toEmail, code) {
  if (!process.env.SENDGRID_API_KEY) {
    console.log(`[dev fallback] OTP for ${toEmail}: ${code}`);
    return { delivered: false, reason: 'no_sendgrid_key' };
  }
  await axios.post(
    'https://api.sendgrid.com/v3/mail/send',
    {
      personalizations: [{ to: [{ email: toEmail }] }],
      from: { email: process.env.SENDGRID_FROM_EMAIL },
      subject: 'Your allMasajid verification code',
      content: [{ type: 'text/plain', value: `Your verification code is ${code}. It expires in 10 minutes.` }],
    },
    { headers: { Authorization: `Bearer ${process.env.SENDGRID_API_KEY}` } }
  );
  return { delivered: true };
}

export async function sendOtpSms(toPhone, code) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.log(`[dev fallback] OTP for ${toPhone}: ${code}`);
    return { delivered: false, reason: 'no_twilio_credentials' };
  }
  const sid = process.env.TWILIO_ACCOUNT_SID;
  await axios.post(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    new URLSearchParams({
      To: toPhone,
      From: process.env.TWILIO_PHONE_NUMBER,
      Body: `Your allMasajid verification code is ${code}. It expires in 10 minutes.`,
    }),
    { auth: { username: sid, password: process.env.TWILIO_AUTH_TOKEN } }
  );
  return { delivered: true };
}
