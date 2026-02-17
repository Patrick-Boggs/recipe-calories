import { useState } from 'react'
import UrlInput from './components/UrlInput'
import LoadingIndicator from './components/LoadingIndicator'
import RecipeSummary from './components/RecipeSummary'
import IngredientTable from './components/IngredientTable'
import ScaleSelector from './components/ScaleSelector'
import './App.css'

export default function App() {
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [scale, setScale] = useState(1)

  async function handleAnalyze(url) {
    setLoading(true)
    setError(null)
    setRecipe(null)
    setScale(1)

    try {
      const res = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        return
      }

      setRecipe(data)
    } catch (err) {
      setError('Failed to connect to server. Please try again.')
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
