import { useEffect, useState } from 'react'
import type { Record as VinylRecord, SpotifyAlbum } from '../types'
import { supabase } from '../lib/supabase'
import { Cover } from './Cover'

export interface EditableRecord {
  id?: string
  artist: string
  title: string
  year: number | ''
  genre: string
  owned: boolean
  priority: boolean
  img: string
}

interface EditorProps {
  rec: EditableRecord
  genres: string[]
  onClose: () => void
  onSave: (form: EditableRecord) => void
  onDelete: (rec: EditableRecord) => void
}

export function Editor({ rec, genres, onClose, onSave, onDelete }: EditorProps) {
  const [form, setForm] = useState<EditableRecord>({ ...rec })
  const [results, setResults] = useState<SpotifyAlbum[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const set = <K extends keyof EditableRecord>(key: K, value: EditableRecord[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const isNew = !form.id

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const canSave = form.artist.trim() && form.title.trim()
  const preview: VinylRecord = {
    ...form,
    id: form.id || 'preview',
    year: form.year || undefined,
    img: form.img || undefined,
  }

  const searchSpotify = async () => {
    setSearching(true)
    setSearchError(null)
    setResults([])
    try {
      const { data, error } = await supabase.functions.invoke<SpotifyAlbum[]>('spotify-search', {
        body: { artist: form.artist, title: form.title },
      })
      if (error) throw error
      setResults(data ?? [])
    } catch {
      setSearchError('Spotify search failed. Try again.')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet sheet-edit" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <div className="sheet-cover">
          <Cover rec={preview} />
          <p className="cover-hint label">
            {form.img ? 'Live preview' : 'Auto sleeve — add a URL below for real art'}
          </p>
        </div>
        <div className="sheet-info edit-form">
          <span className="label">{isNew ? 'Add a record' : 'Edit record'}</span>

          <label className="fld">
            <span className="fld-l">Cover image URL</span>
            <input
              className="in"
              type="url"
              value={form.img}
              placeholder="https://… (paste album art)"
              onChange={(e) => set('img', e.target.value.trim())}
            />
            <span className="fld-help">
              Search Spotify below and pick a result, or paste an image URL directly. Leave blank for an
              auto-generated sleeve.
            </span>
          </label>

          <div className="fld-row">
            <label className="fld">
              <span className="fld-l">Artist</span>
              <input className="in" value={form.artist} onChange={(e) => set('artist', e.target.value)} placeholder="Artist" />
            </label>
            <label className="fld">
              <span className="fld-l">Album</span>
              <input className="in" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Album title" />
            </label>
          </div>

          <div className="fld">
            <button className="btn btn-ghost" type="button" disabled={!form.artist.trim() || searching} onClick={searchSpotify}>
              {searching ? 'Searching…' : 'Search Spotify'}
            </button>
            <span className="fld-help">Search by artist alone to browse their catalog, or add an album title to narrow it down.</span>
            {searchError && <span className="fld-help">{searchError}</span>}
            {results.length > 0 && (
              <div className="spotify-results">
                {results.map((album, i) => (
                  <button
                    key={i}
                    type="button"
                    className={'spotify-result' + (form.img === album.imageUrl ? ' selected' : '')}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        artist: album.artists,
                        title: album.name,
                        year: album.year ? +album.year : f.year,
                        genre: album.genre || f.genre,
                        img: album.imageUrl,
                      }))
                    }
                  >
                    <img src={album.imageUrl} alt={`${album.artists} — ${album.name}`} />
                    <span>
                      {album.name} ({album.year})
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="fld-row">
            <label className="fld fld-sm">
              <span className="fld-l">Year</span>
              <input
                className="in"
                type="number"
                value={form.year}
                onChange={(e) => set('year', e.target.value ? +e.target.value : '')}
                placeholder="1976"
              />
            </label>
            <label className="fld">
              <span className="fld-l">Genre</span>
              <input className="in" list="genre-list" value={form.genre} onChange={(e) => set('genre', e.target.value)} placeholder="Soul" />
              <datalist id="genre-list">
                {genres.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </label>
          </div>

          <div className="fld">
            <span className="fld-l">Where it lives</span>
            <div className="seg">
              <button type="button" className={'seg-b ' + (form.owned ? 'on' : '')} onClick={() => set('owned', true)}>
                On the shelf
              </button>
              <button type="button" className={'seg-b ' + (!form.owned ? 'on' : '')} onClick={() => set('owned', false)}>
                On the wishlist
              </button>
            </div>
          </div>

          {!form.owned && (
            <label className="fld-check">
              <input type="checkbox" checked={form.priority} onChange={(e) => set('priority', e.target.checked)} />
              <span>★ Most wanted — flag this as a top gift pick</span>
            </label>
          )}

          <div className="sheet-actions edit-actions">
            <button className="btn btn-accent" disabled={!canSave} onClick={() => onSave(form)}>
              {isNew ? 'Add record' : 'Save changes'}
            </button>
            {!isNew && (
              <button className="btn btn-ghost danger" onClick={() => onDelete(form)}>
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
