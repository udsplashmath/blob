import Phaser from "phaser-ce";

import assetData from "../asset-data";
import retinaAssetsProcess from "../retina-assets-process";


class SplashState extends Phaser.State {
  constructor(game) {
    super(game);
  }

  preload() {
    this.preloadBar = this.add.sprite(0, 100, "preloaderBar");
    this.preloadBar.anchor.setTo(0, 0.5);
    this.preloadBar.position.setTo(
      this.world.centerX - this.preloadBar.width / 2,
      this.world.centerY
    );
    this.preloadBar.width = 0;

    addProgressOuter(this.game, this.preloadBar.position.x, this.preloadBar.position.y - 16);

    this.load.pack("gameAssets", undefined, assetData);
    
  }
  
  create() {
    retinaAssetsProcess(this.game, () => {
      this.state.start("Game");
    });
  }

  loadUpdate() {

    if (this.preloadTween) return;
    
    const width = (this.preloadBar.texture.width / 100) * this.load.progress;
    this.preloadTween = this.add.tween(this.preloadBar).to({ width }, 200, "Linear");
    this.preloadTween.onComplete.addOnce(() => this.preloadTween = null);
    this.preloadTween.start();
  }
}

export default SplashState;

function addProgressOuter(game, x, y) {
  var graphics = game.add.graphics(x, y);

  graphics.lineStyle(1, 0xffffff, 1);
  graphics.moveTo(0, 0);
  graphics.lineTo(400, 0);
  graphics.lineTo(400, 32);
  graphics.lineTo(0, 32);
  graphics.lineTo(0, 0);

}