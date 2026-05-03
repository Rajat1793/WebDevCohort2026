import { useState, useEffect } from 'react'
import './App.css'

const API = 'https://api.freeapi.app/api/v1/public/randomjokes?page=1&limit=10'

function App() {
  const [jokes, setJokes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchJokes = () => {
    setLoading(true)
    setError(null)
    fetch(API)
      .then(r => {
        if (!r.ok) throw new Error('Network error')
        return r.json()
      })
      .then(json => setJokes(json.data.data))
      .catch(() => setError('Failed to fetch jokes. Please try again.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchJokes() }, [])

  return (
    <main>
      <header>
        <h1>Jokes Viewer</h1>
        <p>10 jokes, freshly fetched</p>
      </header>

      {loading && <div className="status">Loading jokes...</div>}
      {error && (
        <div className="status error">
          <span>{error}</span>
          <button onClick={fetchJokes}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <div className="grid">
          {jokes.map(joke => (
            <article key={joke.id} className="card">
              <p>{joke.content}</p>
              {joke.categories.length > 0 && (
                <div className="tags">
                  {joke.categories.map(cat => (
                    <span key={cat} className="tag">{cat}</span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  )
}

export default App
