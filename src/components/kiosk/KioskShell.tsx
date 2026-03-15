'use client'

import { useState } from 'react'
import { QrCode, Hash, UserPlus, CheckCircle2, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { VisitWithRelations } from '@/types/database'

type Tab = 'checkin' | 'checkout'
type Method = 'qr' | 'code' | 'manual' | null

interface Site {
  id: string
  name: string
  address: string | null
  company_id: string
}

export default function KioskShell({ site }: { site: Site }) {
  const [tab, setTab] = useState<Tab>('checkin')
  const [method, setMethod] = useState<Method>(null)
  const [result, setResult] = useState<VisitWithRelations | null>(null)
  const [error, setError] = useState<string | null>(null)

  function reset() { setMethod(null); setResult(null); setError(null) }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">M</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{site.name}</h1>
          {site.address && <p className="text-slate-400 text-sm mt-1">{site.address}</p>}
        </div>

        {result ? (
          <SuccessScreen visit={result} tab={tab} onReset={reset} />
        ) : (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => { setTab('checkin'); reset() }}
                className={cn('flex-1 py-4 text-sm font-semibold transition-colors', tab === 'checkin' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-500')}
              >
                Check In
              </button>
              <button
                onClick={() => { setTab('checkout'); reset() }}
                className={cn('flex-1 py-4 text-sm font-semibold transition-colors', tab === 'checkout' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-500')}
              >
                Check Out
              </button>
            </div>

            <div className="p-6">
              {tab === 'checkin' && !method && <MethodPicker onSelect={setMethod} />}
              {tab === 'checkin' && method === 'code' && (
                <CodeEntry siteId={site.id} endpoint="checkin" onSuccess={setResult} onError={setError} onBack={reset} />
              )}
              {tab === 'checkin' && method === 'qr' && (
                <QREntry siteId={site.id} onSuccess={setResult} onError={setError} onBack={reset} />
              )}
              {tab === 'checkin' && method === 'manual' && (
                <ManualEntry siteId={site.id} companyId={site.company_id} onSuccess={setResult} onError={setError} onBack={reset} />
              )}
              {tab === 'checkout' && (
                <CodeEntry siteId={site.id} endpoint="checkout" onSuccess={setResult} onError={setError} onBack={() => setTab('checkin')} checkoutMode />
              )}
              {error && <p className="mt-4 text-sm text-red-600 text-center">{error}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MethodPicker({ onSelect }: { onSelect: (m: Method) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-center text-slate-600 text-sm mb-6">How would you like to check in?</p>
      <button onClick={() => onSelect('qr')} className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-slate-900 hover:bg-slate-50 transition-all text-left">
        <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
          <QrCode className="h-6 w-6 text-slate-700" />
        </div>
        <div>
          <p className="font-semibold text-slate-900">Scan QR Code</p>
          <p className="text-sm text-slate-500">Use your invitation QR code</p>
        </div>
      </button>
      <button onClick={() => onSelect('code')} className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-slate-900 hover:bg-slate-50 transition-all text-left">
        <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
          <Hash className="h-6 w-6 text-slate-700" />
        </div>
        <div>
          <p className="font-semibold text-slate-900">Enter Access Code</p>
          <p className="text-sm text-slate-500">Use the code from your invitation</p>
        </div>
      </button>
      <button onClick={() => onSelect('manual')} className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-slate-900 hover:bg-slate-50 transition-all text-left">
        <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
          <UserPlus className="h-6 w-6 text-slate-700" />
        </div>
        <div>
          <p className="font-semibold text-slate-900">Walk-in Registration</p>
          <p className="text-sm text-slate-500">Register without a prior invitation</p>
        </div>
      </button>
    </div>
  )
}

function CodeEntry({
  siteId, endpoint, onSuccess, onError, onBack, checkoutMode = false,
}: {
  siteId: string
  endpoint: 'checkin' | 'checkout'
  onSuccess: (v: VisitWithRelations) => void
  onError: (e: string) => void
  onBack: () => void
  checkoutMode?: boolean
}) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!code.trim()) return
    setLoading(true)
    onError('')
    const res = await fetch(`/api/kiosk/${siteId}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_code: code.trim() }),
    })
    const data = await res.json()
    if (!res.ok) { onError(data.error ?? 'Something went wrong'); setLoading(false); return }
    onSuccess(data.visit)
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Hash className="h-10 w-10 text-slate-400 mx-auto mb-3" />
        <h2 className="font-semibold text-slate-900 text-lg">
          {checkoutMode ? 'Enter your access code to check out' : 'Enter your access code'}
        </h2>
      </div>
      <div className="space-y-3">
        <Input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="e.g. ABC123"
          className="text-center text-2xl font-mono tracking-widest h-16"
          autoFocus
        />
        <Button className="w-full h-12" onClick={submit} disabled={loading || !code.trim()}>
          {loading ? 'Checking…' : checkoutMode ? 'Check Out' : 'Check In'}
        </Button>
        <Button variant="ghost" className="w-full" onClick={onBack}>Back</Button>
      </div>
    </div>
  )
}

function QREntry({
  siteId, onSuccess, onError, onBack,
}: {
  siteId: string
  onSuccess: (v: VisitWithRelations) => void
  onError: (e: string) => void
  onBack: () => void
}) {
  const [manualCode, setManualCode] = useState('')
  const [loading, setLoading] = useState(false)

  // Note: html5-qrcode requires dynamic import + camera — simplified to manual entry
  // for SSR-safe rendering. Camera scanner can be added as a client-only enhancement.
  async function submit() {
    if (!manualCode.trim()) return
    setLoading(true)
    onError('')
    const res = await fetch(`/api/kiosk/${siteId}/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_code: manualCode.trim() }),
    })
    const data = await res.json()
    if (!res.ok) { onError(data.error ?? 'Something went wrong'); setLoading(false); return }
    onSuccess(data.visit)
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <QrCode className="h-10 w-10 text-slate-400 mx-auto mb-3" />
        <h2 className="font-semibold text-slate-900 text-lg">Scan or enter your code</h2>
        <p className="text-sm text-slate-500 mt-1">Point your QR code at the camera, or type the access code below</p>
      </div>
      <div className="bg-slate-100 rounded-xl h-48 flex items-center justify-center text-slate-400 text-sm">
        Camera scanner (requires HTTPS + camera permission)
      </div>
      <div className="space-y-3">
        <Input
          value={manualCode}
          onChange={e => setManualCode(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Or type your access code…"
          className="text-center font-mono tracking-widest"
        />
        <Button className="w-full h-12" onClick={submit} disabled={loading || !manualCode.trim()}>
          {loading ? 'Checking…' : 'Check In'}
        </Button>
        <Button variant="ghost" className="w-full" onClick={onBack}>Back</Button>
      </div>
    </div>
  )
}

function ManualEntry({
  siteId, companyId, onSuccess, onError, onBack,
}: {
  siteId: string
  companyId: string
  onSuccess: (v: VisitWithRelations) => void
  onError: (e: string) => void
  onBack: () => void
}) {
  const [form, setForm] = useState({ name: '', email: '', company: '', purpose: '' })
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!form.name.trim()) return
    setLoading(true)
    onError('')
    const res = await fetch(`/api/kiosk/${siteId}/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walk_in: true, ...form, company_id: companyId }),
    })
    const data = await res.json()
    if (!res.ok) { onError(data.error ?? 'Something went wrong'); setLoading(false); return }
    onSuccess(data.visit)
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <UserPlus className="h-10 w-10 text-slate-400 mx-auto mb-3" />
        <h2 className="font-semibold text-slate-900 text-lg">Walk-in registration</h2>
      </div>
      <div className="space-y-3">
        <div>
          <Label>Full name *</Label>
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" className="mt-1" />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@acme.com" className="mt-1" />
        </div>
        <div>
          <Label>Company</Label>
          <Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Acme Corp" className="mt-1" />
        </div>
        <div>
          <Label>Purpose of visit</Label>
          <Input value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} placeholder="Meeting, Delivery…" className="mt-1" />
        </div>
      </div>
      <Button className="w-full h-12" onClick={submit} disabled={loading || !form.name.trim()}>
        {loading ? 'Checking in…' : 'Check In'}
      </Button>
      <Button variant="ghost" className="w-full" onClick={onBack}>Back</Button>
    </div>
  )
}

function SuccessScreen({ visit, tab, onReset }: { visit: VisitWithRelations; tab: Tab; onReset: () => void }) {
  const isCheckout = tab === 'checkout'

  useEffect(() => {
    const t = setTimeout(onReset, 8000)
    return () => clearTimeout(t)
  }, [onReset])

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
      <div className={cn('h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-6', isCheckout ? 'bg-orange-100' : 'bg-emerald-100')}>
        {isCheckout ? <LogOut className="h-8 w-8 text-orange-600" /> : <CheckCircle2 className="h-8 w-8 text-emerald-600" />}
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        {isCheckout ? 'Goodbye!' : 'Welcome!'}
      </h2>
      <p className="text-lg text-slate-700 font-medium">{visit.visitor?.full_name}</p>
      {!isCheckout && visit.host && (
        <p className="text-slate-500 mt-1">Your host <strong>{visit.host.full_name}</strong> has been notified.</p>
      )}
      {isCheckout && (
        <p className="text-slate-500 mt-1">Thank you for your visit. Have a safe journey!</p>
      )}
      <p className="text-xs text-slate-400 mt-6">Returning to home screen in a few seconds…</p>
      <Button variant="outline" className="mt-4" onClick={onReset}>Done</Button>
    </div>
  )
}

// Need useEffect for auto-reset
import { useEffect } from 'react'
