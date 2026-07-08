import { useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { OWNER_EMAIL, supabase } from './lib/supabase'
import type { Record as VinylRecord } from './types'
import { Header } from './components/Header'
import { FilterBar } from './components/FilterBar'
import { Card } from './components/Card'
import { Detail } from './components/Detail'
import { Editor, type EditableRecord } from './components/Editor'

type View = 'shelf' | 'wishlist'

function toEditable(r: VinylRecord): EditableRecord {
  return {
    id: r.id,
    artist: r.artist,
    title: r.title,
    year: r.year ?? '',
    genre: r.genre ?? '',
    owned: r.owned,
    priority: r.priority ?? false,
    img: r.img ?? '',
  }
}

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [previewGuest, setPreviewGuest] = useState(false)

  const [records, setRecords] = useState<VinylRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [flashError, setFlashError] = useState<string | null>(null)

  const [view, setView] = useState<View>(() => (localStorage.getItem('trr_view') as View) || 'shelf')
  useEffect(() => localStorage.setItem('trr_view', view), [view])

  const [search, setSearch] = useState('')
  const [genre, setGenre] = useState('All')
  const [sel, setSel] = useState<VinylRecord | null>(null)
  const [editRec, setEditRec] = useState<EditableRecord | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data, error } = await supabase.from('records').select('*').order('created_at').returns<VinylRecord[]>()
        if (cancelled) return
        if (error) throw error
        setRecords(data ?? [])
      } catch {
        if (!cancelled) setFlashError('Could not load records.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const authedAsOwner = Boolean(session?.user?.email) && session?.user?.email === OWNER_EMAIL
  const isAdmin = authedAsOwner && !previewGuest

  const enableEditing = () => {
    if (authedAsOwner) setPreviewGuest(false)
    else supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
  }
  const previewAsGuest = () => setPreviewGuest(true)
  const logOut = async () => {
    await supabase.auth.signOut()
    setPreviewGuest(false)
  }

  const shelf = records.filter((r) => r.owned)
  const wish = records.filter((r) => !r.owned)
  const pool = view === 'shelf' ? shelf : wish

  const allGenres = useMemo(() => Array.from(new Set(records.map((r) => r.genre).filter(Boolean))).sort() as string[], [records])
  const genres = useMemo(() => {
    const s = new Set(pool.map((r) => r.genre).filter(Boolean))
    return ['All', ...Array.from(s).sort()] as string[]
  }, [pool])

  useEffect(() => setGenre('All'), [view])

  const genreFiltered = genre === 'All' ? pool : pool.filter((r) => r.genre === genre)
  const searched = search.trim()
    ? genreFiltered.filter((r) => `${r.artist} ${r.title}`.toLowerCase().includes(search.trim().toLowerCase()))
    : genreFiltered
  const ordered = view === 'wishlist' ? [...searched].sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0)) : searched

  const toggleWish = async (rec: VinylRecord) => {
    try {
      const { data, error } = await supabase.from('records').update({ owned: !rec.owned }).eq('id', rec.id).select().single()
      const updated = data as VinylRecord | null
      if (error) throw error
      if (updated) setRecords((rs) => rs.map((r) => (r.id === rec.id ? updated : r)))
    } catch {
      setFlashError('Could not update that record.')
    }
    setSel(null)
  }

  const saveRec = async (form: EditableRecord) => {
    const clean = {
      artist: form.artist.trim(),
      title: form.title.trim(),
      year: form.year || null,
      genre: form.genre.trim() || null,
      owned: form.owned,
      priority: form.priority,
      img: form.img.trim() || null,
    }
    try {
      if (form.id) {
        const { data, error } = await supabase.from('records').update(clean).eq('id', form.id).select().single()
        const updated = data as VinylRecord | null
        if (error) throw error
        if (updated) setRecords((rs) => rs.map((r) => (r.id === form.id ? updated : r)))
      } else {
        const { data, error } = await supabase.from('records').insert(clean).select().single()
        const inserted = data as VinylRecord | null
        if (error) throw error
        if (inserted) {
          setRecords((rs) => [inserted, ...rs])
          if (view === 'shelf' && !inserted.owned) setView('wishlist')
          if (view === 'wishlist' && inserted.owned) setView('shelf')
        }
      }
    } catch {
      setFlashError(form.id ? 'Could not save changes.' : 'Could not add that record.')
    }
    setEditRec(null)
  }

  const deleteRec = async (form: EditableRecord) => {
    if (!form.id) return
    try {
      const { error } = await supabase.from('records').delete().eq('id', form.id)
      if (error) throw error
      setRecords((rs) => rs.filter((r) => r.id !== form.id))
    } catch {
      setFlashError('Could not delete that record.')
    }
    setEditRec(null)
  }

  const startAdd = () => setEditRec({ artist: '', title: '', year: '', genre: '', owned: view === 'shelf', priority: false, img: '' })

  return (
    <div className="app">
      <Header shelfCount={shelf.length} wishCount={wish.length} view={view} onViewChange={setView} />

      <p className="view-intro">
        {view === 'shelf'
          ? "Everything currently spinning at home — browse the shelf and see what's here."
          : "Records I'd love to add. If you're hunting for a gift, anything here is a safe bet — ★ marks the ones I want most."}
      </p>

      {flashError && (
        <div className="flash-error">
          {flashError}{' '}
          <button className="linkbtn" onClick={() => setFlashError(null)}>
            Dismiss
          </button>
        </div>
      )}

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        genres={genres}
        activeGenre={genre}
        onGenreChange={setGenre}
        resultCount={ordered.length}
      />

      {loading ? (
        <div className="empty">
          <p className="title-serif">Loading…</p>
        </div>
      ) : (
        <>
          <div className="grid">
            {isAdmin && (
              <button className="rec add-tile" onClick={startAdd}>
                <div className="add-inner">
                  <span className="add-plus">＋</span>
                  <span className="add-label label">Add a record</span>
                </div>
              </button>
            )}
            {ordered.map((r) => (
              <Card key={r.id} rec={r} onOpen={setSel} />
            ))}
          </div>

          {ordered.length === 0 && !isAdmin && (
            <div className="empty">
              <p className="title-serif">Nothing here yet.</p>
            </div>
          )}
        </>
      )}

      <footer className="site-foot">
        <span className="mono">Wax &amp; Paper</span>
        <div className="foot-actions">
          {isAdmin && (
            <button className="linkbtn label" onClick={previewAsGuest}>
              Preview as guest
            </button>
          )}
          {!authedAsOwner && (
            <button className="linkbtn label" onClick={enableEditing}>
              Owner? Enable editing
            </button>
          )}
          {previewGuest && authedAsOwner && (
            <button className="linkbtn label" onClick={enableEditing}>
              Back to editing
            </button>
          )}
          {authedAsOwner && (
            <button className="linkbtn label" onClick={logOut}>
              Log out
            </button>
          )}
        </div>
      </footer>

      {sel && (
        <Detail
          rec={sel}
          admin={isAdmin}
          onClose={() => setSel(null)}
          onToggleWish={toggleWish}
          onEdit={(r) => {
            setSel(null)
            setEditRec(toEditable(r))
          }}
        />
      )}
      {editRec && <Editor rec={editRec} genres={allGenres} onClose={() => setEditRec(null)} onSave={saveRec} onDelete={deleteRec} />}
    </div>
  )
}

export default App
