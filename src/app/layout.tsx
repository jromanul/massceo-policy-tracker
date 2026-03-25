import type { Metadata } from 'next'
import './globals.css'
import { AppShell } from '@/components/layout/app-shell'

export const metadata: Metadata = {
  title: 'MassCEO Policy Tracker',
  description: 'Legislative and policy tracking for the Massachusetts Center for Employee Ownership',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--background)]">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
