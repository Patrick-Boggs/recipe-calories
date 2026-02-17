import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import DevLabel from './DevLabel'

export default function CookContent({ instructions }) {
  if (!instructions || instructions.length === 0) {
    return null
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
              sx={{
                bgcolor: 'background.default',
                borderRadius: 1.5,
                p: 2,
              }}
            >
              <Typography
                variant="caption"
                color="primary"
                fontWeight={700}
                sx={{ display: 'block', mb: 0.5 }}
              >
                Step {i + 1}
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                {step}
              </Typography>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}
