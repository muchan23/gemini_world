import Phaser from 'phaser';
import { GameConfig } from '../services/gemini';

export default class GameScene extends Phaser.Scene {
  private configData: GameConfig | null = null;
  private playerUnitsGroup!: Phaser.GameObjects.Group;
  private enemyUnitsGroup!: Phaser.GameObjects.Group;
  private towersGroup!: Phaser.GameObjects.Group;
  private projectilesGroup!: Phaser.GameObjects.Group;

  // Dynamic game state
  private playerScore = 0;
  private enemyScore = 0;
  private timerRemaining = 60;
  private gameOver = false;
  private waveCount = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;

  constructor() {
    super('GameScene');
  }

  init(data: { config: GameConfig }) {
    this.configData = data.config;
    // Reset all state on re-init
    this.playerScore = 0;
    this.enemyScore = 0;
    this.timerRemaining = 60;
    this.gameOver = false;
    this.waveCount = 0;
  }

  private isSportsMode(): boolean {
    return this.configData?.gameMode === 'sports-duel';
  }

  private drawArenaBase(width: number, height: number) {
    this.add.rectangle(width / 2, height / 2, width, height, 0x64b63e).setDepth(-20);

    const arenaImageUrl = this.configData?.arenaImageUrl;
    if (!arenaImageUrl) return;

    const arenaKey = 'arena_background_dynamic';
    const drawArenaImage = () => {
      if (!this.textures.exists(arenaKey)) return;
      this.add.image(width / 2, height / 2, arenaKey).setDisplaySize(width, height).setDepth(-10).setAlpha(0.95);
    };

    if (!this.textures.exists(arenaKey)) {
      this.textures.addBase64(arenaKey, arenaImageUrl);
      this.time.delayedCall(100, drawArenaImage);
    } else {
      drawArenaImage();
    }
  }

  private drawArenaOverlay(width: number, height: number) {
    if (this.isSportsMode()) {
      // Sports duel style court lines / net.
      this.add.rectangle(width / 2, height / 2, width - 30, height - 30, 0xffffff, 0).setStrokeStyle(6, 0xfafafa);
      this.add.line(width / 2, height / 2, 0, -height / 2 + 30, 0, height / 2 - 30, 0xffffff, 0.8).setLineWidth(4);
      this.add.rectangle(width / 2, height / 2, 6, height - 80, 0xf6f0d5, 0.85).setDepth(1); // net
      this.add.rectangle(width / 2, height * 0.25, width - 120, 2, 0xffffff, 0.8);
      this.add.rectangle(width / 2, height * 0.75, width - 120, 2, 0xffffff, 0.8);
    } else {
      // Lane battle style river/bridges.
      this.add.rectangle(width / 2, height / 2, width, 60, 0x4da6ff).setDepth(0);
      this.add.rectangle(width * 0.3, height / 2, 80, 70, 0x8b5a2b).setDepth(1);
      this.add.rectangle(width * 0.7, height / 2, 80, 70, 0x8b5a2b).setDepth(1);
    }

    this.add.rectangle(width / 2, height / 2, width - 20, height - 20, 0xffffff, 0).setStrokeStyle(8, 0x333333);
    this.add.text(width / 2, height / 2, this.configData?.theme || 'Arena', {
      fontSize: '48px',
      color: '#ffffff',
      fontFamily: 'Titan One',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setAlpha(0.2);
  }

  create() {
    if (!this.configData) return;

    const { width, height } = this.scale;

    // --- 1. Arena Generation ---
    this.drawArenaBase(width, height);
    this.drawArenaOverlay(width, height);

    // --- 2. Towers (Bases) ---
    this.towersGroup = this.add.group();

    if (this.isSportsMode()) {
      this.createTower(70, height / 2, true, 0x3388ff); // Player side base
      this.createTower(width - 70, height / 2, false, 0xff4444); // Enemy side base
    } else {
      this.createTower(width / 2, height - 80, true, 0x3388ff);
      this.createTower(width / 2, 80, false, 0xff4444);
    }

    // --- 3. Groups ---
    this.playerUnitsGroup = this.add.group();
    this.enemyUnitsGroup = this.add.group();
    this.projectilesGroup = this.add.group();

    // --- Preload Dynamic Assets ---
    if (this.configData) {
      this.configData.playerUnits.forEach((unit, index) => {
        if (unit.imageUrl) {
          const key = `player_unit_${index}`;
          this.textures.addBase64(key, unit.imageUrl);
          unit.textureKey = key;
        }
      });
      this.configData.enemyUnits.forEach((unit, index) => {
        if (unit.imageUrl) {
          const key = `enemy_unit_${index}`;
          this.textures.addBase64(key, unit.imageUrl);
          unit.textureKey = key;
        }
      });
    }

    // --- 4. Spawn Pattern & Win Condition ---
    this.setupSpawnPattern();
    this.setupWinCondition();

    // --- 5. In-Game UI (Spawn Buttons) ---
    const bottomY = height - 50;
    const buttonWidth = 80;
    const gap = 20;
    const totalWidth = this.configData.playerUnits.length * (buttonWidth + gap) - gap;
    const startX = (width - totalWidth) / 2 + buttonWidth / 2;

    this.configData.playerUnits.forEach((unit, index) => {
      const x = startX + index * (buttonWidth + gap);

      const btn = this.add.container(x, bottomY);

      const bg = this.add.rectangle(0, 0, buttonWidth, 60, 0xeeeeee)
        .setStrokeStyle(4, 0x000000)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.tweens.add({
            targets: btn,
            y: bottomY + 5,
            duration: 50,
            yoyo: true
          });
          this.spawnPlayerUnit(unit);
        });

      let icon;
      if (unit.textureKey && this.textures.exists(unit.textureKey)) {
        icon = this.add.sprite(0, -10, unit.textureKey).setDisplaySize(30, 30);
      } else {
        icon = this.add.circle(0, -10, 15, parseInt(unit.color.replace('#', '0x')) || 0x00ff00);
      }

      const costBg = this.add.circle(25, -25, 12, 0xffce44).setStrokeStyle(2, 0x000000);
      const costText = this.add.text(25, -25, unit.cost.toString(), {
        fontSize: '14px',
        color: '#000000',
        fontFamily: 'Titan One'
      }).setOrigin(0.5);

      const name = this.add.text(0, 15, unit.name.substring(0, 8), {
        fontSize: '10px',
        color: '#000000',
        fontFamily: 'Nunito',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      btn.add([bg, icon, name, costBg, costText]);
    });
  }

  // ─── Spawn Pattern ────────────────────────────────────────────────────────

  private setupSpawnPattern() {
    const pattern = this.configData?.spawnPattern || "steady";
    const difficulty = this.configData?.waveDifficulty || 1;

    if (pattern === "steady") {
      this.time.addEvent({
        delay: 4000 / difficulty,
        callback: () => { if (!this.gameOver) this.spawnEnemyUnit(); },
        loop: true
      });
    } else if (pattern === "waves") {
      this.time.addEvent({
        delay: 8000,
        callback: () => {
          if (this.gameOver) return;
          this.waveCount++;
          const count = 3 + Math.floor(Math.random() * 3); // 3–5 units
          for (let i = 0; i < count; i++) {
            this.time.delayedCall(i * 300, () => {
              if (!this.gameOver) this.spawnEnemyUnit();
            });
          }
        },
        loop: true
      });
    } else if (pattern === "boss_rush") {
      this.time.addEvent({
        delay: 6000 / difficulty,
        callback: () => {
          if (this.gameOver) return;
          this.waveCount++;
          this.spawnEnemyUnit();
          if (this.waveCount % 4 === 0) {
            this.time.delayedCall(500, () => {
              if (!this.gameOver) this.spawnBossUnit();
            });
          }
        },
        loop: true
      });
    }
  }

  // ─── Win Condition ────────────────────────────────────────────────────────

  private setupWinCondition() {
    const winCond = this.configData?.winCondition || "destroy_base";
    const { width } = this.scale;

    if (winCond === "score_race") {
      this.scoreText = this.add.text(width / 2, 30, `${this.playerScore} — ${this.enemyScore}`, {
        fontSize: '28px',
        color: '#ffffff',
        fontFamily: 'Titan One',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5).setDepth(10);
    } else if (winCond === "survival") {
      this.timerRemaining = this.configData?.timerSeconds || 60;
      this.timerText = this.add.text(width / 2, 30, `${this.timerRemaining}s`, {
        fontSize: '28px',
        color: '#ffce44',
        fontFamily: 'Titan One',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5).setDepth(10);

      this.time.addEvent({
        delay: 1000,
        callback: () => {
          if (this.gameOver) return;
          this.timerRemaining--;
          if (this.timerText) this.timerText.setText(`${this.timerRemaining}s`);
          if (this.timerRemaining <= 0) {
            this.triggerGameOver("player"); // Player survived!
          }
        },
        loop: true
      });
    }
  }

  // ─── Game Over ────────────────────────────────────────────────────────────

  private triggerGameOver(winner: "player" | "enemy") {
    if (this.gameOver) return;
    this.gameOver = true;

    // Stop all units
    [...this.playerUnitsGroup.getChildren(), ...this.enemyUnitsGroup.getChildren()].forEach((child) => {
      const body = (child as Phaser.GameObjects.Container).body as Phaser.Physics.Arcade.Body;
      if (body) body.setVelocity(0, 0);
    });

    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6).setDepth(20);

    const winnerText = winner === "player" ? "YOU WIN!" : "ENEMY WINS!";
    const winColor = winner === "player" ? '#ffce44' : '#ff4444';

    this.add.text(width / 2, height / 2 - 40, winnerText, {
      fontSize: '64px',
      color: winColor,
      fontFamily: 'Titan One',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5).setDepth(21);

    if (this.configData?.winCondition === "score_race") {
      this.add.text(width / 2, height / 2 + 40, `${this.playerScore} — ${this.enemyScore}`, {
        fontSize: '36px',
        color: '#ffffff',
        fontFamily: 'Titan One',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5).setDepth(21);
    }
  }

  // ─── Boss ─────────────────────────────────────────────────────────────────

  private spawnBossUnit() {
    if (!this.configData) return;
    const { width, height } = this.scale;
    const baseData = this.configData.enemyUnits[Math.floor(Math.random() * this.configData.enemyUnits.length)];
    const bossData = {
      ...baseData,
      name: `BOSS ${baseData.name}`,
      hp: baseData.hp * 5,
      speed: baseData.speed * 0.75,
    };
    const sports = this.isSportsMode();
    const startX = sports ? width - 110 : width / 2 + (Math.random() * 100 - 50);
    const startY = sports ? height / 2 + (Math.random() * 180 - 90) : 120;
    this.createUnit(startX, startY, bossData, false, true);
  }

  // ─── Ranged Ability ───────────────────────────────────────────────────────

  private setupRangedUnit(container: Phaser.GameObjects.Container, isPlayer: boolean) {
    this.time.addEvent({
      delay: 1500,
      callback: () => {
        if (this.gameOver || !container.active) return;
        this.findTargetAndFire(container, isPlayer);
      },
      loop: true
    });
  }

  private findTargetAndFire(shooter: Phaser.GameObjects.Container, isPlayer: boolean) {
    const targets = isPlayer ? this.enemyUnitsGroup.getChildren() : this.playerUnitsGroup.getChildren();

    let closestTarget: Phaser.GameObjects.GameObject | null = null;
    let closestDist = Infinity;

    targets.forEach((t) => {
      const go = t as any;
      const dist = Phaser.Math.Distance.Between(shooter.x, shooter.y, go.x, go.y);
      if (dist < closestDist) {
        closestDist = dist;
        closestTarget = t;
      }
    });

    // Fall back to enemy tower if no units
    if (!closestTarget) {
      this.towersGroup.getChildren().forEach((t) => {
        if (t.getData('isPlayer') !== isPlayer) {
          const go = t as any;
          const dist = Phaser.Math.Distance.Between(shooter.x, shooter.y, go.x, go.y);
          if (dist < closestDist) {
            closestDist = dist;
            closestTarget = t;
          }
        }
      });
    }

    if (closestTarget) {
      const target = closestTarget as any;
      this.fireProjectile(shooter.x, shooter.y, target.x, target.y, isPlayer, 20);
    }
  }

  private fireProjectile(fromX: number, fromY: number, toX: number, toY: number, isPlayer: boolean, damage: number) {
    const color = isPlayer ? 0x3388ff : 0xff4444;
    const proj = this.add.circle(fromX, fromY, 6, color).setStrokeStyle(2, 0xffffff);
    this.physics.add.existing(proj);
    const body = proj.body as Phaser.Physics.Arcade.Body;

    const angle = Math.atan2(toY - fromY, toX - fromX);
    const speed = 250;
    body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    proj.setData('isPlayer', isPlayer);
    proj.setData('damage', damage);

    this.projectilesGroup.add(proj);

    this.time.delayedCall(2000, () => {
      if (proj.active) proj.destroy();
    });
  }

  private applyProjectileDamage(defender: Phaser.GameObjects.Container, dmg: number) {
    const ability = defender.getData('ability');
    const hp = defender.getData('hp');
    const maxHp = defender.getData('maxHp');

    let actualDmg = dmg;
    if (ability === 'shield' && hp < maxHp * 0.5) {
      actualDmg = Math.floor(dmg / 2);
      const ring = defender.getData('shieldRing');
      if (ring) {
        ring.setVisible(true);
        this.time.delayedCall(500, () => { if (ring.active) ring.setVisible(false); });
      }
    }

    const newHp = hp - actualDmg;
    defender.setData('hp', newHp);

    const hpBar = defender.getData('hpBar') as Phaser.GameObjects.Rectangle;
    if (hpBar) hpBar.scaleX = Math.max(0, newHp / maxHp);

    if (newHp <= 0) {
      if (defender.getData('isTower')) {
        const defIsPlayer = defender.getData('isPlayer');
        this.triggerGameOver(defIsPlayer ? "enemy" : "player");
      } else {
        defender.destroy();
      }
    }
  }

  private updateScoreDisplay() {
    if (this.scoreText) {
      this.scoreText.setText(`${this.playerScore} — ${this.enemyScore}`);
    }
  }

  // ─── Tower ────────────────────────────────────────────────────────────────

  createTower(x: number, y: number, isPlayer: boolean, color: number) {
    const tower = this.add.container(x, y);

    const base = this.add.rectangle(0, 0, 60, 60, color).setStrokeStyle(4, 0x000000);
    const roof = this.add.triangle(0, -40, -35, 0, 35, 0, color).setStrokeStyle(4, 0x000000);

    const hpBg = this.add.rectangle(0, -50, 50, 8, 0x000000);
    const hp = this.add.rectangle(0, -50, 48, 6, 0x00ff00);

    tower.add([base, roof, hpBg, hp]);
    tower.setSize(60, 60);
    this.physics.add.existing(tower, true); // Static body

    tower.setData('hp', 2000);
    tower.setData('maxHp', 2000);
    tower.setData('isPlayer', isPlayer);
    tower.setData('hpBar', hp);
    tower.setData('isTower', true);

    this.towersGroup.add(tower);
    return tower;
  }

  // ─── Unit Spawn ───────────────────────────────────────────────────────────

  spawnPlayerUnit(unitData: any) {
    if (this.gameOver) return;
    const { width, height } = this.scale;
    const sports = this.isSportsMode();
    const startX = sports ? 110 : width / 2 + (Math.random() * 100 - 50);
    const startY = sports ? height / 2 + (Math.random() * 180 - 90) : height - 120;
    this.createUnit(startX, startY, unitData, true);
  }

  spawnEnemyUnit() {
    if (!this.configData) return;
    const { width, height } = this.scale;
    const enemyData = this.configData.enemyUnits[Math.floor(Math.random() * this.configData.enemyUnits.length)];
    const sports = this.isSportsMode();
    const startX = sports ? width - 110 : width / 2 + (Math.random() * 100 - 50);
    const startY = sports ? height / 2 + (Math.random() * 180 - 90) : 120;
    this.createUnit(startX, startY, enemyData, false);
  }

  // ─── Create Unit ──────────────────────────────────────────────────────────

  createUnit(x: number, y: number, data: any, isPlayer: boolean, isBoss = false) {
    const color = parseInt(data.color.replace('#', '0x')) || (isPlayer ? 0x00ff00 : 0xff0000);

    const container = this.add.container(x, y);

    const shadow = this.add.ellipse(0, 20, 24, 12, 0x000000, 0.3);

    let body;
    if (data.textureKey && this.textures.exists(data.textureKey)) {
      body = this.add.sprite(0, 0, data.textureKey);
      body.setDisplaySize(40, 40);
    } else {
      body = this.add.circle(0, 0, 15, color).setStrokeStyle(2, 0x000000);
    }

    const nameText = this.add.text(0, -30, data.name, {
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      fontFamily: 'Nunito'
    }).setOrigin(0.5);

    const hpBg = this.add.rectangle(0, -15, 30, 6, 0x000000);
    const hpBar = this.add.rectangle(-14, -15, 28, 4, isPlayer ? 0x66ff66 : 0xff6666).setOrigin(0, 0.5);

    container.add([shadow, body, nameText, hpBg, hpBar]);
    container.setSize(30, 30);

    this.physics.add.existing(container);
    const rb = container.body as Phaser.Physics.Arcade.Body;
    rb.setCircle(15);

    // Velocity
    let vx = 0, vy = 0;
    if (this.isSportsMode()) {
      vx = data.speed * (isPlayer ? 1 : -1) * 20;
      vy = (Math.random() * 20) - 10;
    } else {
      vy = data.speed * (isPlayer ? -1 : 1) * 20;
    }
    rb.setVelocity(vx, vy);

    // Store stats
    container.setData('hp', data.hp);
    container.setData('maxHp', data.hp);
    container.setData('damage', 10);
    container.setData('isPlayer', isPlayer);
    container.setData('hpBar', hpBar);
    container.setData('origVx', vx);
    container.setData('origVy', vy);
    container.setData('ability', data.ability || 'none');

    // Ability initialization
    const ability: string = data.ability || 'none';
    if (ability === 'shield') {
      const ring = this.add.circle(0, 0, 22, 0x3399ff, 0).setStrokeStyle(3, 0x3399ff).setVisible(false);
      container.add(ring);
      container.setData('shieldRing', ring);
    } else if (ability === 'ranged') {
      this.setupRangedUnit(container, isPlayer);
    }

    if (isBoss) container.setScale(2);

    if (isPlayer) this.playerUnitsGroup.add(container);
    else this.enemyUnitsGroup.add(container);
  }

  // ─── Combat ───────────────────────────────────────────────────────────────

  handleCombat(attacker: Phaser.GameObjects.Container, defender: Phaser.GameObjects.Container) {
    const winCond = this.configData?.winCondition || "destroy_base";
    const isTower = defender.getData('isTower') === true;

    // score_race: unit touching tower scores a point; no HP damage to tower
    if (winCond === "score_race" && isTower) {
      const defIsPlayer = defender.getData('isPlayer');
      if (!defIsPlayer) {
        this.playerScore++;
      } else {
        this.enemyScore++;
      }
      this.updateScoreDisplay();
      attacker.destroy();

      const targetScore = this.configData?.targetScore || 5;
      if (this.playerScore >= targetScore) this.triggerGameOver("player");
      else if (this.enemyScore >= targetScore) this.triggerGameOver("enemy");
      return;
    }

    // Probabilistic tick to slow down damage
    if (Math.random() > 0.1) return;

    const dmg = attacker.getData('damage') || 5;
    let actualDmg = dmg;

    // Shield ability: halve damage when HP < 50%
    const defAbility = defender.getData('ability');
    const defHp = defender.getData('hp');
    const defMaxHp = defender.getData('maxHp');
    if (defAbility === 'shield' && defHp < defMaxHp * 0.5) {
      actualDmg = Math.floor(dmg / 2);
      const ring = defender.getData('shieldRing');
      if (ring) {
        ring.setVisible(true);
        this.time.delayedCall(500, () => { if (ring && ring.active) ring.setVisible(false); });
      }
    }

    const currentHp = defHp - actualDmg;
    defender.setData('hp', currentHp);

    const hpBar = defender.getData('hpBar') as Phaser.GameObjects.Rectangle;
    if (hpBar) {
      hpBar.scaleX = Math.max(0, currentHp / defMaxHp);
    }

    this.tweens.add({
      targets: defender,
      alpha: 0.5,
      duration: 50,
      yoyo: true
    });

    if (currentHp <= 0) {
      if (isTower) {
        const defIsPlayer = defender.getData('isPlayer');
        this.triggerGameOver(defIsPlayer ? "enemy" : "player");
      } else {
        defender.destroy();
      }
    }
  }

  // ─── Game Loop ────────────────────────────────────────────────────────────

  update() {
    if (this.gameOver) return;

    // Unit vs unit combat
    this.physics.overlap(this.playerUnitsGroup, this.enemyUnitsGroup, (p, e) => {
      this.handleCombat(p as any, e as any);
    });

    // Units attacking towers
    this.physics.overlap(this.playerUnitsGroup, this.towersGroup, (unit, tower) => {
      if (!tower.getData('isPlayer')) this.handleCombat(unit as any, tower as any);
    });

    this.physics.overlap(this.enemyUnitsGroup, this.towersGroup, (unit, tower) => {
      if (tower.getData('isPlayer')) this.handleCombat(unit as any, tower as any);
    });

    // Projectiles vs enemy units
    this.physics.overlap(this.projectilesGroup, this.enemyUnitsGroup, (proj, unit) => {
      if ((proj as Phaser.GameObjects.Arc).getData('isPlayer')) {
        this.applyProjectileDamage(unit as any, (proj as Phaser.GameObjects.Arc).getData('damage') || 20);
        (proj as Phaser.GameObjects.Arc).destroy();
      }
    });

    // Projectiles vs player units
    this.physics.overlap(this.projectilesGroup, this.playerUnitsGroup, (proj, unit) => {
      if (!(proj as Phaser.GameObjects.Arc).getData('isPlayer')) {
        this.applyProjectileDamage(unit as any, (proj as Phaser.GameObjects.Arc).getData('damage') || 20);
        (proj as Phaser.GameObjects.Arc).destroy();
      }
    });

    // Projectiles vs towers
    this.physics.overlap(this.projectilesGroup, this.towersGroup, (proj, tower) => {
      const p = proj as Phaser.GameObjects.Arc;
      const towerIsPlayer = (tower as any).getData('isPlayer');
      const projIsPlayer = p.getData('isPlayer');
      if (projIsPlayer !== towerIsPlayer) {
        this.applyProjectileDamage(tower as any, p.getData('damage') || 20);
        p.destroy();
      }
    });

    // Per-unit ability updates
    const handleRangedMovement = (unit: any, isPlayer: boolean) => {
      if (unit.getData('ability') !== 'ranged') return;
      const targets = isPlayer ? this.enemyUnitsGroup.getChildren() : this.playerUnitsGroup.getChildren();
      let nearbyEnemy = false;
      for (const t of targets) {
        const go = t as any;
        if (Phaser.Math.Distance.Between(unit.x, unit.y, go.x, go.y) <= 150) {
          nearbyEnemy = true;
          break;
        }
      }
      const body = unit.body as Phaser.Physics.Arcade.Body;
      if (nearbyEnemy) {
        body.setVelocity(0, 0);
      } else {
        body.setVelocity(unit.getData('origVx'), unit.getData('origVy'));
      }
    };

    const handleSpeedBurst = (unit: any, isPlayer: boolean) => {
      if (unit.getData('ability') !== 'speed_burst') return;
      if (unit.getData('bursting')) return;
      const targets = isPlayer ? this.enemyUnitsGroup.getChildren() : this.playerUnitsGroup.getChildren();
      for (const t of targets) {
        const go = t as any;
        if (Phaser.Math.Distance.Between(unit.x, unit.y, go.x, go.y) <= 40) {
          unit.setData('bursting', true);
          const body = unit.body as Phaser.Physics.Arcade.Body;
          const origVx = unit.getData('origVx');
          const origVy = unit.getData('origVy');
          body.setVelocity(origVx * 2, origVy * 2);
          this.time.delayedCall(1500, () => {
            if (unit.active) {
              body.setVelocity(origVx, origVy);
              unit.setData('bursting', false);
            }
          });
          break;
        }
      }
    };

    // Remove off-screen units + apply ability logic
    this.playerUnitsGroup.children.each((child: any) => {
      handleRangedMovement(child, true);
      handleSpeedBurst(child, true);
      if (this.isSportsMode()) {
        if (child.x > this.scale.width + 60 || child.y < -60 || child.y > this.scale.height + 60) child.destroy();
      } else if (child.y < -50) {
        child.destroy();
      }
      return true;
    });

    this.enemyUnitsGroup.children.each((child: any) => {
      handleRangedMovement(child, false);
      handleSpeedBurst(child, false);
      if (this.isSportsMode()) {
        if (child.x < -60 || child.y < -60 || child.y > this.scale.height + 60) child.destroy();
      } else if (child.y > this.scale.height + 50) {
        child.destroy();
      }
      return true;
    });
  }
}
