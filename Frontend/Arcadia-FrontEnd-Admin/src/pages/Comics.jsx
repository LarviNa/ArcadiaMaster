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
    imagenUrl: '',
    genero: 'Superhero',
    descripcion: ''
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
        coverImage: formData.imagenUrl,
        genre: formData.genero || 'Superhero',
        description: formData.descripcion || '',
        releaseDate: editingComic?.releaseDate || new Date().toISOString().split('T')[0],
        language: editingComic?.language || 'Español'
      }

      if (editingComic) {
        const updatedComicData = {
          id: editingComic.id,
          pages: editingComic.pages || 192,
          ...comicData
        }
        await comicsApi.actualizar(editingComic.id, updatedComicData)
        setSuccess('¡Cómic actualizado correctamente en la base de datos!')
      } else {
        await comicsApi.crear(comicData)
        setSuccess('¡Cómic creado exitosamente en el catálogo!')
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
      imagenUrl: comic.imagenUrl || '',
      genero: comic.genre || 'Superhero',
      descripcion: comic.description || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este comic del catálogo?')) {
      return
    }

    try {
      await comicsApi.eliminar(id)
      setSuccess('Cómic eliminado correctamente del sistema')
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
      imagenUrl: '',
      genero: 'Superhero',
      descripcion: ''
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
        <div>
          <h2>Gestión de Cómics</h2>
          <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            Añade, edita precios, gestiona inventario en vivo o elimina cómics del catálogo de Arcadia.
          </p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          + Añadir Nuevo Cómic
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
          <div className="modal-content" style={{ maxWidth: '640px', width: '95%' }}>
            <div className="modal-header">
              <h3>{editingComic ? '✏️ Editar Cómic' : '✨ Añadir Nuevo Cómic'}</h3>
              <button onClick={resetForm} className="close-btn">×</button>
            </div>
            <form onSubmit={handleSubmit} className="comic-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Título del Cómic *</label>
                  <input
                    type="text"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleInputChange}
                    placeholder="Ej: Spider-Man: Blue"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Autor / Guionista *</label>
                  <input
                    type="text"
                    name="autor"
                    value={formData.autor}
                    onChange={handleInputChange}
                    placeholder="Ej: Jeph Loeb & Tim Sale"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Editorial *</label>
                  <input
                    type="text"
                    name="editorial"
                    value={formData.editorial}
                    onChange={handleInputChange}
                    placeholder="Ej: Marvel Comics, DC Comics, Shueisha"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Género / Categoría</label>
                  <select
                    name="genero"
                    value={formData.genero}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      background: 'var(--input-bg, #1e293b)',
                      color: 'var(--text-main, #f8fafc)',
                      border: '1px solid var(--border-color, #334155)',
                      borderRadius: '6px',
                      fontSize: '0.9rem'
                    }}
                  >
                    <option value="Superhero">Superhero (Superhéroes)</option>
                    <option value="Sci-Fi">Sci-Fi (Ciencia Ficción)</option>
                    <option value="Horror">Horror (Terror)</option>
                    <option value="Fantasy">Fantasy (Fantasía)</option>
                    <option value="Dark Fantasy">Dark Fantasy</option>
                    <option value="Action">Action (Acción)</option>
                    <option value="Supernatural">Supernatural</option>
                    <option value="Adventure">Adventure (Aventura)</option>
                    <option value="Mystery">Mystery (Misterio)</option>
                    <option value="Historical">Historical (Histórico)</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Precio en Pesos (CLP) *</label>
                  <input
                    type="number"
                    name="precio"
                    value={formData.precio}
                    onChange={handleInputChange}
                    step="10"
                    min="0"
                    placeholder="Ej: 14990"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Stock Disponible *</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="Ej: 20"
                    required
                  />
                </div>
              </div>

              {/* URL Imagen con ayuda y vista previa */}
              <div className="form-group">
                <label>URL de la Portada / Imagen *</label>
                <input
                  type="url"
                  name="imagenUrl"
                  value={formData.imagenUrl}
                  onChange={handleInputChange}
                  placeholder="https://upload.wikimedia.org/.../portada.jpg"
                  required
                />
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem', lineHeight: '1.3' }}>
                  💡 <strong>¿Cómo obtener la URL?</strong> Pega el enlace directo a una imagen web accesible (.jpg, .png o .webp). Puedes buscar la portada en Wikipedia o Google Imágenes, hacer clic derecho sobre la imagen y seleccionar <em>"Copiar dirección de la imagen"</em>.
                </p>

                {formData.imagenUrl && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#0b1120', padding: '0.5rem', borderRadius: '6px', border: '1px solid #1e293b' }}>
                    <img
                      src={formData.imagenUrl}
                      alt="Vista previa"
                      style={{ width: '48px', height: '64px', objectFit: 'cover', borderRadius: '4px' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>Vista previa de portada detectada</span>
                  </div>
                )}
              </div>

              {/* Descripción */}
              <div className="form-group">
                <label>Sinopsis / Descripción</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Escribe una breve reseña de la historia del cómic..."
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    background: 'var(--input-bg, #1e293b)',
                    color: 'var(--text-main, #f8fafc)',
                    border: '1px solid var(--border-color, #334155)',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div className="form-actions" style={{ marginTop: '1rem' }}>
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingComic ? '💾 Guardar Cambios' : '➕ Crear Cómic'}
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
