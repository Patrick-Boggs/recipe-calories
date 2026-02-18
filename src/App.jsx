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
import CookIdentity from './components/CookIdentity'
import CookContent from './components/CookContent'
import FavoritesView from './components/FavoritesView'
import DevLabel from './components/DevLabel'

function DebugDetails({ debug }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const text = [
    `HTTP Status: ${debug.status ?? 'N/A'}`,
    `Request URL: ${debug.url}`,
    `Response:\n${debug.body}`,
  ].join('\n\n')

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Box sx={{ mt: 1 }}>
      <Stack direction="row" spacing={1}>
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
        <Typography
          component="button"
          onClick={handleCopy}
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
          {copied ? 'Copied!' : 'Copy'}
        </Typography>
      </Stack>
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
  const [mode, setMode] = useState('cook')
  const [recipe, setRecipe] = useState(null)
  const [cookData, setCookData] = useState(null)
  const [cookLoading, setCookLoading] = useState(false)
  const [nutritionLoading, setNutritionLoading] = useState(false)
  const [error, setError] = useState(null)
  const [blocked, setBlocked] = useState(false)
  const [debug, setDebug] = useState(null)
  const [scale, setScale] = useState(1)
  const [favorited, setFavorited] = useState(false)
  const [debugEnabled, setDebugEnabled] = useState(true)

  const loading = mode === 'cook' ? cookLoading : nutritionLoading

  async function fetchEndpoint(endpoint, url) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    const rawText = await res.text()
    let data
    try {
      data = JSON.parse(rawText)
    } catch {
      throw { userError: 'Server returned non-JSON response.', debug: { status: res.status, url, body: rawText } }
    }
    if (!res.ok) {
      throw { userError: data.error || 'Something went wrong.', blocked: data.blocked || false, debug: { status: res.status, url, body: rawText } }
    }
    return data
  }

  function handleAnalyze(url) {
    setError(null)
    setBlocked(false)
    setDebug(null)
    setRecipe(null)
    setCookData(null)
    setScale(1)
    setFavorited(false)
    setCookLoading(true)
    setNutritionLoading(true)

    fetchEndpoint('/api/cook', url)
      .then((data) => setCookData(data))
      .catch((err) => {
        if (mode === 'cook') {
          setError(err.userError || 'Failed to connect to server.')
          setBlocked(err.blocked || false)
          setDebug(err.debug || { status: null, url, body: String(err) })
        }
      })
      .finally(() => setCookLoading(false))

    fetchEndpoint('/api/calculate', url)
      .then((data) => setRecipe(data))
      .catch((err) => {
        if (mode === 'nutrition') {
          setError(err.userError || 'Failed to connect to server.')
          setBlocked(err.blocked || false)
          setDebug(err.debug || { status: null, url, body: String(err) })
        }
      })
      .finally(() => setNutritionLoading(false))
  }

  function handleSelectFavorite(fav) {
    setRecipe(fav)
    setScale(1)
    setFavorited(true)
    setView('recipe')
  }

  const appBarTitle = view === 'favorites'
    ? 'Favorites'
    : (mode === 'cook' && cookData?.title)
      ? cookData.title
      : (recipe?.title || 'Recipe Calories')

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <AppBar position="sticky">
        <Toolbar sx={{ position: 'relative' }}>
          <DevLabel name="AppBar" />
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
            <AcquisitionCard
              onAnalyze={handleAnalyze}
              loading={loading}
              mode={mode}
              onModeChange={setMode}
            />

            {loading && !error && <LoadingIndicator />}

            {!loading && error && (
              <Alert severity={blocked ? "warning" : "error"} variant="outlined">
                {error}
                {debugEnabled && debug && <DebugDetails debug={debug} />}
              </Alert>
            )}

            {mode === 'nutrition' && recipe && (
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

            {mode === 'cook' && cookData && (
              <>
                <CookIdentity
                  cookData={cookData}
                  favorited={favorited}
                  onToggleFavorite={() => setFavorited(!favorited)}
                />
                <CookContent instructions={cookData.instructions} />
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
