import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Star, ShoppingCart, Grid, List } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { Comic } from '../context/CartContext'

const Home = () => {
  const { addToCart } = useCart()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedGenre, setSelectedGenre] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('title')
  const [comics, setComics] = useState<Comic[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchComics = async () => {
      try {
        setLoading(true)
        setError(null)
        const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8083';
        const response = await fetch(`${gatewayUrl}/api/comics`)
        if (!response.ok) {
          throw new Error(`Error ${response.status}: No se pudieron cargar los cómics`)
        }
        const data: Comic[] = await response.json()
        setComics(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }
    fetchComics()
  }, [])

  const genres = ['all', 'Superhero', 'Sci-Fi', 'Horror', 'Historical', 'Fantasy']

  const filteredAndSortedComics = comics
    .filter(comic => selectedGenre === 'all' || comic.genre === selectedGenre)
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'date':
          return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
        default:
          return 0
      }
    })

  const ComicCard = ({ comic }: { comic: Comic }) => (
    <div className="card overflow-hidden group">
      <div className="relative">
        <img
          src={comic.coverImage}
          alt={comic.title}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 right-2 bg-white rounded-full p-1">
          <Star className="h-4 w-4 text-yellow-500 fill-current" />
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-1">{comic.title}</h3>
        <p className="text-gray-600 text-sm mb-2">{comic.author}</p>
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-primary-600">${comic.price}</span>
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">{comic.genre}</span>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/comic/${comic.id}`}
            className="flex-1 btn-secondary text-center text-sm py-2"
          >
            View Details
          </Link>
          <button
            onClick={() => addToCart(comic)}
            className="btn-primary p-2"
            title="Add to Cart"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )

  const ComicListItem = ({ comic }: { comic: Comic }) => (
    <div className="card p-4 flex gap-4">
      <img
        src={comic.coverImage}
        alt={comic.title}
        className="w-24 h-32 object-cover rounded"
      />
      <div className="flex-1">
        <h3 className="font-semibold text-lg mb-1">{comic.title}</h3>
        <p className="text-gray-600 text-sm mb-2">{comic.author}</p>
        <p className="text-gray-700 text-sm mb-3 line-clamp-2">{comic.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-primary-600">${comic.price}</span>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">{comic.genre}</span>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/comic/${comic.id}`}
              className="btn-secondary text-sm py-2 px-4"
            >
              View Details
            </Link>
            <button
              onClick={() => addToCart(comic)}
              className="btn-primary p-2"
              title="Add to Cart"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 mb-8 text-white">
        <h1 className="text-4xl font-bold mb-4">Welcome to Arcadia Comics</h1>
        <p className="text-xl mb-6 text-primary-100">
          Discover amazing stories from your favorite publishers
        </p>
        <button className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors">
          Shop Now
        </button>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {genres.map(genre => (
                <option key={genre} value={genre}>
                  {genre === 'all' ? 'All Genres' : genre}
                </option>
              ))}
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="title">Sort by Title</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="date">Newest First</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-gray-600">
          Showing {filteredAndSortedComics.length} of {comics.length} comics
        </p>
      </div>

      {/* Loading, Error and Comics Grid/List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Cargando cómics...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500 text-lg">Error: {error}</p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAndSortedComics.map(comic => (
                <ComicCard key={comic.id} comic={comic} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedComics.map(comic => (
                <ComicListItem key={comic.id} comic={comic} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {filteredAndSortedComics.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No comics found matching your criteria.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Home
