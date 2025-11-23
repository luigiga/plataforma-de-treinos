import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Menu, Dumbbell, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useAuth } from '@/context/AuthContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Notifications } from '@/components/Notifications'

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
    setIsMobileMenuOpen(false)
  }

  const navLinks = [
    {
      name: 'Para Treinadores',
      path: '/trainers',
      show: !user || user.role === 'subscriber',
    },
    {
      name: 'Treinos',
      path: '/dashboard',
      show: !!user && user.role === 'subscriber',
    },
    {
      name: 'Meus Treinos',
      path: '/trainer-dashboard',
      show: !!user && user.role === 'trainer',
    },
    {
      name: 'Progresso',
      path: '/progress',
      show: !!user && user.role === 'subscriber',
    },
    {
      name: 'Admin',
      path: '/admin-dashboard',
      show: !!user && user.role === 'admin',
    },
    { name: 'Comunidade', path: '/social', show: true },
    { name: 'Planos', path: '/plans', show: true },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'glass-nav h-16' : 'bg-transparent h-16 md:h-20'}`}
    >
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-primary text-white p-2 rounded-xl transition-transform group-hover:scale-110 duration-300 shadow-lg shadow-primary/30">
            <Dumbbell size={20} />
          </div>
          <span className="font-display font-bold text-lg md:text-xl tracking-tight text-foreground">
            FitPlatform
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {navLinks
            .filter((link) => link.show)
            .map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === link.path ? 'text-primary font-bold' : 'text-muted-foreground'}`}
              >
                {link.name}
              </Link>
            ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <Notifications />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full btn-press p-0"
                  >
                    <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-sm">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    Meu Perfil
                  </DropdownMenuItem>
                  {user.role === 'trainer' && (
                    <DropdownMenuItem
                      onClick={() => navigate('/trainer-dashboard')}
                    >
                      Dashboard
                    </DropdownMenuItem>
                  )}
                  {user.role === 'subscriber' && (
                    <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                      Meus Treinos
                    </DropdownMenuItem>
                  )}
                  {user.role === 'admin' && (
                    <DropdownMenuItem
                      onClick={() => navigate('/admin-dashboard')}
                    >
                      <ShieldAlert className="mr-2 h-4 w-4" /> Painel Admin
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive"
                  >
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => navigate('/auth?tab=login')}
                className="btn-press"
              >
                Entrar
              </Button>
              <Button
                onClick={() => navigate('/auth?tab=register')}
                className="btn-press shadow-lg shadow-primary/20 rounded-full px-6"
              >
                Cadastrar
              </Button>
            </>
          )}
        </div>

        <div className="md:hidden flex items-center gap-2">
          {user && <Notifications />}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col gap-6 mt-8">
                <nav className="flex flex-col gap-4">
                  {navLinks
                    .filter((link) => link.show)
                    .map((link) => (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`text-lg font-medium transition-colors hover:text-primary ${location.pathname === link.path ? 'text-primary font-bold' : 'text-foreground'}`}
                      >
                        {link.name}
                      </Link>
                    ))}
                </nav>
                <div className="flex flex-col gap-3 mt-4">
                  {user ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigate('/profile')
                          setIsMobileMenuOpen(false)
                        }}
                      >
                        Meu Perfil
                      </Button>
                      <Button variant="destructive" onClick={handleLogout}>
                        Sair
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigate('/auth?tab=login')
                          setIsMobileMenuOpen(false)
                        }}
                      >
                        Entrar
                      </Button>
                      <Button
                        onClick={() => {
                          navigate('/auth?tab=register')
                          setIsMobileMenuOpen(false)
                        }}
                      >
                        Cadastrar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
