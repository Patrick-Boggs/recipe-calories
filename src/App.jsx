import { useState, useCallback } from 'react'
import UrlInput from './components/UrlInput'
import LoadingIndicator from './components/LoadingIndicator'
import RecipeSummary from './components/RecipeSummary'
import IngredientTable from './components/IngredientTable'
import ScaleSelector from './components/ScaleSelector'
import './App.css'

function DebugDetails({ debug }) {
  const [open, setOpen] = useState(false)
  const text = [
    `HTTP Status: ${debug.status ?? 'N/A'}`,
    `Request URL: ${debug.url}`,
    `Response:\n${debug.body}`,
  ].join('\n\n')

  return (
    <div className="debug-section">
      <button className="debug-toggle" onClick={() => setOpen(!open)}>
        {open ? 'Hide' : 'Show'} Debug Details
      </button>
      {open && (
        <pre className="debug-pre">{text}</pre>
      )}
    </div>
  )
}

export default function App() {
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [debug, setDebug] = useState(null)
  const [scale, setScale] = useState(1)

  async function handleAnalyze(url) {
    setLoading(true)
    setError(null)
    setDebug(null)
    setRecipe(null)
    setScale(1)

    try {
      const res = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      const rawText = await res.text()
      let data
      try {
        data = JSON.parse(rawText)
      } catch {
        setError('Server returned non-JSON response.')
        setDebug({ status: res.status, url, body: rawText })
        return
      }

      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        setDebug({ status: res.status, url, body: rawText })
        return
      }

      setRecipe(data)
    } catch (err) {
      setError('Failed to connect to server. Please try again.')
      setDebug({ status: null, url, body: err.toString() })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Recipe Calories</h1>
        <p className="subtitle">Paste a recipe URL to get a calorie breakdown</p>
      </header>

      <main className="app-main">
        <UrlInput onAnalyze={handleAnalyze} loading={loading} />

        {loading && <LoadingIndicator />}

        {error && (
          <div className="error-card">
            <p>{error}</p>
            {debug && <DebugDetails debug={debug} />}
          </div>
        )}

        {recipe && (
          <>
            <RecipeSummary recipe={recipe} scale={scale} />
            <ScaleSelector scale={scale} onScaleChange={setScale} />
            <IngredientTable ingredients={recipe.ingredients} scale={scale} />
          </>
        )}
      </main>
    </div>
  )
}
