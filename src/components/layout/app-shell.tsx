'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  DollarSign,
  Calendar,
  Lightbulb,
  Archive,
  Menu,
  X,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: <LayoutDashboard size={16} /> },
  { label: 'Legislation', href: '/legislation', icon: <FileText size={16} /> },
  { label: 'Budget', href: '/budget', icon: <DollarSign size={16} /> },
  { label: 'Hearings & Calendar', href: '/hearings', icon: <Calendar size={16} /> },
  { label: 'EOAB Policy Ideas', href: '/policy-ideas', icon: <Lightbulb size={16} /> },
  { label: 'Knowledge / Archive', href: '/knowledge', icon: <Archive size={16} /> },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <header
        className="fixed top-0 left-0 right-0 z-50 border-b border-slate-700"
        style={{ backgroundColor: 'var(--primary)' }}
      >
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="flex items-center h-14 gap-6">
            {/* App Title */}
            <Link
              href="/"
              className="flex-shrink-0 text-white font-semibold text-base tracking-tight hover:text-slate-200 transition-colors"
            >
              MassCEO Policy Tracker
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-0.5 flex-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    'flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors',
                    isActive(item.href)
                      ? 'bg-white/15 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-white/10',
                  ].join(' ')}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen((prev) => !prev)}
              className="lg:hidden ml-auto text-slate-300 hover:text-white transition-colors p-1"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileOpen && (
          <div
            className="lg:hidden border-t border-slate-700 px-4 py-3 space-y-1"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={[
                  'flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'bg-white/15 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-white/10',
                ].join(' ')}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Main Content — offset for fixed header */}
      <main className="flex-1 pt-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</div>
      </main>
    </div>
  )
}
