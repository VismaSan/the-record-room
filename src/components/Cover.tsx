import { useEffect, useState, type ReactNode } from 'react'
import { proceduralSleeveSVG } from '../lib/covers'
import type { Record as VinylRecord } from '../types'

interface CoverProps {
  rec: Pick<VinylRecord, 'id' | 'artist' | 'title' | 'img'>
  children?: ReactNode
}

export function Cover({ rec, children }: CoverProps) {
  const [imgFailed, setImgFailed] = useState(false)

  useEffect(() => {
    setImgFailed(false)
  }, [rec.img, rec.id])

  const showImg = Boolean(rec.img) && !imgFailed

  return (
    <div className="cover">
      <div className="cover-art">
        {showImg ? (
          <img
            src={rec.img}
            alt={`${rec.artist} — ${rec.title}`}
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div dangerouslySetInnerHTML={{ __html: proceduralSleeveSVG(rec) }} />
        )}
      </div>
      {children}
    </div>
  )
}
