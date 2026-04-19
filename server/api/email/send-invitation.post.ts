import { Resend } from 'resend'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const resendApiKey = config.resendApiKey

  if (!resendApiKey) {
    console.warn('RESEND_API_KEY not configured')
    return { skipped: true }
  }

  const body = await readBody(event)
  const { visitorEmail, visitorName, siteName, accessCode, qrCodeData, companyName, visitId, hasDocuments } = body

  if (!visitorEmail) {
    return { skipped: true } // No email to send to
  }

  try {
    const resend = new Resend(resendApiKey)

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 40px 20px; background: #f8fafc; border-radius: 12px; margin-bottom: 30px;">
          <div style="font-size: 32px; font-weight: bold; color: #1e293b; margin-bottom: 8px;">muyenzi</div>
          <p style="color: #64748b; margin: 0;">Your visitor pass is ready</p>
        </div>

        <h2 style="color: #1e293b; font-size: 24px; margin: 30px 0;">Hi ${visitorName},</h2>

        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 20px 0;">
          Your visit to <strong>${siteName}</strong> at <strong>${companyName}</strong> has been confirmed. You're all set to check in when you arrive.
        </p>

        <div style="background: #f1f5f9; border-left: 4px solid #6366f1; padding: 20px; border-radius: 8px; margin: 30px 0;">
          <p style="color: #64748b; margin: 0 0 15px 0; font-size: 14px;">Your access code (in case you can't scan the QR):</p>
          <div style="font-size: 36px; font-weight: bold; color: #1e293b; font-family: 'Courier New', monospace; letter-spacing: 8px; text-align: center;">
            ${accessCode.toUpperCase()}
          </div>
        </div>

        ${hasDocuments && visitId ? `
        <div style="background: #fef9c3; border: 1px solid #fde68a; border-radius: 10px; padding: 20px; margin: 24px 0; text-align: center;">
          <p style="color: #92400e; font-weight: 600; font-size: 15px; margin: 0 0 12px 0;">📋 Documents to review before your visit</p>
          <p style="color: #78350f; font-size: 14px; margin: 0 0 16px 0;">Please read and sign the required documents at your convenience — you can also sign at the kiosk on arrival.</p>
          <a href="${process.env.BASE_URL ?? 'https://muyenzi.com'}/sign/${visitId}"
             style="display: inline-block; background: #6366f1; color: white; text-decoration: none; font-weight: 600; font-size: 15px; padding: 12px 28px; border-radius: 8px;">
            Review &amp; Sign Documents
          </a>
        </div>
        ` : ''}

        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 20px 0;">
          <strong>When you arrive:</strong>
        </p>
        <ol style="color: #475569; font-size: 16px; line-height: 1.8; margin: 20px 0; padding-left: 20px;">
          <li>Look for the kiosk at reception</li>
          <li>Scan the QR code above with your phone, or enter the code above</li>
          <li>You'll be checked in instantly, and your host will be notified</li>
        </ol>

        <p style="color: #64748b; font-size: 14px; margin: 30px 0;">
          Questions? Contact the reception desk or reply to this email.
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 20px 0;">
          Powered by muyenzi • Modern Visitor Management
        </p>
      </div>
    `

    const result = await resend.emails.send({
      from: 'invitations@muyenzi.com',
      to: visitorEmail,
      subject: `Your visitor pass for ${siteName}`,
      html: htmlContent,
    })

    return { sent: true, messageId: result.id }
  } catch (error) {
    console.error('Failed to send invitation email:', error)
    return { sent: false, error: String(error) }
  }
})
