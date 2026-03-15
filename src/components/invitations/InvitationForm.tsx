'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { generateAccessCode } from '@/lib/utils/access-code'
import QRCodeDisplay from '@/components/shared/QRCodeDisplay'
import { CheckCircle2, Copy } from 'lucide-react'

const schema = z.object({
  visitor_name: z.string().min(2, 'Visitor name is required'),
  visitor_company: z.string().optional(),
  visitor_email: z.string().email('Valid email required').optional().or(z.literal('')),
  visitor_phone: z.string().optional(),
  site_id: z.string().min(1, 'Please select a site'),
  host_id: z.string().min(1, 'Please select a host'),
  purpose: z.string().optional(),
  visit_date: z.string().min(1, 'Visit date is required'),
  visit_time: z.string().optional(),
  notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface Props {
  companyId: string
  hostId: string
  sites: { id: string; name: string }[]
  hosts: { id: string; full_name: string }[]
}

interface CreatedVisit {
  access_code: string
  qr_code_data: string
  visitor_name: string
}

export default function InvitationForm({ companyId, hostId, sites, hosts }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [created, setCreated] = useState<CreatedVisit | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      host_id: hostId,
      visit_date: new Date().toISOString().split('T')[0],
    },
  })

  async function onSubmit(data: FormData) {
    // 1. Upsert visitor
    const { data: visitor, error: visitorError } = await supabase
      .from('visitors')
      .upsert({
        company_id: companyId,
        full_name: data.visitor_name,
        email: data.visitor_email || null,
        phone: data.visitor_phone || null,
        company_name: data.visitor_company || null,
      }, { onConflict: 'company_id,email', ignoreDuplicates: false })
      .select()
      .single()

    if (visitorError || !visitor) {
      // If upsert fails (e.g. no email for dedup), just insert
      const { data: newVisitor, error } = await supabase
        .from('visitors')
        .insert({
          company_id: companyId,
          full_name: data.visitor_name,
          email: data.visitor_email || null,
          phone: data.visitor_phone || null,
          company_name: data.visitor_company || null,
        })
        .select()
        .single()
      if (error || !newVisitor) { toast.error('Failed to create visitor'); return }

      return finalizeVisit(data, newVisitor.id)
    }

    finalizeVisit(data, visitor.id)
  }

  async function finalizeVisit(data: FormData, visitorId: string) {
    const accessCode = generateAccessCode()
    const qrCodeData = JSON.stringify({ visitorId, siteId: data.site_id, accessCode, companyId })

    const { data: visit, error } = await supabase
      .from('visits')
      .insert({
        company_id: companyId,
        site_id: data.site_id,
        visitor_id: visitorId,
        host_id: data.host_id,
        purpose: data.purpose || null,
        visit_date: data.visit_date,
        visit_time: data.visit_time || null,
        notes: data.notes || null,
        access_code: accessCode,
        qr_code_data: qrCodeData,
        status: 'expected',
      })
      .select()
      .single()

    if (error || !visit) { toast.error(error?.message ?? 'Failed to create visit'); return }

    // Create invitation record
    await supabase.from('invitations').insert({ visit_id: visit.id })

    toast.success('Invitation created')
    setCreated({
      access_code: accessCode,
      qr_code_data: qrCodeData,
      visitor_name: data.visitor_name,
    })
  }

  if (created) {
    return (
      <div className="space-y-4">
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="pt-6 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-emerald-900">Invitation created for {created.visitor_name}</p>
              <p className="text-sm text-emerald-700 mt-1">Share the QR code or access code with your visitor.</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">QR Code</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <QRCodeDisplay data={created.qr_code_data} size={200} />
              <p className="text-xs text-slate-500 text-center">Visitor scans this to check in</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Access Code</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-4 h-full">
              <div className="text-4xl font-mono font-bold tracking-wider text-slate-900 bg-slate-100 rounded-xl px-8 py-6">
                {created.access_code}
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(created.access_code); toast.success('Copied!') }}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
              >
                <Copy className="h-4 w-4" /> Copy code
              </button>
              <p className="text-xs text-slate-500 text-center">Visitor enters this code at reception</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push('/dashboard/invitations')}>View all invitations</Button>
          <Button onClick={() => { setCreated(null); router.refresh() }}>Create another</Button>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pre-register a visitor</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Visitor details */}
          <div>
            <h3 className="font-medium text-slate-900 mb-3">Visitor details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full name *</Label>
                <Input placeholder="Jane Smith" {...register('visitor_name')} />
                {errors.visitor_name && <p className="text-sm text-red-600">{errors.visitor_name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input placeholder="Acme Corp" {...register('visitor_company')} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="jane@acme.com" {...register('visitor_email')} />
                {errors.visitor_email && <p className="text-sm text-red-600">{errors.visitor_email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="+1 234 567 8900" {...register('visitor_phone')} />
              </div>
            </div>
          </div>

          {/* Visit details */}
          <div>
            <h3 className="font-medium text-slate-900 mb-3">Visit details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Site *</Label>
                <select className="w-full text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900" {...register('site_id')}>
                  <option value="">Select a site…</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {errors.site_id && <p className="text-sm text-red-600">{errors.site_id.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Host *</Label>
                <select className="w-full text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900" {...register('host_id')}>
                  <option value="">Select a host…</option>
                  {hosts.map(h => <option key={h.id} value={h.id}>{h.full_name}</option>)}
                </select>
                {errors.host_id && <p className="text-sm text-red-600">{errors.host_id.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Visit date *</Label>
                <Input type="date" {...register('visit_date')} />
                {errors.visit_date && <p className="text-sm text-red-600">{errors.visit_date.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Visit time</Label>
                <Input type="time" {...register('visit_time')} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Purpose of visit</Label>
                <Input placeholder="Business meeting, interview, delivery…" {...register('purpose')} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Notes</Label>
                <Textarea placeholder="Any additional notes…" rows={3} {...register('notes')} />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating invitation…' : 'Create Invitation'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
