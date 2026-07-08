type View = 'shelf' | 'wishlist'

interface HeaderProps {
  shelfCount: number
  wishCount: number
  view: View
  onViewChange: (view: View) => void
}

export function Header({ shelfCount, wishCount, view, onViewChange }: HeaderProps) {
  return (
    <header className="site-head">
      <div className="head-inner">
        <div className="brand">
          <span className="label">Vinyl &middot; est. for friends</span>
          <h1 className="poster">
            The Record
            <br />
            Room
          </h1>
        </div>
        <div className="head-right">
          <div className="counts">
            <div className="count">
              <span className="n poster">{shelfCount}</span>
              <span className="label">on the shelf</span>
            </div>
            <div className="count">
              <span className="n poster">{wishCount}</span>
              <span className="label">on the wishlist</span>
            </div>
          </div>
        </div>
      </div>
      <nav className="viewnav">
        <button className={'vbtn ' + (view === 'shelf' ? 'active' : '')} onClick={() => onViewChange('shelf')}>
          The Shelf
        </button>
        <button className={'vbtn ' + (view === 'wishlist' ? 'active' : '')} onClick={() => onViewChange('wishlist')}>
          The Wishlist
        </button>
      </nav>
    </header>
  )
}
