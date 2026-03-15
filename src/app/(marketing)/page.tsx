import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, QrCode, Shield, BarChart3, Building2, Users, CheckCircle2 } from 'lucide-react'

export const metadata = {
  title: 'Muyenzi – Modern Visitor Management',
  description: 'Replace paper logbooks with a professional digital visitor management system. QR codes, access codes, analytics, and multi-site support.',
}

const FEATURES = [
  { icon: QrCode, title: 'QR Code Check-In', desc: 'Visitors receive a unique QR code with their invitation. One scan at the kiosk and they\'re checked in.' },
  { icon: Shield, title: 'Access Codes', desc: 'Every visit gets a random 6-character access code as backup. Simple to type, impossible to guess.' },
  { icon: Building2, title: 'Multi-Site Support', desc: 'Manage all your premises from one dashboard. Head office, warehouse, factory — all in one place.' },
  { icon: Users, title: 'Role-Based Access', desc: 'Admins, site managers, receptionists, and hosts each see exactly what they need.' },
  { icon: BarChart3, title: 'Real-Time Analytics', desc: 'Visitor trends, peak hours, site reports, and live occupancy at a glance.' },
  { icon: CheckCircle2, title: 'Instant Notifications', desc: 'Hosts are notified the moment their guest arrives, so no one is left waiting in reception.' },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Create an invitation', desc: 'Pre-register your visitor with their details, visit date, and host.' },
  { step: '02', title: 'Visitor receives their pass', desc: 'They get a QR code and access code by email before they arrive.' },
  { step: '03', title: 'Frictionless arrival', desc: 'Visitor scans their QR or enters their code at the kiosk. Done in seconds.' },
  { step: '04', title: 'Host is notified instantly', desc: 'The host gets an immediate notification so they can greet their guest.' },
]

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-50 to-white pt-20 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-slate-100 rounded-full px-4 py-1.5 text-sm text-slate-600 mb-8">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Modern visitor management
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight mb-6">
            Professional visitor<br />
            <span className="text-slate-500">management, simplified</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10">
            Replace paper logbooks and manual check-in processes with Muyenzi — a modern SaaS platform for managing visitors across all your premises.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-12 px-8 text-base" asChild>
              <Link href="/signup">Start free trial <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
              <Link href="/contact">Book a demo</Link>
            </Button>
          </div>
          <p className="text-sm text-slate-400 mt-4">No credit card required · Free for up to 50 visits/month</p>
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border bg-slate-50 p-1 shadow-xl">
            <div className="rounded-xl bg-slate-900 h-8 flex items-center gap-2 px-4">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
              <div className="flex-1 mx-4 h-5 rounded-md bg-slate-700 max-w-xs" />
            </div>
            <div className="bg-white rounded-b-xl p-6 min-h-64 grid grid-cols-4 gap-4">
              <div className="col-span-1 bg-slate-50 rounded-xl p-4 space-y-3">
                {['Overview', 'Sites', 'Visitors', 'Invitations', 'Analytics'].map(item => (
                  <div key={item} className={`h-8 rounded-lg flex items-center px-3 text-xs font-medium ${item === 'Overview' ? 'bg-slate-200 text-slate-900' : 'text-slate-500'}`}>
                    {item}
                  </div>
                ))}
              </div>
              <div className="col-span-3 space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  {['Visitors Today', 'Inside Now', 'Upcoming', 'This Week'].map((label, i) => (
                    <div key={label} className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="text-2xl font-bold text-slate-900">{[24, 3, 8, 142][i]}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-50 rounded-xl p-4 h-24 flex items-center justify-center">
                  <div className="flex items-end gap-1">
                    {[30, 55, 45, 70, 60, 80, 65, 90, 75, 85, 60, 70].map((h, i) => (
                      <div key={i} className="w-4 bg-slate-800 rounded-sm" style={{ height: `${h * 0.6}px` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need to manage visitors</h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">Built for modern workplaces that care about security, efficiency, and first impressions.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-slate-700" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">How it works</h2>
            <p className="text-lg text-slate-500">From invitation to check-in in four simple steps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {HOW_IT_WORKS.map(step => (
              <div key={step.step} className="flex gap-5">
                <div className="text-3xl font-bold text-slate-200 shrink-0 w-10">{step.step}</div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-slate-500">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-slate-900">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to modernise your reception?</h2>
          <p className="text-slate-400 mb-8 text-lg">Join companies already using Muyenzi to manage thousands of visitors.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-12 px-8 bg-white text-slate-900 hover:bg-slate-100" asChild>
              <Link href="/signup">Start free trial</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 border-slate-600 text-white hover:bg-slate-800" asChild>
              <Link href="/contact">Talk to sales</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
