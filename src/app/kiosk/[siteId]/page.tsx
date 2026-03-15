import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import KioskShell from '@/components/kiosk/KioskShell'

export default async function KioskPage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: site } = await supabase
    .from('sites')
    .select('id, name, address, company_id')
    .eq('id', siteId)
    .single()

  if (!site) notFound()

  return <KioskShell site={site} />
}
