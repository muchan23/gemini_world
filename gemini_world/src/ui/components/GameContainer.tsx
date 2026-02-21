import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { gameConfig } from '../../game/config';

export default function GameContainer() {
    const gameRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        if (!gameRef.current) {
            gameRef.current = new Phaser.Game({ ...gameConfig, parent: 'phaser-container' });
        }

        return () => {
            // Clean up the Phaser game instance when the component unmounts
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, []);

    return <div id="phaser-container" style={{ width: '100vw', height: '100vh', overflow: 'hidden' }} />;
}
