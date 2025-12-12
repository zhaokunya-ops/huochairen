import { CONFIG } from './config.js';

export class TapTapManager {
  constructor(scene) {
    this.scene = scene;
    this.user = null;
    this.room = null;
    this.players = [];
    
    // 初始化广告
    this.initAds();
    
    // 检查登录状态
    this.checkLoginStatus();
  }
  
  // 检查登录状态
  checkLoginStatus() {
    const userData = localStorage.getItem('taptapUser');
    if (userData) {
      this.user = JSON.parse(userData);
      this.scene.events.emit('taptapLoginSuccess', this.user);
    }
  }
  
  // 广告管理工具类
class AdManager {
  constructor(scene) {
    this.scene = scene;
    this.bannerAd = null;
    this.interstitialAd = null;
    this.rewardAd = null;
    
    // 初始化广告
    if (CONFIG.ADS.ENABLED) {
      this.initAds();
    }
  }
  
  // 初始化广告
  initAds() {
    if (window.adSDK && window.adSDK.init) {
      window.adSDK.init({
        appId: CONFIG.ADS.APP_ID,
        onInit: () => {
          console.log('广告初始化完成');
          if (CONFIG.ADS.BANNER_ENABLED) {
            this.createBannerAd();
          }
        }
      });
    }
  }
  
  // 创建横幅广告
  createBannerAd() {
    if (!CONFIG.ADS.BANNER_ENABLED) return;
    
    const bannerHeight = 120;
    this.bannerAd = window.adSDK.createBannerAd({
      adUnitId: CONFIG.ADS.BANNER_ID,
      style: {
        left: 0,
        top: CONFIG.HEIGHT - bannerHeight,
        width: CONFIG.WIDTH,
        height: bannerHeight
      }
    });
    
    this.bannerAd.onLoad(() => {
      console.log('横幅广告加载完成');
      this.bannerAd.show();
    });
    
    this.bannerAd.onError((err) => {
      console.error('横幅广告错误:', err);
    });
  }
  
  // 隐藏横幅广告
  hideBannerAd() {
    if (this.bannerAd && CONFIG.ADS.BANNER_ENABLED) {
      this.bannerAd.hide();
    }
  }
  
  // 显示横幅广告
  showBannerAd() {
    if (this.bannerAd && CONFIG.ADS.BANNER_ENABLED) {
      this.bannerAd.show();
    }
  }
  
  // 加载插屏广告
  loadInterstitialAd() {
    if (!CONFIG.ADS.INTERSTITIAL_ENABLED) return;
    
    this.interstitialAd = window.adSDK.createInterstitialAd({
      adUnitId: CONFIG.ADS.INTERSTITIAL_ID
    });
    
    this.interstitialAd.onLoad(() => {
      console.log('插屏广告加载完成');
    });
    
    this.interstitialAd.onError((err) => {
      console.error('插屏广告错误:', err);
    });
  }
  
  // 显示插屏广告
  showInterstitialAd() {
    if (this.interstitialAd && CONFIG.ADS.INTERSTITIAL_ENABLED) {
      this.interstitialAd.show().catch(err => {
        console.error('插屏广告显示失败:', err);
        // 显示失败时重新加载
        this.loadInterstitialAd();
      });
    } else {
      this.loadInterstitialAd();
    }
  }
  
  // 加载激励视频广告
  loadRewardAd() {
    if (!CONFIG.ADS.REWARD_ENABLED) return;
    
    this.rewardAd = window.adSDK.createRewardedVideoAd({
      adUnitId: CONFIG.ADS.REWARD_ID
    });
    
    this.rewardAd.onLoad(() => {
      console.log('激励广告加载完成');
    });
    
    this.rewardAd.onError((err) => {
      console.error('激励广告错误:', err);
    });
  }
  
  // 显示激励视频广告
  showRewardAd(onSuccess, onFail) {
    if (this.rewardAd && CONFIG.ADS.REWARD_ENABLED) {
      this.rewardAd.show().then(() => {
        console.log('激励广告显示成功');
        this.rewardAd.onClose(res => {
          if (res && res.isEnded) {
            // 广告播放完成
            onSuccess && onSuccess();
          } else {
            // 广告未播放完成
            onFail && onFail();
          }
          // 重新加载广告
          this.loadRewardAd();
        });
      }).catch(err => {
        console.error('激励广告显示失败:', err);
        onFail && onFail();
        this.loadRewardAd();
      });
    } else {
      this.loadRewardAd();
      onFail && onFail();
    }
  }
}
  
  // 创建房间
  createRoom(roomName, maxPlayers = 2) {
    return new Promise((resolve, reject) => {
      if (!this.user) {
        reject('请先登录');
        return;
      }
      
      window.TapTapSDK.createRoom({
        roomName,
        maxPlayers,
        serverId: '1' // 服务器ID，根据实际情况设置
      }).then((room) => {
        this.room = room;
        this.players = [this.user];
        this.setupRoomListeners();
        resolve(room);
      }).catch(reject);
    });
  }
  
  // 加入房间
  joinRoom(roomId) {
    return new Promise((resolve, reject) => {
      if (!this.user) {
        reject('请先登录');
        return;
      }
      
      window.TapTapSDK.joinRoom(roomId).then((room) => {
        this.room = room;
        this.players = room.players;
        this.setupRoomListeners();
        resolve(room);
      }).catch(reject);
    });
  }
  
  // 设置房间监听器
  setupRoomListeners() {
    if (!this.room) return;
    
    // 玩家加入
    this.room.on('playerJoin', (player) => {
      this.players.push(player);
      this.scene.events.emit('multiplayerPlayerJoin', player);
    });
    
    // 玩家离开
    this.room.on('playerLeave', (playerId) => {
      this.players = this.players.filter(p => p.id !== playerId);
      this.scene.events.emit('multiplayerPlayerLeave', playerId);
    });
    
    // 接收消息
    this.room.on('message', (data, senderId) => {
      this.scene.events.emit('multiplayerMessage', data, senderId);
    });
    
    // 房间关闭
    this.room.on('close', () => {
      this.scene.events.emit('multiplayerRoomClose');
      this.room = null;
      this.players = [];
    });
  }
  
  // 发送消息
  sendMessage(data) {
    if (this.room) {
      this.room.send(data);
    }
  }
  
  // 离开房间
  leaveRoom() {
    if (this.room) {
      this.room.leave();
      this.room = null;
      this.players = [];
    }
  }
  
  // 销毁
  destroy() {
    // 隐藏广告
    this.hideBannerAd();
    
    // 离开房间
    this.leaveRoom();
  }
}