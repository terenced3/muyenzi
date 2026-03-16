import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Building2, Plus, MapPin } from 'lucide-react'
import { Button, Card, CardBody } from '@heroui/react'
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
    <div className="flex flex-col h-full">
      <Topbar title="Sites" description="Manage your locations and kiosk access" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-default-400 font-medium">
            {sites?.length ?? 0} location{sites?.length !== 1 ? 's' : ''}
          </p>
          {canManage && (
            <Button
              as={Link}
              href="/dashboard/sites/new"
              color="primary"
              variant="shadow"
              size="sm"
              radius="lg"
              className="font-semibold"
              startContent={<Plus className="h-4 w-4" />}
            >
              Add Site
            </Button>
          )}
        </div>

        {!sites?.length ? (
          <Card shadow="md" radius="lg" className="bg-content1">
            <CardBody className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-full bg-default-100 flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-default-300" />
              </div>
              <h3 className="font-bold text-foreground text-lg mb-1">No sites yet</h3>
              <p className="text-sm text-default-400 mb-5">Add your first location to start managing visitors.</p>
              {canManage && (
                <Button
                  as={Link}
                  href="/dashboard/sites/new"
                  color="primary"
                  variant="shadow"
                  radius="lg"
                  className="font-semibold"
                  startContent={<Plus className="h-4 w-4" />}
                >
                  Add Site
                </Button>
              )}
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sites.map(site => (
              <Card
                key={site.id}
                shadow="md"
                radius="lg"
                className="bg-content1 hover:shadow-lg transition-shadow duration-200"
              >
                <CardBody className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground">{site.name}</p>
                        {site.address && (
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3 text-default-400 shrink-0" />
                            <p className="text-xs text-default-400 truncate">{site.address}</p>
                          </div>
                        )}
                        <p className="text-xs text-default-300 mt-1.5">Added {formatDate(site.created_at)}</p>
                      </div>
                    </div>
                    {canManage && <DeleteSiteButton siteId={site.id} siteName={site.name} />}
                  </div>

                  <div className="mt-4 pt-4 flex gap-2" style={{ borderTop: '1px solid var(--border)' }}>
                    <Button
                      as={Link}
                      href={`/kiosk/${site.id}`}
                      target="_blank"
                      variant="flat"
                      color="default"
                      size="sm"
                      radius="lg"
                      className="flex-1 font-semibold"
                    >
                      Open Kiosk
                    </Button>
                    {canManage && (
                      <Button
                        as={Link}
                        href={`/dashboard/sites/${site.id}`}
                        variant="flat"
                        color="primary"
                        size="sm"
                        radius="lg"
                        className="flex-1 font-semibold"
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
