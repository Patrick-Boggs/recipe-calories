import { useState } from 'react'

export default function UrlInput({ onAnalyze, loading }) {
  const [url, setUrl] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = url.trim()
    if (trimmed) {
      onAnalyze(trimmed)
    }
  }

  return (
    <form className="url-input" onSubmit={handleSubmit}>
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste recipe URL here..."
        required
        autoComplete="off"
        autoCapitalize="off"
        enterKeyHint="go"
      />
      <button type="submit" disabled={loading || !url.trim()}>
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>
    </form>
  )
}
