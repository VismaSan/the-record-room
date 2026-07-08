import { useEffect } from 'react'
import type { Record as VinylRecord } from '../types'
import { Cover } from './Cover'

interface DetailProps {
  rec: VinylRecord
  admin: boolean
  onClose: () => void
  onToggleWish: (rec: VinylRecord) => void
  onEdit: (rec: VinylRecord) => void
}

export function Detail({ rec, admin, onClose, onToggleWish, onEdit }: DetailProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const isWish = !rec.owned

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <div className="sheet-cover">
          <Cover rec={rec} />
        </div>
        <div className="sheet-info">
          <span className="label">{isWish ? 'On the wishlist' : 'On the shelf'}</span>
          <h2 className="title-serif">{rec.title}</h2>
          <p className="sheet-artist poster">{rec.artist}</p>
          <div className="sheet-tags">
            {rec.year && <span className="stamp tag-quiet">{rec.year}</span>}
            {rec.genre && <span className="stamp tag-quiet">{rec.genre}</span>}
            {rec.priority && <span className="stamp">Most wanted</span>}
          </div>
          {admin && (
            <div className="sheet-actions">
              <button className={'btn ' + (isWish ? 'btn-solid' : 'btn-accent')} onClick={() => onToggleWish(rec)}>
                {isWish ? 'Move to the shelf' : 'Add to wishlist'}
              </button>
              <button className="btn btn-ghost" onClick={() => onEdit(rec)}>
                Edit ✎
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
