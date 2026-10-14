import { Link } from 'react-router-dom'
import { Zap, ShieldCheck, Mail, Heart } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white border-t border-slate-800 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-primary-400">Arcadia Comics</span>
              <span className="text-xs bg-primary-900/60 text-primary-300 border border-primary-500/30 px-2 py-0.5 rounded-full font-bold">
                Cloud Native
              </span>
            </div>
            <p className="text-slate-400 text-sm max-w-md leading-relaxed">
              Tu portal preferido para cómics clásicos, novelas gráficas y manga. Diseñado con una arquitectura desacoplada y orientada a eventos con Spring Boot, RabbitMQ y AWS.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-400" />
                <span>RabbitMQ AMQP</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Azure Entra ID + AWS</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Navegación</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-slate-400 hover:text-white transition-colors">
                  Inicio / Catálogo
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-slate-400 hover:text-white transition-colors">
                  Carrito de Compras
                </Link>
              </li>
              <li>
                <a href="#catalogo" className="text-slate-400 hover:text-white transition-colors">
                  Explorar Cómics
                </a>
              </li>
            </ul>
          </div>

          {/* Architecture Details */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Arquitectura de Eventos</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <strong className="text-slate-200">Exchange Direct:</strong>
                <span className="block font-mono text-[11px] text-indigo-400">comics.ventas.direct</span>
              </li>
              <li>
                <strong className="text-slate-200">Routing Key:</strong>
                <span className="block font-mono text-[11px] text-amber-400">venta.confirmada</span>
              </li>
              <li>
                <strong className="text-slate-200">Colas Vinculadas:</strong>
                <span className="block font-mono text-[11px] text-emerald-400">cola.ventas.pdf</span>
                <span className="block font-mono text-[11px] text-teal-400">cola.ventas.stock</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} Arcadia Comics Store · DSY1107 Desarrollo Cloud Native I.</p>
          <p className="flex items-center gap-1">
            <span>Desarrollado para evaluación académica DuocUC</span>
            <Heart className="h-3 w-3 text-red-500 fill-red-500" />
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
