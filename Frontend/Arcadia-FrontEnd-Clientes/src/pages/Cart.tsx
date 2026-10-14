import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft, Mail, User, CreditCard, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { getFallbackImage } from '../data/comicsData'

const Cart = () => {
  const { items, total, updateQuantity, removeFromCart, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [liveStockMap, setLiveStockMap] = useState<{ [id: string]: number }>({})
  const [successData, setSuccessData] = useState<{
    orderId: string
    customerName: string
    customerEmail: string
    totalAmount: number
    itemsCount: number
  } | null>(null)

  // Customer details
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [userId, setUserId] = useState('')

  // Payment mock
  const [cardNumber, setCardNumber] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [ccv, setCcv] = useState('')

  const navigate = useNavigate()

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const u = JSON.parse(userStr)
        if (u.nombre) setCustomerName(u.nombre)
        if (u.email) setCustomerEmail(u.email)
        if (u.id) setUserId(u.id)
      }
    } catch {
      // Empty by default
    }
  }, [])

  // Sincronización en vivo con la base de datos MySQL (ms-comics vía Gateway)
  useEffect(() => {
    const fetchLiveStocks = async () => {
      try {
        const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8083'
        const res = await fetch(`${gatewayUrl}/api/comics`, { signal: AbortSignal.timeout(3000) })
        if (res.ok) {
          const list = await res.json()
          if (Array.isArray(list)) {
            const map: { [id: string]: number } = {}
            list.forEach((c: any) => {
              map[c.id] = typeof c.stock === 'number' ? c.stock : 0
            })
            setLiveStockMap(map)
          }
        }
      } catch (e) {
        console.warn('No se pudo sincronizar stock en vivo en el carrito:', e)
      }
    }
    fetchLiveStocks()
  }, [items.length])

  const getItemStock = (item: any): number => {
    if (liveStockMap[item.id] !== undefined) {
      return liveStockMap[item.id]
    }
    const raw = item.stock !== undefined ? item.stock : 10
    return typeof raw === 'number' ? raw : parseInt(String(raw), 10)
  }

  const itemsWithIssues = items.filter((item) => {
    const stock = getItemStock(item)
    return stock <= 0 || item.quantity > stock
  })
  const hasStockError = itemsWithIssues.length > 0

  const handleFillDemoData = () => {
    setCustomerName('Matias Barraza Contreras')
    setCustomerEmail('mat.barrazac@duocuc.cl')
    setUserId('u-demo-matias')
    setCardNumber('4532 8901 2345 6789')
    setExpirationDate('12/29')
    setCcv('123')
  }

  const formatPriceCLP = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(price)
  }

  const shippingCost = total >= 30000 || total === 0 ? 0 : 2990
  const finalTotal = total + shippingCost

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return

    if (!customerEmail || !customerName) {
      setError('Por favor completa el nombre y correo para despachar tu boleta PDF.')
      return
    }

    // =========================================================================
    // 🛡️ VERIFICACIÓN DIRECTA DE LA PÁGINA (CONTROL DE STOCK ANTES DE LA COLA)
    // =========================================================================
    for (const item of items) {
      const stockItem = getItemStock(item)
      if (stockItem <= 0) {
        setError(`❌ Compra Bloqueada en la Página: El cómic "${item.title}" está actualmente AGOTADO (Stock: 0). Debes eliminarlo del carrito para poder continuar. La orden NO fue enviada a la cola RabbitMQ.`)
        return
      }
      if (item.quantity > stockItem) {
        setError(`❌ Compra Bloqueada en la Página: Solicitas ${item.quantity} unidades de "${item.title}", pero solo disponemos de ${stockItem} en stock. Ajusta la cantidad antes de comprar. La orden NO fue enviada a la cola.`)
        return
      }
    }

    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('token') || ''
      const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8083'

      // 2. Verificación en tiempo real contra la base de datos (ms-comics)
      for (const item of items) {
        try {
          const resComic = await fetch(`${gatewayUrl}/api/comics/${item.id}`, {
            signal: AbortSignal.timeout(2500)
          })
          if (resComic.ok) {
            const liveData = await resComic.json()
            const realStock = liveData.stock !== undefined ? liveData.stock : 10
            if (realStock <= 0) {
              setError(`❌ Verificación en Vivo: "${item.title}" se encuentra actualmente AGOTADO (0 unidades en base de datos). La compra fue bloqueada en la página sin pasar a la cola RabbitMQ.`)
              setLoading(false)
              return
            }
            if (item.quantity > realStock) {
              setError(`❌ Verificación en Vivo: Solicitas ${item.quantity} ejemplares de "${item.title}", pero el stock en MySQL es de solo ${realStock}. La orden NO fue enviada a la cola.`)
              setLoading(false)
              return
            }
          }
        } catch (checkErr) {
          console.warn('Verificación en vivo omitida para ítem ' + item.id, checkErr)
        }
      }

      const orderData = {
        userId: userId || 'u-invitado',
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        totalAmount: finalTotal,
        items: items.map((i) => ({
          comicId: i.id,
          title: i.title,
          price: i.price,
          quantity: i.quantity,
          coverImage: i.coverImage
        })),
        cardNumber: cardNumber.replace(/\s+/g, ''),
        expirationDate: expirationDate.trim(),
        ccv: ccv.trim()
      }

      const response = await fetch(`${gatewayUrl}/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(orderData)
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.message || errData.error || `Error ${response.status}: Fallo en checkout`)
      }

      const resData = await response.json()
      const confirmedOrderId = resData.id || resData.orderId || `ORD-${Date.now().toString().slice(-6)}`

      setSuccessData({
        orderId: confirmedOrderId,
        customerName: customerName,
        customerEmail: customerEmail,
        totalAmount: finalTotal,
        itemsCount: items.reduce((s, it) => s + it.quantity, 0)
      })

      clearCart()
    } catch (err: any) {
      console.warn('Checkout request falló:', err)
      setError(`No se pudo procesar la compra: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Success view with RabbitMQ event explanation
  if (successData) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden transition-colors">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-8 text-white text-center">
            <div className="inline-flex p-3 bg-white/20 rounded-full mb-3 backdrop-blur-sm">
              <CheckCircle2 className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-3xl font-black mb-2">¡Compra Procesada con Éxito!</h1>
            <p className="text-emerald-100 text-sm max-w-lg mx-auto">
              Tu orden ha sido registrada y el evento de compra fue emitido a la arquitectura orientada a eventos.
            </p>
          </div>

          <div className="p-8 space-y-6">
            {/* Order Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-gray-200/80 dark:border-slate-700">
              <div>
                <p className="text-xs text-gray-500 dark:text-slate-400 uppercase font-semibold">Número de Pedido</p>
                <p className="text-lg font-bold text-gray-900 dark:text-slate-100 font-mono">{successData.orderId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-slate-400 uppercase font-semibold">Cliente</p>
                <p className="text-base font-bold text-gray-800 dark:text-slate-200">{successData.customerName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-slate-400 uppercase font-semibold">Correo de Notificación</p>
                <p className="text-sm font-semibold text-primary-700 dark:text-primary-400">{successData.customerEmail}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-slate-400 uppercase font-semibold">Monto Pagado</p>
                <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{formatPriceCLP(successData.totalAmount)}</p>
              </div>
            </div>

            {/* RabbitMQ Event Card */}
            <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl p-6 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🐇</span>
                <h3 className="text-base font-bold text-indigo-950 dark:text-indigo-200">
                  Arquitectura Orientada a Eventos (RabbitMQ)
                </h3>
              </div>
              <p className="text-xs text-indigo-800 dark:text-indigo-300 mb-4 leading-relaxed">
                El servicio <code>ms-ventas</code> publicó un mensaje al exchange <strong>comics.ventas.direct</strong> con routing key <strong>venta.confirmada</strong>:
              </p>

              <div className="space-y-2.5">
                <div className="flex items-start gap-3 bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200">
                  <span className="bg-indigo-600 text-white font-bold px-2 py-0.5 rounded text-[11px] mt-0.5">
                    Cola PDF
                  </span>
                  <div>
                    <strong>cola.ventas.pdf:</strong> Generación en memoria de la boleta con detalle de cómics y despacho del correo a <em>{successData.customerEmail}</em> con JavaMailSender.
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200">
                  <span className="bg-teal-600 text-white font-bold px-2 py-0.5 rounded text-[11px] mt-0.5">
                    Cola Stock
                  </span>
                  <div>
                    <strong>cola.ventas.stock:</strong> Descuento automático de inventario para {successData.itemsCount} ejemplares en la persistencia.
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
              <button
                onClick={() => {
                  setSuccessData(null)
                  navigate('/')
                }}
                className="btn-primary flex-1 py-3 text-center text-sm font-bold"
              >
                Volver a la Tienda
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Empty cart view
  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 shadow-sm max-w-xl mx-auto p-8 transition-colors">
          <div className="w-20 h-20 bg-primary-50 dark:bg-primary-950/60 rounded-full flex items-center justify-center mx-auto mb-6 text-primary-500 dark:text-primary-400">
            <ShoppingCart className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-slate-100 mb-2">Tu carrito está vacío</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-6 max-w-sm mx-auto">
            Añade algunos cómics desde nuestro catálogo para probar el flujo de compra y la emisión de eventos.
          </p>
          <Link
            to="/"
            className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm font-bold shadow-md shadow-primary-600/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Explorar Catálogo de Cómics
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-slate-100">Carrito de Compras</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {items.reduce((s, it) => s + it.quantity, 0)} {items.length === 1 ? 'ejemplar' : 'ejemplares'} en tu selección
          </p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold flex items-center gap-1 hover:underline"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Vaciar Carrito
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Items List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 divide-y divide-gray-100 dark:divide-slate-700 overflow-hidden transition-colors">
            {items.map((item) => {
              const maxStock = getItemStock(item)
              const isOutOfStock = maxStock <= 0
              const exceedsStock = item.quantity > maxStock
              const isAtMax = item.quantity >= maxStock

              return (
                <div key={item.id} className={`p-4 sm:p-5 flex gap-4 items-center transition-colors ${isOutOfStock ? 'bg-red-50/70 dark:bg-red-950/40 border-l-4 border-l-red-500' : exceedsStock ? 'bg-amber-50/50 dark:bg-amber-950/40 border-l-4 border-l-amber-500' : ''}`}>
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).src = getFallbackImage(item.title, item.publisher)
                    }}
                    className={`w-16 h-22 sm:w-20 sm:h-28 object-cover rounded-lg bg-gray-100 dark:bg-slate-900 flex-shrink-0 ${isOutOfStock ? 'grayscale opacity-75' : ''}`}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[11px] font-bold text-primary-600 dark:text-primary-400 uppercase">
                          {item.publisher}
                        </span>
                        <h3 className="font-bold text-gray-900 dark:text-slate-100 text-sm sm:text-base truncate">{item.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          <p className="text-xs text-gray-500 dark:text-slate-400">Por {item.author}</p>
                          {isOutOfStock ? (
                            <span className="text-[11px] font-bold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 px-2 py-0.5 rounded animate-pulse">
                              🔴 Stock: 0 (Agotado)
                            </span>
                          ) : exceedsStock ? (
                            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded">
                              ⚠️ Supera stock ({maxStock} disp.)
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-800">
                              Stock: {maxStock} disp.
                            </span>
                          )}
                          {isAtMax && !isOutOfStock && !exceedsStock && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">(Máximo alcanzado)</span>
                          )}
                        </div>
                        {isOutOfStock && (
                          <p className="text-xs font-bold text-red-600 dark:text-red-400 mt-1">
                            ⚠️ Este cómic se quedó sin stock. Debes eliminarlo del carrito para poder continuar.
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 p-1 transition-colors"
                        title="Eliminar ítem"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50 dark:border-slate-700/60">
                      {/* Quantity Selector */}
                      <div className="flex items-center border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-900">
                        <button
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          disabled={item.quantity <= 1 || isOutOfStock}
                          className="p-1 sm:p-1.5 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className={`w-8 text-center text-xs font-bold ${isOutOfStock || exceedsStock ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-slate-200'}`}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={isAtMax || isOutOfStock}
                          className="p-1 sm:p-1.5 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                          title={isOutOfStock ? 'Producto Agotado' : isAtMax ? 'Stock máximo alcanzado' : 'Aumentar cantidad'}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="font-extrabold text-gray-900 dark:text-slate-100 text-sm sm:text-base">
                          {formatPriceCLP(item.price * item.quantity)}
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-slate-500">
                          {formatPriceCLP(item.price)} c/u
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <Link
            to="/"
            className="btn-secondary inline-flex items-center gap-2 text-xs font-semibold py-2.5 px-4 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Seguir agregando cómics</span>
          </Link>
        </div>

        {/* Right Column: Checkout Form & Summary */}
        <div className="lg:col-span-5 space-y-4">
          <form onSubmit={handleCheckout} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 space-y-5 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                <span>📦</span> Datos de Despacho & Boleta
              </h2>
              <button
                type="button"
                onClick={handleFillDemoData}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-2 py-1 rounded-md font-semibold flex items-center gap-1 transition-colors"
                title="Rellenar con datos de prueba"
              >
                <Sparkles className="h-3 w-3" />
                Cargar Demo
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs leading-relaxed">
                {error}
              </div>
            )}

            {/* Customer Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Nombre Completo del Cliente
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-slate-500" />
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ej: Matias Barraza"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                />
              </div>
            </div>

            {/* Customer Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Correo Electrónico (para recibir Boleta en PDF)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-slate-500" />
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="tu.correo@ejemplo.com"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                />
              </div>
              <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
                A esta casilla se despachará el PDF generado por <code>cola.ventas.pdf</code>.
              </p>
            </div>

            {/* Payment Simulation */}
            <div className="pt-2 border-t border-gray-100 dark:border-slate-700">
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>💳 Método de Pago (Simulación de Tarjeta)</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded font-bold">
                  TEST MODE
                </span>
              </label>
              <div className="relative mb-2">
                <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-slate-500" />
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4532 8901 2345 6789"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  placeholder="MM/AA"
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-center transition-colors"
                />
                <input
                  type="text"
                  required
                  value={ccv}
                  onChange={(e) => setCcv(e.target.value)}
                  placeholder="CVV (3 dígitos)"
                  maxLength={4}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-center transition-colors"
                />
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="pt-3 border-t border-gray-100 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600 dark:text-slate-400">
                <span>Subtotal cómics</span>
                <span className="font-semibold text-gray-800 dark:text-slate-200">{formatPriceCLP(total)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-slate-400">
                <span>Costo de Despacho</span>
                <span>{shippingCost === 0 ? <strong className="text-emerald-600 dark:text-emerald-400">GRATIS</strong> : formatPriceCLP(shippingCost)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-slate-400">
                <span>IVA (19% incluido)</span>
                <span>{formatPriceCLP(Math.round(finalTotal * 0.19))}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-slate-700 pt-2 flex justify-between items-baseline">
                <span className="text-sm font-bold text-gray-900 dark:text-slate-100">Total a Pagar</span>
                <span className="text-xl font-extrabold text-primary-600 dark:text-primary-400">{formatPriceCLP(finalTotal)}</span>
              </div>
            </div>

            {hasStockError && (
              <div className="p-3 bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 rounded-xl text-xs font-bold leading-relaxed">
                ❌ No es posible continuar: Tienes cómics agotados (Stock: 0) o que superan el inventario disponible. Elimina o ajusta los productos en rojo para pagar.
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || hasStockError}
              className={`w-full py-3.5 text-sm font-bold shadow-lg flex items-center justify-center gap-2 rounded-xl transition-all ${
                hasStockError
                  ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 cursor-not-allowed shadow-none'
                  : 'btn-primary shadow-primary-600/30'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Verificando inventario y enviando a RabbitMQ...</span>
                </>
              ) : hasStockError ? (
                <>
                  <span>❌ Compra Bloqueada (Stock 0 / Insuficiente)</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Confirmar y Procesar Compra</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-gray-400 dark:text-slate-500 text-center">
              Al confirmar, se emitirá el evento <code>venta.confirmada</code> en segundo plano.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Cart
