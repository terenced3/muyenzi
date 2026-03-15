'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function ExportMenu({ companyId }: { companyId: string }) {
  function download(format: 'csv' | 'pdf') {
    window.open(`/api/export/${format}?company_id=${companyId}`, '_blank')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
        <Download className="h-4 w-4 mr-2" /> Export
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => download('csv')}>Export as CSV</DropdownMenuItem>
        <DropdownMenuItem onClick={() => download('pdf')}>Export as PDF</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
