import { useEffect, useState } from 'react';
import { usePhaserEvent } from '../hooks/usePhaserEvent';

interface ZoneData {
    zoneId: string;
    zoneName: string;
}

export default function UIOverlay() {
    const activeZone = usePhaserEvent<ZoneData>('overworld-zone-enter');

    // Custom hook won't automatically clear the state when the leave event fires
    // We need to listen to the leave event specifically to clear it.
    // A cleaner way is to expand usePhaserEvent to handle this, but for the MVP, we can just do it here:

    const [currentZone, setCurrentZone] = useState<ZoneData | null>(null);

    useEffect(() => {
        const handleEnter = (e: Event) => {
            const customEvent = e as CustomEvent<ZoneData>;
            setCurrentZone(customEvent.detail);
        };

        const handleLeave = () => {
            setCurrentZone(null);
        };

        window.addEventListener('overworld-zone-enter', handleEnter);
        window.addEventListener('overworld-zone-leave', handleLeave);

        return () => {
            window.removeEventListener('overworld-zone-enter', handleEnter);
            window.removeEventListener('overworld-zone-leave', handleLeave);
        };
    }, []);

    if (!currentZone) return null;

    return (
        <div style={{
            position: 'absolute',
            bottom: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: '20px 40px',
            borderRadius: '50px',
            border: '2px solid #fff',
            color: 'white',
            fontFamily: 'system-ui',
            boxShadow: '0 0 20px rgba(255, 255, 255, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pointerEvents: 'none', // Allow clicking through the UI to the game
            zIndex: 100
        }}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>{currentZone.zoneName}</h2>
            <p style={{ margin: 0, fontSize: '18px', color: '#aaa' }}>Press <strong style={{ color: '#fff' }}>[SPACE]</strong> to Enter</p>
        </div>
    );
}
