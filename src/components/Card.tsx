import type { Record as VinylRecord } from '../types'
import { Cover } from './Cover'

interface CardProps {
  rec: VinylRecord
  onOpen: (rec: VinylRecord) => void
}

export function Card({ rec, onOpen }: CardProps) {
  const isWish = !rec.owned
  return (
    <button className={'rec' + (isWish ? ' is-wish' : '')} onClick={() => onOpen(rec)}>
      <Cover rec={rec}>{isWish && <span className="ribbon">Wishlist</span>}</Cover>
      <div className="rec-meta">
        <div className="artist">{rec.artist || 'New artist'}</div>
        <div className="album title-serif">{rec.title || 'Untitled'}</div>
        <div className="rec-foot">
          {rec.year && <span className="mono yr">{rec.year}</span>}
          {rec.year && rec.genre && <span className="dot">&middot;</span>}
          {rec.genre && <span className="mono gn">{rec.genre}</span>}
          {rec.priority && (
            <span className="star" title="Most wanted">
              ★
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
