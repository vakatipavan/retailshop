import LogoutButton from '@/components/LogoutButton';

export default function Header({ title }: { title: string }) {
  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
      paddingBottom: '1rem',
      borderBottom: '1px solid var(--border-color)',
      gap: '1rem',
    }}>
      <h1 style={{
        fontSize: 'clamp(1.25rem, 4vw, 1.875rem)',
        fontWeight: 600,
        color: 'var(--text-primary)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {title}
      </h1>

      {/* Desktop: show user info & logout. Mobile: hidden (shown in topbar) */}
      <div className="header-user-section" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontWeight: 500, margin: 0, fontSize: '0.9rem' }}>Admin User</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Owner</p>
        </div>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary-color)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          flexShrink: 0,
        }}>
          A
        </div>
        <LogoutButton />
      </div>

      <style>{`
        @media (max-width: 768px) {
          .header-user-section {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
