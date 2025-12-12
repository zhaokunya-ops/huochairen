// 战士类（玩家和敌人的基类）
export class Fighter {
  constructor(scene, x, y, texturePrefix, config) {
    this.scene = scene;
    this.texturePrefix = texturePrefix;
    this.sprite = scene.add.image(x, y, `${texturePrefix}-idle`);
    this.sprite.setScale(config.SCALE);
    
    // 属性
    this.maxHealth = config.HEALTH;
    this.health = config.HEALTH;
    this.speed = config.SPEED;
    this.attackDamage = config.ATTACK_DAMAGE;
    this.attackRange = config.ATTACK_RANGE;
    this.attackCooldown = config.ATTACK_COOLDOWN;
    this.lastAttackTime = 0;
    
    // 状态
    this.isAttacking = false;
    this.isDead = false;
    this.isMoving = false;
    this.isHurt = false;
    this.weapon = null;
    this.currentAnimation = 'idle';
    
    // 行走/跑步动画帧切换
    this.runFrame = 0;
    this.runTimer = 0;
    this.runFrameDelay = 100; // 毫秒
    
    // 攻击类型
    this.attackType = 'punch'; // punch 或 kick
    this.lastAttackType = 'punch';
    
    // 创建血条
    this.createHealthBar();
  }
  
  createHealthBar() {
    this.barWidth = 120;
    this.barHeight = 12;
    const x = this.sprite.x;
    const y = this.sprite.y - this.sprite.displayHeight / 2 - 30;
    
    // 边框（黑色）- 中心对齐
    this.healthBarBorder = this.scene.add.rectangle(x, y, this.barWidth + 4, this.barHeight + 4, 0x000000);
    this.healthBarBorder.setDepth(10);
    this.healthBarBorder.setOrigin(0.5, 0.5);
    
    // 背景（红色）- 中心对齐
    this.healthBarBg = this.scene.add.rectangle(x, y, this.barWidth, this.barHeight, 0xff0000);
    this.healthBarBg.setDepth(11);
    this.healthBarBg.setOrigin(0.5, 0.5);
    
    // 前景（绿色）- 左对齐，这样改变宽度时从右边缩减
    this.healthBarFg = this.scene.add.rectangle(x - this.barWidth / 2, y, this.barWidth, this.barHeight, 0x00ff00);
    this.healthBarFg.setDepth(12);
    this.healthBarFg.setOrigin(0, 0.5); // 左对齐，垂直居中
  }
  
  updateHealthBar() {
    const x = this.sprite.x;
    const y = this.sprite.y - this.sprite.displayHeight / 2 - 30;
    
    // 更新边框和背景位置（中心对齐）
    this.healthBarBorder.setPosition(x, y);
    this.healthBarBg.setPosition(x, y);
    
    // 计算当前血量百分比和宽度
    const healthPercent = Math.max(0, Math.min(1, this.health / this.maxHealth));
    const currentWidth = Math.max(0, Math.min(this.barWidth, this.barWidth * healthPercent));
    
    // 更新绿色血条（左对齐，从左边缘开始）
    const leftEdge = x - this.barWidth / 2;
    this.healthBarFg.setPosition(leftEdge, y);
    this.healthBarFg.width = currentWidth;
  }
  
  takeDamage(damage) {
    if (this.isDead) return;
    
    this.health -= damage;
    this.updateHealthBar();
    
    // 玩家受伤时重置连击
    if (this.scene.comboSystem && this.color === 'red') {
      this.scene.comboSystem.forceReset();
    }
    
    // 播放受伤音效
    if (this.scene.audioManager) {
      this.scene.audioManager.playHurt();
    }
    
    // 切换到受伤动画
    this.playAnimation('hurt');
    this.isHurt = true;
    
    // 受伤闪烁效果
    this.sprite.setTint(0xff0000);
    this.scene.time.delayedCall(300, () => {
      if (this.sprite) {
        this.sprite.clearTint();
        this.isHurt = false;
      }
    });
    
    if (this.health <= 0) {
      this.health = 0;
      this.die();
    }
  }
  
  heal(amount) {
    if (this.isDead) return;
    
    this.health = Math.min(this.maxHealth, this.health + amount);
    this.updateHealthBar();
    
    // 显示回血文字
    const x = this.sprite.x;
    const y = this.sprite.y - 50;
    
    const healText = this.scene.add.text(x, y, `+${amount}`, {
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    this.scene.tweens.add({
      targets: healText,
      y: y - 50,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => healText.destroy()
    });
  }
  
  die() {
    this.isDead = true;
    
    // 播放死亡音效
    if (this.scene.audioManager) {
      this.scene.audioManager.playDeath();
    }
    
    // 切换到死亡动画
    this.playAnimation('death');
    
    // 死亡动画（淡出）
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.3,
      duration: 1000,
      ease: 'Power2'
    });
    
    // 隐藏血条
    this.healthBarBg.setVisible(false);
    this.healthBarFg.setVisible(false);
    this.healthBarBorder.setVisible(false);
  }
  
  canAttack() {
    const now = this.scene.time.now;
    const cooldown = this.weapon ? this.weapon.cooldown : this.attackCooldown;
    return now - this.lastAttackTime >= cooldown;
  }
  
  attack(target = null) {
    if (!this.canAttack() || this.isDead) return false;
    
    // 如果有目标且目标还活着，检查距离
    let inRange = true;
    if (target && !target.isDead) {
      const distance = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y,
        target.sprite.x, target.sprite.y
      );
      
      const range = this.weapon ? this.weapon.range : this.attackRange;
      inRange = distance <= range;
    }
    
    // 执行攻击动作（即使没有目标也可以空挥）
    this.isAttacking = true;
    this.lastAttackTime = this.scene.time.now;
    
    // 交替使用拳和踢
    this.attackType = this.lastAttackType === 'punch' ? 'kick' : 'punch';
    this.lastAttackType = this.attackType;
    
    // 切换到对应攻击动画
    this.playAnimation(this.attackType);
    
    // 如果有目标且在范围内，造成伤害
    if (target && !target.isDead && inRange) {
      // 基础伤害计算
      const baseDamage = this.weapon ? this.weapon.damage : this.attackDamage;
      const damageBoost = this.damageBoost || 0;
      let totalDamage = baseDamage + damageBoost;
      
      // 连击系统加成（只对玩家生效）
      let comboMultiplier = 1.0;
      let comboInfo = null;
      if (this.scene.comboSystem && this.color === 'red') {
        comboInfo = this.scene.comboSystem.recordHit();
        comboMultiplier = comboInfo.multiplier;
        totalDamage = Math.floor(totalDamage * comboMultiplier);
      }
      
      target.takeDamage(totalDamage);
      
      // 播放打击音效
      if (this.scene.audioManager) {
        this.scene.audioManager.playHit();
      }
      
      // 显示伤害数字（带连击倍率）
      this.showDamageText(target, totalDamage, comboInfo);
    }
    
    this.scene.time.delayedCall(400, () => {
      this.isAttacking = false;
    });
    
    return true;
  }
  
  showDamageText(target, damage, comboInfo = null) {
    const x = target.sprite.x;
    const y = target.sprite.y - 50;
    
    // 如果有连击信息，显示连击伤害
    let damageTextContent = `-${damage}`;
    let fontSize = '32px';
    let color = '#ff0000';
    
    if (comboInfo && comboInfo.combo >= 3) {
      damageTextContent = `-${damage}\n×${comboInfo.multiplier.toFixed(1)}`;
      fontSize = '36px';
      color = this.scene.comboSystem.getComboColor();
    }
    
    const damageText = this.scene.add.text(x, y, damageTextContent, {
      fontSize: fontSize,
      fontStyle: 'bold',
      color: color,
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5);
    
    // 连击伤害有特殊效果
    if (comboInfo && comboInfo.combo >= 3) {
      damageText.setScale(1.5);
      this.scene.tweens.add({
        targets: damageText,
        scaleX: 1.0,
        scaleY: 1.0,
        y: y - 80,
        alpha: 0,
        duration: 1000,
        ease: 'Power2',
        onComplete: () => damageText.destroy()
      });
    } else {
      // 普通伤害
      this.scene.tweens.add({
        targets: damageText,
        y: y - 50,
        alpha: 0,
        duration: 800,
        ease: 'Power2',
        onComplete: () => damageText.destroy()
      });
    }
  }
  
  pickupWeapon(weapon) {
    // 如果已有武器，先丢弃overlay武器（如果存在）
    if (this.weaponSprite) {
      this.weaponSprite.destroy();
      this.weaponSprite = null;
    }
    
    this.weapon = weapon;
    
    // 更新攻击属性
    this.attackDamage = weapon.damage;
    this.attackRange = weapon.range;
    this.attackCooldown = weapon.cooldown;
    
    // 强制刷新当前动画，显示持武器状态
    const currentAnim = this.currentAnimation;
    this.currentAnimation = null; // 重置以强制刷新
    
    // 根据当前状态选择合适的动画
    if (this.isDead) {
      this.playAnimation('death');
    } else if (this.isAttacking) {
      // 保持攻击动画
      this.playAnimation(this.lastAttackType === 'kick' ? 'kick' : 'punch');
    } else if (this.isHurt) {
      this.playAnimation('hurt');
    } else if (this.isMoving) {
      // 如果在移动，使用当前跑步帧
      const frameNames = ['run1', 'run2', 'run3'];
      this.playAnimation(frameNames[this.runFrame]);
    } else {
      // 待机状态
      this.playAnimation('idle');
    }
  }
  
  updateWeaponPosition() {
    // 不再需要此方法，因为武器是贴图的一部分
    // 保留为空方法以防其他地方调用
  }
  
  playAnimation(animName) {
    // 如果有武器，优先尝试使用持武器的贴图
    if (this.weapon) {
      const weaponTexture = `${this.texturePrefix}-${animName}-${this.weapon.name}`;
      if (this.scene.textures.exists(weaponTexture)) {
        if (this.currentAnimation !== weaponTexture) {
          this.currentAnimation = weaponTexture;
          this.sprite.setTexture(weaponTexture);
        }
        return;
      }
    }
    
    // 没有武器或没有持武器贴图，使用普通贴图
    if (this.currentAnimation === animName) return;
    this.currentAnimation = animName;
    
    const texture = `${this.texturePrefix}-${animName}`;
    if (this.scene.textures.exists(texture)) {
      this.sprite.setTexture(texture);
    }
  }
  
  updateAnimation(isMoving) {
    if (this.isDead) return;
    if (this.isAttacking) return;
    if (this.isHurt) return;
    
    if (isMoving) {
      // 跑步动画帧切换 (3帧循环)
      const now = this.scene.time.now;
      if (now - this.runTimer > this.runFrameDelay) {
        this.runFrame = (this.runFrame + 1) % 3;
        const frameNames = ['run1', 'run2', 'run3'];
        this.playAnimation(frameNames[this.runFrame]);
        this.runTimer = now;
      }
    } else {
      // 待机动画 - playAnimation会自动处理武器
      this.playAnimation('idle');
    }
  }
  
  destroy() {
    if (this.sprite) this.sprite.destroy();
    if (this.healthBarBg) this.healthBarBg.destroy();
    if (this.healthBarFg) this.healthBarFg.destroy();
    if (this.healthBarBorder) this.healthBarBorder.destroy();
    if (this.weaponSprite) this.weaponSprite.destroy();
  }
}
