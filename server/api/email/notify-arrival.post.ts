import { Resend } from 'resend'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const resendApiKey = config.resendApiKey

  if (!resendApiKey) {
    console.warn('RESEND_API_KEY not configured')
    return { skipped: true }
  }

  const body = await readBody(event)
  const { hostEmail, hostName, visitorName, siteName, checkInTime } = body

  if (!hostEmail) {
    return { skipped: true } // No email to send to
  }

  try {
    const resend = new Resend(resendApiKey)

    const time = new Date(checkInTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-w 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%); border-radius: 12px; margin-bottom: 30px;">
          <div style="font-size: 32px; font-weight: bold; color: white; margin-bottom: 8px;">muyenzi</div>
          <p style="color: rgba(255,255,255,0.9); margin: 0;">Visitor arrival notice</p>
        </div>

        <h2 style="color: #1e293b; font-size: 24px; margin: 30px 0;">Hi ${hostName},</h2>

        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 20px 0;">
          <strong>${visitorName}</strong> has just checked in at <strong>${siteName}</strong>.
        </p>

        <div style="background: #f1f5f9; border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin: 30px 0;">
          <p style="color: #64748b; margin: 0 0 8px 0; font-size: 14px;">Check-in time</p>
          <div style="font-size: 20px; font-weight: bold; color: #1e293b;">
            ${time}
          </div>
        </div>

        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 20px 0;">
          They're ready to be greeted at reception.
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 20px 0;">
          Powered by muyenzi • Modern Visitor Management
        </p>
      </div>
    `

    const result = await resend.emails.send({
      from: 'notifications@muyenzi.com',
      to: hostEmail,
      subject: `${visitorName} has arrived at ${siteName}`,
      html: htmlContent,
    })

    return { sent: true, messageId: result.id }
  } catch (error) {
    console.error('Failed to send arrival email:', error)
    return { sent: false, error: String(error) }
  }
})
