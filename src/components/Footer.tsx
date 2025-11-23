import { Link } from 'react-router-dom'
import { Facebook, Instagram, Youtube, Dumbbell } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-secondary/50 border-t border-border pt-12 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="bg-primary text-white p-1 rounded-md">
                <Dumbbell size={16} />
              </div>
              <span className="font-display font-bold text-lg tracking-tight">
                FitPlatform
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              A plataforma definitiva para conectar personal trainers e
              entusiastas do fitness.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Plataforma</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/trainers" className="hover:text-primary">
                  Para Treinadores
                </Link>
              </li>
              <li>
                <Link to="/plans" className="hover:text-primary">
                  Planos
                </Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-primary">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="#" className="hover:text-primary">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-primary">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-primary">
                  Cookies
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Social</h4>
            <div className="flex gap-4">
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Instagram size={20} />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Facebook size={20} />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Youtube size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} FitPlatform. Todos os direitos
            reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
