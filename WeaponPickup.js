import { CONFIG } from './config.js';

export class WeaponPickup {
  constructor(scene, weaponType) {
    this.scene = scene;
    this.weaponData = CONFIG.WEAPONS[weaponType];
    this.pickedUp = false;
    
    // 在世界下半部分随机生成
    const x = Phaser.Math.Between(CONFIG.WIDTH / 2, CONFIG.WORLD_WIDTH - CONFIG.WIDTH / 2);
    const y = Phaser.Math.Between(CONFIG.PLAYABLE_Y_MIN, CONFIG.PLAYABLE_Y_MAX);
    
    this.sprite = scene.add.image(
      x,
      y,
      `weapon-${this.weaponData.name}`
    );
    this.sprite.setScale(CONFIG.WEAPON_SPAWN.SCALE);
    
    // 发光效果
    this.glowTween = scene.tweens.add({
      targets: this.sprite,
      scaleX: CONFIG.WEAPON_SPAWN.SCALE * 1.2,
      scaleY: CONFIG.WEAPON_SPAWN.SCALE * 1.2,
      alpha: 0.7,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // 轻微浮动效果
    this.floatTween = scene.tweens.add({
      targets: this.sprite,
      y: this.sprite.y - 20,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // 提示文字
    this.text = scene.add.text(this.sprite.x, this.sprite.y - 60, '武器!', {
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    // 文字闪烁
    this.textTween = scene.tweens.add({
      targets: this.text,
      alpha: 0.5,
      duration: 500,
      yoyo: true,
      repeat: -1
    });
  }
  
  checkPickup(fighter) {
    if (this.pickedUp) return false;
    
    const distance = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y,
      fighter.sprite.x, fighter.sprite.y
    );
    
    if (distance < 80) {
      fighter.pickupWeapon(this.weaponData);
      this.destroy();
      return true;
    }
    
    return false;
  }
  
  destroy() {
    this.pickedUp = true;
    
    if (this.glowTween) this.glowTween.stop();
    if (this.floatTween) this.floatTween.stop();
    if (this.textTween) this.textTween.stop();
    
    if (this.sprite) this.sprite.destroy();
    if (this.text) this.text.destroy();
  }
}
