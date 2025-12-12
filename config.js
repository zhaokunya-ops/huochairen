// 游戏配置常量
export const CONFIG = {
  // 游戏尺寸（横屏）
  WIDTH: 1920,
  HEIGHT: 1080,
  
  // 世界尺寸（背景大小）
  WORLD_WIDTH: 3840,  // 2倍宽度
  WORLD_HEIGHT: 2160, // 2倍高度
  
  // 可移动区域（背景下半部分，更靠下）
  PLAYABLE_Y_MIN: 1300, // 从背景中间往下一些
  PLAYABLE_Y_MAX: 2060, // 到背景底部留100像素
  
  // 全局文字偏移（避免顶部遮挡）
  TEXT_OFFSET_Y: 10,
  
  // 玩家设置
  PLAYER: {
    START_X: 1920, // 世界中心X
    START_Y: 1680, // 可移动区域中间
    SPEED: 300,
    HEALTH: 1000, // 玩家血量
    ATTACK_DAMAGE: 10,
    ATTACK_RANGE: 100,
    ATTACK_COOLDOWN: 300, // 毫秒 (从500减少到300，提升攻击速度)
    SCALE: 0.3
  },
  
  // 敌人设置
  ENEMY: {
    START_X: 2400, // 相对于世界中心偏右
    START_Y: 1680, // 可移动区域中间
    SPEED: 250,
    HEALTH: 200, // 敌人血量：翻一倍（100→200）
    ATTACK_DAMAGE: 8,
    ATTACK_RANGE: 100,
    ATTACK_COOLDOWN: 600,
    SCALE: 0.3
  },
  
  // 武器设置
  WEAPONS: {
    SWORD: {
      name: 'sword',
      damage: 20, // 基础伤害10 + 武器伤害10 = 20
      range: 120,
      cooldown: 250 // 快速攻击 (从400减少到250)
    },
    BAT: {
      name: 'bat',
      damage: 15, // 基础伤害10 + 武器伤害5 = 15
      range: 100,
      cooldown: 250 // 快速攻击 (从400减少到250)
    },
    HAMMER: {
      name: 'hammer',
      damage: 25, // 基础伤害10 + 武器伤害15 = 25
      range: 90,
      cooldown: 400 // 重武器稍慢 (从600减少到400)
    }
  },
  
  // 武器生成设置
  WEAPON_SPAWN: {
    MIN_INTERVAL: 8000, // 最小生成间隔（降低概率）
    MAX_INTERVAL: 15000, // 最大生成间隔（降低概率）
    DESPAWN_TIME: 8000, // 武器消失时间
    SCALE: 0.25 // 增大显示（0.15→0.25）
  },
  
  // 道具设置
  PICKUPS: {
    HEALTH: {
      name: 'health',
      restoreAmount: 500, // 回复500血量
      scale: 0.3 // 增大显示（0.2→0.3）
    },
    SPAWN: {
      MIN_INTERVAL: 6000, // 最小生成间隔（降低概率）
      MAX_INTERVAL: 12000, // 最大生成间隔（降低概率）
      DESPAWN_TIME: 10000 // 道具消失时间
    }
  },
  
  // 伤害道具设置
  DAMAGE_PICKUP: {
    DAMAGE_INCREASE: 5, // 伤害增加值
    DURATION: 30000, // 持续时间30秒
    SCALE: 0.3, // 增大显示
    SPAWN: {
      MIN_INTERVAL: 20000, // 最小生成间隔（降低概率）
      MAX_INTERVAL: 35000, // 最大生成间隔（降低概率）
      DESPAWN_TIME: 12000 // 道具消失时间12秒
    }
  },
  
  // 游戏模式
  GAME_MODE: {
    ONE_VS_ONE: '1v1',
    STAGE: 'stage' // 闯关模式
  },
  
  // 闯关模式设置
  STAGE_MODE: {
    INITIAL_ENEMIES: 3, // 第一关敌人数
    ENEMIES_INCREMENT: 1, // 每关敌人数增加
    MAX_BATCH_SIZE: 5, // 每批最多敌人数
    MIN_BATCH_SIZE: 1, // 每批最少敌人数
    ENEMY_SPAWN_DELAY: 2000, // 击败一批后下批出现延迟
    WAVE_SPAWN_INTERVAL: 500, // 同批敌人间隔生成时间
    HEALTH_RESTORE_PERCENT: 30, // 击败一关后恢复血量百分比
    DIFFICULTY_INCREASE: 1.05, // 每关敌人属性提升倍数
    MAX_DIFFICULTY: 3.0 // 最大难度倍数
  },
  
  // 控制设置
  JOYSTICK: {
    X: 200,
    Y: 880,
    RADIUS: 80,
    BASE_ALPHA: 0.5,
    THUMB_ALPHA: 0.8
  },
  
  ATTACK_BUTTON: {
    X: 1720,
    Y: 880,
    RADIUS: 80,
    ALPHA: 0.6
  },
  
  // 广告设置（全局开关 - 在代码中配置，不在游戏界面显示）
  ADS: {
    ENABLED: true, // 主开关 - 修改此处控制所有广告开关
    BANNER_ENABLED: true, // 横幅广告
    REWARD_ENABLED: true, // 奖励广告
    INTERSTITIAL_ENABLED: true, // 插页广告
    REVIVE_ENABLED: true // 复活广告
  },
  
  // 复活设置
  REVIVE: {
    HEALTH_AFTER_REVIVE: 500, // 复活后血量
    MAX_REVIVES_PER_GAME: 1 // 每局最大复活次数
  },
  
  // 竞技场背景列表
  ARENAS: [
    'arena',          // 原始竞技场
    'arena-city',     // 赛博朋克城市
    'arena-dojo',     // 日式道场
    'arena-rooftop',  // 城市天台
    'arena-forest'    // 魔法森林
  ],
  
  // 音频设置
  AUDIO: {
    ENABLED: true, // 音频总开关 - false关/true开
    BGM_VOLUME: 0.4, // 背景音乐音量 (0-1)
    SFX_VOLUME: 0.6, // 音效音量 (0-1)
    
    // 音频文件路径（存放在wav文件夹）
    BGM: 'bgm', // 背景音乐
    HIT: 'hit', // 打击音效
    HURT: 'hurt', // 被攻击音效
    FOOTSTEP: 'footstep', // 脚步声
    PICKUP: 'pickup', // 拾取音效
    DEATH: 'death', // 死亡音效
    VICTORY: 'victory', // 胜利音效
    DEFEAT: 'defeat' // 失败音效
  }
};

// 游戏状态管理
export class GameState {
  constructor() {
    this.totalGames = 0;
    this.wins = 0;
    this.losses = 0;
    this.totalKills = 0;
    this.totalDeaths = 0;
    this.currentGameKills = 0;
    this.currentGameDeaths = 0;
    this.hasRewardWeapon = false;
    this.rewardWeapon = null;
    this.revivesUsed = 0; // 新增：已使用复活次数
    
    // 游戏模式
    this.gameMode = CONFIG.GAME_MODE.ONE_VS_ONE;
    
    // 闯关模式统计
    this.currentStage = 1; // 当前关卡
    this.stageKills = 0; // 当前关卡击杀数
    this.bestStage = 0; // 最高关卡记录
  }
  
  reset() {
    this.currentGameKills = 0;
    this.currentGameDeaths = 0;
    this.hasRewardWeapon = false;
    this.rewardWeapon = null;
    this.revivesUsed = 0; // 重置复活次数
    // 只在1V1模式或新开始闯关时重置currentStage
    // 如果在闯关模式中且currentStage > 1，保持不变（继续闯关）
    if (this.gameMode === CONFIG.GAME_MODE.ONE_VS_ONE || this.currentStage === 1) {
      this.currentStage = 1;
    }
    this.stageKills = 0;
  }
  
  resetStageProgress() {
    // 完全重置闯关模式进度
    this.currentStage = 1;
    this.stageKills = 0;
    this.bestStage = 0;
  }
  
  endGame(playerWon) {
    this.totalGames++;
    if (playerWon) {
      this.wins++;
      this.totalKills++;
    } else {
      this.losses++;
      this.totalDeaths++;
    }
    
    // 更新闯关模式最佳成绩
    if (this.gameMode === CONFIG.GAME_MODE.STAGE) {
      if (this.currentStage > this.bestStage) {
        this.bestStage = this.currentStage;
      }
    }
  }
  
  getWinRate() {
    if (this.totalGames === 0) return 0;
    return Math.round((this.wins / this.totalGames) * 100);
  }
  
  setRewardWeapon(weapon) {
    this.hasRewardWeapon = true;
    this.rewardWeapon = weapon;
  }
  
  setGameMode(mode) {
    this.gameMode = mode;
  }
  
  // 新增：检查是否可以复活
  canRevive() {
    return this.revivesUsed < CONFIG.REVIVE.MAX_REVIVES_PER_GAME;
  }
  
  // 新增：使用一次复活机会
  useRevive() {
    this.revivesUsed++;
  }
}

// 全局游戏状态实例
export const gameState = new GameState();