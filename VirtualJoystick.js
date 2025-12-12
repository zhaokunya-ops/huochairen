import { CONFIG } from './config.js';

export class VirtualJoystick {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    
    // 基座
    this.base = scene.add.circle(x, y, CONFIG.JOYSTICK.RADIUS, 0x333333, CONFIG.JOYSTICK.BASE_ALPHA);
    this.base.setStrokeStyle(3, 0xffffff, 0.5);
    this.base.setDepth(1000);
    this.base.setScrollFactor(0); // 固定在屏幕上
    
    // 摇杆
    this.thumb = scene.add.circle(x, y, CONFIG.JOYSTICK.RADIUS * 0.6, 0x666666, CONFIG.JOYSTICK.THUMB_ALPHA);
    this.thumb.setStrokeStyle(2, 0xffffff, 0.8);
    this.thumb.setDepth(1001);
    this.thumb.setScrollFactor(0); // 固定在屏幕上
    
    // 交互状态
    this.isActive = false;
    this.pointerId = null;
    
    // 输入数据
    this.direction = { x: 0, y: 0 };
    
    // 启用交互
    this.setupInput();
  }
  
  setupInput() {
    this.scene.input.on('pointerdown', (pointer) => {
      if (this.isActive) return;
      
      const distance = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.x, this.y);
      if (distance < CONFIG.JOYSTICK.RADIUS * 2) {
        this.isActive = true;
        this.pointerId = pointer.id;
      }
    });
    
    this.scene.input.on('pointermove', (pointer) => {
      if (!this.isActive || pointer.id !== this.pointerId) return;
      
      const deltaX = pointer.x - this.x;
      const deltaY = pointer.y - this.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (distance > 0) {
        const maxDistance = CONFIG.JOYSTICK.RADIUS * 0.8;
        const clampedDistance = Math.min(distance, maxDistance);
        
        this.thumb.x = this.x + (deltaX / distance) * clampedDistance;
        this.thumb.y = this.y + (deltaY / distance) * clampedDistance;
        
        // 归一化方向
        this.direction.x = deltaX / maxDistance;
        this.direction.y = deltaY / maxDistance;
        
        // 限制在 -1 到 1 之间
        this.direction.x = Phaser.Math.Clamp(this.direction.x, -1, 1);
        this.direction.y = Phaser.Math.Clamp(this.direction.y, -1, 1);
      }
    });
    
    this.scene.input.on('pointerup', (pointer) => {
      if (!this.isActive || pointer.id !== this.pointerId) return;
      
      this.reset();
    });
  }
  
  reset() {
    this.isActive = false;
    this.pointerId = null;
    this.direction = { x: 0, y: 0 };
    
    // 摇杆回到中心
    this.scene.tweens.add({
      targets: this.thumb,
      x: this.x,
      y: this.y,
      duration: 100,
      ease: 'Power2'
    });
  }
  
  getDirection() {
    if (!this.isActive) return null;
    return this.direction;
  }
  
  setScrollFactor(factor) {
    this.base.setScrollFactor(factor);
    this.thumb.setScrollFactor(factor);
  }
  
  destroy() {
    if (this.base) this.base.destroy();
    if (this.thumb) this.thumb.destroy();
  }
}
