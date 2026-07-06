// Supabase Edge Function: Spotify album search via Client Credentials grant.
// Secrets required (Supabase dashboard -> Edge Functions -> Secrets):
//   SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SpotifyAlbum {
  name: string
  artists: string
  imageUrl: string
  year: string
  genre?: string
}

async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get('SPOTIFY_CLIENT_ID')
  const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET')
  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials are not configured')
  }
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) throw new Error('Failed to authenticate with Spotify')
  const json = await res.json()
  return json.access_token as string
}

// Spotify album objects don't carry genre info directly - it lives on the artist.
// Batch-fetch artists for the result set's primary artists and map genres back.
async function fetchGenresByArtistId(artistIds: string[], token: string): Promise<Record<string, string>> {
  if (artistIds.length === 0) return {}
  const res = await fetch(`https://api.spotify.com/v1/artists?ids=${artistIds.join(',')}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return {}
  const json = await res.json()
  const genreByArtist: Record<string, string> = {}
  for (const artist of json.artists ?? []) {
    const genre = artist?.genres?.[0]
    if (artist?.id && genre) genreByArtist[artist.id] = genre.charAt(0).toUpperCase() + genre.slice(1)
  }
  return genreByArtist
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  try {
    const { artist, title } = await req.json()
    if (!artist) {
      return new Response(JSON.stringify({ error: 'artist is required' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const token = await getAccessToken()
    const queryParts = [`artist:"${artist}"`]
    if (title) queryParts.push(`album:"${title}"`)
    const searchUrl = new URL('https://api.spotify.com/v1/search')
    searchUrl.searchParams.set('q', queryParts.join(' '))
    searchUrl.searchParams.set('type', 'album')
    searchUrl.searchParams.set('limit', '10')
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!searchRes.ok) throw new Error('Spotify search request failed')
    const searchJson = await searchRes.json()
    const albumItems = searchJson.albums?.items ?? []

    const artistIds = Array.from(new Set(albumItems.map((album: any) => album.artists?.[0]?.id).filter(Boolean))) as string[]
    const genreByArtist = await fetchGenresByArtistId(artistIds, token)

    const albums: SpotifyAlbum[] = albumItems.map((album: any) => ({
      name: album.name,
      artists: (album.artists ?? []).map((a: any) => a.name).join(', '),
      imageUrl: album.images?.[0]?.url ?? '',
      year: (album.release_date ?? '').slice(0, 4),
      genre: genreByArtist[album.artists?.[0]?.id],
    }))

    return new Response(JSON.stringify(albums), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
