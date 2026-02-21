import { useEffect, useState } from 'react';

/**
 * Custom hook to listen for custom events emitted by the Phaser game instance.
 * @param eventName The name of the custom event to listen for
 */
export function usePhaserEvent<T>(eventName: string): T | null {
    const [eventData, setEventData] = useState<T | null>(null);

    useEffect(() => {
        const handleEvent = (event: Event) => {
            const customEvent = event as CustomEvent<T>;
            setEventData(customEvent.detail);
        };

        window.addEventListener(eventName, handleEvent);

        return () => {
            window.removeEventListener(eventName, handleEvent);
        };
    }, [eventName]);

    return eventData;
}
