export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

export function MobileBlock() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        padding: '2rem',
        background: '#0f172a',
        color: '#e2e8f0',
        fontFamily: 'monospace',
        textAlign: 'center',
        gap: '1rem',
      }}
    >
      <div style={{ fontSize: '3rem' }}>🖥️</div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Desktop Required</h1>
      <p style={{ maxWidth: '24rem', lineHeight: 1.6, margin: 0, color: '#94a3b8' }}>
        ProjecTUI is a complex design tool that is not usable on mobile browsers.
        Please open it on a desktop or laptop computer.
      </p>
      <a
        href="/docs/"
        style={{
          marginTop: '0.5rem',
          padding: '0.5rem 1.25rem',
          background: '#38bdf8',
          color: '#0f172a',
          borderRadius: '0.375rem',
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
        }}
      >
        View Documentation
      </a>
    </div>
  );
}
