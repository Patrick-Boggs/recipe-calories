export default function RecipeSummary({ recipe, scale }) {
  const totalKcal = Math.round(recipe.total_kcal * scale)
  const perServing = recipe.per_serving != null
    ? Math.round(recipe.per_serving * scale)
    : null

  return (
    <div className="summary-card">
      <h2 className="recipe-title">{recipe.title || 'Recipe'}</h2>
      <div className="summary-stats">
        {recipe.servings != null && (
          <div className="stat">
            <span className="stat-value">{recipe.servings}</span>
            <span className="stat-label">servings</span>
          </div>
        )}
        <div className="stat">
          <span className="stat-value">{totalKcal.toLocaleString()}</span>
          <span className="stat-label">total kcal</span>
        </div>
        {perServing != null && (
          <div className="stat">
            <span className="stat-value">{perServing.toLocaleString()}</span>
            <span className="stat-label">per serving</span>
          </div>
        )}
      </div>
    </div>
  )
}
