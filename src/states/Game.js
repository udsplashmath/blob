import Phaser from "phaser-ce";

class GameState extends Phaser.State {
  constructor(game) {
    super(game);
  }

  preload() {
    game.time.advancedTiming = true;
    game.load.image('ball', 'assets/red_ball.png');
    this.blob = game.add.group()
    this.graphics = game.add.graphics(0, 0);
    this.graphics.lineStyle(8, 0xffd900);
    this.jumpTimer = 0
  }

  create() {
    game.physics.startSystem(Phaser.Physics.P2JS);
    game.physics.p2.gravity.y = 200
    game.physics.p2.restitution = 1.0;
    this.centerX = 250
    this.centerY = 250
    this.r = 100
    this.noBalls = 20
    this.createBlob()
    this.blob.setAll('body.bounce', -1)
    this.line = false
    this.jumpButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
  }

  update() {
    this.graphics.clear()
    var last = false
    var first = false

    this.blob.forEach(element => {
      if(element.name == "side" && last){
        if(!last){
          last = element
          first = element
        }
        else if(last.name != "center"){
          this.graphics.lineStyle(2, 0x33FF00);
          this.graphics.moveTo(last.x, last.y);
          this.graphics.lineTo(element.x, element.y);
        }
      }
      last = element
    });
    if(this.blob.length == this.noBalls+1){
      console.log(this.blob.children[0].name)
    this.graphics.lineStyle(2, 0x33FF00);
    this.graphics.moveTo(this.blob.children[1].x, this.blob.children[1].y);
    this.graphics.lineTo(this.blob.children[this.blob.length - 1].x, this.blob.children[this.blob.length - 1].y)
    }

    if (this.jumpButton.isDown && game.time.now > this.jumpTimer)
    {
        this.blob.setAll('body.velocity.y', -250)
        this.jumpTimer = game.time.now + 750;
}
  }

  render() {
    game.debug.text(this.game.time.fps || '--', 2, 14, "#00ff00");
    game.debug.geom(this.line);
  }

  createBlob(){
    var centerBall = game.add.sprite(this.centerX, this.centerY, 'ball');
    centerBall.visible = false
    game.physics.p2.enable(centerBall);
    centerBall.name = "center"
    centerBall.body.collideWorldBounds = true
    this.blob.add(centerBall)
    var lastBall = false
    var firstBall = false
    for (let index = 0; index < this.noBalls; index++) {
      var newBall = game.add.sprite(this.centerX + this.r * Math.cos(index * 2 * Math.PI/this.noBalls),
        this.centerY + this.r * Math.sin(index * 2 * Math.PI/this.noBalls), 'ball')
      newBall.visible = false
      game.physics.p2.enable(newBall);
      newBall.body.collideWorldBounds = true
      var spring = game.physics.p2.createSpring(centerBall, newBall, this.r, 100, 10);
      if (!lastBall) {
        lastBall = newBall
        firstBall = newBall
      }
      else{
        var spring = game.physics.p2.createSpring(lastBall, newBall, 2 * this.r * Math.sin(Math.PI/this.noBalls), 50, 20);
      }
      if(index == this.noBalls - 1){
        var spring = game.physics.p2.createSpring(newBall, firstBall, 2 * this.r * Math.sin(Math.PI/this.noBalls), 50, 20);        
      }
      lastBall = newBall
      newBall.name = "side"
      this.blob.add(newBall)
    }
  }
  

}

export default GameState;
