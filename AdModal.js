import { CONFIG } from './config.js';

export class AdModal {
  constructor(scene, onWatchAd, onClose) {
    this.scene = scene;
    this.onWatchAd = onWatchAd;
    this.onClose = onClose;
    
    this.container = null;
    this.isVisible = false;
  }
  
  show() {
    if (this.isVisible) return;
    
    this.isVisible = true;
    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(2000);
    
    // 半透明遮罩
    const overlay = this.scene.add.rectangle(
      CONFIG.WIDTH / 2,
      CONFIG.HEIGHT / 2,
      CONFIG.WIDTH,
      CONFIG.HEIGHT,
      0x000000,
      0.7
    );
    this.container.add(overlay);
    
    // 弹窗背景
    const modalWidth = 800;
    const modalHeight = 500;
    const modalBg = this.scene.add.rectangle(
      CONFIG.WIDTH / 2,
      CONFIG.HEIGHT / 2,
      modalWidth,
      modalHeight,
      0xffffff
    );
    modalBg.setStrokeStyle(4, 0x000000);
    this.container.add(modalBg);
    
    // 关闭按钮
    const closeBtn = this.scene.add.circle(
      CONFIG.WIDTH / 2 + modalWidth / 2 - 40,
      CONFIG.HEIGHT / 2 - modalHeight / 2 + 40,
      30,
      0xff0000
    );
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.hide(false));
    this.container.add(closeBtn);
    
    const closeX = this.scene.add.text(
      closeBtn.x,
      closeBtn.y,
      '✕',
      {
        fontSize: '36px',
        fontStyle: 'bold',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
    this.container.add(closeX);
    
    // 标题
    const title = this.scene.add.text(
      CONFIG.WIDTH / 2,
      CONFIG.HEIGHT / 2 - 150,
      '🎁 获得奖励道具！',
      {
        fontSize: '48px',
        fontStyle: 'bold',
        color: '#000000'
      }
    ).setOrigin(0.5);
    this.container.add(title);
    
    // 描述
    const desc = this.scene.add.text(
      CONFIG.WIDTH / 2,
      CONFIG.HEIGHT / 2 - 50,
      '观看广告后，游戏开局将随机获得一个强力武器！',
      {
        fontSize: '28px',
        color: '#333333',
        align: 'center',
        wordWrap: { width: modalWidth - 100 }
      }
    ).setOrigin(0.5);
    this.container.add(desc);
    
    // 武器图标展示
    const weaponIcons = this.scene.add.container(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 50);
    const weapons = ['sword', 'bat', 'hammer'];
    weapons.forEach((weapon, index) => {
      const icon = this.scene.add.image((index - 1) * 150, 0, `weapon-${weapon}`);
      icon.setScale(0.12);
      weaponIcons.add(icon);
    });
    this.container.add(weaponIcons);
    
    // 观看广告按钮
    const btnWidth = 400;
    const btnHeight = 80;
    const btnY = CONFIG.HEIGHT / 2 + 180;
    
    const watchAdBtn = this.scene.add.rectangle(
      CONFIG.WIDTH / 2,
      btnY,
      btnWidth,
      btnHeight,
      0x00cc00
    );
    watchAdBtn.setStrokeStyle(3, 0x000000);
    watchAdBtn.setInteractive({ useHandCursor: true });
    watchAdBtn.on('pointerdown', () => this.hide(true));
    watchAdBtn.on('pointerover', () => watchAdBtn.setFillStyle(0x00ff00));
    watchAdBtn.on('pointerout', () => watchAdBtn.setFillStyle(0x00cc00));
    this.container.add(watchAdBtn);
    
    const btnText = this.scene.add.text(
      CONFIG.WIDTH / 2,
      btnY,
      '📺 观看广告',
      {
        fontSize: '36px',
        fontStyle: 'bold',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
    this.container.add(btnText);
    
    // 入场动画
    this.container.setAlpha(0);
    this.container.setScale(0.8);
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });
  }
  
  hide(watchedAd) {
    if (!this.isVisible) return;
    
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      scaleX: 0.8,
      scaleY: 0.8,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        if (this.container) {
          this.container.destroy();
          this.container = null;
        }
        this.isVisible = false;
        
        if (watchedAd && this.onWatchAd) {
          // 实际项目中应调用真实广告SDK
          if (window.adSDK && window.adSDK.showRewardAd) {
            window.adSDK.showRewardAd({
              success: () => this.onWatchAd(),
              fail: () => console.log('广告播放失败')
            });
          } else {
            // 模拟广告播放完成
            setTimeout(() => {
              this.onWatchAd();
            }, 1000);
          }
        } else if (!watchedAd && this.onClose) {
          this.onClose();
        }
      }
    });
  }
  
  destroy() {
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
    this.isVisible = false;
  }
}