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
    private currentZone: string | null = null;
    private triggerGroup!: Phaser.Physics.Arcade.Group;
    private isControlLocked = false;
    private onMiniGameOpen = () => {
        this.isControlLocked = true;
        this.player.setVelocity(0, 0);
    };
    private onMiniGameClose = () => {
        this.isControlLocked = false;
    };

    constructor() {
        super('OverworldScene');
    }

    preload() {
        this.createPlaceholderTextures();
    }

    create() {
        console.log('[OverworldScene] create() called');
        this.cameras.main.setBackgroundColor('#1e1e24');
        this.physics.world.setBounds(0, 0, 2000, 2000);
        this.add.tileSprite(1000, 1000, 2000, 2000, 'floorGrid');

        this.player = this.physics.add.sprite(1000, 1000, 'playerTemp');
        this.player.setCollideWorldBounds(true);

        this.createZones();

        this.cameras.main.setBounds(0, 0, 2000, 2000);
        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);

        this.add.text(20, 20, 'The Gemini World: Overworld', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'system-ui'
        }).setScrollFactor(0);

        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.wasd = this.input.keyboard.addKeys({
                up: Phaser.Input.Keyboard.KeyCodes.W,
                down: Phaser.Input.Keyboard.KeyCodes.S,
                left: Phaser.Input.Keyboard.KeyCodes.A,
                right: Phaser.Input.Keyboard.KeyCodes.D
            }) as {
                up: Phaser.Input.Keyboard.Key;
                down: Phaser.Input.Keyboard.Key;
                left: Phaser.Input.Keyboard.Key;
                right: Phaser.Input.Keyboard.Key;
            };
        }

        window.addEventListener('world-minigame-open', this.onMiniGameOpen);
        window.addEventListener('world-minigame-close', this.onMiniGameClose);

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            window.removeEventListener('world-minigame-open', this.onMiniGameOpen);
            window.removeEventListener('world-minigame-close', this.onMiniGameClose);
        });
    }

    update() {
        const speed = 300;
        this.player.setVelocity(0);

        if (!this.cursors || !this.wasd || this.isControlLocked) return;

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

        const body = this.player.body as Phaser.Physics.Arcade.Body | null;
        if (body && body.velocity.x !== 0 && body.velocity.y !== 0) {
            body.velocity.normalize().scale(speed);

            if (isUp && isRight) this.player.setRotation(-Math.PI / 4);
            if (isUp && isLeft) this.player.setRotation(-3 * Math.PI / 4);
            if (isDown && isRight) this.player.setRotation(Math.PI / 4);
            if (isDown && isLeft) this.player.setRotation(3 * Math.PI / 4);
        }

        this.checkZoneExit();
    }

    private checkZoneExit() {
        if (this.currentZone !== null) {
            const activeTriggers = this.triggerGroup.getChildren().filter((trigger) => (trigger as Phaser.GameObjects.Zone & { zoneId?: string }).zoneId === this.currentZone);

            let isStillOverlapping = false;
            for (const trigger of activeTriggers) {
                if (this.physics.overlap(this.player, trigger as Phaser.GameObjects.GameObject)) {
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

    private createPlaceholderTextures() {
        const graphics = this.make.graphics({ x: 0, y: 0 });

        graphics.lineStyle(2, 0x333333, 0.5);
        graphics.strokeRect(0, 0, 64, 64);
        graphics.generateTexture('floorGrid', 64, 64);
        graphics.clear();

        graphics.fillStyle(0x00ffff, 1);
        graphics.fillCircle(16, 16, 16);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(16, 12, 16, 8);
        graphics.generateTexture('playerTemp', 32, 32);
        graphics.clear();
    }

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

        zones.forEach((zone) => {
            graphics.fillStyle(zone.color, 0.2);
            graphics.lineStyle(4, zone.color, 0.8);
            graphics.fillRect(zone.x - 200, zone.y - 150, 400, 300);
            graphics.strokeRect(zone.x - 200, zone.y - 150, 400, 300);

            graphics.fillStyle(0xffffff, 0.5);
            graphics.fillCircle(zone.x, zone.y + 120, 30);

            const trigger = this.add.zone(zone.x, zone.y, 400, 300);
            this.physics.add.existing(trigger);

            const typedTrigger = trigger as Phaser.GameObjects.Zone & {
                body: Phaser.Physics.Arcade.Body;
                zoneId: string;
                zoneName: string;
            };

            typedTrigger.zoneId = zone.id;
            typedTrigger.zoneName = zone.name;
            typedTrigger.body.setAllowGravity(false);
            typedTrigger.body.setImmovable(true);

            this.triggerGroup.add(typedTrigger);

            this.add.text(zone.x, zone.y - 50, zone.name, {
                fontSize: '28px',
                color: '#ffffff',
                fontStyle: 'bold',
                fontFamily: 'system-ui'
            }).setOrigin(0.5);
        });

        this.physics.add.overlap(this.player, this.triggerGroup, (_player, rawTrigger) => {
            const trigger = rawTrigger as Phaser.GameObjects.Zone & {
                zoneId: string;
                zoneName: string;
            };

            if (this.currentZone !== trigger.zoneId) {
                this.currentZone = trigger.zoneId;
                window.dispatchEvent(new CustomEvent('overworld-zone-enter', {
                    detail: { zoneId: trigger.zoneId, zoneName: trigger.zoneName }
                }));
            }
        });
    }
}
