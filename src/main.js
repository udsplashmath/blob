import Phaser from "phaser-ce";

import BootState from "./states/Boot";
import SplashState from "./states/Splash";
import GameState from "./states/Game";

import config from "./config";

class Game extends Phaser.Game {
  constructor() {

    const gameConfig = {
      width: config.gameWidth,
      height: config.gameHeight,
      renderer: Phaser.CANVAS,
      parent: "game-cont",
      state: null
    };

    super(gameConfig);

    this.state.add("Boot", BootState, false);
    this.state.add("Splash", SplashState, false);
    this.state.add("Game", GameState, false);

    this.state.start("Boot");
  }
}

window.game = new Game();
