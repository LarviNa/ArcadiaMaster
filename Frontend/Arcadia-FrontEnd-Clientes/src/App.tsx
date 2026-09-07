import { Routes, Route, useSearchParams, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import Home from './pages/Home'
import ComicDetail from './pages/ComicDetail'
import Cart from './pages/Cart'
import { CartProvider } from './context/CartContext'

function App() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const token = searchParams.get('token')
    const userStr = searchParams.get('user')
    
    if (token && userStr) {
      localStorage.setItem('token', token)
      localStorage.setItem('user', decodeURIComponent(userStr))
      
      // Clean URL
      navigate(window.location.pathname, { replace: true })
    }
  }, [searchParams, navigate])

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/comic/:id" element={<ComicDetail />} />
            <Route path="/cart" element={<Cart />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </CartProvider>
  )
}

export default App
