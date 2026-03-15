'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'

export default function ContactPage() {
  const [sent, setSent] = useState(false)

  return (
    <div className="py-20 px-6">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Get in touch</h1>
          <p className="text-slate-500">Have a question or want to book a demo? We&apos;d love to hear from you.</p>
        </div>

        {sent ? (
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
              <h2 className="font-semibold text-slate-900 text-lg mb-2">Message received!</h2>
              <p className="text-slate-500 text-sm">We&apos;ll get back to you within one business day.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <form
                onSubmit={e => { e.preventDefault(); setSent(true) }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First name</Label>
                    <Input placeholder="Jane" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Last name</Label>
                    <Input placeholder="Smith" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Work email</Label>
                  <Input type="email" placeholder="jane@company.com" required />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input placeholder="Acme Corp" />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea placeholder="Tell us how we can help…" rows={4} required />
                </div>
                <Button type="submit" className="w-full">Send message</Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
