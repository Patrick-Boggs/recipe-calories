import Stack from '@mui/material/Stack'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import DevLabel from './DevLabel'

const PLACEHOLDER_FAVORITES = [
  { title: 'Chicken Tikka Masala', servings: 6, total_kcal: 2450, per_serving: 408, ingredients: [] },
  { title: 'Spaghetti Bolognese', servings: 4, total_kcal: 1800, per_serving: 450, ingredients: [] },
  { title: 'Pad Thai', servings: 4, total_kcal: 2100, per_serving: 525, ingredients: [] },
]

export default function FavoritesView({ onSelectRecipe }) {
  return (
    <Box sx={{ position: 'relative' }}>
      <DevLabel name="Favorites" />
      <Stack spacing={2} sx={{ pt: 2 }}>
      <Typography variant="body2" color="text.secondary">
        Tap a recipe to view it.
      </Typography>
      {PLACEHOLDER_FAVORITES.map((fav, i) => (
        <Card key={i}>
          <CardActionArea onClick={() => onSelectRecipe(fav)}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600}>
                {fav.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {fav.servings} servings &middot; {fav.per_serving} kcal/serving
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      ))}
    </Stack>
    </Box>
  )
}
