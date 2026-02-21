import Phaser from 'phaser';

export default class OverworldScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: {
        up: Phaser.Input.Keyboard.Key;
        down: Phaser.Input.Keyboard.Key;
        left: Phaser.Input.Keyboard.Key;
        right: Phaser.Input.Keyboard.Key;
    };

    constructor() {
        super('OverworldScene');
    }

    preload() {
        // Generate placeholder texture for the grid floor
        this.createPlaceholderTextures();
    }

    create() {
        console.log('[OverworldScene] create() called');
        // Set background color to a darker cyber-aesthetic tone
        this.cameras.main.setBackgroundColor('#1e1e24');

        // Create a 2000x2000 world bounds
        this.physics.world.setBounds(0, 0, 2000, 2000);

        // Add a simple tileSprite to act as the floor grid
        this.add.tileSprite(1000, 1000, 2000, 2000, 'floorGrid');


        // Create a simple player placeholder
        this.player = this.physics.add.sprite(1000, 1000, 'playerTemp');
        this.player.setCollideWorldBounds(true);

        // Draw the 5 main zones (must happen after player exists for overlap wiring)
        this.createZones();

        // Setup camera
        this.cameras.main.setBounds(0, 0, 2000, 2000);
        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);

        // Setup UI Layer and text
        const uiText = this.add.text(20, 20, 'The Gemini World: Overworld', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'system-ui'
        }).setScrollFactor(0); // Sticks to the camera UI layer

        // Setup input
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.wasd = this.input.keyboard.addKeys({
                up: Phaser.Input.Keyboard.KeyCodes.W,
                down: Phaser.Input.Keyboard.KeyCodes.S,
                left: Phaser.Input.Keyboard.KeyCodes.A,
                right: Phaser.Input.Keyboard.KeyCodes.D
            }) as any;
        }
    }

    update() {
        // Simple 8-way movement logic
        const speed = 300;
        this.player.setVelocity(0);

        // Ensure we have cursors available
        if (!this.cursors || !this.wasd) return;

        const isLeft = this.cursors.left.isDown || this.wasd.left.isDown;
        const isRight = this.cursors.right.isDown || this.wasd.right.isDown;
        const isUp = this.cursors.up.isDown || this.wasd.up.isDown;
        const isDown = this.cursors.down.isDown || this.wasd.down.isDown;

        if (isLeft) {
            this.player.setVelocityX(-speed);
            this.player.setRotation(Math.PI);
        } else if (isRight) {
            this.player.setVelocityX(speed);
            this.player.setRotation(0);
        }

        if (isUp) {
            this.player.setVelocityY(-speed);
            this.player.setRotation(-Math.PI / 2);
        } else if (isDown) {
            this.player.setVelocityY(speed);
            this.player.setRotation(Math.PI / 2);
        }

        // Normalize diagonal movement speed and set rotation
        if (this.player.body?.velocity.x !== 0 && this.player.body?.velocity.y !== 0) {
            this.player.body.velocity.normalize().scale(speed);

            // Fix diagonal rotations
            if (isUp && isRight) this.player.setRotation(-Math.PI / 4);
            if (isUp && isLeft) this.player.setRotation(-3 * Math.PI / 4);
            if (isDown && isRight) this.player.setRotation(Math.PI / 4);
            if (isDown && isLeft) this.player.setRotation(3 * Math.PI / 4);
        }

        this.checkZoneExit();
    }

    private checkZoneExit() {
        if (this.currentZone !== null) {
            // Find the specific trigger body the player was in
            const activeTriggers = this.triggerGroup.getChildren().filter((trigger: any) => trigger.zoneId === this.currentZone);

            let isStillOverlapping = false;
            for (const trigger of activeTriggers) {
                if (this.physics.overlap(this.player, trigger)) {
                    isStillOverlapping = true;
                    break;
                }
            }

            if (!isStillOverlapping) {
                this.currentZone = null;
                window.dispatchEvent(new CustomEvent('overworld-zone-leave'));
            }
        }
    }

    /**
     * Generates basic geometric textures in-memory so we don't
     * need external image files to start testing.
     */
    private createPlaceholderTextures() {
        const graphics = this.make.graphics({ x: 0, y: 0 });

        // 1. Floor grid tile
        graphics.lineStyle(2, 0x333333, 0.5);
        graphics.strokeRect(0, 0, 64, 64);
        graphics.generateTexture('floorGrid', 64, 64);
        graphics.clear();

        // 2. Player temporary sprite (Cyan Circle)
        graphics.fillStyle(0x00ffff, 1);
        graphics.fillCircle(16, 16, 16);
        // Draw a little directional indicator
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(16, 12, 16, 8);
        graphics.generateTexture('playerTemp', 32, 32);
        graphics.clear();
    }

    private currentZone: string | null = null;
    private triggerGroup!: Phaser.Physics.Arcade.Group;

    private createZones() {
        const graphics = this.add.graphics();
        const zones = [
            { id: 'battle_royale', name: 'Battle Royale', color: 0xff4444, x: 500, y: 500 },
            { id: 'appraisal', name: 'The Appraisal', color: 0x44ff44, x: 1500, y: 500 },
            { id: 'interrogation', name: 'The Interrogation', color: 0x4444ff, x: 1000, y: 1500 },
            { id: 'game4', name: 'Game 4', color: 0xffff44, x: 500, y: 1500 },
            { id: 'game5', name: 'Game 5', color: 0xff44ff, x: 1500, y: 1500 },
        ];

        this.triggerGroup = this.physics.add.group();

        zones.forEach(zone => {
            // Draw zone background
            graphics.fillStyle(zone.color, 0.2);
            graphics.lineStyle(4, zone.color, 0.8);
            graphics.fillRect(zone.x - 200, zone.y - 150, 400, 300);
            graphics.strokeRect(zone.x - 200, zone.y - 150, 400, 300);

            // Add a visual 'interaction pad' in front
            graphics.fillStyle(0xffffff, 0.5);
            graphics.fillCircle(zone.x, zone.y + 120, 30);

            // Create invisible physics body for the interaction pad
            const trigger = this.add.zone(zone.x, zone.y + 120, 80, 80);
            this.physics.add.existing(trigger);
            // @ts-ignore - store metadata on the trigger
            trigger.zoneId = zone.id;
            // @ts-ignore
            trigger.zoneName = zone.name;
            this.triggerGroup.add(trigger);

            // Add Zone Text
            this.add.text(zone.x, zone.y - 50, zone.name, {
                fontSize: '28px',
                color: '#ffffff',
                fontStyle: 'bold',
                fontFamily: 'system-ui'
            }).setOrigin(0.5);
        });

        // Add overlap detection between player and trigger zones
        this.physics.add.overlap(this.player, this.triggerGroup, (_player, trigger: any) => {
            console.log(`[OverworldScene] Overlap detected with trigger! Zone ID: ${trigger.zoneId}`);
            if (this.currentZone !== trigger.zoneId) {
                console.log(`[OverworldScene] Entering new zone: ${trigger.zoneId}`);
                this.currentZone = trigger.zoneId;
                // Dispatch a custom DOM event for React to pick up
                window.dispatchEvent(new CustomEvent('overworld-zone-enter', {
                    detail: { zoneId: trigger.zoneId, zoneName: trigger.zoneName }
                }));
            }
        });
    }
}
