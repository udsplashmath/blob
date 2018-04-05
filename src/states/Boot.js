import Phaser from "phaser-ce";

class BootState extends Phaser.State {
  constructor(game) {
    super(game);
  }

  preload() {
    this.load.image("preloaderBar", "assets/preload.png");
  }

  create() {

    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

    this.physics.startSystem(Phaser.Physics.ARCADE);
    this.world.setBounds(0, 0, this.game.width, this.game.height);

    this.state.start("Splash");
  }

  update() {
    
  }
}

export default BootState;