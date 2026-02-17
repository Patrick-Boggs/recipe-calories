import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

export default function LoadingIndicator() {
  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <CircularProgress color="primary" sx={{ mb: 2 }} />
      <Typography variant="body2" color="text.secondary">
        Scraping recipe and looking up calories...
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.6 }}>
        This may take 10-30 seconds
      </Typography>
    </Box>
  )
}
