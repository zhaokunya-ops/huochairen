import { CONFIG, gameState } from './config.js';

export class StageCompleteScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StageCompleteScene' });
  }
  
  init(data) {
    this.completedStage = data.completedStage;
    this.kills = data.kills;
    this.healthRestored = data.healthRestored;
  }
  
  create() {
    // 背景
    const bg = this.add.image(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 'arena');
    bg.setDisplaySize(CONFIG.WIDTH, CONFIG.HEIGHT);
    
    // 半透明遮罩
    this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.WIDTH, CONFIG.HEIGHT, 0x000000, 0.7);
    
    // 标题
    const title = this.add.text(CONFIG.WIDTH / 2, 200, `🎉 第 ${this.completedStage} 关完成！`, {
      fontSize: '80px',
      fontStyle: 'bold',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5);
    
    // 闪烁效果
    this.tweens.add({
      targets: title,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // 统计面板
    const statsY = CONFIG.HEIGHT / 2 - 80;
    
    this.add.text(CONFIG.WIDTH / 2, statsY, '本关战绩', {
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    const stats = [
      `击杀数: ${this.kills}`,
      `恢复血量: +${this.healthRestored} HP`,
      `下一关: 第 ${gameState.currentStage} 关`
    ];
    
    stats.forEach((stat, index) => {
      this.add.text(CONFIG.WIDTH / 2, statsY + 70 + index * 60, stat, {
        fontSize: '40px',
        color: '#ffffff'
      }).setOrigin(0.5);
    });
    
    // 按钮区域
    const buttonY = CONFIG.HEIGHT / 2 + 250;
    const buttonGap = 100;
    const btnWidth = 400;
    const btnHeight = 80;
    
    // 下一关按钮
    const nextBtn = this.add.rectangle(CONFIG.WIDTH / 2 - btnWidth / 2 - buttonGap / 2, buttonY, btnWidth, btnHeight, 0x00cc00);
    nextBtn.setStrokeStyle(5, 0xffffff);
    nextBtn.setInteractive({ useHandCursor: true });
    
    const nextText = this.add.text(CONFIG.WIDTH / 2 - btnWidth / 2 - buttonGap / 2, buttonY, '继续闯关 ➡️', {
      fontSize: '42px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // 返回主页按钮
    const menuBtn = this.add.rectangle(CONFIG.WIDTH / 2 + btnWidth / 2 + buttonGap / 2, buttonY, btnWidth, btnHeight, 0x3498db);
    menuBtn.setStrokeStyle(5, 0xffffff);
    menuBtn.setInteractive({ useHandCursor: true });
    
    const menuText = this.add.text(CONFIG.WIDTH / 2 + btnWidth / 2 + buttonGap / 2, buttonY, '返回主页 🏠', {
      fontSize: '42px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // 按钮悬停效果
    nextBtn.on('pointerover', () => {
      nextBtn.setFillStyle(0x00ff00);
      nextBtn.setScale(1.05);
      nextText.setScale(1.05);
    });
    
    nextBtn.on('pointerout', () => {
      nextBtn.setFillStyle(0x00cc00);
      nextBtn.setScale(1);
      nextText.setScale(1);
    });
    
    menuBtn.on('pointerover', () => {
      menuBtn.setFillStyle(0x5dade2);
      menuBtn.setScale(1.05);
      menuText.setScale(1.05);
    });
    
    menuBtn.on('pointerout', () => {
      menuBtn.setFillStyle(0x3498db);
      menuBtn.setScale(1);
      menuText.setScale(1);
    });
    
    // 点击事件
    nextBtn.on('pointerdown', () => {
      // 继续下一关
      this.scene.start('GameScene');
    });
    
    menuBtn.on('pointerdown', () => {
      // 保存当前进度并返回主页
      // gameState.currentStage 已经是下一关的数值，保持不变
      // 下次进入闯关模式时会从这个关卡开始
      this.scene.start('MenuScene');
    });
    
    // 提示文字
    this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 100, '选择返回主页可保存进度，下次继续挑战', {
      fontSize: '32px',
      color: '#aaaaaa',
      align: 'center'
    }).setOrigin(0.5);
  }
  
  shutdown() {
    // 场景关闭时清理（如果有需要）
  }
}
