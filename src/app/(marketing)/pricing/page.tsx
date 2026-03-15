import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'

export const metadata = { title: 'Pricing – Muyenzi' }

const PLANS = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'For small teams just getting started',
    features: ['Up to 50 visits/month', '1 site', '2 team members', 'QR & access code check-in', 'Email notifications'],
    cta: 'Start free',
    href: '/signup',
    highlight: false,
  },
  {
    name: 'Professional',
    price: '$29',
    period: '/month',
    description: 'For growing companies with multiple sites',
    features: ['Unlimited visits', 'Up to 5 sites', 'Unlimited team members', 'Full analytics & reports', 'CSV & PDF export', 'Priority support'],
    cta: 'Start free trial',
    href: '/signup',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large organisations with custom needs',
    features: ['Unlimited everything', 'Custom integrations', 'SSO / SAML', 'Dedicated support', 'SLA guarantee', 'Custom branding'],
    cta: 'Talk to sales',
    href: '/contact',
    highlight: false,
  },
]

export default function PricingPage() {
  return (
    <div className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Simple, transparent pricing</h1>
          <p className="text-lg text-slate-500">Start free. Scale as you grow. No hidden fees.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map(plan => (
            <div key={plan.name} className={`rounded-2xl p-8 ${plan.highlight ? 'bg-slate-900 text-white ring-2 ring-slate-900' : 'bg-white border'}`}>
              <h2 className={`font-semibold text-lg mb-1 ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h2>
              <p className={`text-sm mb-6 ${plan.highlight ? 'text-slate-400' : 'text-slate-500'}`}>{plan.description}</p>
              <div className="mb-6">
                <span className={`text-4xl font-bold ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>{plan.price}</span>
                {plan.period && <span className={`text-sm ml-1 ${plan.highlight ? 'text-slate-400' : 'text-slate-500'}`}>{plan.period}</span>}
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className={`h-4 w-4 shrink-0 ${plan.highlight ? 'text-emerald-400' : 'text-emerald-500'}`} />
                    <span className={plan.highlight ? 'text-slate-300' : 'text-slate-600'}>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full ${plan.highlight ? 'bg-white text-slate-900 hover:bg-slate-100' : ''}`}
                variant={plan.highlight ? 'secondary' : 'default'}
                asChild
              >
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-slate-400 mt-10">
          All plans include SSL encryption, 99.9% uptime SLA, and GDPR-compliant data handling.
        </p>
      </div>
    </div>
  )
}
