interface ZoneData {
  zoneId: string;
  zoneName: string;
}

interface UIOverlayProps {
  currentZone: ZoneData | null;
  isMiniGameOpen: boolean;
  lastResultText: string | null;
}

export default function UIOverlay({ currentZone, isMiniGameOpen, lastResultText }: UIOverlayProps) {
  return (
    <>
      {currentZone && !isMiniGameOpen && (
        <div style={{
          position: 'absolute',
          bottom: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.82)',
          padding: '20px 40px',
          borderRadius: '50px',
          border: '2px solid #fff',
          color: 'white',
          fontFamily: 'system-ui',
          boxShadow: '0 0 20px rgba(255, 255, 255, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'none',
          zIndex: 100,
        }}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>{currentZone.zoneName}</h2>
          <p style={{ margin: 0, fontSize: '18px', color: '#aaa' }}>
            Entering mini game...
          </p>
        </div>
      )}

      {lastResultText && (
        <div style={{
          position: 'absolute',
          top: '6%',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(24, 24, 32, 0.92)',
          padding: '12px 20px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.35)',
          color: '#f8f8ff',
          fontFamily: 'system-ui',
          fontSize: '14px',
          letterSpacing: '0.03em',
          pointerEvents: 'none',
          zIndex: 101,
        }}>
          Mini Game Result: {lastResultText}
        </div>
      )}
    </>
  );
}
