import { CONFIG, gameState } from './config.js';
import { AdModal } from './AdModal.js';
import { SettingsPanel } from './SettingsPanel.js';
import { AudioManager } from './AudioManager.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }
  
  create() {
    // 初始化音频管理器
    this.audioManager = new AudioManager(this);
    this.audioManager.init();
    this.audioManager.playBGM();
    
    // 背景
    const bg = this.add.image(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 'arena');
    bg.setDisplaySize(CONFIG.WIDTH, CONFIG.HEIGHT);
    
    // 半透明遮罩
    this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.WIDTH, CONFIG.HEIGHT, 0x000000, 0.5);
    
    // 创建左上角个人中心按钮
    this.createProfileButton();
    
    // 创建设置面板
    this.settingsPanel = new SettingsPanel(this);
    this.settingsPanel.create();
    
    // 游戏标题
    const title = this.add.text(CONFIG.WIDTH / 2, 140, '火柴人快打', {
      fontSize: '128px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 10
    }).setOrigin(0.5, 0);
    
    // 闪烁效果
    this.tweens.add({
      targets: title,
      alpha: 0.7,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // 三个模块并排居中
    this.createMainLayout();
    
    // 底部：广告轮播
    if (CONFIG.ADS.ENABLED && CONFIG.ADS.BANNER_ENABLED) {
      this.createAdBanner();
    }
  }
  
  createMainLayout() {
    const centerX = CONFIG.WIDTH / 2;
    const centerY = CONFIG.HEIGHT / 2 + 50;
    
    const panelWidth = 450;
    const panelHeight = 500;
    const gap = 60; // 间隔
    
    // 三个模块的x位置计算（居中对齐）
    const totalWidth = panelWidth * 3 + gap * 2;
    const startX = centerX - totalWidth / 2 + panelWidth / 2;
    
    const x1 = startX; // 1V1对战
    const x2 = startX + panelWidth + gap; // 连续对战
    const x3 = startX + (panelWidth + gap) * 2; // 历史战绩
    
    // 1V1 模式按钮
    this.createModeButton(
      x1,
      centerY,
      '1V1 对战',
      '经典单局对战模式',
      0xff6600,
      CONFIG.GAME_MODE.ONE_VS_ONE,
      panelWidth,
      panelHeight
    );
    
    // 闯关模式按钮
    this.createModeButton(
      x2,
      centerY,
      '闯关模式',
      '敌人越来越多！',
      0xcc00ff,
      CONFIG.GAME_MODE.STAGE,
      panelWidth,
      panelHeight
    );
    
    // 联机对战面板
    this.createMultiplayerPanel(x3, centerY, panelWidth, panelHeight);
  }
  
  createProfileButton() {
    // 个人中心按钮（左上角）
    const btnX = 150;
    const btnY = 80;
    const btnWidth = 220;
    const btnHeight = 80;
    
    const profileBtn = this.add.rectangle(btnX, btnY, btnWidth, btnHeight, 0x9b59b6);
    profileBtn.setStrokeStyle(4, 0xffffff);
    profileBtn.setInteractive({ useHandCursor: true });
    
    const profileText = this.add.text(btnX, btnY, '👤 个人中心', {
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    profileBtn.on('pointerover', () => {
      profileBtn.setFillStyle(0xaf7ac5);
      profileBtn.setScale(1.05);
      profileText.setScale(1.05);
    });
    
    profileBtn.on('pointerout', () => {
      profileBtn.setFillStyle(0x9b59b6);
      profileBtn.setScale(1);
      profileText.setScale(1);
    });
    
    profileBtn.on('pointerdown', () => {
      this.scene.start('ProfileScene');
    });
  }
  
  createModeButton(x, y, title, desc, color, mode, btnWidth, btnHeight) {
    
    // 按钮背景
    const btnBg = this.add.rectangle(x, y, btnWidth, btnHeight, color);
    btnBg.setStrokeStyle(5, 0xffffff);
    btnBg.setInteractive({ useHandCursor: true });
    
    // 标题（向下移动40px）
    const btnTitle = this.add.text(x, y - 40, title, {
      fontSize: '96px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5, 0.5);
    
    // 描述（向下移动40px）
    const btnDesc = this.add.text(x, y + 100, desc, {
      fontSize: '52px',
      color: '#ffffff'
    }).setOrigin(0.5, 0.5);
    
    // 关卡信息（仅闯关模式，向下移动40px）
    let scoreText = null;
    if (mode === CONFIG.GAME_MODE.STAGE) {
      // 显示当前关卡（如果大于1）和最高关卡
      let stageInfo = '';
      if (gameState.currentStage > 1) {
        stageInfo = `继续: 第${gameState.currentStage}关\n最高: 第${gameState.bestStage}关`;
      } else {
        stageInfo = gameState.bestStage > 0 ? `最高: 第${gameState.bestStage}关` : '开始挑战';
      }
      scoreText = this.add.text(x, y + 180, stageInfo, {
        fontSize: '44px',
        color: '#ffff00',
        align: 'center'
      }).setOrigin(0.5, 0.5);
    }
    
    // 悬停效果
    btnBg.on('pointerover', () => {
      btnBg.setFillStyle(color + 0x002200);
      btnBg.setScale(1.05);
      btnTitle.setScale(1.05);
      btnDesc.setScale(1.05);
      if (scoreText) scoreText.setScale(1.05);
    });
    
    btnBg.on('pointerout', () => {
      btnBg.setFillStyle(color);
      btnBg.setScale(1);
      btnTitle.setScale(1);
      btnDesc.setScale(1);
      if (scoreText) scoreText.setScale(1);
    });
    
    // 点击事件
    btnBg.on('pointerdown', () => {
      gameState.setGameMode(mode);
      if (CONFIG.ADS.ENABLED && CONFIG.ADS.REWARD_ENABLED) {
        this.showAdModal();
      } else {
        this.startGame();
      }
    });
  }
  
  createMultiplayerPanel(panelX, panelY, panelWidth, panelHeight) {
    // 面板背景
    const panel = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x16a085);
    panel.setStrokeStyle(5, 0xffffff);
    panel.setInteractive({ useHandCursor: true });
    
    // 标题
    this.add.text(panelX, panelY - 80, '联机对战', {
      fontSize: '96px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5, 0.5);
    
    // 描述
    this.add.text(panelX, panelY + 60, '与全球玩家实时对战！', {
      fontSize: '48px',
      color: '#ffffff'
    }).setOrigin(0.5, 0.5);
    
    // 状态提示
    this.add.text(panelX, panelY + 140, '开发中', {
      fontSize: '44px',
      fontStyle: 'bold',
      color: '#ffff00'
    }).setOrigin(0.5, 0.5);
    
    // 悬停效果
    panel.on('pointerover', () => {
      panel.setFillStyle(0x1abc9c);
      panel.setScale(1.05);
    });
    
    panel.on('pointerout', () => {
      panel.setFillStyle(0x16a085);
      panel.setScale(1);
    });
    
    // 点击进入联机对战场景
    panel.on('pointerdown', () => {
      this.scene.start('MultiplayerScene');
    });
  }
  
  createStatsPanel(panelX, panelY, panelWidth, panelHeight) {
    // 面板背景
    const panel = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x222222, 0.9);
    panel.setStrokeStyle(5, 0xffffff);
    
    // 标题（放大）
    this.add.text(panelX, panelY - 200, '历史战绩', {
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#ffff00'
    }).setOrigin(0.5, 0);
    
    const leftX = panelX - 100;
    const rightX = panelX + 100;
    const startY = panelY - 130;
    
    // 1V1 统计（左侧，放大字体）
    this.add.text(leftX, startY, '1V1 模式', {
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ff6600'
    }).setOrigin(0.5, 0);
    
    const stats1v1 = [
      `总场次: ${gameState.totalGames}`,
      `胜利: ${gameState.wins}`,
      `失败: ${gameState.losses}`,
      `胜率: ${gameState.getWinRate()}%`
    ];
    
    stats1v1.forEach((stat, index) => {
      this.add.text(leftX, startY + 50 + index * 50, stat, {
        fontSize: '32px',
        color: '#ffffff'
      }).setOrigin(0.5, 0.5);
    });
    
    // 闯关模式统计（右侧，放大字体）
    this.add.text(rightX, startY, '闯关模式', {
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#cc00ff'
    }).setOrigin(0.5, 0);
    
    // 显示当前关卡和最高关卡
    if (gameState.currentStage > 1) {
      this.add.text(rightX, startY + 65, '当前进度', {
        fontSize: '28px',
        color: '#ffffff'
      }).setOrigin(0.5, 0.5);
      
      this.add.text(rightX, startY + 105, `第 ${gameState.currentStage} 关`, {
        fontSize: '44px',
        fontStyle: 'bold',
        color: '#00ff00'
      }).setOrigin(0.5, 0.5);
      
      this.add.text(rightX, startY + 145, '历史最高', {
        fontSize: '28px',
        color: '#ffffff'
      }).setOrigin(0.5, 0.5);
      
      this.add.text(rightX, startY + 180, `第 ${gameState.bestStage} 关`, {
        fontSize: '40px',
        fontStyle: 'bold',
        color: '#ffff00'
      }).setOrigin(0.5, 0.5);
    } else {
      this.add.text(rightX, startY + 80, '最高关卡', {
        fontSize: '32px',
        color: '#ffffff'
      }).setOrigin(0.5, 0.5);
      
      const stageDisplay = gameState.bestStage > 0 ? `第 ${gameState.bestStage} 关` : '未挑战';
      this.add.text(rightX, startY + 135, stageDisplay, {
        fontSize: '56px',
        fontStyle: 'bold',
        color: '#ffff00'
      }).setOrigin(0.5, 0.5);
    }
    
    // 重置战绩按钮（底部，放大）
    const resetBtnY = panelY + 200;
    const resetBtn = this.add.rectangle(panelX, resetBtnY, 380, 70, 0xff4444);
    resetBtn.setStrokeStyle(3, 0xffffff);
    resetBtn.setInteractive({ useHandCursor: true });
    
    const resetBtnText = this.add.text(panelX, resetBtnY, '📺 重置战绩与关卡', {
      fontSize: '30px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5, 0.5);
    
  }
  
  createAdBanner() {
  // 底部广告横幅
  const bannerHeight = 120;
  const banner = this.add.rectangle(
    CONFIG.WIDTH / 2,
    CONFIG.HEIGHT - bannerHeight / 2,
    CONFIG.WIDTH,
    bannerHeight,
    0x3498db
  );
  
  // 广告文本
  this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - bannerHeight / 2, '📢 游戏内广告 - 点击查看更多精彩内容', {
    fontSize: '32px',
    color: '#ffffff',
    fontStyle: 'bold'
  }).setOrigin(0.5);
  
  // 实际项目中应接入真实广告SDK
  if (window.adSDK && window.adSDK.createBannerAd) {
    this.bannerAd = window.adSDK.createBannerAd({
      adUnitId: CONFIG.ADS.BANNER_ID,
      style: {
        left: 0,
        top: CONFIG.HEIGHT - bannerHeight,
        width: CONFIG.WIDTH,
        height: bannerHeight
      }
    });
    this.bannerAd.show();
  }
  
  // 点击广告
  banner.setInteractive({ useHandCursor: true });
  banner.on('pointerdown', () => {
    if (window.adSDK && window.adSDK.clickBannerAd) {
      window.adSDK.clickBannerAd();
    } else {
      console.log('广告被点击');
    }
  });
}
}