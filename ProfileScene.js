import { CONFIG, gameState } from './config.js';

export class ProfileScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ProfileScene' });
  }
  
  create() {
    // 背景
    const bg = this.add.image(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 'arena');
    bg.setDisplaySize(CONFIG.WIDTH, CONFIG.HEIGHT);
    
    // 半透明遮罩
    this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.WIDTH, CONFIG.HEIGHT, 0x000000, 0.5);
    
    // 主布局容器（左右两列）
    this.createMainLayout();
    
    // 返回按钮（左上角）
    this.createBackButton();
  }
  
  createMainLayout() {
    const centerX = CONFIG.WIDTH / 2;
    const centerY = CONFIG.HEIGHT / 2 + 50;
    
    const panelWidth = 800;
    const panelHeight = 900;
    const gap = 80;
    
    // 左面板：个人信息 + 历史战绩
    const leftX = centerX - panelWidth / 2 - gap / 2;
    this.createProfilePanel(leftX, centerY, panelWidth, panelHeight);
    
    // 右面板：广告内容
    const rightX = centerX + panelWidth / 2 + gap / 2;
    this.createAdPanel(rightX, centerY, panelWidth, panelHeight);
  }
  
  createProfilePanel(x, y, width, height) {
    // 面板背景
    const panel = this.add.rectangle(x, y, width, height, 0xffffff, 0.95);
    panel.setStrokeStyle(5, 0x000000);
    
    const startY = y - height / 2 + 60;
    
    // 用户信息区域
    const avatarSize = 120;
    const avatarX = x - width / 2 + 80 + avatarSize / 2;
    const avatarY = startY + 60;
    
    // 头像圆形
    const avatar = this.add.circle(avatarX, avatarY, avatarSize / 2, 0xcccccc);
    avatar.setStrokeStyle(4, 0x000000);
    
    // 头像表情（简笔画笑脸）
    const faceGraphics = this.add.graphics();
    // 眼睛
    faceGraphics.fillStyle(0x000000);
    faceGraphics.fillCircle(avatarX - 20, avatarY - 15, 8);
    faceGraphics.fillCircle(avatarX + 20, avatarY - 15, 8);
    // 嘴巴（微笑弧线）
    faceGraphics.lineStyle(6, 0x000000);
    faceGraphics.beginPath();
    faceGraphics.arc(avatarX, avatarY + 10, 30, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(180), false);
    faceGraphics.strokePath();
    
    // 用户名
    const username = '游客123'; // TODO: 从用户数据获取
    this.add.text(avatarX + avatarSize / 2 + 30, avatarY - 20, username, {
      fontSize: '64px',
      fontStyle: 'bold',
      color: '#000000'
    }).setOrigin(0, 0.5);
    
    // 胜率
    const winRate = gameState.getWinRate();
    const winRateColor = winRate === 0 ? '#ff0000' : winRate >= 50 ? '#00cc00' : '#ffaa00';
    this.add.text(avatarX + avatarSize / 2 + 30, avatarY + 30, `胜率  ${winRate}%`, {
      fontSize: '48px',
      color: '#666666'
    }).setOrigin(0, 0.5);
    
    const winRateValue = this.add.text(avatarX + avatarSize / 2 + 220, avatarY + 30, `${winRate}%`, {
      fontSize: '48px',
      fontStyle: 'bold',
      color: winRateColor
    }).setOrigin(0, 0.5);
    
    // 分隔线
    const lineY = startY + 150;
    const line = this.add.graphics();
    line.lineStyle(2, 0xcccccc);
    line.lineBetween(x - width / 2 + 40, lineY, x + width / 2 - 40, lineY);
    
    // 战绩统计区域
    const statsStartY = lineY + 40;
    const columnWidth = width / 3;
    
    // 1V1模式
    this.createStatsColumn(x - width / 2 + columnWidth / 2 + 20, statsStartY, '1V1 模式', {
      totalGames: gameState.totalGames,
      wins: gameState.wins,
      losses: gameState.losses,
      winRate: gameState.getWinRate()
    });
    
    // 闯关模式
    const stageGames = gameState.bestStage > 0 ? gameState.bestStage : 0;
    this.createStatsColumn(x, statsStartY, '闯关模式', {
      currentStage: gameState.currentStage,
      bestStage: gameState.bestStage,
      label1: '当前进度',
      label2: '历史最高'
    });
    
    // 联机对战（占位）
    this.createStatsColumn(x + width / 2 - columnWidth / 2 - 20, statsStartY, '联机对战', {
      totalGames: 0,
      wins: 0,
      losses: 0,
      winRate: 0
    });
    
    // 重置按钮（底部）
    const resetBtnY = y + height / 2 - 100;
    const resetBtn = this.add.rectangle(x, resetBtnY, 600, 80, 0xff4444);
    resetBtn.setStrokeStyle(4, 0x000000);
    resetBtn.setInteractive({ useHandCursor: true });
    
    const resetText = this.add.text(x, resetBtnY, '重置战绩与关卡', {
      fontSize: '42px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    resetBtn.on('pointerover', () => {
      resetBtn.setFillStyle(0xff6666);
      resetBtn.setScale(1.05);
      resetText.setScale(1.05);
    });
    
    resetBtn.on('pointerout', () => {
      resetBtn.setFillStyle(0xff4444);
      resetBtn.setScale(1);
      resetText.setScale(1);
    });
    
    resetBtn.on('pointerdown', () => {
      this.showResetAdPage();
    });
  }
  
  createStatsColumn(x, y, title, data) {
    // 标题
    this.add.text(x, y, title, {
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#000000'
    }).setOrigin(0.5, 0);
    
    const dataY = y + 60;
    
    if (data.currentStage !== undefined) {
      // 闯关模式特殊显示
      this.add.text(x, dataY, data.label1 || '当前进度', {
        fontSize: '28px',
        color: '#666666'
      }).setOrigin(0.5, 0);
      
      this.add.text(x, dataY + 50, `第 ${data.currentStage} 关`, {
        fontSize: '32px',
        fontStyle: 'bold',
        color: '#000000'
      }).setOrigin(0.5, 0);
      
      this.add.text(x, dataY + 120, data.label2 || '历史最高', {
        fontSize: '28px',
        color: '#666666'
      }).setOrigin(0.5, 0);
      
      this.add.text(x, dataY + 170, `第 ${data.bestStage} 关`, {
        fontSize: '32px',
        fontStyle: 'bold',
        color: '#000000'
      }).setOrigin(0.5, 0);
    } else {
      // 标准模式显示
      const stats = [
        `总场次: ${data.totalGames}`,
        `胜利: ${data.wins}`,
        `失败: ${data.losses}`,
        `胜率: ${data.winRate}%`
      ];
      
      stats.forEach((stat, index) => {
        this.add.text(x, dataY + index * 60, stat, {
          fontSize: '32px',
          color: '#000000'
        }).setOrigin(0.5, 0);
      });
    }
  }
  
  createAdPanel(x, y, width, height) {
  // 广告面板背景
  const panel = this.add.rectangle(x, y, width, height, 0x4444ff, 0.95);
  panel.setStrokeStyle(5, 0x000000);
  panel.setInteractive({ useHandCursor: true });
  
  // 广告标题
  this.add.text(x, y - height / 2 + 60, '📢 推荐广告', {
    fontSize: '42px',
    fontStyle: 'bold',
    color: '#ffffff'
  }).setOrigin(0.5);
  
  // 广告内容（轮播）
  const adContents = [
    {
      emoji: '🎮',
      title: '超级游戏大优惠',
      desc: '全场5折起，立即查看',
      color: 0x3498db
    },
    {
      emoji: '🎁',
      title: '新用户福利',
      desc: '首充双倍奖励等你拿',
      color: 0xe74c3c
    },
    {
      emoji: '⚡',
      title: '限时活动',
      desc: '今日登录送豪华礼包',
      color: 0xf39c12
    },
    {
      emoji: '🏆',
      title: '排行榜挑战',
      desc: '冲榜赢取丰厚奖励',
      color: 0x9b59b6
    }
  ];
  
  let currentAdIndex = 0;
  
  // 广告emoji
  const adEmoji = this.add.text(x, y - 120, adContents[0].emoji, {
    fontSize: '180px'
  }).setOrigin(0.5);
  
  // 广告标题
  const adTitle = this.add.text(x, y + 80, adContents[0].title, {
    fontSize: '56px',
    fontStyle: 'bold',
    color: '#ffffff'
  }).setOrigin(0.5);
  
  // 广告描述
  const adDesc = this.add.text(x, y + 160, adContents[0].desc, {
    fontSize: '38px',
    color: '#ffffff'
  }).setOrigin(0.5);
  
  // 点击提示
  const clickHint = this.add.text(x, y + height / 2 - 60, '点击查看详情 >', {
    fontSize: '32px',
    color: '#ffff00'
  }).setOrigin(0.5);
  
  // 广告指示点
  const dotsY = y + height / 2 - 120;
  const dots = [];
  const dotSpacing = 30;
  const startX = x - (adContents.length - 1) * dotSpacing / 2;
  
  for (let i = 0; i < adContents.length; i++) {
    const dot = this.add.circle(startX + i * dotSpacing, dotsY, 8, i === 0 ? 0xffffff : 0x888888);
    dots.push(dot);
  }
  
  // 轮播定时器
  this.time.addEvent({
    delay: 3000,
    callback: () => {
      currentAdIndex = (currentAdIndex + 1) % adContents.length;
      const ad = adContents[currentAdIndex];
      
      // 更新内容
      adEmoji.setText(ad.emoji);
      adTitle.setText(ad.title);
      adDesc.setText(ad.desc);
      panel.setFillStyle(ad.color, 0.95);
      
      // 更新指示点
      dots.forEach((dot, i) => {
        dot.setFillStyle(i === currentAdIndex ? 0xffffff : 0x888888);
      });
    },
    loop: true
  });
  
  // 点击广告
  panel.on('pointerdown', () => {
    this.showAdPage();
  });
  
  panel.on('pointerover', () => {
    panel.setScale(1.02);
    clickHint.setScale(1.1);
  });
  
  panel.on('pointerout', () => {
    panel.setScale(1);
    clickHint.setScale(1);
  });
}

showAdPage() {
  // 实际项目中应调用广告SDK展示详情
  if (window.adSDK && window.adSDK.openAdDetail) {
    window.adSDK.openAdDetail();
  } else {
    console.log('打开广告详情页');
    // 可以添加跳转逻辑
  }
}
  
  performReset() {
    // 执行重置操作
    gameState.totalGames = 0;
    gameState.wins = 0;
    gameState.losses = 0;
    gameState.resetStageProgress();
    
    // 显示成功提示
    const successOverlay = this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.WIDTH, CONFIG.HEIGHT, 0x000000, 0.8);
    successOverlay.setDepth(6000);
    successOverlay.setInteractive();
    
    const successBox = this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 800, 300, 0x27ae60);
    successBox.setStrokeStyle(5, 0xffffff);
    successBox.setDepth(6001);
    
    const successText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, '✅ 战绩和关卡已重置成功！', {
      fontSize: '56px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    successText.setDepth(6002);
    
    // 2秒后自动刷新场景
    this.time.delayedCall(2000, () => {
      successOverlay.destroy();
      successBox.destroy();
      successText.destroy();
      this.scene.restart();
    });
  }
  
  showAdPage() {
    // 点击右侧广告的广告页面
    const adPage = this.add.container(0, 0);
    adPage.setDepth(4000);
    
    const adBg = this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.WIDTH, CONFIG.HEIGHT, 0x000000);
    adPage.add(adBg);
    
    const adText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, '广告详情页面（模拟）\n\n点击任意位置返回', {
      fontSize: '64px',
      fontStyle: 'bold',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
    adPage.add(adText);
    
    adBg.setInteractive();
    adBg.on('pointerdown', () => {
      adPage.destroy();
    });
  }
  
  showResetConfirm() {
    // 确认弹窗容器
    const overlay = this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.WIDTH, CONFIG.HEIGHT, 0x000000, 0.7);
    overlay.setDepth(4000);
    overlay.setInteractive();
    
    const confirmBox = this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 800, 400, 0xffffff);
    confirmBox.setStrokeStyle(5, 0x000000);
    confirmBox.setDepth(4001);
    
    const confirmText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 80, '确认重置所有战绩和关卡进度？\n此操作不可恢复！', {
      fontSize: '40px',
      color: '#000000',
      align: 'center'
    }).setOrigin(0.5);
    confirmText.setDepth(4002);
    
    // 确认按钮
    const yesBtn = this.add.rectangle(CONFIG.WIDTH / 2 - 150, CONFIG.HEIGHT / 2 + 80, 200, 70, 0xff4444);
    yesBtn.setStrokeStyle(4, 0x000000);
    yesBtn.setInteractive({ useHandCursor: true });
    yesBtn.setDepth(4001);
    
    const yesText = this.add.text(CONFIG.WIDTH / 2 - 150, CONFIG.HEIGHT / 2 + 80, '确认', {
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    yesText.setDepth(4002);
    
    // 取消按钮
    const noBtn = this.add.rectangle(CONFIG.WIDTH / 2 + 150, CONFIG.HEIGHT / 2 + 80, 200, 70, 0x95a5a6);
    noBtn.setStrokeStyle(4, 0x000000);
    noBtn.setInteractive({ useHandCursor: true });
    noBtn.setDepth(4001);
    
    const noText = this.add.text(CONFIG.WIDTH / 2 + 150, CONFIG.HEIGHT / 2 + 80, '取消', {
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    noText.setDepth(4002);
    
    const cleanup = () => {
      overlay.destroy();
      confirmBox.destroy();
      confirmText.destroy();
      yesBtn.destroy();
      yesText.destroy();
      noBtn.destroy();
      noText.destroy();
    };
    
    yesBtn.on('pointerdown', () => {
      gameState.totalGames = 0;
      gameState.wins = 0;
      gameState.losses = 0;
      gameState.resetStageProgress();
      cleanup();
      this.scene.restart();
    });
    
    noBtn.on('pointerdown', () => {
      cleanup();
    });
    
    overlay.on('pointerdown', () => {
      cleanup();
    });
  }
}
