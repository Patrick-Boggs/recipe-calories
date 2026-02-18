import { useState } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Checkbox from '@mui/material/Checkbox'
import DevLabel from './DevLabel'

export default function CookContent({ instructions }) {
  const [checked, setChecked] = useState({})

  if (!instructions || instructions.length === 0) {
    return null
  }

  function toggleStep(index) {
    setChecked((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  return (
    <Card sx={{ position: 'relative' }}>
      <DevLabel name="Content (Cook)" />
      <CardContent>
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 1 }}
        >
          Preparation
        </Typography>
        <Stack spacing={1.5}>
          {instructions.map((step, i) => (
            <Box
              key={i}
              onClick={() => toggleStep(i)}
              sx={{
                bgcolor: 'background.default',
                borderRadius: 1.5,
                p: 2,
                cursor: 'pointer',
                opacity: checked[i] ? 0.4 : 1,
                transition: 'all 0.2s',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Checkbox
                  checked={!!checked[i]}
                  tabIndex={-1}
                  disableRipple
                  size="small"
                  sx={{ p: 0, mt: '-2px' }}
                />
                <Typography
                  variant="caption"
                  color="primary"
                  fontWeight={700}
                >
                  Step {i + 1}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  lineHeight: 1.6,
                  ml: 4,
                  textDecoration: checked[i] ? 'line-through' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {step}
              </Typography>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}
