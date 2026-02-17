import { useState } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'

export default function AcquisitionCard({ onAnalyze, loading }) {
  const [url, setUrl] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = url.trim()
    if (trimmed) {
      onAnalyze(trimmed)
    }
  }

  return (
    <Card>
      <CardContent>
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
      </CardContent>
    </Card>
  )
}
