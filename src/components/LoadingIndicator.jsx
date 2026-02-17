export default function LoadingIndicator() {
  return (
    <div className="loading">
      <div className="spinner" />
      <p>Scraping recipe and looking up calories...</p>
      <p className="loading-note">This may take 10-30 seconds</p>
    </div>
  )
}
