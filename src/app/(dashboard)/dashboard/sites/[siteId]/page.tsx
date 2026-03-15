'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Topbar from '@/components/layout/Topbar'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2),
  address: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function EditSitePage() {
  const { siteId } = useParams<{ siteId: string }>()
  const router = useRouter()
  const supabase = createClient()

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    supabase.from('sites').select('*').eq('id', siteId).single().then(({ data }) => {
      if (data) reset({ name: data.name, address: data.address ?? '' })
    })
  }, [siteId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(data: FormData) {
    const { error } = await supabase.from('sites').update({
      name: data.name,
      address: data.address || null,
    }).eq('id', siteId)
    if (error) { toast.error(error.message); return }
    toast.success('Site updated')
    router.push('/dashboard/sites')
    router.refresh()
  }

  return (
    <div className="flex flex-col">
      <Topbar title="Edit Site" />
      <div className="p-6 max-w-lg">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
          <Link href="/dashboard/sites"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
        </Button>
        <Card>
          <CardHeader><CardTitle>Edit site details</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Site name *</Label>
                <Input {...register('name')} />
                {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input {...register('address')} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
