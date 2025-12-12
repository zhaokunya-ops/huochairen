import { CONFIG, gameState } from './config.js';
import { AudioManager } from './AudioManager.js';

// 模拟WebSocket连接类（实际项目中应替换为真实WebSocket实现）
class GameSocket {
  constructor(scene) {
    this.scene = scene;
    this.isConnected = false;
    this.roomId = null;
    this.players = [];
    this.callbacks = {
      connected: [],
      roomCreated: [],
      roomJoined: [],
      playerJoined: [],
      matchFound: [],
      error: []
    };
    
    // 模拟连接状态
    this.connect();
  }
  
  // 连接到服务器
  connect() {
    // 实际项目中应使用真实的WebSocket连接
    setTimeout(() => {
      this.isConnected = true;
      this.scene.showMessage('已连接到服务器', 0x27ae60);
      this.trigger('connected');
    }, 1000);
  }
  
  // 创建房间
  createRoom() {
    if (!this.isConnected) {
      this.trigger('error', '未连接到服务器');
      return;
    }
    
    // 模拟创建房间
    setTimeout(() => {
      // 生成6位随机房间号
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      this.roomId = roomId;
      this.players = [{ id: gameState.playerId, name: '你' }];
      this.trigger('roomCreated', roomId);
    }, 1500);
  }
  
  // 加入房间
  joinRoom(roomId) {
    if (!this.isConnected) {
      this.trigger('error', '未连接到服务器');
      return;
    }
    
    // 模拟加入房间
    setTimeout(() => {
      // 模拟房间存在的情况
      if (roomId.length === 6) {
        this.roomId = roomId;
        this.players = [
          { id: 'other123', name: '玩家1' },
          { id: gameState.playerId, name: '你' }
        ];
        this.trigger('roomJoined', roomId, this.players);
        
        // 模拟其他玩家已在房间内
        if (this.players.length >= 2) {
          setTimeout(() => {
            this.trigger('matchFound', roomId);
          }, 1000);
        }
      } else {
        this.trigger('error', '房间不存在或已关闭');
      }
    }, 1500);
  }
  
  // 加入匹配队列
  joinMatchmaking() {
    if (!this.isConnected) {
      this.trigger('error', '未连接到服务器');
      return;
    }
    
    // 模拟匹配过程
    setTimeout(() => {
      this.roomId = 'MATCH' + Math.random().toString(36).substring(2, 6).toUpperCase();
      this.players = [
        { id: gameState.playerId, name: '你' },
        { id: 'match' + Math.floor(Math.random() * 1000), name: '匹配玩家' }
      ];
      this.trigger('matchFound', this.roomId);
    }, 3000);
  }
  
  // 注册回调事件
  on(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback);
    }
  }
  
  // 触发事件
  trigger(event, ...args) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback(...args));
    }
  }
  
  // 离开房间
  leaveRoom() {
    this.roomId = null;
    this.players = [];
  }
}

export class MultiplayerScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MultiplayerScene' });
    this.socket = null;
    this.roomPanel = null;
  }
  
  create() {
    // 初始化音频管理器
    this.audioManager = new AudioManager(this);
    this.audioManager.init();
    
    // 背景
    const bg = this.add.image(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 'arena');
    bg.setDisplaySize(CONFIG.WIDTH, CONFIG.HEIGHT);
    
    // 半透明遮罩
    this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.WIDTH, CONFIG.HEIGHT, 0x000000, 0.5);
    
    // 标题
    this.add.text(CONFIG.WIDTH / 2, 150, '联机对战', {
      fontSize: '96px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5);
    
    // 初始化网络连接
    this.initNetwork();
    
    // 三个功能按钮
    this.createButtons();
    
    // 底部广告横幅
    this.createAdBanner();
    
    // 返回按钮
    this.createBackButton();
  }
  
  initNetwork() {
    // 确保玩家有唯一ID
    if (!gameState.playerId) {
      gameState.playerId = 'player' + Math.floor(Math.random() * 10000);
    }
    
    this.socket = new GameSocket(this);
    
    // 注册网络事件回调
    this.socket.on('roomCreated', (roomId) => {
      this.showRoomPanel(roomId, true);
    });
    
    this.socket.on('roomJoined', (roomId, players) => {
      this.showRoomPanel(roomId, false);
    });
    
    this.socket.on('playerJoined', (player) => {
      if (this.roomPanel) {
        this.updateRoomPlayers(player);
      }
    });
    
    this.socket.on('matchFound', (roomId) => {
      this.showMessage('匹配成功，即将进入游戏', 0x27ae60);
      setTimeout(() => {
        gameState.currentRoomId = roomId;
        gameState.gameMode = CONFIG.GAME_MODE.MULTIPLAYER;
        this.scene.start('GameScene');
      }, 2000);
    });
    
    this.socket.on('error', (message) => {
      this.showMessage(`错误: ${message}`, 0xe74c3c);
    });
  }
  
  createButtons() {
    const centerX = CONFIG.WIDTH / 2;
    const startY = 350;
    const buttonWidth = 600;
    const buttonHeight = 150;
    const gap = 50;
    
    // 按钮数据
    const buttons = [
      {
        text: '🎲 自动匹配房间',
        color: 0x27ae60,
        action: () => this.autoMatch()
      },
      {
        text: '➕ 创建房间',
        color: 0x3498db,
        action: () => this.createRoom()
      },
      {
        text: '🔑 加入指定房间',
        color: 0xe67e22,
        action: () => this.joinRoom()
      }
    ];
    
    buttons.forEach((btnData, index) => {
      const y = startY + index * (buttonHeight + gap);
      this.createButton(centerX, y, buttonWidth, buttonHeight, btnData);
    });
  }
  
  createButton(x, y, width, height, data) {
    // 按钮背景
    const btn = this.add.rectangle(x, y, width, height, data.color);
    btn.setStrokeStyle(5, 0xffffff);
    btn.setInteractive({ useHandCursor: true });
    
    // 按钮文字
    const text = this.add.text(x, y, data.text, {
      fontSize: '52px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // 悬停效果
    btn.on('pointerover', () => {
      btn.setFillStyle(data.color + 0x222222);
      btn.setScale(1.05);
      text.setScale(1.05);
    });
    
    btn.on('pointerout', () => {
      btn.setFillStyle(data.color);
      btn.setScale(1);
      text.setScale(1);
    });
    
    // 点击事件
    btn.on('pointerdown', () => {
      this.audioManager.playSound('click');
      data.action();
    });
  }
  
  autoMatch() {
    this.showMessage('正在匹配玩家...', 0x27ae60);
    this.socket.joinMatchmaking();
  }
  
  createRoom() {
    this.showMessage('正在创建房间...', 0x3498db);
    this.socket.createRoom();
  }
  
  joinRoom() {
    // 显示输入房间号弹窗
    this.showRoomCodeInput();
  }
  
  showRoomCodeInput() {
    // 遮罩
    const overlay = this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.WIDTH, CONFIG.HEIGHT, 0x000000, 0.8);
    overlay.setDepth(3000);
    overlay.setInteractive();
    
    // 输入框背景
    const inputBox = this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 800, 500, 0xffffff);
    inputBox.setStrokeStyle(5, 0x000000);
    inputBox.setDepth(3001);
    
    // 标题
    this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 150, '输入房间代码', {
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#000000'
    }).setOrigin(0.5).setDepth(3002);
    
    // 输入提示
    const inputHint = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 30, '请输入6位房间代码', {
      fontSize: '36px',
      color: '#666666'
    }).setOrigin(0.5).setDepth(3002);
    
    // 房间代码输入框
    const codeDisplay = this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 40, 600, 80, 0xf0f0f0);
    codeDisplay.setStrokeStyle(3, 0x000000);
    codeDisplay.setDepth(3001);
    
    const codeText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 40, '', {
      fontSize: '64px',
      fontStyle: 'bold',
      color: '#000000',
      letterSpacing: '20'
    }).setOrigin(0.5).setDepth(3002);
    
    // 输入状态管理
    let currentCode = '';
    
    // 创建数字字母键盘
    const keys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
    const keyWidth = 60;
    const keyHeight = 60;
    const keyGap = 10;
    const startX = CONFIG.WIDTH / 2 - (5 * keyWidth + 4 * keyGap) / 2;
    const startY = CONFIG.HEIGHT / 2 + 140;
    
    keys.forEach((key, index) => {
      const row = Math.floor(index / 10);
      const col = index % 10;
      const x = startX + col * (keyWidth + keyGap);
      const y = startY + row * (keyHeight + keyGap);
      
      const keyBtn = this.add.rectangle(x, y, keyWidth, keyHeight, 0xeeeeee);
      keyBtn.setStrokeStyle(2, 0x999999);
      keyBtn.setInteractive({ useHandCursor: true });
      keyBtn.setDepth(3001);
      
      const keyText = this.add.text(x, y, key, {
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#000000'
      }).setOrigin(0.5).setDepth(3002);
      
      keyBtn.on('pointerdown', () => {
        if (currentCode.length < 6) {
          currentCode += key;
          codeText.setText(currentCode.padEnd(6, '_'));
          this.audioManager.playSound('click');
        }
      });
      
      keyBtn.on('pointerover', () => {
        keyBtn.setFillStyle(0xdddddd);
      });
      
      keyBtn.on('pointerout', () => {
        keyBtn.setFillStyle(0xeeeeee);
      });
    });
    
    // 删除按钮
    const deleteBtn = this.add.rectangle(
      startX + 9 * (keyWidth + keyGap), 
      startY + 3 * (keyHeight + keyGap), 
      keyWidth, 
      keyHeight, 
      0xf44336
    );
    deleteBtn.setStrokeStyle(2, 0x999999);
    deleteBtn.setInteractive({ useHandCursor: true });
    deleteBtn.setDepth(3001);
    
    const deleteText = this.add.text(
      startX + 9 * (keyWidth + keyGap), 
      startY + 3 * (keyHeight + keyGap), 
      '⌫', 
      { fontSize: '24px', fontStyle: 'bold', color: '#ffffff' }
    ).setOrigin(0.5).setDepth(3002);
    
    deleteBtn.on('pointerdown', () => {
      if (currentCode.length > 0) {
        currentCode = currentCode.slice(0, -1);
        codeText.setText(currentCode.padEnd(6, '_'));
        this.audioManager.playSound('click');
      }
    });
    
    deleteBtn.on('pointerover', () => {
      deleteBtn.setFillStyle(0xd32f2f);
    });
    
    deleteBtn.on('pointerout', () => {
      deleteBtn.setFillStyle(0xf44336);
    });
    
    const cleanup = () => {
      overlay.destroy();
      inputBox.destroy();
      inputHint.destroy();
      codeDisplay.destroy();
      codeText.destroy();
      // 销毁所有按键
      this.children.list.forEach(child => {
        if (child.depth === 3001 || child.depth === 3002) {
          child.destroy();
        }
      });
    };
    
    // 确认按钮
    const confirmBtn = this.add.rectangle(CONFIG.WIDTH / 2 - 150, CONFIG.HEIGHT - 150, 200, 70, 0xe67e22);
    confirmBtn.setStrokeStyle(4, 0x000000);
    confirmBtn.setInteractive({ useHandCursor: true });
    confirmBtn.setDepth(3001);
    
    const confirmText = this.add.text(CONFIG.WIDTH / 2 - 150, CONFIG.HEIGHT - 150, '加入', {
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(3002);
    
    confirmBtn.on('pointerdown', () => {
      if (currentCode.length === 6) {
        cleanup();
        this.showMessage('正在加入房间...', 0xe67e22);
        this.socket.joinRoom(currentCode);
      } else {
        this.showMessage('请输入6位房间代码', 0xf39c12);
      }
    });
    
    // 取消按钮
    const cancelBtn = this.add.rectangle(CONFIG.WIDTH / 2 + 150, CONFIG.HEIGHT - 150, 200, 70, 0x95a5a6);
    cancelBtn.setStrokeStyle(4, 0x000000);
    cancelBtn.setInteractive({ useHandCursor: true });
    cancelBtn.setDepth(3001);
    
    const cancelText = this.add.text(CONFIG.WIDTH / 2 + 150, CONFIG.HEIGHT - 150, '取消', {
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(3002);
    
    cancelBtn.on('pointerdown', () => {
      cleanup();
    });
    
    overlay.on('pointerdown', () => {
      cleanup();
    });
  }
  
  showRoomPanel(roomId, isCreator) {
    // 清除现有面板
    if (this.roomPanel) {
      this.roomPanel.destroy();
    }
    
    // 创建面板容器
    this.roomPanel = this.add.container(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2);
    this.roomPanel.setDepth(3000);
    
    // 遮罩
    const overlay = this.add.rectangle(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT, 0x000000, 0.8);
    overlay.setInteractive();
    this.roomPanel.add(overlay);
    
    // 面板背景
    const panel = this.add.rectangle(0, 0, 800, 600, 0xffffff);
    panel.setStrokeStyle(5, 0x000000);
    this.roomPanel.add(panel);
    
    // 标题
    const title = this.add.text(0, -250, '房间信息', {
      fontSize: '56px',
      fontStyle: 'bold',
      color: '#000000'
    }).setOrigin(0.5);
    this.roomPanel.add(title);
    
    // 房间号
    const roomIdText = this.add.text(0, -180, `房间代码: ${roomId}`, {
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#e74c3c'
    }).setOrigin(0.5);
    this.roomPanel.add(roomIdText);
    
    // 复制按钮
    const copyBtn = this.add.rectangle(0, -120, 200, 60, 0x3498db);
    copyBtn.setStrokeStyle(3, 0x000000);
    copyBtn.setInteractive({ useHandCursor: true });
    this.roomPanel.add(copyBtn);
    
    const copyText = this.add.text(0, -120, '复制房间号', {
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.roomPanel.add(copyText);
    
    copyBtn.on('pointerdown', () => {
      navigator.clipboard.writeText(roomId).then(() => {
        this.showMessage('已复制到剪贴板', 0x27ae60);
      });
      this.audioManager.playSound('click');
    });
    
    // 玩家列表标题
    const playersTitle = this.add.text(0, -50, '房间玩家', {
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#000000'
    }).setOrigin(0.5);
    this.roomPanel.add(playersTitle);
    
    // 玩家列表容器
    this.playersList = this.add.container(0, 50);
    this.roomPanel.add(this.playersList);
    
    // 初始玩家列表
    this.updateRoomPlayersList(this.socket.players);
    
    // 开始游戏按钮（只有创建者可见）
    if (isCreator) {
      const startBtn = this.add.rectangle(0, 200, 300, 80, 0x27ae60);
      startBtn.setStrokeStyle(4, 0x000000);
      startBtn.setInteractive({ useHandCursor: true });
      this.roomPanel.add(startBtn);
      
      const startText = this.add.text(0, 200, '开始游戏', {
        fontSize: '42px',
        fontStyle: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);
      this.roomPanel.add(startText);
      
      // 检查是否可以开始游戏
      const updateStartButton = () => {
        const canStart = this.socket.players.length >= 2;
        startBtn.setFillStyle(canStart ? 0x27ae60 : 0x95a5a6);
        startBtn.setInteractive({ useHandCursor: canStart });
      };
      
      updateStartButton();
      
      startBtn.on('pointerdown', () => {
        if (this.socket.players.length >= 2) {
          this.socket.trigger('matchFound', roomId);
        }
        this.audioManager.playSound('click');
      });
    }
    
    // 离开按钮
    const leaveBtn = this.add.rectangle(0, 280, 200, 70, 0xe74c3c);
    leaveBtn.setStrokeStyle(4, 0x000000);
    leaveBtn.setInteractive({ useHandCursor: true });
    this.roomPanel.add(leaveBtn);
    
    const leaveText = this.add.text(0, 280, '离开房间', {
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.roomPanel.add(leaveText);
    
    leaveBtn.on('pointerdown', () => {
      this.socket.leaveRoom();
      this.roomPanel.destroy();
      this.roomPanel = null;
      this.audioManager.playSound('click');
    });
  }
  
  updateRoomPlayersList(players) {
    // 清空现有玩家列表
    this.playersList.removeAll(true);
    
    // 添加玩家
    players.forEach((player, index) => {
      const yPos = index * 60;
      const playerText = this.add.text(
        0, 
        yPos, 
        `${player.name} ${player.id === gameState.playerId ? '(你)' : ''}`, 
        { fontSize: '32px', color: '#000000' }
      ).setOrigin(0.5);
      this.playersList.add(playerText);
    });
  }
  
  updateRoomPlayers(newPlayer) {
    this.socket.players.push(newPlayer);
    this.updateRoomPlayersList(this.socket.players);
  }
  
  showMessage(text, color) {
    // 显示临时提示信息
    const msgBox = this.add.rectangle(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 800, 200, color, 0.95);
    msgBox.setStrokeStyle(5, 0xffffff);
    msgBox.setDepth(4000);
    
    const msgText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, text, {
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    msgText.setDepth(4001);
    
    // 2秒后自动消失
    this.time.delayedCall(2000, () => {
      msgBox.destroy();
      msgText.destroy();
    });
  }
  
  createAdBanner() {
  // 底部广告横幅
  const bannerHeight = 120;
  
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
  } else {
    // 模拟广告横幅
    const banner = this.add.rectangle(
      CONFIG.WIDTH / 2,
      CONFIG.HEIGHT - bannerHeight / 2,
      CONFIG.WIDTH,
      bannerHeight,
      0x3498db
    );
    
    this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - bannerHeight / 2, '📢 联机模式广告 - 点击了解更多', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    banner.setInteractive({ useHandCursor: true });
    banner.on('pointerdown', () => {
      console.log('广告被点击');
    });
  }
}
  
  createBackButton() {
    const backBtn = this.add.rectangle(100, 80, 160, 70, 0x3498db);
    backBtn.setStrokeStyle(4, 0xffffff);
    backBtn.setInteractive({ useHandCursor: true });
    
    const backText = this.add.text(100, 80, '← 返回', {
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    backBtn.on('pointerover', () => {
      backBtn.setFillStyle(0x5dade2);
      backBtn.setScale(1.05);
      backText.setScale(1.05);
    });
    
    backBtn.on('pointerout', () => {
      backBtn.setFillStyle(0x3498db);
      backBtn.setScale(1);
      backText.setScale(1);
    });
    
    backBtn.on('pointerdown', () => {
      this.audioManager.playSound('click');
      if (this.socket) {
        this.socket.leaveRoom();
      }
      this.scene.start('MenuScene');
    });
  }
}