import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ShoppingCart, ArrowLeft, Star, Calendar, BookOpen, Globe, Check, Shield } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { Comic } from '../context/CartContext'
import { DEFAULT_COMICS, getFallbackImage } from '../data/comicsData'

const ComicDetail = () => {
  const { id } = useParams<{ id: string }>()
  const { addToCart, items } = useCart()
  
  const [comic, setComic] = useState<Comic | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [isAdded, setIsAdded] = useState(false)
  const [warningMessage, setWarningMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchComic = async () => {
      try {
        setLoading(true)
        const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8083'
        const response = await fetch(`${gatewayUrl}/api/comics/${id}`, {
          signal: AbortSignal.timeout(3000)
        })
        if (response.ok) {
          const data: Comic = await response.json()
          setComic(data)
          return
        }
      } catch {
        // Fallback below
      }

      // Fallback to local default comics
      const local = DEFAULT_COMICS.find(c => c.id === id)
      if (local) {
        setComic(local)
      }
      setLoading(false)
    }

    fetchComic()
  }, [id])

  const formatPriceCLP = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(price)
  }

  const maxStock = comic && comic.stock !== undefined ? comic.stock : 10
  const currentInCart = comic ? items.find((i) => i.id === comic.id)?.quantity || 0 : 0
  const remainingStock = Math.max(0, maxStock - currentInCart)

  const handleAddMultiple = () => {
    if (!comic) return
    if (remainingStock <= 0) {
      setWarningMessage(`Ya tienes el máximo de unidades disponibles (${maxStock}) en tu carrito.`)
      setTimeout(() => setWarningMessage(null), 3000)
      return
    }

    const qtyToAdd = Math.min(quantity, remainingStock)
    addToCart(comic, qtyToAdd)
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 1500)
    setQuantity(1)
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400 mx-auto mb-3"></div>
        <p className="text-gray-500 dark:text-slate-400 text-sm">Cargando información del cómic...</p>
      </div>
    )
  }

  if (!comic) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">Cómic no encontrado</h1>
        <p className="text-gray-500 dark:text-slate-400 mb-6">El título solicitado no existe en nuestro catálogo.</p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver a la tienda
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-slate-400 mb-6">
        <Link to="/" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
          Catálogo
        </Link>
        <span>/</span>
        <span className="text-gray-400 dark:text-slate-500">{comic.publisher}</span>
        <span>/</span>
        <span className="font-semibold text-gray-800 dark:text-slate-200 truncate">{comic.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Comic Image Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-gray-200 dark:border-slate-700 overflow-hidden p-3 transition-colors">
            <img
              src={comic.coverImage}
              alt={comic.title}
              referrerPolicy="no-referrer"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).src = getFallbackImage(comic.title, comic.publisher)
              }}
              className="w-full h-auto max-h-[520px] object-contain rounded-xl mx-auto"
            />
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-3.5 flex items-center gap-3 transition-colors">
            <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div className="text-xs text-emerald-900 dark:text-emerald-200">
              <span className="font-bold">Garantía Arcadia:</span> Copia original certificada, empaque reforzado y boleta con firma digital.
            </div>
          </div>
        </div>

        {/* Comic Details Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 sm:p-8 transition-colors">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300">
                {comic.publisher}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300">
                {comic.genre}
              </span>
              {maxStock <= 0 ? (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 ml-auto">
                  ❌ Agotado (0 unidades)
                </span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 ml-auto">
                  Stock disponible: {maxStock} unid.
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-slate-100 mb-2">{comic.title}</h1>
            <p className="text-base text-gray-600 dark:text-slate-400 mb-4">
              Autor / Guionista: <span className="font-semibold text-gray-900 dark:text-slate-200">{comic.author}</span>
            </p>

            <div className="flex items-center gap-4 py-4 border-y border-gray-100 dark:border-slate-700 mb-6">
              <div>
                <span className="text-3xl sm:text-4xl font-extrabold text-primary-600 dark:text-primary-400">
                  {formatPriceCLP(comic.price)}
                </span>
                <span className="text-sm text-gray-400 dark:text-slate-500 ml-2">IVA incluido</span>
              </div>
              <div className="flex items-center ml-auto bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/60">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500 mr-1" />
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300">4.9 / 5.0</span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400 mb-2">Sinopsis</h2>
              <p className="text-gray-700 dark:text-slate-300 leading-relaxed text-sm sm:text-base">{comic.description}</p>
            </div>

            {/* Technical Sheet */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8 bg-gray-50 dark:bg-slate-900/60 p-4 rounded-xl border border-gray-100 dark:border-slate-700/60">
              <div className="flex items-center space-x-2.5">
                <BookOpen className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                <div>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 uppercase font-semibold">Páginas</p>
                  <p className="text-xs font-bold text-gray-800 dark:text-slate-200">{comic.pages || 100} págs.</p>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <Globe className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                <div>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 uppercase font-semibold">Idioma</p>
                  <p className="text-xs font-bold text-gray-800 dark:text-slate-200">{comic.language || 'Español'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <Calendar className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                <div>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 uppercase font-semibold">Publicación</p>
                  <p className="text-xs font-bold text-gray-800 dark:text-slate-200">{comic.releaseDate || 'Clásico'}</p>
                </div>
              </div>
            </div>

            {warningMessage && (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold rounded-xl">
                ⚠️ {warningMessage}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center border border-gray-300 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-900 px-2">
                <button
                  type="button"
                  disabled={quantity <= 1 || remainingStock <= 0}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  -
                </button>
                <span className="px-3 font-bold text-sm text-gray-800 dark:text-slate-200">{remainingStock <= 0 ? 0 : quantity}</span>
                <button
                  type="button"
                  disabled={quantity >= remainingStock || remainingStock <= 0}
                  onClick={() => setQuantity((q) => Math.min(remainingStock, q + 1))}
                  className="px-3 py-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddMultiple}
                disabled={remainingStock <= 0 || maxStock <= 0}
                className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                  remainingStock <= 0 || maxStock <= 0
                    ? 'bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-slate-600 cursor-not-allowed'
                    : isAdded
                    ? 'bg-emerald-600 text-white'
                    : 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-600/30'
                }`}
              >
                {maxStock <= 0 ? (
                  <span>❌ Sin Stock Disponible</span>
                ) : remainingStock <= 0 ? (
                  <span>⚠️ Límite de Stock Alcanzado en Carrito</span>
                ) : isAdded ? (
                  <>
                    <Check className="h-5 w-5" />
                    <span>¡Agregado al Carrito!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5" />
                    <span>Agregar al Carrito ({formatPriceCLP(comic.price * quantity)})</span>
                  </>
                )}
              </button>

              <Link
                to="/"
                className="btn-secondary py-3 px-5 rounded-xl text-center text-sm font-semibold flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Volver</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ComicDetail