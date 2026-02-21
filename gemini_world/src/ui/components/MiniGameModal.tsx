import { useEffect, useMemo, useRef, useState } from 'react';

interface ZoneData {
  zoneId: string;
  zoneName: string;
}

export interface MiniGameResult {
  result: 'clear' | 'fail' | 'quit';
  score?: number;
  reward?: string;
}

interface MiniGameModalProps {
  zone: ZoneData;
  launchUrl: string;
  onClose: (result?: MiniGameResult) => void;
}

interface MiniGameMessage {
  type: string;
  payload?: MiniGameResult;
}

export default function MiniGameModal({ zone, launchUrl, onClose }: MiniGameModalProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  const targetOrigin = useMemo(() => new URL(launchUrl).origin, [launchUrl]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<MiniGameMessage>) => {
      if (event.origin !== targetOrigin) return;
      if (!event.data || typeof event.data.type !== 'string') return;

      if (event.data.type === 'MINIGAME_FINISH') {
        onClose(event.data.payload);
      }

      if (event.data.type === 'MINIGAME_CLOSE') {
        onClose({ result: 'quit' });
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose({ result: 'quit' });
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose, targetOrigin]);

  const postInitMessage = () => {
    if (!iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      {
        type: 'WORLD_INIT',
        payload: {
          zoneId: zone.zoneId,
          zoneName: zone.zoneName,
          startedAt: new Date().toISOString(),
        },
      },
      targetOrigin,
    );
  };

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 200,
      background: 'rgba(0, 0, 0, 0.72)',
      display: 'flex',
      alignItems: 'stretch',
      justifyContent: 'center',
      backdropFilter: 'blur(3px)',
    }}>
      <div style={{
        width: '100vw',
        height: '100vh',
        background: '#11141f',
        border: '0',
        borderRadius: 0,
        overflow: 'hidden',
        boxShadow: 'none',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          minHeight: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 14px',
          borderBottom: '1px solid rgba(255,255,255,0.15)',
          fontFamily: 'system-ui',
          color: '#fff',
          background: 'linear-gradient(180deg, #21273a 0%, #171c2b 100%)',
        }}>
          <div style={{ fontWeight: 700 }}>{zone.zoneName}</div>
          <button
            onClick={() => onClose({ result: 'quit' })}
            style={{
              border: '1px solid rgba(255,255,255,0.35)',
              background: '#2b3249',
              color: '#fff',
              borderRadius: 8,
              padding: '6px 10px',
              cursor: 'pointer',
            }}
          >
            Exit [ESC]
          </button>
        </div>

        <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
          {!loaded && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              color: '#aeb4cb',
              fontFamily: 'system-ui',
              background: '#0e1220',
            }}>
              Mini game loading...
            </div>
          )}
          <iframe
            ref={iframeRef}
            title={`mini-game-${zone.zoneId}`}
            src={launchUrl}
            onLoad={() => {
              setLoaded(true);
              postInitMessage();
            }}
            style={{
              width: '100%',
              height: '100%',
              border: 0,
              background: '#0e1220',
              overflow: 'auto',
            }}
            allow="fullscreen"
          />
        </div>
      </div>
    </div>
  );
}
