import { CONFIG } from './config.js';

export class AudioManager {
  constructor(scene) {
    this.scene = scene;
    this.bgm = null;
    this.sounds = {};
    this.footstepTimer = null;
    this.lastFootstepTime = 0;
  }
  
  // 加载所有音频（在BootScene的preload中调用）
  static preloadAudio(scene) {
    if (!CONFIG.AUDIO.ENABLED) return;
    
    // 加载背景音乐（从assets文件夹）
    scene.load.audio(CONFIG.AUDIO.BGM, 'assets/bgm.mp3');
    
    // 加载音效
    scene.load.audio(CONFIG.AUDIO.HIT, 'wav/hit.wav');
    scene.load.audio(CONFIG.AUDIO.HURT, 'wav/hurt.wav');
    scene.load.audio(CONFIG.AUDIO.FOOTSTEP, 'wav/footstep.wav');
    scene.load.audio(CONFIG.AUDIO.PICKUP, 'wav/pickup.wav');
    scene.load.audio(CONFIG.AUDIO.DEATH, 'wav/death.wav');
    scene.load.audio(CONFIG.AUDIO.DEFEAT, 'wav/defeat.wav');
    scene.load.audio(CONFIG.AUDIO.VICTORY, 'wav/victory.wav');
  }
  
  // 初始化音频（在场景create中调用）
  init() {
    if (!CONFIG.AUDIO.ENABLED) return;
    
    try {
      // 创建背景音乐（如果已存在则获取现有的）
      if (!this.bgm) {
        const existingBGM = this.scene.sound.get(CONFIG.AUDIO.BGM);
        if (existingBGM) {
          this.bgm = existingBGM;
        } else {
          this.bgm = this.scene.sound.add(CONFIG.AUDIO.BGM, {
            volume: CONFIG.AUDIO.BGM_VOLUME,
            loop: true
          });
        }
      }
      
      // 创建音效（如果已存在则获取现有的）
      const soundKeys = [
        CONFIG.AUDIO.HIT,
        CONFIG.AUDIO.HURT,
        CONFIG.AUDIO.FOOTSTEP,
        CONFIG.AUDIO.PICKUP,
        CONFIG.AUDIO.DEATH,
        CONFIG.AUDIO.VICTORY,
        CONFIG.AUDIO.DEFEAT
      ];
      
      soundKeys.forEach(key => {
        if (!this.sounds[key]) {
          const existingSound = this.scene.sound.get(key);
          if (existingSound) {
            this.sounds[key] = existingSound;
          } else {
            this.sounds[key] = this.scene.sound.add(key, {
              volume: CONFIG.AUDIO.SFX_VOLUME
            });
          }
        }
      });
    } catch (error) {
      console.warn('AudioManager: Failed to initialize audio', error);
    }
  }
  
  // 播放背景音乐
  playBGM() {
    if (!CONFIG.AUDIO.ENABLED || !this.bgm) return;
    
    try {
      if (!this.bgm.isPlaying) {
        this.bgm.play();
      }
    } catch (error) {
      console.warn('AudioManager: Failed to play BGM', error);
    }
  }
  
  // 停止背景音乐
  stopBGM() {
    if (!CONFIG.AUDIO.ENABLED || !this.bgm) return;
    
    try {
      if (this.bgm.isPlaying) {
        this.bgm.stop();
      }
    } catch (error) {
      console.warn('AudioManager: Failed to stop BGM', error);
    }
  }
  
  // 播放打击音效
  playHit() {
    this.playSound(CONFIG.AUDIO.HIT);
  }
  
  // 播放受伤音效
  playHurt() {
    this.playSound(CONFIG.AUDIO.HURT);
  }
  
  // 播放脚步声（带防抖，避免过于频繁）
  playFootstep() {
    if (!CONFIG.AUDIO.ENABLED) return;
    
    const now = Date.now();
    // 脚步声至少间隔300ms
    if (now - this.lastFootstepTime > 300) {
      this.playSound(CONFIG.AUDIO.FOOTSTEP);
      this.lastFootstepTime = now;
    }
  }
  
  // 播放拾取音效
  playPickup() {
    this.playSound(CONFIG.AUDIO.PICKUP);
  }
  
  // 播放死亡音效
  playDeath() {
    this.playSound(CONFIG.AUDIO.DEATH);
  }
  
  // 播放胜利音效
  playVictory() {
    this.playSound(CONFIG.AUDIO.VICTORY);
    this.stopBGM(); // 停止背景音乐
  }
  
  // 播放失败音效
  playDefeat() {
    this.playSound(CONFIG.AUDIO.DEFEAT);
    this.stopBGM(); // 停止背景音乐
  }
  
  // 播放音效的通用方法
  playSound(soundKey) {
    if (!CONFIG.AUDIO.ENABLED) return;
    
    try {
      const sound = this.sounds[soundKey];
      if (sound && !sound.isPlaying) {
        sound.play();
      }
    } catch (error) {
      console.warn(`AudioManager: Failed to play sound ${soundKey}`, error);
    }
  }
  
  // 设置背景音乐音量
  setBGMVolume(volume) {
    if (this.bgm) {
      this.bgm.setVolume(Math.max(0, Math.min(1, volume)));
    }
  }
  
  // 设置音效音量
  setSFXVolume(volume) {
    Object.values(this.sounds).forEach(sound => {
      if (sound) {
        sound.setVolume(Math.max(0, Math.min(1, volume)));
      }
    });
  }
  
  // 清理
  destroy() {
    this.stopBGM();
    
    if (this.bgm) {
      this.bgm.destroy();
      this.bgm = null;
    }
    
    Object.values(this.sounds).forEach(sound => {
      if (sound) {
        sound.destroy();
      }
    });
    
    this.sounds = {};
  }
}
