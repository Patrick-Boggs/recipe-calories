const STATUS_COLORS = {
  ok: 'var(--success)',
  skipped: 'var(--warning)',
  'not found': 'var(--error)',
}

export default function IngredientTable({ ingredients, scale }) {
  return (
    <div className="ingredients-section">
      <h3>Ingredient Breakdown</h3>
      <div className="ingredients-list">
        {ingredients.map((ing, i) => (
          <IngredientRow key={i} ingredient={ing} scale={scale} />
        ))}
      </div>
    </div>
  )
}

function IngredientRow({ ingredient, scale }) {
  const { raw, name, grams, kcal_per_100g, total_kcal, usda_match, status, note } = ingredient

  const scaledGrams = grams != null ? Math.round(grams * scale * 10) / 10 : null
  const scaledKcal = total_kcal != null ? Math.round(total_kcal * scale * 10) / 10 : null

  return (
    <div className={`ingredient-row status-${status?.replace(' ', '-')}`}>
      <div className="ingredient-header">
        <span
          className="status-dot"
          style={{ background: STATUS_COLORS[status] || STATUS_COLORS.ok }}
          title={status}
        />
        <span className="ingredient-name">{raw}</span>
      </div>

      {status === 'ok' && (
        <div className="ingredient-details">
          <div className="detail-chips">
            {scaledGrams != null && (
              <span className="chip">{scaledGrams}g</span>
            )}
            {kcal_per_100g != null && (
              <span className="chip">{kcal_per_100g} kcal/100g</span>
            )}
            {scaledKcal != null && (
              <span className="chip chip-kcal">{scaledKcal} kcal</span>
            )}
          </div>
          {usda_match && (
            <p className="usda-match">{usda_match}</p>
          )}
        </div>
      )}

      {status !== 'ok' && note && (
        <p className="ingredient-note">{note}</p>
      )}
    </div>
  )
}
