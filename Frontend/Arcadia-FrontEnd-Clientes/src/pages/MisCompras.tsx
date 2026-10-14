import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package, ArrowLeft, Calendar, CheckCircle2, Clock, AlertCircle, ShoppingBag, ExternalLink, ShieldCheck } from 'lucide-react'
import { getFallbackImage } from '../data/comicsData'

interface OrderItem {
  comicId: string
  title: string
  price: number
  quantity: number
  coverImage?: string
}

interface Order {
  id: string
  userId: string
  customerName: string
  customerEmail: string
  totalAmount: number
  status: string
  createdAt?: string
  items: OrderItem[]
}

const MisCompras = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const navigate = useNavigate()

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        setCurrentUser(JSON.parse(userStr))
      } else {
        setCurrentUser(null)
      }
    } catch {
      setCurrentUser(null)
    }
  }, [])

  useEffect(() => {
    const fetchUserOrders = async () => {
      if (!currentUser) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8083'
      const token = localStorage.getItem('token')

      try {
        // Consultar pedidos por userId y email
        const queryParams = new URLSearchParams()
        if (currentUser.id) queryParams.append('userId', currentUser.id)
        if (currentUser.email) queryParams.append('email', currentUser.email)

        let ordersList: Order[] = []

        // Intento 1: /orders/user-orders
        try {
          const res = await fetch(`${gatewayUrl}/orders/user-orders?${queryParams.toString()}`, {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            signal: AbortSignal.timeout(6000)
          })
          if (res.ok) {
            ordersList = await res.json()
          }
        } catch (e1) {
          console.warn('Fallo endpoint /orders/user-orders, probando fallback...', e1)
        }

        // Intento 2: fallback a /orders/history/{userId} si la lista está vacía
        if ((!ordersList || ordersList.length === 0) && currentUser.id) {
          try {
            const resHistory = await fetch(`${gatewayUrl}/orders/history/${currentUser.id}`, {
              headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              },
              signal: AbortSignal.timeout(6000)
            })
            if (resHistory.ok) {
              ordersList = await resHistory.json()
            }
          } catch (e2) {
            console.warn('Fallo endpoint /orders/history, probando fallback general...', e2)
          }
        }

        // Intento 3: fallback a /orders y filtrar en cliente por email
        if (!ordersList || ordersList.length === 0) {
          try {
            const resAll = await fetch(`${gatewayUrl}/orders`, {
              signal: AbortSignal.timeout(6000)
            })
            if (resAll.ok) {
              const allOrders = await resAll.json()
              if (Array.isArray(allOrders)) {
                ordersList = allOrders.filter(
                  (o: any) =>
                    (currentUser.email && o.customerEmail?.toLowerCase() === currentUser.email?.toLowerCase()) ||
                    (currentUser.id && o.userId === currentUser.id)
                )
              }
            }
          } catch (e3) {
            console.warn('Fallo fallback /orders general', e3)
          }
        }

        // Ordenar pedidos por fecha más reciente
        if (Array.isArray(ordersList)) {
          ordersList.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime()
            const dateB = new Date(b.createdAt || 0).getTime()
            return dateB - dateA
          })
          setOrders(ordersList)
        } else {
          setOrders([])
        }
      } catch (err: any) {
        setError('No se pudo conectar con el servicio de órdenes. Intenta nuevamente.')
      } finally {
        setLoading(false)
      }
    }

    fetchUserOrders()
  }, [currentUser])

  const formatPriceCLP = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(price)
  }

  const formatFecha = (dateStr?: string) => {
    if (!dateStr) return 'Fecha reciente'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateStr
    }
  }

  const loginUrl = import.meta.env.VITE_LOGIN_URL || 'http://localhost:5173'

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-200">
      {/* Botón Volver */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al Catálogo</span>
        </Link>
      </div>

      {/* Header del Perfil / Compras */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-slate-700 shadow-sm mb-8 transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md">
              <Package className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-slate-100">
                Mis Compras Recientes
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                {currentUser ? (
                  <>
                    Historial de pedidos para{' '}
                    <strong className="text-gray-800 dark:text-slate-200">
                      {currentUser.nombre || currentUser.email}
                    </strong>{' '}
                    ({currentUser.email})
                  </>
                ) : (
                  'Consulta tus adquisiciones, boletas y detalles de entrega'
                )}
              </p>
            </div>
          </div>

          {currentUser && (
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 px-3.5 py-1.5 rounded-full text-xs font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              <span>Cliente Autenticado</span>
            </div>
          )}
        </div>
      </div>

      {/* Si no ha iniciado sesión */}
      {!currentUser ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 p-8 shadow-sm">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">
            Inicia sesión para ver tus compras
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            Para proteger tu privacidad y mostrarte tus boletas y pedidos anteriores, ingresa con tu cuenta de cliente.
          </p>
          <a
            href={loginUrl}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-md transition-all text-sm"
          >
            <span>Iniciar Sesión como Cliente</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      ) : loading ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 dark:border-primary-400 mx-auto mb-3"></div>
          <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">Buscando tus pedidos en el sistema...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl text-red-700 dark:text-red-300 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 p-8 shadow-sm">
          <div className="text-5xl mb-4">📦</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">
            Aún no tienes compras registradas
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            Cuando adquieras cómics a través de nuestro carrito de compras, aparecerán listados aquí en vivo con sus boletas y estados.
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-md transition-all text-sm cursor-pointer"
          >
            <span>Explorar Catálogo de Cómics</span>
          </button>
        </div>
      ) : (
        /* Lista de órdenes */
        <div className="space-y-6">
          <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 px-1">
            Tienes <span className="text-gray-900 dark:text-slate-100 font-bold">{orders.length}</span> compra{orders.length !== 1 ? 's' : ''} realizada{orders.length !== 1 ? 's' : ''}
          </p>

          {orders.map((order) => {
            const isPaid = order.status?.toUpperCase() === 'PAID' || order.status?.toUpperCase() === 'COMPLETED'
            return (
              <div
                key={order.id}
                className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
              >
                {/* Cabecera del pedido */}
                <div className="bg-gray-50/80 dark:bg-slate-900/60 px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-xs font-bold bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-slate-200 px-2.5 py-1 rounded-lg">
                      #{order.id.slice(0, 13)}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatFecha(order.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 ${
                        isPaid
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                      }`}
                    >
                      {isPaid ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                      {isPaid ? 'Pago Confirmado' : order.status || 'Pendiente'}
                    </span>
                    <span className="text-base font-black text-gray-900 dark:text-slate-100">
                      {formatPriceCLP(order.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Lista de Cómics comprados */}
                <div className="p-6 divide-y divide-gray-100 dark:divide-slate-700/60">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, idx) => (
                      <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={item.coverImage || getFallbackImage(item.title, 'Comics')}
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              ;(e.currentTarget as HTMLImageElement).src = getFallbackImage(item.title, 'Comics')
                            }}
                            className="w-12 h-16 object-cover rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 flex-shrink-0"
                          />
                          <div>
                            <h4 className="font-bold text-gray-900 dark:text-slate-100 text-sm sm:text-base line-clamp-1">
                              {item.title}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                              {formatPriceCLP(item.price)} × <span className="font-bold text-gray-700 dark:text-slate-300">{item.quantity} ejemplar{item.quantity !== 1 ? 'es' : ''}</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-bold text-gray-800 dark:text-slate-200 text-sm">
                            {formatPriceCLP(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-slate-400 py-2">
                      Información de ítems procesada vía RabbitMQ
                    </p>
                  )}
                </div>

                {/* Pie de la tarjeta */}
                <div className="bg-gray-50/50 dark:bg-slate-900/30 px-6 py-3 border-t border-gray-100 dark:border-slate-700/60 flex flex-wrap items-center justify-between text-xs text-gray-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Boleta electrónica despachada a {order.customerEmail}
                  </span>
                  <span className="font-medium">
                    Total productos: {order.items?.reduce((s, it) => s + (it.quantity || 1), 0) || 1} unid.
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MisCompras
