import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft, Mail, User, CreditCard, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { getFallbackImage } from '../data/comicsData'

const Cart = () => {
  const { items, total, updateQuantity, removeFromCart, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
  const [userId, setUserId] = useState('u002')

  // Payment mock
  const [cardNumber, setCardNumber] = useState('4532 8901 2345 6789')
  const [expirationDate, setExpirationDate] = useState('12/29')
  const [ccv, setCcv] = useState('123')

  const navigate = useNavigate()

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const u = JSON.parse(userStr)
        if (u.nombre) setCustomerName(u.nombre)
        if (u.email) setCustomerEmail(u.email)
        if (u.id) setUserId(u.id)
      } else {
        // Pre-fill friendly demo defaults for quick presentation testing
        setCustomerName('Matias Barraza')
        setCustomerEmail('mat.barrazac@duocuc.cl')
        setUserId('u-demo-1')
      }
    } catch {
      setCustomerName('Cliente Arcadia')
      setCustomerEmail('cliente@arcadia.cl')
    }
  }, [])

  const handleFillDemoData = () => {
    setCustomerName('Matias Barraza Contreras')
    setCustomerEmail('mat.barrazac@duocuc.cl')
    setUserId('u-demo-matias')
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
    // 1. Verificación local con los datos actuales del carrito
    for (const item of items) {
      const stockItem = item.stock !== undefined ? item.stock : 10
      if (stockItem <= 0) {
        setError(`❌ Verificación de Stock: El cómic "${item.title}" está AGOTADO (Stock: 0). Debes eliminarlo del carrito para poder comprar.`)
        return
      }
      if (item.quantity > stockItem) {
        setError(`❌ Verificación de Stock: Solicitas ${item.quantity} unidades de "${item.title}", pero solo disponemos de ${stockItem} en stock. Ajusta la cantidad antes de comprar.`)
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
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-6 rounded-2xl border border-gray-200/80">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Número de Pedido</p>
                <p className="text-lg font-bold text-gray-900 font-mono">{successData.orderId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Cliente</p>
                <p className="text-base font-bold text-gray-800">{successData.customerName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Correo de Notificación</p>
                <p className="text-sm font-semibold text-primary-700">{successData.customerEmail}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Monto Pagado</p>
                <p className="text-lg font-extrabold text-emerald-600">{formatPriceCLP(successData.totalAmount)}</p>
              </div>
            </div>

            {/* RabbitMQ Event Card */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🐇</span>
                <h3 className="text-base font-bold text-indigo-950">
                  Arquitectura Orientada a Eventos (RabbitMQ)
                </h3>
              </div>
              <p className="text-xs text-indigo-800 mb-4 leading-relaxed">
                El servicio <code>ms-ventas</code> publicó un mensaje al exchange <strong>comics.ventas.direct</strong> con routing key <strong>venta.confirmada</strong>:
              </p>

              <div className="space-y-2.5">
                <div className="flex items-start gap-3 bg-white/80 p-3 rounded-xl border border-indigo-100 text-xs text-indigo-900">
                  <span className="bg-indigo-600 text-white font-bold px-2 py-0.5 rounded text-[11px] mt-0.5">
                    Cola PDF
                  </span>
                  <div>
                    <strong>cola.ventas.pdf:</strong> Generación en memoria de la boleta con detalle de cómics y despacho del correo a <em>{successData.customerEmail}</em> con JavaMailSender.
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white/80 p-3 rounded-xl border border-indigo-100 text-xs text-indigo-900">
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
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
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
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 shadow-sm max-w-xl mx-auto p-8">
          <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6 text-primary-500">
            <ShoppingCart className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Tu carrito está vacío</h1>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
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
          <h1 className="text-3xl font-black text-gray-900">Carrito de Compras</h1>
          <p className="text-sm text-gray-500">
            {items.reduce((s, it) => s + it.quantity, 0)} {items.length === 1 ? 'ejemplar' : 'ejemplares'} en tu selección
          </p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 hover:underline"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Vaciar Carrito
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Items List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            {items.map((item) => {
              const maxStock = item.stock !== undefined ? item.stock : 10
              const isOutOfStock = maxStock <= 0
              const exceedsStock = item.quantity > maxStock
              const isAtMax = item.quantity >= maxStock

              return (
                <div key={item.id} className={`p-4 sm:p-5 flex gap-4 items-center ${isOutOfStock || exceedsStock ? 'bg-red-50/40' : ''}`}>
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).src = getFallbackImage(item.title, item.publisher)
                    }}
                    className={`w-16 h-22 sm:w-20 sm:h-28 object-cover rounded-lg bg-gray-100 flex-shrink-0 ${isOutOfStock ? 'grayscale opacity-75' : ''}`}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[11px] font-bold text-primary-600 uppercase">
                          {item.publisher}
                        </span>
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">{item.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          <p className="text-xs text-gray-500">Por {item.author}</p>
                          {isOutOfStock ? (
                            <span className="text-[10px] font-bold text-red-600 bg-red-100/80 px-2 py-0.5 rounded border border-red-200">
                              ❌ Agotado (0 disp.)
                            </span>
                          ) : exceedsStock ? (
                            <span className="text-[10px] font-bold text-red-600 bg-red-100/80 px-2 py-0.5 rounded border border-red-200">
                              ⚠️ Supera stock ({maxStock} disp.)
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                              Stock: {maxStock} disp.
                            </span>
                          )}
                          {isAtMax && !isOutOfStock && !exceedsStock && (
                            <span className="text-[10px] text-amber-600 font-semibold">(Máximo alcanzado)</span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                        title="Eliminar ítem"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                      {/* Quantity Selector */}
                      <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                        <button
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          disabled={item.quantity <= 1}
                          className="p-1 sm:p-1.5 text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className={`w-8 text-center text-xs font-bold ${exceedsStock ? 'text-red-600' : 'text-gray-800'}`}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={isAtMax || isOutOfStock}
                          className="p-1 sm:p-1.5 text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                          title={isAtMax ? 'Stock máximo alcanzado' : 'Aumentar cantidad'}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="font-extrabold text-gray-900 text-sm sm:text-base">
                          {formatPriceCLP(item.price * item.quantity)}
                        </p>
                        <p className="text-[11px] text-gray-400">
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
          <form onSubmit={handleCheckout} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>📦</span> Datos de Despacho & Boleta
              </h2>
              <button
                type="button"
                onClick={handleFillDemoData}
                className="text-[11px] text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md font-semibold flex items-center gap-1 transition-colors"
                title="Rellenar con datos de prueba"
              >
                <Sparkles className="h-3 w-3" />
                Cargar Demo
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs leading-relaxed">
                {error}
              </div>
            )}

            {/* Customer Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nombre Completo del Cliente
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ej: Matias Barraza"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Customer Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Correo Electrónico (para recibir Boleta en PDF)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="tu.correo@ejemplo.com"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                A esta casilla se despachará el PDF generado por <code>cola.ventas.pdf</code>.
              </p>
            </div>

            {/* Payment Simulation */}
            <div className="pt-2 border-t border-gray-100">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
                <span>💳 Método de Pago (Simulación de Tarjeta)</span>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                  TEST MODE
                </span>
              </label>
              <div className="relative mb-2">
                <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="Número de Tarjeta"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  placeholder="MM/YY"
                  className="px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-center"
                />
                <input
                  type="text"
                  required
                  value={ccv}
                  onChange={(e) => setCcv(e.target.value)}
                  placeholder="CCV (3 dígitos)"
                  maxLength={3}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-center"
                />
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal cómics</span>
                <span className="font-semibold text-gray-800">{formatPriceCLP(total)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Costo de Despacho</span>
                <span>{shippingCost === 0 ? <strong className="text-emerald-600">GRATIS</strong> : formatPriceCLP(shippingCost)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>IVA (19% incluido)</span>
                <span>{formatPriceCLP(Math.round(finalTotal * 0.19))}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between items-baseline">
                <span className="text-sm font-bold text-gray-900">Total a Pagar</span>
                <span className="text-xl font-extrabold text-primary-600">{formatPriceCLP(finalTotal)}</span>
              </div>
            </div>

            {items.some((item) => (item.stock !== undefined && item.stock <= 0) || (item.stock !== undefined && item.quantity > item.stock)) && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold leading-relaxed">
                ⚠️ Hay cómics en tu carrito que superan el stock disponible o están agotados. Modifica las cantidades o elimina el ítem para procesar la compra.
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || items.some((item) => (item.stock !== undefined && item.stock <= 0) || (item.stock !== undefined && item.quantity > item.stock))}
              className={`w-full py-3.5 text-sm font-bold shadow-lg flex items-center justify-center gap-2 rounded-xl transition-all ${
                items.some((item) => (item.stock !== undefined && item.stock <= 0) || (item.stock !== undefined && item.quantity > item.stock))
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                  : 'btn-primary shadow-primary-600/30'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Verificando inventario y enviando a RabbitMQ...</span>
                </>
              ) : items.some((item) => (item.stock !== undefined && item.stock <= 0) || (item.stock !== undefined && item.quantity > item.stock)) ? (
                <>
                  <span>❌ Stock Insuficiente para Comprar</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Confirmar y Procesar Compra</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-gray-400 text-center">
              Al confirmar, se emitirá el evento <code>venta.confirmada</code> en segundo plano.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Cart
