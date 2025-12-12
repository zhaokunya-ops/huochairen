import { CONFIG } from './config.js';

export class ComboSystem {
  constructor(scene) {
    this.scene = scene;
    this.comboCount = 0;
    this.comboTimer = null;
    this.comboTimeWindow = 3000; // 3秒内连续命中才算连击
    this.lastHitTime = 0;
  }
  
  // 记录一次命中
  recordHit() {
    const now = Date.now();
    
    // 如果在时间窗口内，增加连击数
    if (now - this.lastHitTime <= this.comboTimeWindow) {
      this.comboCount++;
    } else {
      // 超时，重置连击
      this.comboCount = 1;
    }
    
    this.lastHitTime = now;
    
    // 清除旧的计时器
    if (this.comboTimer) {
      clearTimeout(this.comboTimer);
    }
    
    // 设置新的计时器，3秒后重置连击
    this.comboTimer = setTimeout(() => {
      this.resetCombo();
    }, this.comboTimeWindow);
    
    // 显示连击提示
    this.showComboText();
    
    // 返回当前连击数和伤害倍率
    return {
      combo: this.comboCount,
      multiplier: this.getDamageMultiplier()
    };
  }
  
  // 获取伤害倍率
  getDamageMultiplier() {
    if (this.comboCount < 3) return 1.0;      // 1-2连击：无加成
    if (this.comboCount < 5) return 1.2;      // 3-4连击：+20%
    if (this.comboCount < 8) return 1.5;      // 5-7连击：+50%
    if (this.comboCount < 12) return 2.0;     // 8-11连击：+100%
    if (this.comboCount < 20) return 2.5;     // 12-19连击：+150%
    return 3.0;                                // 20+连击：+200%
  }
  
  // 获取连击等级文字
  getComboRank() {
    if (this.comboCount < 3) return '';
    if (this.comboCount < 5) return 'GOOD';
    if (this.comboCount < 8) return 'GREAT';
    if (this.comboCount < 12) return 'EXCELLENT';
    if (this.comboCount < 20) return 'AMAZING';
    return 'LEGENDARY';
  }
  
  // 获取连击颜色
  getComboColor() {
    if (this.comboCount < 3) return '#ffffff';
    if (this.comboCount < 5) return '#00ff00';  // 绿色
    if (this.comboCount < 8) return '#00ffff';  // 青色
    if (this.comboCount < 12) return '#ffff00'; // 黄色
    if (this.comboCount < 20) return '#ff9900'; // 橙色
    return '#ff0000';                           // 红色
  }
  
  // 显示连击文字
  showComboText() {
    if (this.comboCount < 3) return; // 少于3连击不显示
    
    const comboText = this.scene.comboText;
    if (!comboText) return;
    
    const rank = this.getComboRank();
    const multiplier = this.getDamageMultiplier();
    
    // 更新文字内容
    comboText.setText(`${this.comboCount} HIT COMBO!\n${rank}\n×${multiplier.toFixed(1)} 伤害`);
    comboText.setColor(this.getComboColor());
    comboText.setVisible(true);
    
    // 缩放动画
    comboText.setScale(1.5);
    this.scene.tweens.add({
      targets: comboText,
      scaleX: 1.0,
      scaleY: 1.0,
      duration: 200,
      ease: 'Back.easeOut'
    });
    
    // 抖动效果
    this.scene.tweens.add({
      targets: comboText,
      x: comboText.x + 10,
      duration: 50,
      yoyo: true,
      repeat: 3,
      ease: 'Power2'
    });
  }
  
  // 重置连击
  resetCombo() {
    if (this.comboCount >= 3) {
      // 显示连击结束
      const comboText = this.scene.comboText;
      if (comboText) {
        this.scene.tweens.add({
          targets: comboText,
          alpha: 0,
          duration: 500,
          ease: 'Power2',
          onComplete: () => {
            comboText.setVisible(false);
            comboText.setAlpha(1);
          }
        });
      }
    }
    
    this.comboCount = 0;
    this.lastHitTime = 0;
    
    if (this.comboTimer) {
      clearTimeout(this.comboTimer);
      this.comboTimer = null;
    }
  }
  
  // 获取当前连击数
  getComboCount() {
    return this.comboCount;
  }
  
  // 强制重置（用于玩家受伤或死亡）
  forceReset() {
    this.resetCombo();
  }
  
  // 销毁
  destroy() {
    if (this.comboTimer) {
      clearTimeout(this.comboTimer);
      this.comboTimer = null;
    }
  }
}
