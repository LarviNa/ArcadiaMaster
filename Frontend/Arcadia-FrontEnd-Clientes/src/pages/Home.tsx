import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Star, ShoppingCart, Grid, List, Check, Search, ShieldCheck, Zap } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { Comic } from '../context/CartContext'
import { DEFAULT_COMICS, getFallbackImage } from '../data/comicsData'

const Home = () => {
  const { addToCart } = useCart()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedGenre, setSelectedGenre] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('title')
  const [comics, setComics] = useState<Comic[]>(DEFAULT_COMICS)
  const [loading, setLoading] = useState<boolean>(true)
  const [isUsingFallback, setIsUsingFallback] = useState<boolean>(false)
  const [addedItemIds, setAddedItemIds] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    const fetchComics = async () => {
      try {
        setLoading(true)
        const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8083'
        const response = await fetch(`${gatewayUrl}/api/comics`, {
          signal: AbortSignal.timeout(3000)
        })
        if (!response.ok) {
          throw new Error(`Error ${response.status}: No se pudo cargar catálogo remoto`)
        }
        const data = await response.json()
        if (Array.isArray(data) && data.length > 0) {
          setComics(data)
          setIsUsingFallback(false)
        } else {
          setComics(DEFAULT_COMICS)
          setIsUsingFallback(true)
        }
      } catch (err) {
        console.info('Usando catálogo inicial precargado (Modo Resiliente):', err)
        setComics(DEFAULT_COMICS)
        setIsUsingFallback(true)
      } finally {
        setLoading(false)
      }
    }
    fetchComics()
  }, [])

  const handleAddToCart = (comic: Comic) => {
    addToCart(comic)
    setAddedItemIds((prev) => ({ ...prev, [comic.id]: true }))
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [comic.id]: false }))
    }, 1200)
  }

  const formatPriceCLP = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(price)
  }

  const genres = ['all', 'Superhero', 'Sci-Fi', 'Horror', 'Historical', 'Fantasy']

  const filteredAndSortedComics = comics
    .filter((comic) => {
      const matchesGenre = selectedGenre === 'all' || comic.genre === selectedGenre
      const query = searchTerm.toLowerCase()
      const matchesSearch =
        !searchTerm ||
        comic.title.toLowerCase().includes(query) ||
        comic.author.toLowerCase().includes(query) ||
        comic.publisher.toLowerCase().includes(query)
      return matchesGenre && matchesSearch
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'date':
          return new Date(b.releaseDate || '1970-01-01').getTime() - new Date(a.releaseDate || '1970-01-01').getTime()
        default:
          return 0
      }
    })

  const ComicCard = ({ comic }: { comic: Comic }) => {
    const isAdded = !!addedItemIds[comic.id]
    const publisherColor =
      comic.publisher.includes('Marvel')
        ? 'bg-red-100 text-red-800'
        : comic.publisher.includes('DC')
        ? 'bg-blue-100 text-blue-800'
        : 'bg-emerald-100 text-emerald-800'

    return (
      <div className="card overflow-hidden group flex flex-col justify-between border border-gray-200 hover:border-primary-400 hover:shadow-xl transition-all duration-300">
        <div className="relative overflow-hidden bg-gray-100 aspect-[3/4]">
          <img
            src={comic.coverImage}
            alt={comic.title}
            referrerPolicy="no-referrer"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).src = getFallbackImage(comic.title, comic.publisher)
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="absolute bottom-2 left-2 flex gap-1">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md shadow-sm ${publisherColor}`}>
              {comic.publisher}
            </span>
          </div>
        </div>

        <div className="p-4 flex flex-col flex-1 justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>{comic.genre}</span>
              <span className="font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                Stock: {comic.stock ?? 10}
              </span>
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1 line-clamp-1 group-hover:text-primary-600 transition-colors">
              {comic.title}
            </h3>
            <p className="text-gray-500 text-xs mb-3 line-clamp-1">Por {comic.author}</p>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-xl font-extrabold text-primary-600">{formatPriceCLP(comic.price)}</span>
              <span className="text-xs text-gray-400 line-through">
                {formatPriceCLP(Math.round(comic.price * 1.25))}
              </span>
            </div>

            <div className="flex gap-2">
              <Link
                to={`/comic/${comic.id}`}
                className="flex-1 btn-secondary text-center text-xs py-2 font-semibold"
              >
                Ver Detalle
              </Link>
              <button
                onClick={() => handleAddToCart(comic)}
                className={`p-2 rounded-lg font-medium text-xs transition-colors flex items-center justify-center ${
                  isAdded
                    ? 'bg-emerald-600 text-white'
                    : 'bg-primary-600 hover:bg-primary-700 text-white'
                }`}
                title="Añadir al Carrito"
              >
                {isAdded ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const ComicListItem = ({ comic }: { comic: Comic }) => {
    const isAdded = !!addedItemIds[comic.id]

    return (
      <div className="card p-4 flex flex-col sm:flex-row gap-4 border border-gray-200 hover:border-primary-300 transition-all">
        <div className="w-full sm:w-28 h-40 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={comic.coverImage}
            alt={comic.title}
            referrerPolicy="no-referrer"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).src = getFallbackImage(comic.title, comic.publisher)
            }}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                {comic.publisher}
              </span>
              <span className="text-xs text-gray-500">• {comic.genre}</span>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded ml-auto">
                Stock: {comic.stock ?? 10} unid.
              </span>
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-1">{comic.title}</h3>
            <p className="text-gray-600 text-sm mb-2">Por {comic.author}</p>
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{comic.description}</p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div>
              <span className="text-2xl font-bold text-primary-600">{formatPriceCLP(comic.price)}</span>
            </div>
            <div className="flex gap-2">
              <Link to={`/comic/${comic.id}`} className="btn-secondary text-xs py-2 px-3 font-semibold">
                Ver Ficha
              </Link>
              <button
                onClick={() => handleAddToCart(comic)}
                className={`py-2 px-4 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors ${
                  isAdded
                    ? 'bg-emerald-600 text-white'
                    : 'bg-primary-600 hover:bg-primary-700 text-white'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>¡Agregado!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    <span>Añadir</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-8 md:p-12 mb-8 text-white shadow-2xl border border-indigo-900/40">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-semibold mb-4 backdrop-blur-sm">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>Tienda de Cómics Cloud Native · Event-Driven</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-white">
            Arcadia Comics <span className="text-primary-400">Store</span>
          </h1>
          <p className="text-lg text-slate-300 mb-6 leading-relaxed">
            Explora las mejores novelas gráficas de Marvel, DC y Manga japonés. Tus compras son procesadas en tiempo real mediante mensajería desacoplada con RabbitMQ.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="#catalogo"
              className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary-600/30 transition-all flex items-center gap-2 text-sm"
            >
              <span>Explorar Catálogo</span>
              <span className="text-primary-200">↓</span>
            </a>
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-black/30 px-3 py-2.5 rounded-xl border border-white/10">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Emisión de Boleta PDF + Descuento de Stock Automático</span>
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-16 -top-16 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Catalog Control Bar */}
      <div id="catalogo" className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar título, autor o editorial..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Filters & View Toggles */}
          <div className="flex flex-wrap gap-2 items-center w-full md:w-auto justify-between md:justify-end">
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="all">Todos los Géneros</option>
              {genres
                .filter((g) => g !== 'all')
                .map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="title">Ordenar por Título</option>
              <option value="price-low">Precio: Menor a Mayor</option>
              <option value="price-high">Precio: Mayor a Menor</option>
              <option value="date">Más Recientes</option>
            </select>

            <div className="flex gap-1 border border-gray-200 p-1 rounded-xl bg-gray-50">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Vista Cuadrícula"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Vista Lista"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between mb-6 px-1">
        <p className="text-sm text-gray-500">
          Mostrando <span className="font-semibold text-gray-800">{filteredAndSortedComics.length}</span> de{' '}
          <span className="font-semibold text-gray-800">{comics.length}</span> cómics disponibles
        </p>

        {isUsingFallback && (
          <span className="inline-flex items-center gap-1.5 text-xs bg-amber-50 text-amber-700 border border-amber-200/80 px-2.5 py-1 rounded-full font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Catálogo Local Activo (12 títulos)
          </span>
        )}
      </div>

      {/* Grid / List Content */}
      {loading ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Cargando catálogo de cómics...</p>
        </div>
      ) : filteredAndSortedComics.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">No se encontraron cómics</h3>
          <p className="text-gray-500 text-sm mb-4">Intenta cambiar los términos de búsqueda o el filtro de género.</p>
          <button
            onClick={() => {
              setSearchTerm('')
              setSelectedGenre('all')
            }}
            className="btn-secondary text-xs px-4 py-2 font-semibold"
          >
            Limpiar filtros
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredAndSortedComics.map((comic) => (
            <ComicCard key={comic.id} comic={comic} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedComics.map((comic) => (
            <ComicListItem key={comic.id} comic={comic} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Home
