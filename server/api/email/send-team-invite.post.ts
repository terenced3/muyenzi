import { Resend } from 'resend'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  site_manager: 'Site Manager',
  receptionist: 'Receptionist',
  host: 'Host',
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const resendApiKey = config.resendApiKey

  if (!resendApiKey) {
    console.warn('RESEND_API_KEY not configured — skipping team invite email')
    return { skipped: true }
  }

  const body = await readBody(event)
  const { inviteeEmail, inviterName, companyName, role, token } = body

  if (!inviteeEmail || !token) {
    return { skipped: true }
  }

  const baseUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://muyenzi.com'
  const inviteUrl = `${baseUrl}/invite/${token}`
  const roleLabel = ROLE_LABELS[role] ?? role

  try {
    const resend = new Resend(resendApiKey)

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%); border-radius: 12px; margin-bottom: 30px;">
          <div style="font-size: 32px; font-weight: bold; color: white; margin-bottom: 8px;">muyenzi</div>
          <p style="color: rgba(255,255,255,0.9); margin: 0;">You've been invited to join a team</p>
        </div>

        <h2 style="color: #1e293b; font-size: 22px; margin: 30px 0 8px;">You're invited to <strong>${companyName}</strong></h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
          ${inviterName} has invited you to join <strong>${companyName}</strong> on Muyenzi as a <strong>${roleLabel}</strong>.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a
            href="${inviteUrl}"
            style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%); color: white; text-decoration: none; font-weight: bold; font-size: 16px; padding: 14px 32px; border-radius: 10px;"
          >
            Accept invitation
          </a>
        </div>

        <p style="color: #64748b; font-size: 14px; text-align: center;">
          Or copy this link into your browser:<br>
          <span style="color: #6366f1; word-break: break-all;">${inviteUrl}</span>
        </p>

        <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="color: #64748b; font-size: 13px; margin: 0;">
            This invite expires in 7 days. If you weren't expecting this, you can safely ignore it.
          </p>
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          Powered by muyenzi • Modern Visitor Management
        </p>
      </div>
    `

    const result = await resend.emails.send({
      from: 'invitations@muyenzi.com',
      to: inviteeEmail,
      subject: `${inviterName} invited you to join ${companyName} on Muyenzi`,
      html,
    })

    return { sent: true, messageId: result.id }
  } catch (error) {
    console.error('Failed to send team invite email:', error)
    return { sent: false, error: String(error) }
  }
})
