import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="glass" style={{ position: 'sticky', top: 0, zIndex: 50, padding: '1rem 0' }}>
      <div className="container flex justify-between items-center">
        <Link href="/" style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🏠</span>
          NhaDat<span style={{ color: 'var(--accent-primary)' }}>Tracker</span>
        </Link>
        <div className="flex gap-4">
          <Link href="/" className="btn btn-secondary">
            Danh sách
          </Link>
          <Link href="/add" className="btn btn-primary">
            + Thêm Nhà Mới
          </Link>
        </div>
      </div>
    </nav>
  );
}
