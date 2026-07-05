interface FilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  genres: string[]
  activeGenre: string
  onGenreChange: (genre: string) => void
  resultCount: number
}

export function FilterBar({ search, onSearchChange, genres, activeGenre, onGenreChange, resultCount }: FilterBarProps) {
  return (
    <div className="filterbar">
      <div className="filter-search">
        <input
          className="in"
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search artist or album…"
          aria-label="Search artist or album"
        />
      </div>
      <div className="chips">
        {genres.map((g) => (
          <button key={g} className={'chip ' + (activeGenre === g ? 'active' : '')} onClick={() => onGenreChange(g)}>
            {g}
          </button>
        ))}
      </div>
      <span className="result-count label">
        {resultCount} record{resultCount !== 1 ? 's' : ''}
      </span>
    </div>
  )
}
