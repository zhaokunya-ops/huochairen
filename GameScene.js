import { CONFIG, gameState } from './config.js';
import { Player } from './Player.js';
import { Enemy } from './Enemy.js';
import { WeaponPickup } from './WeaponPickup.js';
import { HealthPickup } from './HealthPickup.js';
import { DamagePickup } from './DamagePickup.js';
import { VirtualJoystick } from './VirtualJoystick.js';
import { AttackButton } from './AttackButton.js';
import { AudioManager } from './AudioManager.js';
import { ComboSystem } from './ComboSystem.js';
import { AdModal } from './AdModal.js'; // 新增导入

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }
  
  create() {
    // 游戏状态（必须先初始化，因为后续逻辑会检查）
    this.gameOver = false;
    this.reviveModal = null; // 新增：复活弹窗
    
    // 保存奖励武器（在reset之前）
    const savedRewardWeapon = gameState.hasRewardWeapon ? gameState.rewardWeapon : null;
    const hadReward = gameState.hasRewardWeapon;
    
    // 重置当前局数据
    gameState.reset();
    
    // 恢复奖励武器
    if (hadReward && savedRewardWeapon) {
      gameState.hasRewardWeapon = true;
      gameState.rewardWeapon = savedRewardWeapon;
    }
    
    // 初始化音频管理器
    this.audioManager = new AudioManager(this);
    this.audioManager.init();
    this.audioManager.playBGM();
    
    // 随机选择背景（放大到世界尺寸）
    const randomArena = CONFIG.ARENAS[Phaser.Math.Between(0, CONFIG.ARENAS.length - 1)];
    const bg = this.add.image(CONFIG.WORLD_WIDTH / 2, CONFIG.WORLD_HEIGHT / 2, randomArena);
    bg.setDisplaySize(CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT);
    bg.setScrollFactor(1); // 背景跟随摄像机
    
    // 初始化闯关模式变量
    this.isStageMode = gameState.gameMode === CONFIG.GAME_MODE.STAGE;
    
    // 根据当前关卡计算难度倍数
    if (this.isStageMode) {
      // 每关增加5%难度，从第1关的1.0开始
      this.difficultyMultiplier = Math.min(
        1 + (gameState.currentStage - 1) * (CONFIG.STAGE_MODE.DIFFICULTY_INCREASE - 1),
        CONFIG.STAGE_MODE.MAX_DIFFICULTY
      );
    } else {
      this.difficultyMultiplier = 1;
    }
    
    this.currentBatchIndex = 0; // 当前批次索引
    this.totalBatchesInStage = 0; // 当前关卡总批次
    this.remainingEnemiesInBatch = 0; // 当前批次剩余敌人
    
    // 闯关模式显示
    if (this.isStageMode) {
      this.stageText = this.add.text(CONFIG.WIDTH / 2, 80, `第 ${gameState.currentStage} 关`, {
        fontSize: '56px',
        fontStyle: 'bold',
        color: '#ff6600',
        stroke: '#000000',
        strokeThickness: 5
      }).setOrigin(0.5);
      this.stageText.setDepth(1500);
      
      this.killCountText = this.add.text(CONFIG.WIDTH / 2, 140, '击杀: 0', {
        fontSize: '42px',
        fontStyle: 'bold',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5);
      this.killCountText.setDepth(1500);
    }
    
    // 创建玩家
    this.player = new Player(this, CONFIG.PLAYER.START_X, CONFIG.PLAYER.START_Y);
    
    // 创建左上角UI血条
    this.createPlayerUIHealthBar();
    
    // 创建敌人列表
    this.enemies = [];
    if (this.isStageMode) {
      // 闯关模式：根据关卡计算并生成第一批敌人
      this.startStage();
    } else {
      // 1V1模式：只有一个敌人
      const enemy = new Enemy(this, CONFIG.ENEMY.START_X, CONFIG.ENEMY.START_Y, this.difficultyMultiplier);
      this.enemies.push(enemy);
    }
    
    // 如果有奖励武器，给玩家装备
    if (gameState.hasRewardWeapon) {
      this.player.pickupWeapon(gameState.rewardWeapon);
      
      // 清除奖励状态（已使用）
      gameState.hasRewardWeapon = false;
      gameState.rewardWeapon = null;
      
      // 显示提示
      const rewardText = this.add.text(CONFIG.WIDTH / 2, 200, '🎁 获得奖励武器！', {
        fontSize: '48px',
        fontStyle: 'bold',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5);
      
      this.tweens.add({
        targets: rewardText,
        y: 150,
        alpha: 0,
        duration: 2000,
        ease: 'Power2',
        onComplete: () => rewardText.destroy()
      });
    }
    
    // 武器拾取物
    this.currentWeapon = null;
    
    // 设置武器生成定时器
    this.setupWeaponSpawner();
    
    // 创建回血道具系统
    this.healthPickup = new HealthPickup(this);
    this.healthPickup.start();
    
    // 创建伤害道具系统
    this.damagePickup = new DamagePickup(this);
    this.damagePickup.start();
    
    // 创建虚拟摇杆
    this.joystick = new VirtualJoystick(
      this,
      CONFIG.JOYSTICK.X,
      CONFIG.JOYSTICK.Y
    );
    
    // 创建攻击按钮
    this.attackButton = new AttackButton(
      this,
      CONFIG.ATTACK_BUTTON.X,
      CONFIG.ATTACK_BUTTON.Y,
      () => this.handleAttack()
    );
    
    // 创建连击显示
    this.comboText = this.add.text(CONFIG.WIDTH / 2, 220, '', {
      fontSize: '64px',
      fontStyle: 'bold',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5, 0.5);
    this.comboText.setDepth(1500);
    this.comboText.setVisible(false);
    
    // 设置摄像机跟随玩家
    this.cameras.main.setBounds(0, 0, CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    // 设置摄像机偏移，让玩家在屏幕中间偏下方（下方1/3处）
    this.cameras.main.setFollowOffset(0, -CONFIG.HEIGHT / 6);
    
    // 设置UI元素固定在摄像机上（不随摄像机移动）
    if (this.stageText) this.stageText.setScrollFactor(0);
    if (this.killCountText) this.killCountText.setScrollFactor(0);
    this.comboText.setScrollFactor(0);
    this.joystick.setScrollFactor(0);
    this.attackButton.setScrollFactor(0);
    
    // 创建连击系统
    this.comboSystem = new ComboSystem(this);
  }
  
  createPlayerUIHealthBar() {
    // 血条位置和尺寸
    const barX = 40;
    const barY = 40;
    const barWidth = 400;
    const barHeight = 30;
    
    // 血条标签
    this.playerHealthLabel = this.add.text(barX, barY - 30, '玩家血量', {
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0, 0.5);
    this.playerHealthLabel.setDepth(2000);
    this.playerHealthLabel.setScrollFactor(0);
    
    // 血条背景（黑色）
    this.playerUIHealthBg = this.add.rectangle(barX, barY, barWidth, barHeight, 0x000000);
    this.playerUIHealthBg.setOrigin(0, 0.5);
    this.playerUIHealthBg.setDepth(2000);
    this.playerUIHealthBg.setScrollFactor(0);
    
    // 血条边框（白色）
    const border = this.add.graphics();
    border.lineStyle(3, 0xffffff, 1);
    border.strokeRect(barX - 1.5, barY - barHeight / 2 - 1.5, barWidth + 3, barHeight + 3);
    border.setDepth(2001);
    border.setScrollFactor(0);
    this.playerUIHealthBorder = border;
    
    // 血条前景（红色到绿色渐变）
    this.playerUIHealthFg = this.add.rectangle(barX, barY, barWidth, barHeight, 0x00ff00);
    this.playerUIHealthFg.setOrigin(0, 0.5);
    this.playerUIHealthFg.setDepth(2002);
    this.playerUIHealthFg.setScrollFactor(0);
    
    // 血量文字
    this.playerHealthText = this.add.text(barX + barWidth / 2, barY, `${this.player.health}/${this.player.maxHealth}`, {
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5, 0.5);
    this.playerHealthText.setDepth(2003);
    this.playerHealthText.setScrollFactor(0);
    
    // 保存血条配置
    this.playerUIHealthConfig = {
      x: barX,
      y: barY,
      width: barWidth,
      height: barHeight
    };
  }
  
  updatePlayerUIHealthBar() {
    if (!this.playerUIHealthFg || !this.player) return;
    
    const healthPercent = Math.max(0, this.player.health / this.player.maxHealth);
    const currentWidth = this.playerUIHealthConfig.width * healthPercent;
    
    // 更新血条宽度
    this.playerUIHealthFg.width = currentWidth;
    
    // 根据血量百分比改变颜色
    let color;
    if (healthPercent > 0.6) {
      color = 0x00ff00; // 绿色
    } else if (healthPercent > 0.3) {
      color = 0xffff00; // 黄色
    } else {
      color = 0xff0000; // 红色
    }
    this.playerUIHealthFg.setFillStyle(color);
    
    // 更新血量文字
    this.playerHealthText.setText(`${Math.max(0, this.player.health)}/${this.player.maxHealth}`);
  }
  
  setupWeaponSpawner() {
    const spawnWeapon = () => {
      if (this.gameOver) return;
      
      // 如果当前有武器且未被拾取，先销毁
      if (this.currentWeapon && !this.currentWeapon.pickedUp) {
        this.currentWeapon.destroy();
      }
      
      // 随机生成一种武器
      const weapons = ['SWORD', 'BAT', 'HAMMER'];
      const randomWeapon = weapons[Phaser.Math.Between(0, weapons.length - 1)];
      
      this.currentWeapon = new WeaponPickup(this, randomWeapon);
      
      // 设置自动消失
      this.time.delayedCall(CONFIG.WEAPON_SPAWN.DESPAWN_TIME, () => {
        if (this.currentWeapon && !this.currentWeapon.pickedUp) {
          this.currentWeapon.destroy();
          this.currentWeapon = null;
        }
      });
      
      // 设置下一次生成
      const nextSpawnTime = Phaser.Math.Between(
        CONFIG.WEAPON_SPAWN.MIN_INTERVAL,
        CONFIG.WEAPON_SPAWN.MAX_INTERVAL
      );
      this.time.delayedCall(nextSpawnTime, spawnWeapon);
    };
    
    // 首次生成延迟
    this.time.delayedCall(3000, spawnWeapon);
  }
  
  handleAttack() {
    if (this.gameOver) return;
    
    this.player.attack();
  }
  
  // 新增：显示复活广告弹窗
showReviveAdModal() {
  if (this.reviveModal) return;
  
  this.reviveModal = new AdModal(
    this,
    () => {
      // 观看广告后复活
      this.revivePlayer();
      this.reviveModal = null;
    },
    () => {
      // 不观看广告，游戏结束
      this.reviveModal = null;
      this.endGame(false);
    }
  );
  
  // 修改复活弹窗内容
  const titleText = this.reviveModal.container.getChildren().find(child => 
    child.text === '🎁 获得奖励道具！'
  );
  if (titleText) {
    titleText.setText('💖 复活继续战斗！');
  }
  
  const descText = this.reviveModal.container.getChildren().find(child => 
    child.text && child.text.includes('观看广告后，游戏开局将随机获得一个强力武器！')
  );
  if (descText) {
    descText.setText('观看广告即可复活并获得500点生命值，继续当前战斗！');
  }
  
  const btnText = this.reviveModal.container.getChildren().find(child => 
    child.text === '📺 观看广告'
  );
  if (btnText) {
    btnText.setText('📺 观看广告复活');
  }
  
  // 隐藏武器图标
  const weaponIcons = this.reviveModal.container.getChildren().find(child => 
    child.type === 'Container' && child.list.length > 0 && child.list[0].texture.key.includes('weapon-')
  );
  if (weaponIcons) {
    weaponIcons.setVisible(false);
  }
  
  this.reviveModal.show();
}
  
  // 新增：复活玩家
  revivePlayer() {
    // 恢复玩家生命值
    this.player.health = CONFIG.REVIVE.HEALTH_AFTER_REVIVE;
    this.player.sprite.setVisible(true);
    this.player.canMove = true;
    this.player.isInvulnerable = true; // 短暂无敌
    
    // 更新血条
    this.updatePlayerUIHealthBar();
    
    // 播放复活音效
    this.audioManager.playSFX('revive');
    
    // 显示复活提示
    const reviveText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 100, '复活成功！', {
      fontSize: '64px',
      fontStyle: 'bold',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);
    reviveText.setDepth(2000);
    reviveText.setScrollFactor(0);
    
    this.tweens.add({
      targets: reviveText,
      y: CONFIG.HEIGHT / 2 - 200,
      alpha: 0,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => reviveText.destroy()
    });
    
    // 3秒后取消无敌状态并闪烁提示
    this.time.delayedCall(3000, () => {
      this.player.isInvulnerable = false;
      
      // 无敌状态结束提示
      const invulnEndText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 100, '无敌状态结束！', {
        fontSize: '48px',
        fontStyle: 'bold',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5);
      invulnEndText.setDepth(2000);
      invulnEndText.setScrollFactor(0);
      
      this.tweens.add({
        targets: invulnEndText,
        y: CONFIG.HEIGHT / 2 - 200,
        alpha: 0,
        duration: 2000,
        ease: 'Power2',
        onComplete: () => invulnEndText.destroy()
      });
    });
    
    // 标记已使用复活
    gameState.useRevive();
    
    // 继续游戏
    this.gameOver = false;
  }
  
  // 修改玩家死亡处理
  handlePlayerDeath() {
    this.audioManager.playSFX('death');
    this.player.canMove = false;
    this.player.sprite.setVisible(false);
    
    // 检查是否可以复活
    if (CONFIG.ADS.ENABLED && CONFIG.ADS.REVIVE_ENABLED && gameState.canRevive()) {
      this.showReviveAdModal();
    } else {
      // 不能复活，游戏结束
      this.time.delayedCall(1000, () => this.endGame(false));
    }
  }
  
  endGame(playerWon) {
    if (this.gameOver) return;
    
    this.gameOver = true;
    gameState.endGame(playerWon);
    
    // 播放相应音效
    if (playerWon) {
      this.audioManager.playSFX('victory');
    } else {
      this.audioManager.playSFX('defeat');
    }
    
    // 显示结果文字
    const resultText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 100, 
      playerWon ? '胜利！' : '失败！', {
      fontSize: '96px',
      fontStyle: 'bold',
      color: playerWon ? '#00ff00' : '#ff0000',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5);
    resultText.setDepth(2000);
    resultText.setScrollFactor(0);
    
    // 显示返回菜单按钮
    const menuBtn = this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 100, 400, 100, 0x3498db);
    menuBtn.setStrokeStyle(4, 0xffffff);
    menuBtn.setInteractive({ useHandCursor: true });
    menuBtn.setDepth(2000);
    menuBtn.setScrollFactor(0);
    
    const menuText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 100, '返回菜单', {
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    menuText.setDepth(2001);
    menuText.setScrollFactor(0);
    
    menuBtn.on('pointerover', () => {
      menuBtn.setFillStyle(0x2980b9);
    });
    
    menuBtn.on('pointerout', () => {
      menuBtn.setFillStyle(0x3498db);
    });
    
    menuBtn.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
    
    // 如果是闯关模式且胜利，显示下一关按钮
    if (this.isStageMode && playerWon) {
      const nextBtn = this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 250, 400, 100, 0x2ecc71);
      nextBtn.setStrokeStyle(4, 0xffffff);
      nextBtn.setInteractive({ useHandCursor: true });
      nextBtn.setDepth(2000);
      nextBtn.setScrollFactor(0);
      
      const nextText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 250, '下一关', {
        fontSize: '48px',
        fontStyle: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);
      nextText.setDepth(2001);
      nextText.setScrollFactor(0);
      
      nextBtn.on('pointerover', () => {
        nextBtn.setFillStyle(0x27ae60);
      });
      
      nextBtn.on('pointerout', () => {
        nextBtn.setFillStyle(0x2ecc71);
      });
      
      nextBtn.on('pointerdown', () => {
        gameState.currentStage++;
        this.scene.start('GameScene');
      });
    }
  }
  
  update(time, delta) {
    if (this.gameOver) return;
    
    // 更新玩家
    if (this.player && this.player.isAlive()) {
      this.player.update(this.joystick, delta);
      this.updatePlayerUIHealthBar();
    } else if (!this.gameOver) {
      this.handlePlayerDeath();
    }
    
    // 更新敌人
    this.enemies.forEach(enemy => {
      if (enemy.isAlive()) {
        enemy.update(this.player, delta);
      }
    });
    
    // 过滤掉已死亡的敌人
    this.enemies = this.enemies.filter(enemy => enemy.isAlive());
    
    // 更新连击系统
    this.comboSystem.update(delta);
    
    // 检查闯关模式胜利条件
    if (this.isStageMode && this.enemies.length === 0 && this.currentBatchIndex >= this.totalBatchesInStage) {
      this.endStage();
    }
  }
  
  startStage() {
    // 计算当前关卡的总敌人数：初始敌人 + (关卡数-1)*每关增加的敌人
    const totalEnemies = CONFIG.STAGE_MODE.INITIAL_ENEMIES + 
      (gameState.currentStage - 1) * CONFIG.STAGE_MODE.ENEMIES_INCREMENT;
    
    // 计算需要多少批次
    this.totalBatchesInStage = Math.ceil(totalEnemies / CONFIG.STAGE_MODE.MAX_BATCH_SIZE);
    
    // 生成第一批敌人
    this.spawnNextEnemyBatch();
  }
  
  spawnNextEnemyBatch() {
    if (this.currentBatchIndex >= this.totalBatchesInStage) return;
    
    // 计算当前批次的敌人数
    const remainingEnemies = CONFIG.STAGE_MODE.INITIAL_ENEMIES + 
      (gameState.currentStage - 1) * CONFIG.STAGE_MODE.ENEMIES_INCREMENT - 
      this.currentBatchIndex * CONFIG.STAGE_MODE.MAX_BATCH_SIZE;
      
    const enemiesInBatch = Math.min(remainingEnemies, CONFIG.STAGE_MODE.MAX_BATCH_SIZE);
    this.remainingEnemiesInBatch = enemiesInBatch;
    
    // 逐个生成敌人
    for (let i = 0; i < enemiesInBatch; i++) {
      this.time.delayedCall(i * CONFIG.STAGE_MODE.WAVE_SPAWN_INTERVAL, () => {
        // 随机生成位置（玩家周围）
        const spawnRange = 800;
        const spawnX = Phaser.Math.Clamp(
          this.player.x + Phaser.Math.Between(-spawnRange, spawnRange),
          500, 
          CONFIG.WORLD_WIDTH - 500
        );
        const spawnY = Phaser.Math.Clamp(
          this.player.y + Phaser.Math.Between(-spawnRange, spawnRange),
          CONFIG.PLAYABLE_Y_MIN, 
          CONFIG.PLAYABLE_Y_MAX
        );
        
        const enemy = new Enemy(this, spawnX, spawnY, this.difficultyMultiplier);
        this.enemies.push(enemy);
      });
    }
    
    this.currentBatchIndex++;
  }
  
  endStage() {
    // 恢复部分生命值
    const healthRestore = this.player.maxHealth * (CONFIG.STAGE_MODE.HEALTH_RESTORE_PERCENT / 100);
    this.player.health = Math.min(this.player.maxHealth, this.player.health + healthRestore);
    this.updatePlayerUIHealthBar();
    
    // 显示关卡完成提示
    const stageCompleteText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 200, 
      `第 ${gameState.currentStage} 关 完成！`, {
      fontSize: '72px',
      fontStyle: 'bold',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);
    stageCompleteText.setDepth(2000);
    stageCompleteText.setScrollFactor(0);
    
    // 短暂延迟后继续
    this.time.delayedCall(2000, () => {
      this.endGame(true);
    });
  }
}