import { QrCode, Hash, Building2, Users, BarChart3, CheckCircle2, Bell, Download, Shield } from 'lucide-react'

export const metadata = { title: 'Features – Muyenzi' }

const FEATURES = [
  {
    category: 'Check-In',
    items: [
      { icon: QrCode, title: 'QR Code Check-In', desc: 'Visitors scan their personalised QR code at the kiosk for instant check-in.' },
      { icon: Hash, title: 'Access Code Entry', desc: 'A unique 6-character code sent with every invitation, as a QR code alternative.' },
      { icon: Users, title: 'Walk-In Registration', desc: 'Visitors without a prior invitation can self-register directly at the kiosk.' },
    ],
  },
  {
    category: 'Management',
    items: [
      { icon: Building2, title: 'Multi-Site Support', desc: 'Manage multiple premises — each with their own kiosk, staff, and visit logs.' },
      { icon: Shield, title: 'Role-Based Permissions', desc: 'Admin, Site Manager, Receptionist, and Host roles with granular permissions.' },
      { icon: CheckCircle2, title: 'Visitor Pre-Registration', desc: 'Invite visitors in advance and let them arrive with everything ready.' },
    ],
  },
  {
    category: 'Insights',
    items: [
      { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Visitor trends, peak hours, per-site breakdowns, and security reports.' },
      { icon: Bell, title: 'Real-Time Notifications', desc: 'Hosts are notified the instant their visitor checks in.' },
      { icon: Download, title: 'Export Reports', desc: 'Download visitor logs as CSV or PDF with date and site filters.' },
    ],
  },
]

export default function FeaturesPage() {
  return (
    <div className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Features</h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            A complete visitor management platform built for security-conscious modern workplaces.
          </p>
        </div>

        {FEATURES.map(section => (
          <div key={section.category} className="mb-16">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-6">{section.category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {section.items.map(f => (
                <div key={f.title} className="rounded-2xl border bg-white p-6 hover:shadow-md transition-shadow">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
                    <f.icon className="h-5 w-5 text-slate-700" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-500">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
