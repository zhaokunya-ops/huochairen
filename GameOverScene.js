import { CONFIG, gameState } from './config.js';
import { AdModal } from './AdModal.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }
  
  init(data) {
    this.playerWon = data.playerWon;
  }
  
  create() {
    // 背景
    const bg = this.add.image(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 'arena');
    bg.setDisplaySize(CONFIG.WIDTH, CONFIG.HEIGHT);
    
    // 半透明遮罩
    this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.WIDTH, CONFIG.HEIGHT, 0x000000, 0.6);
    
    // 标题
    const titleText = this.playerWon ? '🎉 胜利！' : '💀 失败！';
    const titleColor = this.playerWon ? '#ffff00' : '#ff6666';
    
    const title = this.add.text(CONFIG.WIDTH / 2, 200, titleText, {
      fontSize: '80px',
      fontStyle: 'bold',
      color: titleColor,
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5, 0.5);
    
    // 左侧：本局战绩
    this.createStatsPanel();
    
    // 右侧：广告位
    if (CONFIG.ADS.ENABLED && CONFIG.ADS.INTERSTITIAL_ENABLED) {
      this.createAdPanel();
    } else {
      this.createPlaceholderAd();
    }
    
    // 底部按钮
    this.createButtons();
  }
  
  createStatsPanel() {
    const panelX = CONFIG.WIDTH / 4;
    const panelY = CONFIG.HEIGHT / 2 + 50;
    
    // 面板背景
    const panel = this.add.rectangle(panelX, panelY, 500, 450, 0x222222, 0.9);
    panel.setStrokeStyle(4, 0xffffff);
    
    // 标题
    this.add.text(panelX, panelY - 180, '本局战绩', {
      fontSize: '40px',
      fontStyle: 'bold',
      color: '#ffff00'
    }).setOrigin(0.5);
    
    // 根据游戏模式显示不同统计
    if (gameState.gameMode === CONFIG.GAME_MODE.ENDLESS) {
      // 连续对战模式统计
      const stats = [
        `击杀数: ${gameState.endlessKills}`,
        `最佳成绩: ${gameState.bestEndlessScore}`,
        '',
        '-- 总战绩 --',
        `总场次: ${gameState.totalGames}`,
        `胜利: ${gameState.wins}`,
        `失败: ${gameState.losses}`
      ];
      
      stats.forEach((stat, index) => {
        const color = stat.includes('击杀数') ? '#ff00ff' : 
                      stat.includes('最佳成绩') ? '#ffff00' : '#ffffff';
        
        this.add.text(panelX, panelY - 120 + index * 50, stat, {
          fontSize: stat.startsWith('--') ? '28px' : '32px',
          fontStyle: stat.startsWith('--') || stat.includes('击杀数') ? 'bold' : 'normal',
          color: color
        }).setOrigin(0.5);
      });
    } else {
      // 1V1模式统计
      const stats = [
        `结果: ${this.playerWon ? '胜利' : '失败'}`,
        '',
        '-- 总战绩 --',
        `总场次: ${gameState.totalGames}`,
        `胜利: ${gameState.wins}`,
        `失败: ${gameState.losses}`,
        `胜率: ${gameState.getWinRate()}%`
      ];
      
      stats.forEach((stat, index) => {
        const color = stat.includes('胜利') ? '#00ff00' : 
                      stat.includes('失败') ? '#ff6666' : '#ffffff';
        
        this.add.text(panelX, panelY - 120 + index * 50, stat, {
          fontSize: stat.startsWith('--') ? '28px' : '32px',
          fontStyle: stat.startsWith('--') ? 'bold' : 'normal',
          color: color
        }).setOrigin(0.5);
      });
    }
  }
  
  createAdPanel() {
    const panelX = CONFIG.WIDTH * 3 / 4;
    const panelY = CONFIG.HEIGHT / 2 + 50;
    
    // 广告背景
    const adPanel = this.add.rectangle(panelX, panelY, 500, 450, 0x4444ff, 0.9);
    adPanel.setStrokeStyle(4, 0xffffff);
    
    // 广告标签
    this.add.text(panelX, panelY - 180, '广告', {
      fontSize: '28px',
      color: '#ffffff',
      backgroundColor: '#ff0000',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5);
    
    // 广告内容
    const adContents = [
      '🎮 限时特惠',
      '新游戏上线！',
      '立即下载',
      '好评如潮'
    ];
    
    adContents.forEach((content, index) => {
      this.add.text(panelX, panelY - 80 + index * 70, content, {
        fontSize: '36px',
        fontStyle: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);
    });
    
    // 点击跳转提示
    this.add.text(panelX, panelY + 160, '[ 点击查看详情 ]', {
      fontSize: '24px',
      color: '#aaffaa'
    }).setOrigin(0.5);
    
    // 可点击
    adPanel.setInteractive({ useHandCursor: true });
    adPanel.on('pointerdown', () => {
      this.showAdPage();
    });
    
    adPanel.on('pointerover', () => {
      adPanel.setFillStyle(0x5555ff);
    });
    
    adPanel.on('pointerout', () => {
      adPanel.setFillStyle(0x4444ff);
    });
  }
  
  createPlaceholderAd() {
    const panelX = CONFIG.WIDTH * 3 / 4;
    const panelY = CONFIG.HEIGHT / 2 + 50;
    
    // 占位符
    const placeholder = this.add.rectangle(panelX, panelY, 500, 450, 0x333333, 0.5);
    placeholder.setStrokeStyle(4, 0x666666, 0.5);
    
    this.add.text(panelX, panelY, '[ 广告已禁用 ]', {
      fontSize: '32px',
      color: '#666666'
    }).setOrigin(0.5);
  }
  
  createButtons() {
    const btnY = CONFIG.HEIGHT - 150;
    const spacing = 350;
    
    // 再来一局按钮
    const playAgainBtn = this.createButton(
      CONFIG.WIDTH / 2 - spacing / 2,
      btnY,
      '再来一局',
      0x00cc00,
      () => {
        if (CONFIG.ADS.ENABLED && CONFIG.ADS.REWARD_ENABLED) {
          this.showAdModal();
        } else {
          this.restartGame();
        }
      }
    );
    
    // 返回主页按钮
    const menuBtn = this.createButton(
      CONFIG.WIDTH / 2 + spacing / 2,
      btnY,
      '返回主页',
      0x0066cc,
      () => {
        this.scene.start('MenuScene');
      }
    );
  }
  
  createButton(x, y, text, color, onClick) {
    const btnWidth = 280;
    const btnHeight = 90;
    
    const btn = this.add.rectangle(x, y, btnWidth, btnHeight, color);
    btn.setStrokeStyle(4, 0xffffff);
    btn.setInteractive({ useHandCursor: true });
    
    const btnText = this.add.text(x, y, text, {
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // 悬停效果
    btn.on('pointerover', () => {
      btn.setFillStyle(color + 0x002200);
      btn.setScale(1.05);
      btnText.setScale(1.05);
    });
    
    btn.on('pointerout', () => {
      btn.setFillStyle(color);
      btn.setScale(1);
      btnText.setScale(1);
    });
    
    btn.on('pointerdown', onClick);
    
    return btn;
  }
  
  showAdModal() {
    const adModal = new AdModal(
      this,
      () => {
        // 观看广告后，随机给一个武器
        const weapons = ['SWORD', 'BAT', 'HAMMER'];
        const randomWeapon = weapons[Phaser.Math.Between(0, weapons.length - 1)];
        gameState.setRewardWeapon(CONFIG.WEAPONS[randomWeapon]);
        
        // 模拟广告播放
        this.showAdPage(() => {
          this.restartGame();
        });
      },
      () => {
        // 关闭弹窗，直接开始游戏
        this.restartGame();
      }
    );
    adModal.show();
  }
  
  showAdPage(onComplete) {
    // 模拟广告页面
    const adPage = this.add.container(0, 0);
    adPage.setDepth(3000);
    
    const adBg = this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.WIDTH, CONFIG.HEIGHT, 0x000000);
    adPage.add(adBg);
    
    const adText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, '广告播放中...\n\n3', {
      fontSize: '64px',
      fontStyle: 'bold',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
    adPage.add(adText);
    
    // 倒计时
    let countdown = 3;
    const timer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        countdown--;
        if (countdown > 0) {
          adText.setText(`广告播放中...\n\n${countdown}`);
        } else {
          adPage.destroy();
          if (onComplete) onComplete();
        }
      },
      repeat: 2
    });
  }
  
  restartGame() {
    this.scene.start('GameScene');
  }
}
