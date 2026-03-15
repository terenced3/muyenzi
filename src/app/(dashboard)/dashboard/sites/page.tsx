import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Building2, Plus, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Topbar from '@/components/layout/Topbar'
import Link from 'next/link'
import { formatDate } from '@/lib/utils/format'
import DeleteSiteButton from './DeleteSiteButton'

export const metadata = { title: 'Sites – Muyenzi' }

export default async function SitesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('company_id, role').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const { data: sites } = await supabase
    .from('sites')
    .select('*')
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })

  const canManage = ['admin', 'site_manager'].includes(profile.role)

  return (
    <div className="flex flex-col">
      <Topbar title="Sites" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">{sites?.length ?? 0} location{sites?.length !== 1 ? 's' : ''}</p>
          {canManage && (
            <Button asChild>
              <Link href="/dashboard/sites/new">
                <Plus className="h-4 w-4 mr-2" /> Add Site
              </Link>
            </Button>
          )}
        </div>

        {!sites?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Building2 className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="font-semibold text-slate-900 mb-1">No sites yet</h3>
            <p className="text-sm text-slate-500 mb-4">Add your first location to start managing visitors.</p>
            {canManage && (
              <Button asChild>
                <Link href="/dashboard/sites/new"><Plus className="h-4 w-4 mr-2" />Add Site</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sites.map(site => (
              <Card key={site.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <Building2 className="h-5 w-5 text-slate-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{site.name}</p>
                        {site.address && (
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                            <p className="text-xs text-slate-500 truncate">{site.address}</p>
                          </div>
                        )}
                        <p className="text-xs text-slate-400 mt-2">Added {formatDate(site.created_at)}</p>
                      </div>
                    </div>
                    {canManage && <DeleteSiteButton siteId={site.id} siteName={site.name} />}
                  </div>
                  <div className="mt-4 pt-4 border-t flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/kiosk/${site.id}`} target="_blank">
                        Open Kiosk
                      </Link>
                    </Button>
                    {canManage && (
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link href={`/dashboard/sites/${site.id}`}>Edit</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
