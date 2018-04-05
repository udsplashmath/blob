import gameAssets from "./asset-pack";

import config from "./config";

const assetsPath = config.scale == 2 ? "assets_retina" : "assets";

gameAssets.forEach(asset => {
  asset.url = `${assetsPath}/${asset.url}`;
});

export default {
  gameAssets
};