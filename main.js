import Phaser from 'phaser';
import { CONFIG } from './config.js';
import { MenuScene } from './MenuScene.js';
import { GameScene } from './GameScene.js';
import { GameOverScene } from './GameOverScene.js';
import { StageCompleteScene } from './StageCompleteScene.js';
import { ProfileScene } from './ProfileScene.js';
import { MultiplayerScene } from './MultiplayerScene.js';
import { AudioManager } from './AudioManager.js';
import { AdManager } from './AdManager.js'; // 导入广告管理器

class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }
  
  preload() {
    // 显示加载进度
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 320, height / 2 - 30, 640, 60);
    
    const loadingText = this.add.text(width / 2, height / 2 - 80, '加载中...', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    const percentText = this.add.text(width / 2, height / 2, '0%', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 2 - 310, height / 2 - 20, 620 * value, 40);
      percentText.setText(parseInt(value * 100) + '%');
    });
    
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });
    
    // 加载游戏资源 - 红色火柴人动画帧（玩家）
    this.load.image('red-idle', 'image/player/red-idle.webp?2sEt');
    this.load.image('red-run1', 'image/player/red-run1.webp?xMNJ');
    this.load.image('red-run2', 'image/player/red-run2.webp?oZQJ');
    this.load.image('red-run3', 'image/player/red-run3.webp?mR28');
    this.load.image('red-punch', 'image/player/red-punch.webp?yFWy');
    this.load.image('red-kick', 'image/player/red-kick.webp?x4RR');
    this.load.image('red-hurt', 'image/player/red-hurt.webp?esuS');
    this.load.image('red-death', 'image/player/red-death.webp?18PS');
    
    // 蓝色火柴人动画帧（敌人）
    this.load.image('blue-idle', 'image/enemy/blue-idle.webp?pRY3');
    this.load.image('blue-run1', 'image/enemy/blue-run1.webp?xpPv');
    this.load.image('blue-run2', 'image/enemy/blue-run2.webp?QRxG');
    this.load.image('blue-run3', 'image/enemy/blue-run3.webp?d2tS');
    this.load.image('blue-punch', 'image/enemy/blue-punch.webp?WjSY');
    this.load.image('blue-kick', 'image/enemy/blue-kick.webp?qTm2');
    this.load.image('blue-hurt', 'image/enemy/blue-hurt.webp?rJlt');
    this.load.image('blue-death', 'image/enemy/blue-death.webp?GfCn');
    
    // 红色火柴人持武器帧
    this.load.image('red-idle-sword', 'image/player/red-idle-sword.webp?46o7');
    this.load.image('red-idle-bat', 'image/player/red-idle-bat.webp?8y1A');
    this.load.image('red-idle-hammer', 'image/player/red-idle-hammer.webp?SlI1');
    
    // 红色火柴人持武器帧 - run
    this.load.image('red-run1-sword', 'image/player/red-run1-sword.webp?pe58');
    this.load.image('red-run1-bat', 'image/player/red-run1-bat.webp?jpQs');
    this.load.image('red-run1-hammer', 'image/player/red-run1-hammer.webp?vE0M');
    this.load.image('red-run2-sword', 'image/player/red-run2-sword.webp?4SZr');
    this.load.image('red-run2-bat', 'image/player/red-run2-bat.webp?Rb7V');
    this.load.image('red-run2-hammer', 'image/player/red-run2-hammer.webp?3vUw');
    this.load.image('red-run3-sword', 'image/player/red-run3-sword.webp?rKZa');
    this.load.image('red-run3-bat', 'image/player/red-run3-bat.webp?69h9');
    this.load.image('red-run3-hammer', 'image/player/red-run3-hammer.webp?oklI');
    
    // 红色火柴人持武器帧 - punch
    this.load.image('red-punch-sword', 'image/player/red-punch-sword.webp?mSsJ');
    this.load.image('red-punch-bat', 'image/player/red-punch-bat.webp?nsaG');
    this.load.image('red-punch-hammer', 'image/player/red-punch-hammer.webp?xAqV');
    
    // 红色火柴人持武器帧 - kick
    this.load.image('red-kick-sword', 'image/player/red-kick-sword.webp?bG5K');
    this.load.image('red-kick-bat', 'image/player/red-kick-bat.webp?ayFz');
    this.load.image('red-kick-hammer', 'image/player/red-kick-hammer.webp?oB82');
    
    // 红色火柴人持武器帧 - hurt
    this.load.image('red-hurt-sword', 'image/player/red-hurt-sword.webp?uKkY');
    this.load.image('red-hurt-bat', 'image/player/red-hurt-bat.webp?6niQ');
    this.load.image('red-hurt-hammer', 'image/player/red-hurt-hammer.webp?gewJ');
    
    // 红色火柴人持武器帧 - death
    this.load.image('red-death-sword', 'image/player/red-death-sword.webp?ZIFs');
    this.load.image('red-death-bat', 'image/player/red-death-bat.webp?7uGR');
    this.load.image('red-death-hammer', 'image/player/red-death-hammer.webp?0XUk');
    
    // 蓝色火柴人持武器帧 - idle
    this.load.image('blue-idle-sword', 'image/enemy/blue-idle-sword.webp?U5kl');
    this.load.image('blue-idle-bat', 'image/enemy/blue-idle-bat.webp?47xy');
    this.load.image('blue-idle-hammer', 'image/enemy/blue-idle-hammer.webp?f3iy');
    
    // 蓝色火柴人持武器帧 - run
    this.load.image('blue-run1-sword', 'image/enemy/blue-run1-sword.webp?pe58');
    this.load.image('blue-run1-bat', 'image/enemy/blue-run1-bat.webp?jpQs');
    this.load.image('blue-run1-hammer', 'image/enemy/blue-run1-hammer.webp?vE0M');
    this.load.image('blue-run2-sword', 'image/enemy/blue-run2-sword.webp?4SZr');
    this.load.image('blue-run2-bat', 'image/enemy/blue-run2-bat.webp?Rb7V');
    this.load.image('blue-run2-hammer', 'image/enemy/blue-run2-hammer.webp?3vUw');
    this.load.image('blue-run3-sword', 'image/enemy/blue-run3-sword.webp?rKZa');
    this.load.image('blue-run3-bat', 'image/enemy/blue-run3-bat.webp?69h9');
    this.load.image('blue-run3-hammer', 'image/enemy/blue-run3-hammer.webp?oklI');
    
    // 蓝色火柴人持武器帧 - punch
    this.load.image('blue-punch-sword', 'image/enemy/blue-punch-sword.webp?mSsJ');
    this.load.image('blue-punch-bat', 'image/enemy/blue-punch-bat.webp?nsaG');
    this.load.image('blue-punch-hammer', 'image/enemy/blue-punch-hammer.webp?xAqV');
    
    // 蓝色火柴人持武器帧 - kick
    this.load.image('blue-kick-sword', 'image/enemy/blue-kick-sword.webp?bG5K');
    this.load.image('blue-kick-bat', 'image/enemy/blue-kick-bat.webp?ayFz');
    this.load.image('blue-kick-hammer', 'image/enemy/blue-kick-hammer.webp?oB82');
    
    // 蓝色火柴人持武器帧 - hurt
    this.load.image('blue-hurt-sword', 'image/enemy/blue-hurt-sword.webp?uKkY');
    this.load.image('blue-hurt-bat', 'image/enemy/blue-hurt-bat.webp?6niQ');
    this.load.image('blue-hurt-hammer', 'image/enemy/blue-hurt-hammer.webp?gewJ');
    
    // 蓝色火柴人持武器帧 - death
    this.load.image('blue-death-sword', 'image/enemy/blue-death-sword.webp?ZIFs');
    this.load.image('blue-death-bat', 'image/enemy/blue-death-bat.webp?7uGR');
    this.load.image('blue-death-hammer', 'image/enemy/blue-death-hammer.webp?0XUk');
    
    // 武器、道具和场景
    this.load.image('weapon-sword', 'image/weapons/weapon-sword.webp?JDYR');
    this.load.image('weapon-bat', 'image/weapons/weapon-bat.webp?vqeH');
    this.load.image('weapon-hammer', 'image/weapons/weapon-hammer.webp?EW94');
    this.load.image('health-pickup', 'image/weapons/health-pickup.webp?pSjs');
    this.load.image('damage-pickup', 'image/weapons/damage-pickup.webp?031y');
    
    // 多个竞技场背景
    this.load.image('arena', 'image/arenas/fighting-arena.webp?k0hy');
    this.load.image('arena-city', 'image/arenas/arena-city.webp?P9fH');
    this.load.image('arena-dojo', 'image/arenas/arena-dojo.webp?DQhf');
    this.load.image('arena-rooftop', 'image/arenas/arena-rooftop.webp?zCZM');
    this.load.image('arena-forest', 'image/arenas/arena-forest.webp?MHvl');

    
    // 加载音频文件
    AudioManager.preloadAudio(this);
  }
  
  create() {
    // 初始化广告管理器
    window.adManager = new AdManager();
    window.adManager.init();
    
    // 预加载关键广告
    if (CONFIG.ADS.ENABLED) {
      window.adManager.loadInterstitialAd();
      window.adManager.loadRewardAd();
    }
    
    // 加载完成，启动菜单场景
    this.scene.start('MenuScene');
  }
}

// 游戏配置
const config = {
  type: Phaser.AUTO,
  width: CONFIG.WIDTH,
  height: CONFIG.HEIGHT,
  parent: 'phaser-game-container',
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, StageCompleteScene, ProfileScene, MultiplayerScene]
};

// 创建游戏实例
const game = new Phaser.Game(config);

// 防止页面滚动和缩放（移动端优化）
document.addEventListener('touchmove', (e) => {
  e.preventDefault();
}, { passive: false });

document.addEventListener('gesturestart', (e) => {
  e.preventDefault();
});

// 导出游戏实例（用于调试）
window.game = game;