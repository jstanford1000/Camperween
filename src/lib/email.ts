import { Resend } from "resend"
import { formatCurrency } from "./pricing"
import { EVENT_NAME, PAYMENT_INSTRUCTIONS } from "./config"

interface ConfirmationEmailAttendee {
  firstName: string
  lastName: string
  ticketLabel: string
  price: number
}

interface ConfirmationEmailData {
  orderId: string
  purchaserFirstName: string
  purchaserLastName: string
  purchaserEmail: string
  total: number
  attendees: ConfirmationEmailAttendee[]
}

const FROM_ADDRESS = process.env.EMAIL_FROM || "Camperween <onboarding@resend.dev>"
const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL

export async function sendConfirmationEmail(data: ConfirmationEmailData) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set -- skipping confirmation email")
    return
  }

  const resend = new Resend(apiKey)

  const attendeeRows = data.attendees
    .map(
      (a) => `
        <tr>
          <td style="padding:4px 8px;border-bottom:1px solid #eee;">${a.firstName} ${a.lastName} &middot; ${a.ticketLabel}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right;">${formatCurrency(a.price)}</td>
        </tr>`
    )
    .join("")

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;color:#1a1a1a;">
      <h1 style="font-size:20px;">You're registered for ${EVENT_NAME}!</h1>
      <p>Hi ${data.purchaserFirstName}, thanks for signing up. One last step: send payment.</p>

      <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;">
        ${attendeeRows}
        <tr>
          <td style="padding:8px;font-weight:bold;">Total</td>
          <td style="padding:8px;text-align:right;font-weight:bold;">${formatCurrency(data.total)}</td>
        </tr>
      </table>

      <div style="background:#fff8ec;border:1px solid #f0b429;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0 0 8px;font-weight:bold;">
          Pay ${formatCurrency(data.total)} via Venmo, Zelle, or PayPal now
        </p>
        <p style="margin:0 0 8px;font-size:13px;">
          Please include "${data.purchaserFirstName} ${data.purchaserLastName} - Camperween" in the
          payment note so we can match it to your registration.
        </p>
        <p style="margin:0;font-size:14px;">
          Venmo: ${PAYMENT_INSTRUCTIONS.venmo}<br />
          Zelle: ${PAYMENT_INSTRUCTIONS.zelle}<br />
          PayPal: ${PAYMENT_INSTRUCTIONS.paypal}
        </p>
      </div>

      <p style="font-size:12px;color:#666;">Order confirmation #${data.orderId}</p>
    </div>
  `

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: data.purchaserEmail,
      subject: `You're registered for ${EVENT_NAME}!`,
      html,
    })
  } catch (err) {
    console.error("Failed to send confirmation email:", err)
  }
}

export async function sendAdminNotificationEmail(data: ConfirmationEmailData) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set -- skipping admin notification email")
    return
  }
  if (!ADMIN_NOTIFICATION_EMAIL) {
    console.warn("ADMIN_NOTIFICATION_EMAIL not set -- skipping admin notification email")
    return
  }

  const resend = new Resend(apiKey)

  const attendeeRows = data.attendees
    .map(
      (a) => `
        <tr>
          <td style="padding:4px 8px;border-bottom:1px solid #eee;">${a.firstName} ${a.lastName} &middot; ${a.ticketLabel}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right;">${formatCurrency(a.price)}</td>
        </tr>`
    )
    .join("")

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;color:#1a1a1a;">
      <h1 style="font-size:20px;">New registration: ${data.purchaserFirstName} ${data.purchaserLastName}</h1>
      <p style="font-size:14px;">${data.purchaserEmail}</p>

      <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;">
        ${attendeeRows}
        <tr>
          <td style="padding:8px;font-weight:bold;">Total</td>
          <td style="padding:8px;text-align:right;font-weight:bold;">${formatCurrency(data.total)}</td>
        </tr>
      </table>

      <p style="font-size:12px;color:#666;">Order #${data.orderId} &middot; view in the admin dashboard.</p>
    </div>
  `

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: ADMIN_NOTIFICATION_EMAIL,
      subject: `New Camperween registration: ${data.purchaserFirstName} ${data.purchaserLastName}`,
      html,
    })
  } catch (err) {
    console.error("Failed to send admin notification email:", err)
  }
}
