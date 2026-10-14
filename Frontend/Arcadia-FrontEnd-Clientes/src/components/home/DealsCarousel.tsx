import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ShoppingCart, Check, Flame, Tag, Star, Sparkles } from 'lucide-react'
import { Comic, useCart } from '../../context/CartContext'
import { getFallbackImage } from '../../data/comicsData'

interface DealItem {
  id: string
  title: string
  author: string
  publisher: string
  originalPrice: number
  dealPrice: number
  discountPercent: number
  stock: number
  coverImage: string
  genre: string
  badge: string
  highlight: string
  description: string
}

const MONTHLY_DEALS: DealItem[] = [
  {
    id: 'c002',
    title: 'Batman: The Dark Knight Returns',
    author: 'Frank Miller',
    publisher: 'DC Comics',
    originalPrice: 14990,
    dealPrice: 10990,
    discountPercent: 27,
    stock: 10,
    coverImage: 'https://upload.wikimedia.org/wikipedia/en/5/5a/Dark_knight_returns.jpg',
    genre: 'Superhero',
    badge: 'OFERTA DESTACADA',
    highlight: 'Obra cumbre de Frank Miller que redefinió los cómics modernos.',
    description: 'En una Gotham dominada por bandas criminales y el caos, un Bruce Wayne retirado de 55 años vuelve a colocarse la capa para imponer justicia brutal.'
  },
  {
    id: 'c025',
    title: 'Civil War',
    author: 'Mark Millar',
    publisher: 'Marvel Comics',
    originalPrice: 15990,
    dealPrice: 11190,
    discountPercent: 30,
    stock: 15,
    coverImage: 'https://upload.wikimedia.org/wikipedia/en/f/fb/Civil_War_1.jpg',
    genre: 'Superhero',
    badge: '-30% DESCUENTO',
    highlight: 'El mayor crossover del siglo entre Iron Man y Capitán América.',
    description: 'La ley de registro divide a los Vengadores en dos bandos irreconciliables en una guerra ideológica que sacude los cimientos del universo Marvel.'
  },
  {
    id: 'c007',
    title: 'One Piece Vol. 1',
    author: 'Eiichiro Oda',
    publisher: 'Shueisha',
    originalPrice: 8990,
    dealPrice: 6990,
    discountPercent: 22,
    stock: 30,
    coverImage: 'https://upload.wikimedia.org/wikipedia/en/6/6d/One_Piece%2C_Volume_61_Cover_%28Japanese%29.jpg',
    genre: 'Fantasy',
    badge: 'ESPECIAL MANGA',
    highlight: '¡El inicio del manga más vendido en la historia del planeta!',
    description: 'Acompaña a Monkey D. Luffy y su tripulación de los Sombreros de Paja en la búsqueda del tesoro legendario para convertirse en el Rey de los Piratas.'
  },
  {
    id: 'c004',
    title: 'Watchmen',
    author: 'Alan Moore',
    publisher: 'DC Comics',
    originalPrice: 18990,
    dealPrice: 13990,
    discountPercent: 26,
    stock: 8,
    coverImage: 'https://upload.wikimedia.org/wikipedia/en/a/a2/Watchmen%2C_issue_1.jpg',
    genre: 'Historical',
    badge: 'CLÁSICO IMPRESCINDIBLE',
    highlight: 'Galardonada con el Premio Hugo. La mayor obra gráfica de todos los tiempos.',
    description: '¿Quién vigila a los vigilantes? Rorschach investiga el asesinato de un antiguo camarada descubriendo una conspiración de escala global.'
  },
  {
    id: 'c032',
    title: 'Akira Vol. 1',
    author: 'Katsuhiro Otomo',
    publisher: 'Kodansha',
    originalPrice: 19990,
    dealPrice: 14990,
    discountPercent: 25,
    stock: 7,
    coverImage: 'https://upload.wikimedia.org/wikipedia/en/a/a2/Akira_vol01.jpg',
    genre: 'Sci-Fi',
    badge: 'JOYA CYBERPUNK',
    highlight: '364 páginas a puro trazo magistral en el Neo-Tokio distópico.',
    description: 'En una megalópolis al borde del colapso social, pandilleros en motocicletas se ven envueltos en un misterioso experimento militar sobrehumano.'
  }
]

export const DealsCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [addedIds, setAddedIds] = useState<{ [key: string]: boolean }>({})
  const { addToCart } = useCart()

  // Auto-play interval
  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % MONTHLY_DEALS.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [isPaused])

  const currentDeal = MONTHLY_DEALS[currentIndex]

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? MONTHLY_DEALS.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % MONTHLY_DEALS.length)
  }

  const formatPriceCLP = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(price)
  }

  const handleBuyDeal = (deal: DealItem) => {
    const comicToBuy: Comic = {
      id: deal.id,
      title: deal.title,
      author: deal.author,
      publisher: deal.publisher,
      price: deal.dealPrice,
      stock: deal.stock,
      coverImage: deal.coverImage,
      description: deal.description,
      genre: deal.genre
    }

    addToCart(comicToBuy, 1)
    setAddedIds((prev) => ({ ...prev, [deal.id]: true }))
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [deal.id]: false }))
    }, 1500)
  }

  const isAdded = !!addedIds[currentDeal.id]

  return (
    <div
      className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/50 shadow-2xl transition-all"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Decorative background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 left-1/4 w-80 h-80 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner Tag */}
      <div className="px-6 sm:px-8 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
            <Flame className="h-4 w-4" />
            Ofertas del Mes · Hasta 30% Dcto.
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>Precios especiales limitados a stock disponible</span>
        </div>
      </div>

      {/* Main Slide Content */}
      <div className="px-6 sm:px-10 py-6 grid grid-cols-1 md:grid-cols-12 gap-8 items-center min-h-[380px]">
        {/* Left Column: Comic Cover Art */}
        <div className="md:col-span-5 lg:col-span-4 flex justify-center">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-rose-500 to-indigo-500 rounded-2xl blur-md opacity-50 group-hover:opacity-75 transition duration-500"></div>
            <div className="relative w-48 sm:w-56 aspect-[3/4] rounded-xl overflow-hidden shadow-2xl bg-slate-800">
              <img
                src={currentDeal.coverImage}
                alt={currentDeal.title}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).src = getFallbackImage(currentDeal.title, currentDeal.publisher)
                }}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3">
                <span className="bg-rose-600 text-white font-black text-xs px-2.5 py-1 rounded-full shadow-lg border border-white/20 uppercase tracking-wider">
                  -{currentDeal.discountPercent}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Comic Details & Actions */}
        <div className="md:col-span-7 lg:col-span-8 flex flex-col justify-between text-white space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {currentDeal.badge}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {currentDeal.publisher}
              </span>
              <span className="text-xs text-slate-400">• {currentDeal.genre}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white mb-1">
              {currentDeal.title}
            </h2>
            <p className="text-sm text-slate-400 mb-3">Por <strong className="text-slate-200">{currentDeal.author}</strong></p>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl mb-4 line-clamp-3">
              {currentDeal.description}
            </p>

            <div className="inline-flex items-center gap-2 bg-indigo-950/80 border border-indigo-700/40 rounded-xl px-3 py-1.5 text-xs text-indigo-200 mb-2">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              <span>{currentDeal.highlight}</span>
            </div>
          </div>

          {/* Pricing & CTA */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-emerald-400">
                  {formatPriceCLP(currentDeal.dealPrice)}
                </span>
                <span className="text-sm sm:text-base text-slate-400 line-through font-semibold">
                  {formatPriceCLP(currentDeal.originalPrice)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Stock promocional: <strong className="text-slate-200">{currentDeal.stock} unidades</strong>
              </p>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Link
                to={`/comic/${currentDeal.id}`}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
              >
                Ver Ficha
              </Link>

              <button
                type="button"
                onClick={() => handleBuyDeal(currentDeal)}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                  isAdded
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>¡Agregado a la Orden!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    <span>Comprar con Oferta</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        type="button"
        onClick={handlePrev}
        aria-label="Oferta anterior"
        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/70 hover:bg-slate-800 text-white backdrop-blur-sm border border-white/10 transition-colors"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={handleNext}
        aria-label="Siguiente oferta"
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/70 hover:bg-slate-800 text-white backdrop-blur-sm border border-white/10 transition-colors"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Slide Indicators / Dots */}
      <div className="py-4 flex justify-center gap-2 border-t border-slate-800/60 bg-black/20">
        {MONTHLY_DEALS.map((deal, idx) => (
          <button
            key={deal.id}
            type="button"
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Ir a oferta ${deal.title}`}
            className={`transition-all duration-300 rounded-full ${
              idx === currentIndex
                ? 'w-8 h-2.5 bg-rose-500'
                : 'w-2.5 h-2.5 bg-slate-600 hover:bg-slate-400'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export default DealsCarousel
