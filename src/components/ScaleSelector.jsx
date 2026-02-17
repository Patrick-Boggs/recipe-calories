const SCALES = [0.5, 1, 2, 3, 4]

export default function ScaleSelector({ scale, onScaleChange }) {
  return (
    <div className="scale-selector">
      <span className="scale-label">Scale:</span>
      <div className="scale-buttons">
        {SCALES.map((s) => (
          <button
            key={s}
            className={`scale-btn ${scale === s ? 'active' : ''}`}
            onClick={() => onScaleChange(s)}
          >
            {s === 0.5 ? '½' : s}x
          </button>
        ))}
      </div>
    </div>
  )
}
