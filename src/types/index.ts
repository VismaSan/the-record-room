export interface Record {
  id: string
  artist: string
  title: string
  year?: number
  genre?: string
  owned: boolean
  priority?: boolean
  img?: string
  created_at?: string
}

export interface SpotifyAlbum {
  name: string
  artists: string
  imageUrl: string
  year: string
}
