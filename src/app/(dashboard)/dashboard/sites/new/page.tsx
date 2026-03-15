'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Topbar from '@/components/layout/Topbar'
import { useUser } from '@/context/UserContext'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2, 'Site name is required'),
  address: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function NewSitePage() {
  const router = useRouter()
  const { user } = useUser()
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    if (!user) return
    const { error } = await supabase.from('sites').insert({
      company_id: user.company_id,
      name: data.name,
      address: data.address || null,
    })
    if (error) { toast.error(error.message); return }
    toast.success('Site created')
    router.push('/dashboard/sites')
    router.refresh()
  }

  return (
    <div className="flex flex-col">
      <Topbar title="New Site" />
      <div className="p-6 max-w-lg">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
          <Link href="/dashboard/sites"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Add a new site</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Site name *</Label>
                <Input id="name" placeholder="Head Office" {...register('name')} />
                {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" placeholder="123 Main Street, City" {...register('address')} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating…' : 'Create Site'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
