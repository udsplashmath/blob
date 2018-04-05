export default {
  gameWidth: 500,
  gameHeight: 500,
  scale: window.devicePixelRatio >= 2 ? 2 : 1,
  touch: is_touch_device()
};

function is_touch_device() {
  return "ontouchstart" in window
    || navigator.maxTouchPoints;
}