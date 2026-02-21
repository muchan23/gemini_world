import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import GameScene from './GameScene';
import { GameConfig } from '../services/gemini';

interface PhaserContainerProps {
  config: GameConfig;
}

const PhaserContainer: React.FC<PhaserContainerProps> = ({ config }) => {
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gameRef.current) {
      const phaserConfig: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: gameRef.current,
        width: 800,
        height: 600,
        physics: {
          default: 'arcade',
          arcade: { debug: false }
        },
        scene: [GameScene]
      };

      const game = new Phaser.Game(phaserConfig);
      game.scene.start('GameScene', { config });

      return () => {
        game.destroy(true);
      };
    }
  }, [config]);

  return <div ref={gameRef} style={{ width: '800px', height: '600px', margin: '0 auto', borderRadius: '12px', overflow: 'hidden', border: '4px solid #333' }} />;
};

export default PhaserContainer;
