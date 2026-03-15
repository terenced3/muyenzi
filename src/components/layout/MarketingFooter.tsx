import Link from 'next/link'

export default function MarketingFooter() {
  return (
    <footer className="border-t bg-white py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-7 w-7 rounded-lg bg-slate-900 flex items-center justify-center">
                <span className="text-white font-bold text-xs">M</span>
              </div>
              <span className="font-semibold text-slate-900">muyenzi</span>
            </div>
            <p className="text-xs text-slate-500">Modern visitor management for professional workplaces.</p>
          </div>
          <div>
            <h4 className="font-medium text-slate-900 mb-3 text-sm">Product</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="/features" className="hover:text-slate-900">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-slate-900">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-slate-900 mb-3 text-sm">Company</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="/contact" className="hover:text-slate-900">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-slate-900 mb-3 text-sm">Account</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="/login" className="hover:text-slate-900">Sign in</Link></li>
              <li><Link href="/signup" className="hover:text-slate-900">Sign up</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t pt-6 text-xs text-slate-400">
          © {new Date().getFullYear()} Muyenzi. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
