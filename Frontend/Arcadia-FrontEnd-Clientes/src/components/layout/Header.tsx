import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Search, User } from 'lucide-react'
import { useCart } from '../../context/CartContext'

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
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <div className="text-2xl font-bold text-primary-600">
              Arcadia Comics
            </div>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Buscar cómics..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-3">
            {currentUser ? (
              <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full text-sm">
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
                <span className="font-medium text-gray-700 max-w-[120px] truncate" title={currentUser.email || ''}>
                  {currentUser.nombre || currentUser.email || 'Usuario'}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
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
                  className="text-gray-400 hover:text-red-600 transition-colors p-1"
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
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Iniciar Sesión"
              >
                <User className="h-5 w-5 text-gray-600" />
                <span className="hidden sm:inline">Ingresar</span>
              </button>
            )}
            
            <button 
              type="button"
              onClick={() => navigate('/cart')}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Ver Carrito"
            >
              <ShoppingCart className="h-6 w-6 text-gray-600" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
