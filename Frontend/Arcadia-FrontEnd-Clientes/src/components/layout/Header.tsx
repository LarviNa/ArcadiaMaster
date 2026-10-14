import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Search, User, Sun, Moon, Package } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useTheme } from '../../context/ThemeContext'

interface UserSession {
  id?: string
  nombre?: string
  email?: string
  rol?: string
  esMicrosoft?: boolean
  proveedor?: string
}

const Header = () => {
  const { items } = useCart()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null)
  const cartItemCount = items?.reduce((sum: number, item: any) => sum + (item?.quantity || 0), 0) || 0

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        setCurrentUser(JSON.parse(userStr))
      }
    } catch {
      setCurrentUser(null)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setCurrentUser(null)
    const loginUrl = import.meta.env.VITE_LOGIN_URL || 'http://localhost:5173'
    window.location.href = loginUrl
  }

  const handleGoToAdmin = () => {
    const token = localStorage.getItem('token') || ''
    const userStr = encodeURIComponent(JSON.stringify(currentUser || {}))
    const adminUrl = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174'
    window.location.href = `${adminUrl}/?token=${token}&user=${userStr}`
  }

  const isMicrosoft =
    currentUser?.esMicrosoft === true ||
    currentUser?.proveedor?.toUpperCase() === 'MICROSOFT'

  const isAdmin = currentUser?.rol?.toLowerCase() === 'admin'

  return (
    <header className="bg-white dark:bg-slate-900 shadow-sm border-b border-gray-200 dark:border-slate-800 transition-colors duration-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400 transition-colors">
              Arcadia Comics
            </div>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Buscar cómics..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-slate-500" />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-2 sm:space-x-3">
            {currentUser ? (
              <div className="flex items-center space-x-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-3 py-1.5 rounded-full text-sm">
                {isMicrosoft && (
                  <span title="Autenticado con Microsoft Entra ID" className="inline-flex items-center">
                    <svg viewBox="0 0 21 21" width="14" height="14" className="flex-shrink-0">
                      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                    </svg>
                  </span>
                )}
                <span className="font-medium text-gray-700 dark:text-slate-200 max-w-[120px] truncate" title={currentUser.email || ''}>
                  {currentUser.nombre || currentUser.email || 'Usuario'}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    isAdmin ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300' : 'bg-green-100 dark:bg-emerald-900/60 text-green-700 dark:text-emerald-300'
                  }`}
                >
                  {currentUser.rol || 'Cliente'}
                </span>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={handleGoToAdmin}
                    className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-full font-medium transition-colors"
                    title="Ir al Panel de Administración"
                  >
                    <span>Admin</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors p-1"
                  title="Cerrar sesión"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => {
                  const loginUrl = import.meta.env.VITE_LOGIN_URL || 'http://localhost:5173'
                  window.location.href = loginUrl
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Iniciar Sesión"
              >
                <User className="h-5 w-5 text-gray-600 dark:text-slate-300" />
                <span className="hidden sm:inline">Ingresar</span>
              </button>
            )}

            {/* Mis Compras Link */}
            <Link
              to="/mis-compras"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-gray-700 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 transition-colors"
              title="Ver mis compras recientes"
            >
              <Package className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              <span className="hidden sm:inline">Mis Compras</span>
            </Link>
            
            {/* Dark Mode Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              title={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 transition-transform duration-300 rotate-0 hover:rotate-45" />
              ) : (
                <Moon className="h-5 w-5 transition-transform duration-300 hover:-rotate-12" />
              )}
            </button>

            {/* Cart Button */}
            <button 
              type="button"
              onClick={() => navigate('/cart')}
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              title="Ver Carrito"
            >
              <ShoppingCart className="h-6 w-6 text-gray-600 dark:text-slate-300" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {cartItemCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar cómics..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-slate-500" />
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
