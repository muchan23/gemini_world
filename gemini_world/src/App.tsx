import { useCallback, useEffect, useMemo, useState } from 'react';
import GameContainer from './ui/components/GameContainer';
import MiniGameModal from './ui/components/MiniGameModal';
import type { MiniGameResult } from './ui/components/MiniGameModal';
import UIOverlay from './ui/components/UIOverlay';
import './index.css';

interface ZoneData {
  zoneId: string;
  zoneName: string;
}

interface MiniGameSession {
  zone: ZoneData;
  launchUrl: string;
}

function buildMiniGameUrl(zone: ZoneData): string {
  const baseUrl = import.meta.env.VITE_MINIGAME_URL ?? 'http://localhost:5174';
  const url = new URL(baseUrl);
  url.searchParams.set('zoneId', zone.zoneId);
  url.searchParams.set('zoneName', zone.zoneName);
  return url.toString();
}

function App() {
  const [currentZone, setCurrentZone] = useState<ZoneData | null>(null);
  const [miniGameSession, setMiniGameSession] = useState<MiniGameSession | null>(null);
  const [lastResult, setLastResult] = useState<MiniGameResult | null>(null);
  const [zoneEntryArmed, setZoneEntryArmed] = useState(true);

  const isMiniGameOpen = miniGameSession !== null;

  const openMiniGameForZone = useCallback((zone: ZoneData) => {
    if (isMiniGameOpen) return;
    setMiniGameSession({
      zone,
      launchUrl: buildMiniGameUrl(zone),
    });
    window.dispatchEvent(new CustomEvent('world-minigame-open'));
  }, [isMiniGameOpen]);

  useEffect(() => {
    const handleEnter = (e: Event) => {
      const customEvent = e as CustomEvent<ZoneData>;
      const zone = customEvent.detail;
      setCurrentZone(zone);
      if (zoneEntryArmed && !isMiniGameOpen) {
        openMiniGameForZone(zone);
        setZoneEntryArmed(false);
      }
    };

    const handleLeave = () => {
      setCurrentZone(null);
      setZoneEntryArmed(true);
    };

    window.addEventListener('overworld-zone-enter', handleEnter);
    window.addEventListener('overworld-zone-leave', handleLeave);

    return () => {
      window.removeEventListener('overworld-zone-enter', handleEnter);
      window.removeEventListener('overworld-zone-leave', handleLeave);
    };
  }, [isMiniGameOpen, openMiniGameForZone, zoneEntryArmed]);

  const openMiniGame = useCallback(() => {
    if (!currentZone || isMiniGameOpen) return;
    openMiniGameForZone(currentZone);
    setZoneEntryArmed(false);
  }, [currentZone, isMiniGameOpen, openMiniGameForZone]);

  const closeMiniGame = useCallback((result?: MiniGameResult) => {
    setMiniGameSession(null);
    setLastResult(result ?? null);
    window.dispatchEvent(new CustomEvent('world-minigame-close'));
  }, []);

  useEffect(() => {
    if (!currentZone || isMiniGameOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return;
      event.preventDefault();
      openMiniGame();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentZone, isMiniGameOpen, openMiniGame]);

  useEffect(() => {
    if (!lastResult) return;
    const timer = window.setTimeout(() => setLastResult(null), 4500);
    return () => window.clearTimeout(timer);
  }, [lastResult]);

  const overlayStatus = useMemo(() => {
    if (!lastResult) return null;
    return `${lastResult.result.toUpperCase()}${typeof lastResult.score === 'number' ? ` · Score ${lastResult.score}` : ''}${lastResult.reward ? ` · Reward ${lastResult.reward}` : ''}`;
  }, [lastResult]);

  return (
    <div className="app-container">
      <GameContainer />
      <UIOverlay currentZone={currentZone} isMiniGameOpen={isMiniGameOpen} lastResultText={overlayStatus} />
      {miniGameSession && (
        <MiniGameModal
          key={`${miniGameSession.zone.zoneId}-${miniGameSession.launchUrl}`}
          zone={miniGameSession.zone}
          launchUrl={miniGameSession.launchUrl}
          onClose={closeMiniGame}
        />
      )}
    </div>
  );
}

export default App;
