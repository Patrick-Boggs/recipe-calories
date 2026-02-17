import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import IconButton from '@mui/material/IconButton'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import FavoriteIcon from '@mui/icons-material/Favorite'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import DevLabel from './DevLabel'

const SCALES = [0.5, 1, 2, 3, 4]

function StatBox({ value, label }) {
  return (
    <Box
      sx={{
        flex: 1,
        textAlign: 'center',
        py: 1.5,
        px: 1,
        bgcolor: 'background.default',
        borderRadius: 1,
      }}
    >
      <Typography variant="h5" fontWeight={700} color="primary">
        {value}
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
      >
        {label}
      </Typography>
    </Box>
  )
}

export default function RecipeSummary({ recipe, scale, onScaleChange, favorited, onToggleFavorite }) {
  const scaledServings = recipe.servings != null ? Math.round(recipe.servings * scale) : null
  const totalKcal = Math.round(recipe.total_kcal * scale)
  const perServing = recipe.per_serving != null
    ? Math.round(recipe.per_serving)
    : null

  return (
    <Card sx={{ position: 'relative' }}>
      <DevLabel name="Identity" />
      <CardContent>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.3, mb: 2 }}>
            {recipe.title || 'Recipe'}
          </Typography>
          <IconButton onClick={onToggleFavorite} color="primary" sx={{ mt: -0.5 }}>
            {favorited ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          </IconButton>
        </Stack>

        <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
          {recipe.servings != null && (
            <StatBox value={scaledServings} label="servings" />
          )}
          <StatBox value={totalKcal.toLocaleString()} label="total kcal" />
          {perServing != null && (
            <StatBox value={perServing.toLocaleString()} label="per serving" />
          )}
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
          >
            Scale:
          </Typography>
          <ToggleButtonGroup
            value={scale}
            exclusive
            onChange={(_, val) => { if (val !== null) onScaleChange(val) }}
            size="small"
          >
            {SCALES.map((s) => (
              <ToggleButton key={s} value={s} sx={{ px: 2 }}>
                {s === 0.5 ? '½' : s}x
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>
      </CardContent>
    </Card>
  )
}
