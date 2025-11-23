import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { AuthProvider } from '@/context/AuthContext'
import { DataProvider } from '@/context/DataContext'

export default function Layout() {
  return (
    <AuthProvider>
      <DataProvider>
        <div className="flex flex-col min-h-screen bg-background font-sans text-foreground">
          <Navbar />
          <main className="flex-grow pt-[70px]">
            <Outlet />
          </main>
          <Footer />
        </div>
      </DataProvider>
    </AuthProvider>
  )
}
