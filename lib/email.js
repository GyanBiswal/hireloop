// lib/email.js
//
// Thin wrapper around the Resend SDK.
// Centralising email here means if we ever swap Resend for SendGrid or SES,
// we change ONE file, not every place that sends email.
//
// We export one function per email type so call sites are readable:
//   sendStageMovedEmail({ candidateName, candidateEmail, jobTitle, stageName })

import { Resend } from 'resend'

// Instantiate once — the API key authenticates every request to Resend's API
const resend = new Resend(process.env.RESEND_API_KEY)

// ── Utility: safe send wrapper ────────────────────────────────────────────────
// We never want a failed email to crash the main API request.
// Emails are "fire and forget" — if they fail, log it and move on.
async function safeSend(payload) {
  try {
    const { error } = await resend.emails.send(payload)
    if (error) console.error('[Email] Resend error:', error)
  } catch (err) {
    // Log but don't rethrow — a broken email must never break a stage move
    console.error('[Email] Failed to send:', err)
  }
}

// ── Email: candidate stage moved ─────────────────────────────────────────────
// Sent to the candidate whenever a recruiter moves them to a new pipeline stage.
export async function sendStageMovedEmail({ candidateName, candidateEmail, jobTitle, stageName }) {
  await safeSend({
    from:    process.env.RESEND_FROM,
    to:      candidateEmail,
    subject: `Update on your application — ${jobTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #4f46e5; margin-bottom: 4px;">HireLoop</h2>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin-bottom: 24px;" />
        <p>Hi <strong>${candidateName}</strong>,</p>
        <p>We wanted to let you know that your application for <strong>${jobTitle}</strong>
           has been updated.</p>
        <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="margin: 0; font-size: 14px; color: #6b7280;">Current stage</p>
          <p style="margin: 4px 0 0; font-size: 20px; font-weight: 700; color: #111827;">
            ${stageName}
          </p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          Our team will be in touch with next steps. Thank you for your interest!
        </p>
        <p style="color: #6b7280; font-size: 14px;">— The HireLoop Team</p>
      </div>
    `,
  })
}

// ── Email: application received ───────────────────────────────────────────────
// Sent to the candidate immediately after they submit the public apply form.
export async function sendApplicationReceivedEmail({ candidateName, candidateEmail, jobTitle }) {
  await safeSend({
    from:    process.env.RESEND_FROM,
    to:      candidateEmail,
    subject: `We received your application — ${jobTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #4f46e5; margin-bottom: 4px;">HireLoop</h2>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin-bottom: 24px;" />
        <p>Hi <strong>${candidateName}</strong>,</p>
        <p>Thanks for applying to <strong>${jobTitle}</strong>!
           We've received your application and our team will review it shortly.</p>
        <p style="color: #6b7280; font-size: 14px;">
          We'll keep you posted on any updates. In the meantime, feel free to
          prepare for a potential phone screen.
        </p>
        <p style="color: #6b7280; font-size: 14px;">— The HireLoop Team</p>
      </div>
    `,
  })
}

// ── Email: candidate hired ────────────────────────────────────────────────────
export async function sendHiredEmail({ candidateName, candidateEmail, jobTitle }) {
  await safeSend({
    from:    process.env.RESEND_FROM,
    to:      candidateEmail,
    subject: `🎉 Congratulations! Offer for ${jobTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #4f46e5; margin-bottom: 4px;">HireLoop</h2>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin-bottom: 24px;" />
        <p>Hi <strong>${candidateName}</strong>,</p>
        <p>🎉 We're thrilled to inform you that you've been selected for
           <strong>${jobTitle}</strong>!</p>
        <p>Our team will reach out shortly with the formal offer details.
           Congratulations!</p>
        <p style="color: #6b7280; font-size: 14px;">— The HireLoop Team</p>
      </div>
    `,
  })
}