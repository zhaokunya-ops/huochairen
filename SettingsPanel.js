import { CONFIG } from './config.js';

export class SettingsPanel {
  constructor(scene) {
    this.scene = scene;
    this.isOpen = false;
    this.container = null;
  }
  
  create() {
    // 创建设置按钮（右上角齿轮图标）
    this.settingsButton = this.scene.add.text(
      CONFIG.WIDTH - 100, 
      120, 
      '⚙️', 
      {
        fontSize: '96px'
      }
    );
    this.settingsButton.setOrigin(0.5); // 居中对齐
    this.settingsButton.setInteractive({ useHandCursor: true });
    this.settingsButton.setDepth(2000);
    this.settingsButton.setScrollFactor(0);
    
    this.settingsButton.on('pointerdown', () => {
      if (!this.isOpen) {
        this.open();
      }
    });
    
    // 创建面板容器（初始隐藏）
    this.createPanel();
  }
  
  createPanel() {
    this.container = this.scene.add.container(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2);
    this.container.setDepth(2500);
    this.container.setScrollFactor(0);
    this.container.setVisible(false);
    
    // 半透明遮罩
    const overlay = this.scene.add.rectangle(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT, 0x000000, 0.7);
    overlay.setOrigin(0.5);
    this.container.add(overlay);
    
    // 设置面板背景
    const panelBg = this.scene.add.rectangle(0, 0, 800, 600, 0x2c3e50);
    panelBg.setStrokeStyle(4, 0xffffff);
    this.container.add(panelBg);
    
    // 标题
    const title = this.scene.add.text(0, -240, '设置', {
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.container.add(title);
    
    // 背景音乐音量
    const bgmLabel = this.scene.add.text(-300, -120, '背景音乐:', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0, 0.5);
    this.container.add(bgmLabel);
    
    // BGM 音量条
    this.bgmSlider = this.createSlider(0, -120, CONFIG.AUDIO.BGM_VOLUME, true);
    
    // 游戏音效音量
    const sfxLabel = this.scene.add.text(-300, 20, '游戏音效:', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0, 0.5);
    this.container.add(sfxLabel);
    
    // SFX 音量条
    this.sfxSlider = this.createSlider(0, 20, CONFIG.AUDIO.SFX_VOLUME, false);
    
    // 关闭按钮
    const closeButton = this.scene.add.rectangle(0, 200, 200, 60, 0xe74c3c);
    closeButton.setInteractive({ useHandCursor: true });
    closeButton.setStrokeStyle(3, 0xffffff);
    this.container.add(closeButton);
    
    const closeText = this.scene.add.text(0, 200, '关闭', {
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.container.add(closeText);
    
    closeButton.on('pointerdown', () => {
      this.close();
    });
    
    // 点击遮罩关闭
    overlay.setInteractive();
    overlay.on('pointerdown', () => {
      this.close();
    });
  }
  
  createSlider(x, y, initialValue, isBGM) {
    // 滑块轨道
    const track = this.scene.add.rectangle(x + 50, y, 400, 10, 0x7f8c8d);
    this.container.add(track);
    
    // 滑块填充
    const fill = this.scene.add.rectangle(x + 50 - 200, y, 400 * initialValue, 10, 0x3498db);
    fill.setOrigin(0, 0.5);
    this.container.add(fill);
    
    // 滑块手柄
    const handle = this.scene.add.circle(x + 50 - 200 + 400 * initialValue, y, 20, 0xecf0f1);
    handle.setStrokeStyle(3, 0x2c3e50);
    handle.setInteractive({ useHandCursor: true, draggable: true });
    this.container.add(handle);
    
    // 音量文字
    const valueText = this.scene.add.text(x + 280, y, `${Math.round(initialValue * 100)}%`, {
      fontSize: '28px',
      color: '#ffffff'
    }).setOrigin(0, 0.5);
    this.container.add(valueText);
    
    // 拖动逻辑
    const dragHandler = (pointer, gameObject, dragX, dragY) => {
      if (gameObject === handle) {
        // 限制在轨道范围内
        const minX = x + 50 - 200;
        const maxX = x + 50 + 200;
        const clampedX = Phaser.Math.Clamp(dragX, minX, maxX);
        
        handle.x = clampedX;
        
        // 更新填充
        const fillWidth = clampedX - minX;
        fill.width = fillWidth;
        
        // 计算音量值 (0-1)
        const volume = fillWidth / 400;
        valueText.setText(`${Math.round(volume * 100)}%`);
        
        // 更新CONFIG并应用音量
        if (isBGM) {
          CONFIG.AUDIO.BGM_VOLUME = volume;
          if (this.scene.audioManager) {
            this.scene.audioManager.setBGMVolume(volume);
          }
        } else {
          CONFIG.AUDIO.SFX_VOLUME = volume;
          if (this.scene.audioManager) {
            this.scene.audioManager.setSFXVolume(volume);
          }
        }
      }
    };
    
    this.scene.input.on('drag', dragHandler);
    
    return { track, fill, handle, valueText, isBGM };
  }
  
  open() {
    this.isOpen = true;
    this.container.setVisible(true);
  }
  
  close() {
    this.isOpen = false;
    this.container.setVisible(false);
  }
  
  destroy() {
    if (this.settingsButton) this.settingsButton.destroy();
    if (this.container) this.container.destroy();
  }
}
