import { CONFIG } from './config.js';

export class AttackButton {
  constructor(scene, x, y, onAttack) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.onAttack = onAttack;
    
    // 按钮圆形
    this.button = scene.add.circle(x, y, CONFIG.ATTACK_BUTTON.RADIUS, 0xff0000, CONFIG.ATTACK_BUTTON.ALPHA);
    this.button.setStrokeStyle(4, 0xffffff, 0.8);
    this.button.setDepth(1000);
    this.button.setScrollFactor(0); // 固定在屏幕上
    
    // 文字
    this.text = scene.add.text(x, y, '攻击', {
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.text.setDepth(1001);
    this.text.setScrollFactor(0); // 固定在屏幕上
    
    // 交互状态
    this.isPressed = false;
    this.cooldownBar = null;
    
    // 启用交互
    this.setupInput();
  }
  
  setupInput() {
    this.scene.input.on('pointerdown', (pointer) => {
      const distance = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.x, this.y);
      if (distance < CONFIG.ATTACK_BUTTON.RADIUS * 1.5) {
        this.press();
      }
    });
    
    this.scene.input.on('pointerup', () => {
      this.release();
    });
  }
  
  press() {
    if (this.isPressed) return;
    
    this.isPressed = true;
    
    // 按下效果
    this.button.setScale(0.9);
    this.text.setScale(0.9);
    this.button.setAlpha(1);
    
    // 触发攻击
    if (this.onAttack) {
      this.onAttack();
    }
  }
  
  release() {
    if (!this.isPressed) return;
    
    this.isPressed = false;
    
    // 恢复
    this.button.setScale(1);
    this.text.setScale(1);
    this.button.setAlpha(CONFIG.ATTACK_BUTTON.ALPHA);
  }
  
  showCooldown(duration) {
    // 显示冷却进度
    if (this.cooldownBar) {
      this.cooldownBar.destroy();
    }
    
    this.cooldownBar = this.scene.add.circle(this.x, this.y, CONFIG.ATTACK_BUTTON.RADIUS, 0x000000, 0.5);
    this.cooldownBar.setDepth(999);
    this.cooldownBar.setScrollFactor(0); // 固定在屏幕上
    
    this.scene.tweens.add({
      targets: this.cooldownBar,
      alpha: 0,
      duration: duration,
      ease: 'Linear',
      onComplete: () => {
        if (this.cooldownBar) {
          this.cooldownBar.destroy();
          this.cooldownBar = null;
        }
      }
    });
  }
  
  setScrollFactor(factor) {
    this.button.setScrollFactor(factor);
    this.text.setScrollFactor(factor);
    if (this.cooldownBar) this.cooldownBar.setScrollFactor(factor);
  }
  
  destroy() {
    if (this.button) this.button.destroy();
    if (this.text) this.text.destroy();
    if (this.cooldownBar) this.cooldownBar.destroy();
  }
}
