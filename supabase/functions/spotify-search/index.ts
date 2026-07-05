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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  try {
    const { artist, title } = await req.json()
    if (!artist || !title) {
      return new Response(JSON.stringify({ error: 'artist and title are required' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const token = await getAccessToken()
    const query = encodeURIComponent(`${artist} ${title}`)
    const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=album&limit=6`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!searchRes.ok) throw new Error('Spotify search request failed')
    const searchJson = await searchRes.json()

    const albums: SpotifyAlbum[] = (searchJson.albums?.items ?? []).map((album: any) => ({
      name: album.name,
      artists: (album.artists ?? []).map((a: any) => a.name).join(', '),
      imageUrl: album.images?.[0]?.url ?? '',
      year: (album.release_date ?? '').slice(0, 4),
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
