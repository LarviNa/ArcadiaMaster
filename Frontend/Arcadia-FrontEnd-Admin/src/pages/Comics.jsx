import { useState, useEffect } from 'react'
import { comicsApi } from '../services/comicsApi'

const Comics = () => {
  const [comics, setComics] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingComic, setEditingComic] = useState(null)
  const [formData, setFormData] = useState({
    titulo: '',
    autor: '',
    editorial: '',
    precio: '',
    stock: '',
    imagenUrl: ''
  })
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    fetchComics()
  }, [])

  const fetchComics = async () => {
    try {
      const data = await comicsApi.obtenerTodos()
      const mappedData = data.map(comic => ({
        id: comic.id,
        titulo: comic.title,
        autor: comic.author,
        editorial: comic.publisher,
        precio: comic.price,
        stock: comic.stock,
        imagenUrl: comic.coverImage,
        description: comic.description,
        releaseDate: comic.releaseDate,
        genre: comic.genre,
        pages: comic.pages,
        language: comic.language
      }))
      setComics(mappedData)
    } catch (err) {
      setError('Error al cargar los comics')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const comicData = {
        title: formData.titulo,
        author: formData.autor,
        publisher: formData.editorial,
        price: parseFloat(formData.precio),
        stock: parseInt(formData.stock),
        coverImage: formData.imagenUrl
      }

      if (editingComic) {
        const updatedComicData = {
          id: editingComic.id,
          description: editingComic.description,
          releaseDate: editingComic.releaseDate,
          genre: editingComic.genre,
          pages: editingComic.pages,
          language: editingComic.language,
          ...comicData
        }
        await comicsApi.actualizar(editingComic.id, updatedComicData)
        setSuccess('Comic actualizado correctamente')
      } else {
        await comicsApi.crear(comicData)
        setSuccess('Comic creado correctamente')
      }
      fetchComics()
      resetForm()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleEdit = (comic) => {
    setEditingComic(comic)
    setFormData({
      titulo: comic.titulo,
      autor: comic.autor,
      editorial: comic.editorial,
      precio: comic.precio.toString(),
      stock: comic.stock.toString(),
      imagenUrl: comic.imagenUrl || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este comic?')) {
      return
    }

    try {
      await comicsApi.eliminar(id)
      setSuccess('Comic eliminado correctamente')
      fetchComics()
    } catch (err) {
      setError(err.message)
    }
  }

  const resetForm = () => {
    setFormData({
      titulo: '',
      autor: '',
      editorial: '',
      precio: '',
      stock: '',
      imagenUrl: ''
    })
    setEditingComic(null)
    setShowForm(false)
  }

  if (loading) {
    return (
      <div className="comics-container">
        <div className="loading">Cargando comics...</div>
      </div>
    )
  }

  return (
    <div className="comics-container">
      <div className="comics-header">
        <h2>Gestión de Comics</h2>
        <button 
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          + Nuevo Comic
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingComic ? 'Editar Comic' : 'Nuevo Comic'}</h3>
              <button onClick={resetForm} className="close-btn">×</button>
            </div>
            <form onSubmit={handleSubmit} className="comic-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Título</label>
                  <input
                    type="text"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Autor</label>
                  <input
                    type="text"
                    name="autor"
                    value={formData.autor}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Editorial</label>
                  <input
                    type="text"
                    name="editorial"
                    value={formData.editorial}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Precio</label>
                  <input
                    type="number"
                    name="precio"
                    value={formData.precio}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Stock</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>URL Imagen (opcional)</label>
                  <input
                    type="text"
                    name="imagenUrl"
                    value={formData.imagenUrl}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingComic ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="comics-grid">
        {comics.map((comic) => (
          <div key={comic.id} className="comic-card">
            {comic.imagenUrl && (
              <img 
                src={comic.imagenUrl} 
                alt={comic.titulo}
                className="comic-image"
                onError={(e) => e.target.style.display = 'none'}
              />
            )}
            <div className="comic-info">
              <h3>{comic.titulo}</h3>
              <p><strong>Autor:</strong> {comic.autor}</p>
              <p><strong>Editorial:</strong> {comic.editorial}</p>
              <p><strong>Precio:</strong> ${comic.precio}</p>
              <p><strong>Stock:</strong> {comic.stock}</p>
            </div>
            <div className="comic-actions">
              <button 
                onClick={() => handleEdit(comic)}
                className="btn-edit"
              >
                Editar
              </button>
              <button 
                onClick={() => handleDelete(comic.id)}
                className="btn-delete"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {comics.length === 0 && (
        <div className="no-comics">
          <p>No hay comics registrados</p>
          <button 
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            Crear primer comic
          </button>
        </div>
      )}
    </div>
  )
}

export default Comics
