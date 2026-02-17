import { useState } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import DevLabel from './DevLabel'

export default function AcquisitionCard({ onAnalyze, loading, mode, onModeChange }) {
  const [url, setUrl] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = url.trim()
    if (trimmed) {
      onAnalyze(trimmed)
    }
  }

  return (
    <Card sx={{ position: 'relative' }}>
      <DevLabel name="Acquisition" />
      <CardContent>
        <Stack spacing={1.5}>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, val) => { if (val !== null) onModeChange(val) }}
            size="small"
            fullWidth
          >
            <ToggleButton value="cook">Cook</ToggleButton>
            <ToggleButton value="nutrition">Nutrition</ToggleButton>
          </ToggleButtonGroup>
          <Stack
            component="form"
            direction="row"
            spacing={1}
            onSubmit={handleSubmit}
          >
            <TextField
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste recipe URL here..."
              required
              autoComplete="off"
              size="small"
              fullWidth
              inputProps={{ autoCapitalize: 'off', enterKeyHint: 'go' }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !url.trim()}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}
