import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { OfflineBanner } from './OfflineBanner'
import { AuthProvider } from '@/context/AuthContext'
import { DataProvider } from '@/context/DataContext'
import { QueryProvider } from './QueryProvider'

export default function Layout() {
  return (
    <QueryProvider>
      <AuthProvider>
        <DataProvider>
          <div className="flex flex-col min-h-screen bg-background font-sans text-foreground">
            <Navbar />
            <OfflineBanner />
            <main className="flex-grow pt-[70px]">
              <Outlet />
            </main>
            <Footer />
          </div>
        </DataProvider>
      </AuthProvider>
    </QueryProvider>
  )
}
