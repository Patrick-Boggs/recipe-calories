import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import DevLabel from './DevLabel'

const STATUS_COLORS = {
  ok: '#4ade80',
  skipped: '#fbbf24',
  'not found': '#f87171',
}

function IngredientRow({ ingredient, scale }) {
  const { raw, name, grams, kcal_per_100g, total_kcal, usda_match, status, note } = ingredient

  const scaledGrams = grams != null ? Math.round(grams * scale * 10) / 10 : null
  const scaledKcal = total_kcal != null ? Math.round(total_kcal * scale * 10) / 10 : null

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 1.5,
        p: 2,
        border: 1,
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" alignItems="flex-start" spacing={1.25}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            flexShrink: 0,
            mt: 0.75,
            bgcolor: STATUS_COLORS[status] || STATUS_COLORS.ok,
          }}
        />
        <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
          {raw}
        </Typography>
      </Stack>

      {status === 'ok' && (
        <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 1, pl: 2.25 }}>
          {scaledGrams != null && (
            <Chip label={`${scaledGrams}g`} size="small" variant="outlined" />
          )}
          {kcal_per_100g != null && (
            <Chip label={`${kcal_per_100g} kcal/100g`} size="small" variant="outlined" />
          )}
          {scaledKcal != null && (
            <Chip
              label={`${scaledKcal} kcal`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Stack>
      )}

      {status === 'ok' && usda_match && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 0.75, pl: 2.25, fontStyle: 'italic', opacity: 0.7 }}
        >
          {usda_match}
        </Typography>
      )}

      {status !== 'ok' && note && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 0.5, pl: 2.25, fontStyle: 'italic' }}
        >
          {note}
        </Typography>
      )}
    </Box>
  )
}

export default function IngredientTable({ ingredients, scale }) {
  return (
    <Card sx={{ position: 'relative' }}>
      <DevLabel name="Content" />
      <CardContent>
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 1 }}
        >
          Ingredient Breakdown
        </Typography>
        <Stack spacing={1}>
          {ingredients.map((ing, i) => (
            <IngredientRow key={i} ingredient={ing} scale={scale} />
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}
