import Box from '@mui/material/Box'

export default function DevLabel({ name }) {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 4,
        left: 4,
        px: 0.75,
        py: 0.25,
        fontSize: '0.6rem',
        fontWeight: 700,
        fontFamily: 'monospace',
        color: '#000',
        bgcolor: '#fbbf24',
        borderRadius: 0.5,
        lineHeight: 1,
        zIndex: 1,
        pointerEvents: 'none',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}
    >
      {name}
    </Box>
  )
}
