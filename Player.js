update(joystickData, delta) { // 新增delta参数
    if (this.isDead) return;
    
    let isMoving = false;
    
    // 根据摇杆输入移动
    if (joystickData) {
      this.velocity.x = joystickData.x * this.speed;
      this.velocity.y = joystickData.y * this.speed;
      
      // 检查是否在移动
      if (Math.abs(joystickData.x) > 0.1 || Math.abs(joystickData.y) > 0.1) {
        isMoving = true;
      }
      
      // 更新朝向
      if (joystickData.x < -0.1) {
        this.sprite.setFlipX(true); // 面向左边
      } else if (joystickData.x > 0.1) {
        this.sprite.setFlipX(false); // 面向右边
      }
    } else {
      this.velocity.x = 0;
      this.velocity.y = 0;
    }
    
    // 应用移动（使用delta时间使移动更平滑）
    const moveFactor = delta / 16.67; // 基于60fps的基准值
    this.sprite.x += this.velocity.x * moveFactor;
    this.sprite.y += this.velocity.y * moveFactor;
    
    // 限制在世界边界内（仅下半部分可移动）
    const padding = 100;
    this.sprite.x = Phaser.Math.Clamp(this.sprite.x, padding, CONFIG.WORLD_WIDTH - padding);
    this.sprite.y = Phaser.Math.Clamp(this.sprite.y, CONFIG.PLAYABLE_Y_MIN, CONFIG.PLAYABLE_Y_MAX);
    
    // 播放脚步声（移动时，添加频率控制）
    if (isMoving && this.scene.audioManager) {
      const now = this.scene.time.now;
      if (!this.lastFootstepTime || now - this.lastFootstepTime > 300) {
        this.scene.audioManager.playFootstep();
        this.lastFootstepTime = now;
      }
    }
    
    // 更新动画
    this.updateAnimation(isMoving);
    
    // 更新血条和武器位置
    this.updateHealthBar();
    this.updateWeaponPosition();
  }