import type { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { OfflineBanner } from './OfflineBanner'
import { AuthProvider } from '@/context/AuthContext'
import { DataProvider } from '@/context/DataContext'
import { MockAuthProvider } from '@/mocks/MockAuthProvider'
import { MockDataProvider } from '@/mocks/MockDataProvider'
import { QueryProvider } from './QueryProvider'
import { USE_MOCKS } from '@/lib/config'

function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-background font-sans text-foreground">
      <Navbar />
      <OfflineBanner />
      {USE_MOCKS && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-900 dark:text-amber-100 text-center text-xs sm:text-sm py-1.5 px-3">
          Modo MOCK ativo — dados locais, sem Supabase/Stripe. Senha demo:{' '}
          <strong>demo123</strong>
        </div>
      )}
      <main className="flex-grow pt-[70px]">{children}</main>
      <Footer />
    </div>
  )
}

export default function Layout() {
  if (USE_MOCKS) {
    return (
      <QueryProvider>
        <MockAuthProvider>
          <MockDataProvider>
            <AppShell>
              <Outlet />
            </AppShell>
          </MockDataProvider>
        </MockAuthProvider>
      </QueryProvider>
    )
  }

  return (
    <QueryProvider>
      <AuthProvider>
        <DataProvider>
          <AppShell>
            <Outlet />
          </AppShell>
        </DataProvider>
      </AuthProvider>
    </QueryProvider>
  )
}
