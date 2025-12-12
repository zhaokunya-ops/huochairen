import { CONFIG } from './config.js';

export class DamagePickup {
  constructor(scene) {
    this.scene = scene;
    this.pickup = null;
    this.spawnTimer = null;
    this.despawnTimer = null;
  }
  
  start() {
    this.scheduleNextSpawn();
  }
  
  scheduleNextSpawn() {
    // 检查场景是否有效
    if (!this.scene || !this.scene.time) {
      return;
    }
    
    const delay = Phaser.Math.Between(
      CONFIG.DAMAGE_PICKUP.SPAWN.MIN_INTERVAL,
      CONFIG.DAMAGE_PICKUP.SPAWN.MAX_INTERVAL
    );
    
    this.spawnTimer = this.scene.time.delayedCall(delay, () => {
      this.spawn();
    });
  }
  
  spawn() {
    if (this.pickup) {
      return; // 已经有道具存在
    }
    
    // 检查场景是否有效
    if (!this.scene || !this.scene.add) {
      return;
    }
    
    // 在世界下半部分随机生成
    const x = Phaser.Math.Between(CONFIG.WIDTH / 2, CONFIG.WORLD_WIDTH - CONFIG.WIDTH / 2);
    const y = Phaser.Math.Between(CONFIG.PLAYABLE_Y_MIN, CONFIG.PLAYABLE_Y_MAX);
    
    // 创建伤害道具精灵（使用图片）
    this.pickup = this.scene.add.sprite(x, y, 'damage-pickup');
    this.pickup.setScale(CONFIG.DAMAGE_PICKUP.SCALE);
    this.pickup.setDepth(5);
    
    // 漂浮动画
    this.scene.tweens.add({
      targets: this.pickup,
      y: y - 20,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // 旋转动画
    this.scene.tweens.add({
      targets: this.pickup,
      angle: 360,
      duration: 2000,
      repeat: -1,
      ease: 'Linear'
    });
    
    // 发光效果
    this.scene.tweens.add({
      targets: this.pickup,
      alpha: 0.7,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // 设置自动消失
    this.despawnTimer = this.scene.time.delayedCall(
      CONFIG.DAMAGE_PICKUP.SPAWN.DESPAWN_TIME,
      () => {
        this.despawn();
      }
    );
  }
  
  despawn() {
    if (this.pickup) {
      // 检查场景是否有效
      if (this.scene && this.scene.tweens && this.scene.sys && this.scene.sys.isActive()) {
        // 消失动画
        this.scene.tweens.add({
          targets: this.pickup,
          alpha: 0,
          scale: 0,
          duration: 300,
          onComplete: () => {
            if (this.pickup) {
              this.pickup.destroy();
              this.pickup = null;
            }
            this.scheduleNextSpawn();
          }
        });
      } else {
        // 场景无效，直接销毁
        if (this.pickup) {
          this.pickup.destroy();
          this.pickup = null;
        }
      }
    }
    
    if (this.despawnTimer) {
      this.despawnTimer.remove();
      this.despawnTimer = null;
    }
  }
  
  checkPickup(character) {
    if (!this.pickup || !character.sprite) {
      return false;
    }
    
    // 检查场景是否有效
    if (!this.scene) {
      return false;
    }
    
    const distance = Phaser.Math.Distance.Between(
      character.sprite.x,
      character.sprite.y,
      this.pickup.x,
      this.pickup.y
    );
    
    if (distance < 60) {
      // 应用伤害加成
      this.applyDamageBoost(character);
      
      // 取消自动消失计时器
      if (this.despawnTimer) {
        this.despawnTimer.remove();
        this.despawnTimer = null;
      }
      
      // 保存引用并立即清空，防止重复拾取
      const pickupSprite = this.pickup;
      this.pickup = null;
      
      // 播放拾取效果
      if (this.scene.tweens && pickupSprite) {
        this.scene.tweens.add({
          targets: pickupSprite,
          alpha: 0,
          scale: 0.3,
          duration: 200,
          onComplete: () => {
            if (pickupSprite) {
              pickupSprite.destroy();
            }
            this.scheduleNextSpawn();
          }
        });
      } else {
        if (pickupSprite) {
          pickupSprite.destroy();
        }
        this.scheduleNextSpawn();
      }
      
      return true;
    }
    
    return false;
  }
  
  applyDamageBoost(character) {
    // 增加伤害
    character.damageBoost = (character.damageBoost || 0) + CONFIG.DAMAGE_PICKUP.DAMAGE_INCREASE;
    
    // 如果已有buff计时器，清除它
    if (character.damageBoostTimer) {
      character.damageBoostTimer.remove();
    }
    
    // 设置新的计时器
    character.damageBoostTimer = this.scene.time.delayedCall(
      CONFIG.DAMAGE_PICKUP.DURATION,
      () => {
        character.damageBoost = 0;
        character.damageBoostTimer = null;
        
        // 显示buff结束提示
        if (this.scene && this.scene.sys && this.scene.sys.isActive()) {
          const expireText = this.scene.add.text(
            character.sprite.x, 
            character.sprite.y - 100, 
            '伤害加成结束', {
            fontSize: '28px',
            fontStyle: 'bold',
            color: '#ff4444',
            stroke: '#000000',
            strokeThickness: 3
          }).setOrigin(0.5);
          
          this.scene.tweens.add({
            targets: expireText,
            y: expireText.y - 50,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => expireText.destroy()
          });
        }
      }
    );
    
    // 显示获得提示
    const boostText = this.scene.add.text(
      character.sprite.x,
      character.sprite.y - 100,
      `伤害 +${CONFIG.DAMAGE_PICKUP.DAMAGE_INCREASE}！`,
      {
        fontSize: '36px',
        fontStyle: 'bold',
        color: '#ff4444',
        stroke: '#000000',
        strokeThickness: 4
      }
    ).setOrigin(0.5);
    
    this.scene.tweens.add({
      targets: boostText,
      y: boostText.y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => boostText.destroy()
    });
  }
  
  getPickup() {
    return this.pickup;
  }
  
  destroy() {
    if (this.pickup) {
      this.pickup.destroy();
      this.pickup = null;
    }
    if (this.spawnTimer) {
      this.spawnTimer.remove();
      this.spawnTimer = null;
    }
    if (this.despawnTimer) {
      this.despawnTimer.remove();
      this.despawnTimer = null;
    }
  }
}
