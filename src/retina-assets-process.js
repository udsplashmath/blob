import Phaser from "phaser-ce";

import config from "./config";

export default function(game, callback) {

  if (config.scale < 2) return (callback && callback());

  var keys = game.cache.getKeys();
  
  processImages(game, keys.slice(), callback);
}

function processImages(game, keys, callback) {
  if (!keys || !keys.length) {
    callback && callback();
    return;
  }
  const key = keys.shift();
  const sprite = new Phaser.Sprite(game, 0, 0, key);
  
  const bmpAsset = new Phaser.BitmapData(game, `${key}-bitmap`, sprite.width, sprite.height);
  
  bmpAsset.draw(sprite, 0, 0, sprite.width / 2, sprite.height / 2);
  
  bmpAsset.generateTexture(key, () => {
    bmpAsset.destroy();
    processImages(game, keys, callback);
  });
}