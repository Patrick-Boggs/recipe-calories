import { useState } from 'react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import Tooltip from '@mui/material/Tooltip'
import FavoriteIcon from '@mui/icons-material/Favorite'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import BugReportIcon from '@mui/icons-material/BugReport'
import AcquisitionCard from './components/AcquisitionCard'
import LoadingIndicator from './components/LoadingIndicator'
import RecipeSummary from './components/RecipeSummary'
import IngredientTable from './components/IngredientTable'
import FavoritesView from './components/FavoritesView'

function DebugDetails({ debug }) {
  const [open, setOpen] = useState(false)
  const text = [
    `HTTP Status: ${debug.status ?? 'N/A'}`,
    `Request URL: ${debug.url}`,
    `Response:\n${debug.body}`,
  ].join('\n\n')

  return (
    <Box sx={{ mt: 1 }}>
      <Typography
        component="button"
        onClick={() => setOpen(!open)}
        sx={{
          background: 'none',
          border: 'none',
          color: 'text.secondary',
          fontSize: '0.8rem',
          cursor: 'pointer',
          textDecoration: 'underline',
          p: 0,
        }}
      >
        {open ? 'Hide' : 'Show'} Debug Details
      </Typography>
      {open && (
        <Box
          component="pre"
          sx={{
            mt: 1,
            p: 1.5,
            bgcolor: '#0d0d1a',
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            color: 'text.secondary',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            maxHeight: 300,
            overflowY: 'auto',
            userSelect: 'all',
          }}
        >
          {text}
        </Box>
      )}
    </Box>
  )
}

export default function App() {
  const [view, setView] = useState('recipe')
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [debug, setDebug] = useState(null)
  const [scale, setScale] = useState(1)
  const [favorited, setFavorited] = useState(false)
  const [debugEnabled, setDebugEnabled] = useState(true)

  async function handleAnalyze(url) {
    setLoading(true)
    setError(null)
    setDebug(null)
    setRecipe(null)
    setScale(1)
    setFavorited(false)

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

  function handleSelectFavorite(fav) {
    setRecipe(fav)
    setScale(1)
    setFavorited(true)
    setView('recipe')
  }

  const appBarTitle = view === 'favorites'
    ? 'Favorites'
    : (recipe?.title || 'Recipe Calories')

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <AppBar position="sticky">
        <Toolbar>
          {view === 'favorites' && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setView('recipe')}
              sx={{ mr: 1 }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
            {appBarTitle}
          </Typography>
          <Tooltip title={debugEnabled ? 'Debug on' : 'Debug off'}>
            <IconButton
              color="inherit"
              onClick={() => setDebugEnabled(!debugEnabled)}
              sx={{ opacity: debugEnabled ? 1 : 0.4 }}
            >
              <BugReportIcon />
            </IconButton>
          </Tooltip>
          {view === 'recipe' && (
            <IconButton color="inherit" onClick={() => setView('favorites')}>
              <FavoriteIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 2, flex: 1 }}>
        {view === 'recipe' && (
          <Stack spacing={2}>
            <AcquisitionCard onAnalyze={handleAnalyze} loading={loading} />

            {loading && <LoadingIndicator />}

            {error && (
              <Alert severity="error" variant="outlined">
                {error}
                {debugEnabled && debug && <DebugDetails debug={debug} />}
              </Alert>
            )}

            {recipe && (
              <>
                <RecipeSummary
                  recipe={recipe}
                  scale={scale}
                  onScaleChange={setScale}
                  favorited={favorited}
                  onToggleFavorite={() => setFavorited(!favorited)}
                />
                <IngredientTable ingredients={recipe.ingredients} scale={scale} />
              </>
            )}
          </Stack>
        )}

        {view === 'favorites' && (
          <FavoritesView onSelectRecipe={handleSelectFavorite} />
        )}
      </Container>
    </Box>
  )
}
