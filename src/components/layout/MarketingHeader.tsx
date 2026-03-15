import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="font-semibold text-slate-900 text-lg">muyenzi</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-slate-600">
          <Link href="/features" className="hover:text-slate-900 transition-colors">Features</Link>
          <Link href="/pricing" className="hover:text-slate-900 transition-colors">Pricing</Link>
          <Link href="/contact" className="hover:text-slate-900 transition-colors">Contact</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/signup">Start free trial</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
