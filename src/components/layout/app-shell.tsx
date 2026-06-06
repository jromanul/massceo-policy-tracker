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
  Menu,
  X,
  Map,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: <LayoutDashboard size={15} strokeWidth={1.75} /> },
  { label: 'MA Legislation', href: '/legislation', icon: <FileText size={15} strokeWidth={1.75} /> },
  { label: 'Budget', href: '/budget', icon: <DollarSign size={15} strokeWidth={1.75} /> },
  { label: 'Hearings & Calendar', href: '/hearings', icon: <Calendar size={15} strokeWidth={1.75} /> },
  { label: 'National Employee Ownership Legislation Tracker', href: '/other-state-centers', icon: <Map size={15} strokeWidth={1.75} /> },
  { label: 'Peer State Policy Overview', href: '/policy-ideas', icon: <Lightbulb size={15} strokeWidth={1.75} /> },
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
      {/* Commonwealth banner — institutional masthead */}
      <header
        className="fixed top-0 left-0 right-0 z-50"
        style={{ backgroundColor: 'var(--ma-navy)' }}
      >
        {/* Top utility strip — agency identification, presentation-deck style */}
        <div
          className="hidden md:block"
          style={{ backgroundColor: 'var(--ma-navy-deep)' }}
        >
          <div className="max-w-[1400px] mx-auto px-6">
            <div className="flex items-center justify-between h-6 text-[11px] tracking-wide">
              <span
                className="uppercase font-medium"
                style={{ color: 'var(--ma-blue-soft)', letterSpacing: '0.08em' }}
              >
                Commonwealth of Massachusetts · Office of Business Development
              </span>
              <span className="text-white/60 font-mono text-[10px]">
                Massachusetts Center for Employee Ownership
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center h-14 gap-8">
            {/* App Title */}
            <Link
              href="/"
              style={{ color: '#ffffff' }}
              className="flex-shrink-0 flex items-baseline gap-2 hover:opacity-90 transition-opacity no-underline"
            >
              <span
                className="font-semibold text-[17px] tracking-tight"
                style={{ fontFamily: "'Source Sans 3', sans-serif", color: '#ffffff' }}
              >
                MassCEO
              </span>
              <span
                className="text-[13px] font-normal"
                style={{ color: 'var(--ma-blue-soft)' }}
              >
                Policy Tracker
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-1 flex-1">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{ color: '#ffffff' }}
                    className={[
                      'flex items-center gap-1.5 px-3 py-2 text-[13px] font-bold tracking-tight transition-colors relative no-underline',
                      active ? 'opacity-100' : 'opacity-90 hover:opacity-100',
                    ].join(' ')}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute left-2 right-2 -bottom-0.5 h-[2px]"
                        style={{ backgroundColor: 'var(--ma-blue)' }}
                      />
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen((prev) => !prev)}
              className="lg:hidden ml-auto text-white/80 hover:text-white transition-colors p-1"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Commonwealth accent strip — three-band motif */}
        <div className="ma-accent-strip" aria-hidden="true" />

        {/* Mobile Dropdown */}
        {mobileOpen && (
          <div
            className="lg:hidden border-t px-4 py-3 space-y-1"
            style={{
              backgroundColor: 'var(--ma-navy)',
              borderTopColor: 'var(--ma-navy-deep)',
            }}
          >
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    color: '#ffffff',
                    ...(active
                      ? { borderLeft: `3px solid var(--ma-blue)`, paddingLeft: '9px' }
                      : {}),
                  }}
                  className={[
                    'flex items-center gap-2 px-3 py-2 text-sm font-bold transition-colors no-underline',
                    active ? 'opacity-100' : 'opacity-90 hover:opacity-100',
                  ].join(' ')}
                >
                  {item.icon}
                  {item.label}
                </Link>
              )
            })}
          </div>
        )}
      </header>

      {/* Main content — offset for fixed header (14 h nav + 6 h utility strip + 3 px strip)  */}
      <main className="flex-1 pt-[calc(3.5rem+1.5rem+3px)] md:pt-[calc(3.5rem+1.5rem+3px)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">{children}</div>
      </main>
    </div>
  )
}
