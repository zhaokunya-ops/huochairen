import { Fighter } from './Fighter.js';
import { CONFIG, gameState } from './config.js';

export class Enemy extends Fighter {
  constructor(scene, x, y, difficultyMultiplier = 1) {
    super(scene, x, y, 'blue', CONFIG.ENEMY);
    
    // 应用难度倍数（用于连续对战模式）
    this.health = Math.floor(this.health * difficultyMultiplier);
    this.maxHealth = this.health;
    this.attackDamage = Math.floor(this.attackDamage * difficultyMultiplier);
    this.speed = Math.floor(this.speed * Math.min(difficultyMultiplier, 1.3)); // 速度增长有上限
    
    this.sprite.setFlipX(true); // 面向左边
    
    // AI 状态
    this.target = null;
    this.state = 'idle'; // idle, chase, attack, pickup
    this.targetWeapon = null;
    this.nextThinkTime = 0;
    this.thinkInterval = 200; // AI 决策间隔（毫秒）
    this.lastPosition = { x: x, y: y };
  }
  
  die() {
    super.die();
    
    // 更新击杀数（闯关模式）
    if (this.scene.isStageMode) {
      gameState.stageKills++;
      this.scene.updateKillCountDisplay();
      
      if (this.scene.killCountText) {
        this.scene.tweens.add({
          targets: this.scene.killCountText,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 200,
          yoyo: true,
          ease: 'Power2'
        });
      }
    }
  }
  
  update(player, weaponPickup, healthPickup, damagePickup) {
    if (this.isDead) return;
    
    const now = this.scene.time.now;
    
    // AI 决策
    if (now >= this.nextThinkTime) {
      this.think(player, weaponPickup, healthPickup, damagePickup);
      this.nextThinkTime = now + this.thinkInterval;
    }
    
    // 执行当前状态
    this.executeState(player, weaponPickup, healthPickup, damagePickup);
    
    // 检查是否在移动
    const isMoving = Math.abs(this.sprite.x - this.lastPosition.x) > 0.5 || 
                     Math.abs(this.sprite.y - this.lastPosition.y) > 0.5;
    this.lastPosition = { x: this.sprite.x, y: this.sprite.y };
    
    // 更新动画
    this.updateAnimation(isMoving);
    
    // 更新血条和武器位置
    this.updateHealthBar();
    this.updateWeaponPosition();
  }
  
  think(player, weaponPickup, healthPickup, damagePickup) {
    // 优先级1：血量低于40%时，优先去捡回血道具
    const healthPickupSprite = healthPickup?.getPickup();
    if (healthPickupSprite && this.health < this.maxHealth * 0.4) {
      const distanceToHealth = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y,
        healthPickupSprite.x, healthPickupSprite.y
      );
      
      if (distanceToHealth < 700) {
        this.state = 'pickup_health';
        this.targetPickup = healthPickupSprite;
        return;
      }
    }
    
    // 优先级2：伤害道具（提升战斗力）
    const damagePickupSprite = damagePickup?.getPickup();
    if (damagePickupSprite && !this.damageBoost) {
      const distanceToDamage = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y,
        damagePickupSprite.x, damagePickupSprite.y
      );
      
      if (distanceToDamage < 500) {
        this.state = 'pickup_damage';
        this.targetPickup = damagePickupSprite;
        return;
      }
    }
    
    // 优先级3：如果场上有武器且自己没武器，去捡武器
    if (weaponPickup && !weaponPickup.pickedUp && !this.weapon) {
      const distanceToWeapon = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y,
        weaponPickup.sprite.x, weaponPickup.sprite.y
      );
      
      // 如果武器离得不太远，优先去捡
      if (distanceToWeapon < 600) {
        this.state = 'pickup_weapon';
        this.targetWeapon = weaponPickup;
        return;
      }
    }
    
    // 优先级4：攻击玩家
    const distanceToPlayer = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y,
      player.sprite.x, player.sprite.y
    );
    
    const range = this.weapon ? this.weapon.range : this.attackRange;
    
    if (distanceToPlayer <= range) {
      this.state = 'attack';
    } else {
      this.state = 'chase';
    }
  }
  
  executeState(player, weaponPickup, healthPickup, damagePickup) {
    switch (this.state) {
      case 'chase':
        this.chasePlayer(player);
        break;
      case 'attack':
        this.attackPlayer(player);
        break;
      case 'pickup_weapon':
        this.pickupWeaponAI(weaponPickup, player);
        break;
      case 'pickup_health':
        this.pickupItemAI(this.targetPickup, 'health');
        break;
      case 'pickup_damage':
        this.pickupItemAI(this.targetPickup, 'damage');
        break;
    }
  }
  
  chasePlayer(player) {
    // 向玩家移动
    const angle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y,
      player.sprite.x, player.sprite.y
    );
    
    const velocityX = Math.cos(angle) * this.speed * (1 / 60);
    const velocityY = Math.sin(angle) * this.speed * (1 / 60);
    
    this.sprite.x += velocityX;
    this.sprite.y += velocityY;
    
    // 更新朝向
    if (velocityX < 0) {
      this.sprite.setFlipX(true);
    } else if (velocityX > 0) {
      this.sprite.setFlipX(false);
    }
    
    // 限制在世界边界内（仅下半部分可移动）
    const padding = 100;
    this.sprite.x = Phaser.Math.Clamp(this.sprite.x, padding, CONFIG.WORLD_WIDTH - padding);
    this.sprite.y = Phaser.Math.Clamp(this.sprite.y, CONFIG.PLAYABLE_Y_MIN, CONFIG.PLAYABLE_Y_MAX);
  }
  
  attackPlayer(player) {
    this.attack(player);
    
    // 攻击时稍微靠近一点
    const distance = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y,
      player.sprite.x, player.sprite.y
    );
    
    const range = this.weapon ? this.weapon.range : this.attackRange;
    
    if (distance > range * 0.8) {
      this.chasePlayer(player);
    }
  }
  
  pickupWeaponAI(weaponPickup, player) {
    if (!weaponPickup || weaponPickup.pickedUp) {
      this.state = 'chase';
      return;
    }
    
    // 向武器移动
    const angle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y,
      weaponPickup.sprite.x, weaponPickup.sprite.y
    );
    
    const velocityX = Math.cos(angle) * this.speed * 1.2 * (1 / 60); // 加速捡武器
    const velocityY = Math.sin(angle) * this.speed * 1.2 * (1 / 60);
    
    this.sprite.x += velocityX;
    this.sprite.y += velocityY;
    
    // 更新朝向
    if (velocityX < 0) {
      this.sprite.setFlipX(true);
    } else if (velocityX > 0) {
      this.sprite.setFlipX(false);
    }
    
    // 检查是否捡到武器
    const distance = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y,
      weaponPickup.sprite.x, weaponPickup.sprite.y
    );
    
    if (distance < 80) {
      // 捡起武器
      this.pickupWeapon(weaponPickup.weaponData);
      weaponPickup.destroy();
      this.state = 'chase';
    }
  }
  
  pickupItemAI(itemSprite, itemType) {
    if (!itemSprite) {
      this.state = 'chase';
      return;
    }
    
    // 向道具移动（更快速度，因为是重要资源）
    const angle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y,
      itemSprite.x, itemSprite.y
    );
    
    const speedMultiplier = itemType === 'health' ? 1.5 : 1.3; // 残血时冲刺速度更快
    const velocityX = Math.cos(angle) * this.speed * speedMultiplier * (1 / 60);
    const velocityY = Math.sin(angle) * this.speed * speedMultiplier * (1 / 60);
    
    this.sprite.x += velocityX;
    this.sprite.y += velocityY;
    
    // 更新朝向
    if (velocityX < 0) {
      this.sprite.setFlipX(true);
    } else if (velocityX > 0) {
      this.sprite.setFlipX(false);
    }
    
    // 限制在世界边界内（仅下半部分可移动）
    const padding = 100;
    this.sprite.x = Phaser.Math.Clamp(this.sprite.x, padding, CONFIG.WORLD_WIDTH - padding);
    this.sprite.y = Phaser.Math.Clamp(this.sprite.y, CONFIG.PLAYABLE_Y_MIN, CONFIG.PLAYABLE_Y_MAX);
    
    // 道具拾取由GameScene的update统一检测，这里只负责移动
    // 如果道具消失了，切换回追击状态
    const distance = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y,
      itemSprite.x, itemSprite.y
    );
    
    // 如果离道具太远（可能被玩家捡走），放弃追逐
    if (distance > 800) {
      this.state = 'chase';
    }
  }
}
