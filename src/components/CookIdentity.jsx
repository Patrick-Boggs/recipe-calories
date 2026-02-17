import { useState } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import FavoriteIcon from '@mui/icons-material/Favorite'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import DevLabel from './DevLabel'

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

export default function CookIdentity({ cookData, favorited, onToggleFavorite }) {
  const [checked, setChecked] = useState({})

  function toggleItem(index) {
    setChecked((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  return (
    <Card sx={{ position: 'relative' }}>
      <DevLabel name="Identity (Cook)" />
      <CardContent>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.3, mb: 2 }}>
            {cookData.title || 'Recipe'}
          </Typography>
          <IconButton onClick={onToggleFavorite} color="primary" sx={{ mt: -0.5 }}>
            {favorited ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          </IconButton>
        </Stack>

        <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
          {cookData.prep_time != null && (
            <StatBox value={`${cookData.prep_time}m`} label="prep" />
          )}
          {cookData.cook_time != null && (
            <StatBox value={`${cookData.cook_time}m`} label="cook" />
          )}
          {cookData.total_time != null && (
            <StatBox value={`${cookData.total_time}m`} label="total" />
          )}
        </Stack>

        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5 }}
        >
          Ingredients
        </Typography>

        <List dense disablePadding>
          {cookData.ingredients.map((ing, i) => (
            <ListItemButton
              key={i}
              onClick={() => toggleItem(i)}
              dense
              sx={{ borderRadius: 1, px: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Checkbox
                  edge="start"
                  checked={!!checked[i]}
                  tabIndex={-1}
                  disableRipple
                  size="small"
                />
              </ListItemIcon>
              <ListItemText
                primary={ing}
                primaryTypographyProps={{
                  variant: 'body2',
                  sx: {
                    textDecoration: checked[i] ? 'line-through' : 'none',
                    opacity: checked[i] ? 0.4 : 1,
                    transition: 'all 0.2s',
                  },
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </CardContent>
    </Card>
  )
}
