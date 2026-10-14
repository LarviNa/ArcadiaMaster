import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ShoppingCart, ArrowLeft, Star, Calendar, BookOpen, Globe, Check, Shield } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { Comic } from '../context/CartContext'
import { DEFAULT_COMICS, getFallbackImage } from '../data/comicsData'

const ComicDetail = () => {
  const { id } = useParams<{ id: string }>()
  const { addToCart } = useCart()
  
  const [comic, setComic] = useState<Comic | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [isAdded, setIsAdded] = useState(false)

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

  const handleAddMultiple = () => {
    if (!comic) return
    for (let i = 0; i < quantity; i++) {
      addToCart(comic)
    }
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 1500)
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3"></div>
        <p className="text-gray-500 text-sm">Cargando información del cómic...</p>
      </div>
    )
  }

  if (!comic) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Cómic no encontrado</h1>
        <p className="text-gray-500 mb-6">El título solicitado no existe en nuestro catálogo.</p>
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
      <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-primary-600 transition-colors">
          Catálogo
        </Link>
        <span>/</span>
        <span className="text-gray-400">{comic.publisher}</span>
        <span>/</span>
        <span className="font-semibold text-gray-800 truncate">{comic.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Comic Image Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden p-3">
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

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-3">
            <Shield className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <div className="text-xs text-emerald-900">
              <span className="font-bold">Garantía Arcadia:</span> Copia original certificada, empaque reforzado y boleta con firma digital.
            </div>
          </div>
        </div>

        {/* Comic Details Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary-50 text-primary-700">
                {comic.publisher}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                {comic.genre}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 ml-auto">
                Stock: {comic.stock ?? 10} unidades
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">{comic.title}</h1>
            <p className="text-base text-gray-600 mb-4">
              Autor / Guionista: <span className="font-semibold text-gray-900">{comic.author}</span>
            </p>

            <div className="flex items-center gap-4 py-4 border-y border-gray-100 mb-6">
              <div>
                <span className="text-3xl sm:text-4xl font-extrabold text-primary-600">
                  {formatPriceCLP(comic.price)}
                </span>
                <span className="text-sm text-gray-400 ml-2">IVA incluido</span>
              </div>
              <div className="flex items-center ml-auto bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500 mr-1" />
                <span className="text-xs font-bold text-amber-800">4.9 / 5.0</span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Sinopsis</h2>
              <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{comic.description}</p>
            </div>

            {/* Technical Sheet */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex items-center space-x-2.5">
                <BookOpen className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-[11px] text-gray-400 uppercase font-semibold">Páginas</p>
                  <p className="text-xs font-bold text-gray-800">{comic.pages || 100} págs.</p>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <Globe className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-[11px] text-gray-400 uppercase font-semibold">Idioma</p>
                  <p className="text-xs font-bold text-gray-800">{comic.language || 'Español'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-[11px] text-gray-400 uppercase font-semibold">Publicación</p>
                  <p className="text-xs font-bold text-gray-800">{comic.releaseDate || 'Clásico'}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center border border-gray-300 rounded-xl bg-gray-50 px-2">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-gray-600 hover:text-gray-900 font-bold"
                >
                  -
                </button>
                <span className="px-3 font-bold text-sm text-gray-800">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-3 py-2 text-gray-600 hover:text-gray-900 font-bold"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddMultiple}
                className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                  isAdded
                    ? 'bg-emerald-600 text-white'
                    : 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-600/30'
                }`}
              >
                {isAdded ? (
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