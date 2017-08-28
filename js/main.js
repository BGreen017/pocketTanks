$(document).ready(function() {
  var $title = $('#title');
  var player1 = "Player 1";
  var player2 = "Player 2";
  var game;
  var deduction = (Math.random() * 40) + 20;
  // parameters for terrain generation
  var STEP_MAX = 1.5;
  var STEP_CHANGE = 1.0;
  var HEIGHT_MAX = 480;

  // starting conditions
  var height = (Math.random() * (360 - 200)) + 200;
  var slope = (Math.random() * STEP_MAX) * 2 - STEP_MAX;

  // open instructions on click
  $('#instructions').on('click', function(event) {
    $('#instructions').css('display', 'none');
    $('#rules').css('display', 'block');

  });
  // open player 1 name div
  $('#start').on('click', function(event) {
    $('#rules').css('display', 'none');
    $('#player1').css('display', 'block');
  });
  // open player 2 name div
  $('#p1name').on('click', function(event) {
    event.preventDefault();
    $('#player1').css('display', 'none');
    $('#player2').css('display', 'block');
    player1 = $('#p1').val();
  });
  // open game
  $('#p2name').on('click', function(event) {
    event.preventDefault();
    $title.css('display', 'none');
    $('#player2').css('display', 'none');
    player2 = $('#p2').val();
    startGame();
  });

  // function for creating new players, allows for easy management of a player's variables
  function Player(){
    //tank 1
    this.tank = null;
    this.turret = null;
    this.flame = null;
    this.bullet = null;

    // text for tank 1
    this.power = 300;
    this.powerText = null;
    this.angleText = null;
    this.score = 0;
    this.scoreText = null;
    this.nameText = null;

    // fake invisible tank for arcade physics
    this.fakeTank = null;
  }
  // function for creating game
  function startGame(){
    game = new Phaser.Game(640, 480, Phaser.CANVAS, 'game');

    var PhaserGame = function(game) {

      this.player1 = new Player();
      this.player2 = new Player();

      // background
      this.background = null;
      this.land = null;
      this.emitter = null;

      // text for volley
      this.volley = 1;
      this.volleyText = null;

      // controls
      this.cursors = null;
      this.cursors2 = null;
      this.fireButton = null;

      // flag to determine which turn
      this.player1Turn = true;
    };

    // all functions in this prototype are called from phaser.io to set up the game
    PhaserGame.prototype = {
      init: function() {
        this.game.renderer.renderSession.roundPixels = true;

        this.game.world.setBounds(0, 0, 640, 480);
        this.physics.startSystem(Phaser.Physics.ARCADE);
        this.physics.startSystem(Phaser.Physics.P2JS);
        this.physics.p2.gravity.y = 200;
        this.physics.arcade.gravity.y = 200;
      },
      preload: function() {
        //  Need this because can fetch assets from Amazon S3
        //  Remove the next 2 lines if running locally
        this.load.baseURL = 'http://files.phaser.io.s3.amazonaws.com/codingtips/issue002/';
        this.load.crossOrigin = 'anonymous';

        this.load.image('tank', 'assets/tank.png');
        this.load.image('turret', 'assets/turret.png');
        this.load.image('bullet', 'assets/bullet.png');
        this.load.image('background', 'assets/background.png');
        this.load.image('flame', 'assets/flame.png');
        this.load.image('target', 'assets/target.png');
        this.load.image('land', 'assets/land.png');

        //  Note: Graphics from Amiga Tanx Copyright 1991 Gary Roberts
      },
      create: function() {
        // scaling option
        this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

        // have the game centered horizontally and/or vertically depending on screen size
        this.scale.pageAlignHorizontally = true;
        this.scale.pageAlignVertically = true;

        //  Simple but pretty background
        this.background = this.add.sprite(0, 0, 'background');

        //  The land is a BitmapData the size of the game world
        //  We draw the 'lang.png' to it then add it to the world
        this.land = this.add.bitmapData(640, 480);
        if (height > 480 || height < 200) {
          height = 360;
        }

          // creating the landscape
         for (var x = 0; x < 640; x++) {
              // change height and slope
              height += slope;
              slope += (Math.random() * STEP_CHANGE) * 2 - STEP_CHANGE;

              // clip height and slope to maximum
              if (slope > STEP_MAX) { slope = STEP_MAX };
              if (slope < -STEP_MAX) { slope = -STEP_MAX };

              if (height > HEIGHT_MAX) {
                  height = HEIGHT_MAX;
                  slope *= -1;
              }
              if (height < 0) {
                  height = 0;
                  slope *= -1;
              }
              this.land.context.strokeStyle = "#014421";
              // draw column
              this.land.context.beginPath();
              this.land.context.moveTo(x, HEIGHT_MAX);
              this.land.context.lineTo(x, height);
              this.land.context.stroke();
         }
        //this.land.draw('land');
        this.land.update();
        this.land.addToWorld();
        game.physics.p2.enable(this.land);


        for (var i = 1; i < 3; i++) {
          // bullets
          this[`player${i}`].bullet = this.add.sprite(0, 0, 'bullet');
          this[`player${i}`].bullet.exists = false;
          this.physics.arcade.enable(this[`player${i}`].bullet);
          // flames
          this[`player${i}`].flame = this.add.sprite(0, 0, 'flame');
          this[`player${i}`].flame.anchor.set(0.5);
          this[`player${i}`].flame.visible = false;
          // power text
          this[`player${i}`].powerText = this.add.text((i === 1 ? 8 : 530), 24, 'Power: 300', {
            font: "18px 'Work Sans', sans-serif",
            fill: "#000000"
          });
          this[`player${i}`].powerText.setShadow(1, 1, 'rgba(0, 0, 0, 0.8)', 1);
          this[`player${i}`].powerText.fixedToCamera = true;
          // angle text
          this[`player${i}`].angleText = this.add.text((i === 1 ? 8 : 530), 40, (i === 1 ? 'Angle: 0' : 'Angle: 180'), {
            font: "18px 'Work Sans', sans-serif",
            fill: "#000000"
          });
          this[`player${i}`].angleText.setShadow(1, 1, 'rgba(0, 0, 0, 0.8)', 1);
          this[`player${i}`].angleText.fixedToCamera = true;
          // score text
          this[`player${i}`].scoreText = this.add.text((i === 1 ? 8 : 530), 56, 'Score: 0', {
            font: "18px 'Work Sans', sans-serif",
            fill: "#000000"
          });
          this[`player${i}`].scoreText.setShadow(1, 1, 'rgba(0, 0, 0, 0.8)', 1);
          this[`player${i}`].scoreText.fixedToCamera = true;
          // name text
          this[`player${i}`].nameText = this.add.text((i === 1 ? 8 : 530), 8, (i === 1 ? `${player1}` : `${player2}`), {
            font: "18px 'Work Sans', sans-serif",
            fill: "#000000"
          });
          this[`player${i}`].nameText.setShadow(1, 1, 'rgba(0, 0, 0, 0.8)', 1);
          this[`player${i}`].nameText.fixedToCamera = true;
        }

        // //  A small burst of particles when a target is hit
        this.emitter = this.add.emitter(0, 0, 30);
        this.emitter.makeParticles('flame');
        this.emitter.setXSpeed(-120, 120);
        this.emitter.setYSpeed(-100, -200);
        this.emitter.setRotation();

        //  The body of the tank
        this.player1.tank = this.add.sprite(24, 100, 'tank');
        this.player2.tank = this.add.sprite(456, 100, 'tank');
        this.player1.fakeTank = this.add.sprite(24, 100, 'tank');
        this.player2.fakeTank = this.add.sprite(456, 100, 'tank');
        this.player1.fakeTank.visible = false;
        this.player2.fakeTank.visible = false;
        game.physics.arcade.enable(this.player1.tank);
        game.physics.arcade.enable(this.player2.tank);

        game.physics.p2.enable(this.player1.tank);
        this.player1.tank.body.allowGravity = false;
        this.player1.tank.body.collideWorldBounds = true;
        console.log(this.player1.tank.body);

        game.physics.p2.enable(this.player2.tank);
        this.player2.tank.body.allowGravity = false;
        this.player2.tank.body.collideWorldBounds = true;


        //  The turret which we rotate (offset 30x14 from the tank)
        this.player1.turret = this.add.sprite(this.player1.tank.x + 30, this.player1.tank.y + 14, 'turret');
        this.player2.turret = this.add.sprite(this.player2.tank.x + 30, this.player2.tank.y + 14, 'turret');
        this.player1.turret.visible = false;
        this.player2.turret.visible = false;
        this.player2.turret.angle = 180;

        this.volleyText = this.add.text(260, 8, 'Volley Number: 1', {
          font: "18px Arial",
          fill: "#ffffff"
        });
        this.volleyText.setShadow(1, 1, 'rgba(0, 0, 0, 0.8)', 1);
        this.volleyText.fixedToCamera = true;

        //  Some basic controls
        //this.cursors2 = this.input.keyboard.createCursorKeys();
        this.cursors2 = this.input.keyboard.addKeys({
          'up': Phaser.KeyCode.DOWN,
          'down': Phaser.KeyCode.UP,
          'left': Phaser.KeyCode.LEFT,
          'right': Phaser.KeyCode.RIGHT
        });
        //cursor2 key settings...
        this.cursors = this.input.keyboard.addKeys({
          'up': Phaser.KeyCode.W,
          'down': Phaser.KeyCode.S,
          'left': Phaser.KeyCode.A,
          'right': Phaser.KeyCode.D
        });
        this.fireButton = this.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        this.fireButton.onDown.add(this.fire, this);
      },
      /**
       * Called by update if the bullet is in flight.
       *
       * @method bulletVsLand

       * @param {Phaser.Sprite} bullet - A reference to the bullet (same as this.bullet)
       */
      bulletVsLand: function(bullet) {
        //  Simple bounds check
        if (bullet.x < 0 || bullet.x > this.game.world.width || bullet.y > this.game.height || bullet.y < 0) {
          this.removeBullet(bullet);
          if (this.player1Turn) {
            this.volley++;
            this.volleyText.text = 'Volley Number: ' + this.volley;
          }
          return;
        }

        var x = Math.floor(bullet.x);
        var y = Math.floor(bullet.y);
        var rgba = this.land.getPixel(x, y);

        if (rgba.a > 0) {
          this.land.blendDestinationOut();
          this.land.circle(x, y, 16, 'rgba(0, 0, 0, 255');
          this.land.blendReset();
          this.land.update();

          //  If you like you could combine the above 4 lines:
          // this.land.blendDestinationOut().circle(x, y, 16, 'rgba(0, 0, 0, 255').blendReset().update();

          this.removeBullet(bullet);
          if (this.player1Turn) {
            this.volley++;
            this.volleyText.text = 'Volley Number: ' + this.volley;
          }
        }
      },
      /**
       * Called by fireButton.onDown
       *
       * @method fire
       */
      fire: function() {
        if (this.player1.bullet.exists || this.player2.bullet.exists) {
          return;
        }

        if (this.player1Turn) {
          //  Now work out where the END of the turret is
          var p = new Phaser.Point(this.player1.turret.x, this.player1.turret.y);
          p.rotate(p.x, p.y, this.player1.turret.rotation, false, 34);
          //  Re-position the bullet where the turret is
          this.player1.bullet.reset(p.x, p.y);

          //  And position the flame sprite there
          this.player1.flame.x = p.x;
          this.player1.flame.y = p.y;
          this.player1.flame.alpha = 1;
          this.player1.flame.visible = true;

          //  Boom
          this.add.tween(this.player1.flame).to({
            alpha: 0
          }, 100, "Linear", true);

          //  So we can see what's going on when the bullet leaves the screen
          this.camera.follow(this.player1.bullet);

          //  Our launch trajectory is based on the angle of the turret and the power
          this.physics.arcade.velocityFromRotation(this.player1.turret.rotation, (this.player1.power- (this.player1.score * deduction)), this.player1.bullet.body.velocity);
          this.player1Turn = false;
        } else {
          //  Now work out where the END of the turret is
          var p = new Phaser.Point(this.player2.turret.x, this.player2.turret.y);
          p.rotate(p.x, p.y, this.player2.turret.rotation, false, 34);
          //  Re-position the bullet where the turret is
          this.player2.bullet.reset(p.x, p.y);

          //  And position the flame sprite there
          this.player2.flame.x = p.x;
          this.player2.flame.y = p.y;
          this.player2.flame.alpha = 1;
          this.player2.flame.visible = true;

          //  Boom
          this.add.tween(this.player2.flame).to({
            alpha: 0
          }, 100, "Linear", true);

          //  So we can see what's going on when the bullet leaves the screen
          this.camera.follow(this.player2.bullet);

          //  Our launch trajectory is based on the angle of the turret and the power
          this.physics.arcade.velocityFromRotation(this.player2.turret.rotation, (this.player2.power- (this.player2.score * deduction)), this.player2.bullet.body.velocity);
          this.player1Turn = true;
        }
      },

      /**
       * Called by physics.arcade.overlap if the bullet and a tank overlap
       *
       * @method hitTank

       * @param {Phaser.Sprite} bullet - A reference to the bullet
       * @param {Phaser.Sprite} tank - The tank the bullet hit
       */
      hitTank: function(bullet, tank) {
        this.emitter.at(tank);
        this.emitter.explode(2000, 10);

        this.removeBullet(bullet, true);
        if (!this.player1Turn) {
          this.player2.tank.body.reset(Math.random() * 240, Math.random() * 100);
          this.player1.score++;
          this.player1.scoreText.text = 'Score: ' + this.player1.score;
        } else {
          this.player1.tank.body.x = (Math.random() * 240 + 240);
          this.player1.tank.body.y = 100;
          console.log(this.player1.tank.body);
          this.player2.score++;
          this.player2.scoreText.text = 'Score: ' + this.player2.score;
          this.volley++;
          this.volleyText.text = 'Volley Number: ' + this.volley;
        }
      },
      /**
       * Removes the bullet, stops the camera following and tweens the camera back to the tank.
       * Have put this into its own method as it's called from several places.
       *
       * @method removeBullet

       * @param {Phaser.Sprite} bullet - A reference to the bullet (same as this.bullet)
       * @param {Boolean} hasExploded - if bullet should explode or not
       */
      removeBullet: function(bullet, hasExploded) {
        if (typeof hasExploded === 'undefined') {
          hasExploded = false;
        }

        bullet.kill();
        this.camera.follow();

        var delay = 1000;

        if (hasExploded) {
          delay = 2000;
        }
        if (!this.player1Turn) {
          this.add.tween(this.camera).to({
            x: 100
          }, 1000, "Quint", true, delay);
        } else {
          this.add.tween(this.camera).to({
            x: 0
          }, 1000, "Quint", true, delay);
        }
      },
      /**
       * Called by update to make tank stop on land.
       *
       * @method tankVsLand
       */
      tankVsLand: function() {
        for (var i = 1; i < 3; i++) {
          var x = Math.floor(this[`player${i}`].tank.x);
          var y = Math.floor(this[`player${i}`].tank.y) + 40;
          var rgba = this.land.getPixel(x, y);

          // when the tank contacts the terrain, stop it from moving, otherwise let it fall from gravity
          if (rgba.a > 0) {
            this[`player${i}`].tank.body.allowGravity = false;
            this[`player${i}`].tank.body.reset(x, y);
            this[`player${i}`].tank.body.rotation = 0;
            this[`player${i}`].turret.x = this[`player${i}`].tank.centerX;
            this[`player${i}`].turret.y = this[`player${i}`].tank.centerY;
            this[`player${i}`].fakeTank.centerX = this[`player${i}`].tank.centerX;
            this[`player${i}`].fakeTank.centerY = this[`player${i}`].tank.centerY;
            this[`player${i}`].turret.visible = true;
          }else {
            this[`player${i}`].tank.body.allowGravity = true;
          }
        }


      },
      /**
       * Core update loop. Handles collision checks and player input.
       *
       * @method update
       */
      update: function() {
        // new game button to start a new game
        $('#newgame').on('click', function(event) {
          $('#winner').css('display', 'none');
          game.destroy();
          startGame();
        });
        // reset button refreshes page
        $('#reset').on('click', function(event) {
          location.reload();
        });

        //  If the bullet is in flight, don't let them control anything
        if (this.player1.bullet.exists) {
          //  Bullet vs. the Tank
          if (this.physics.arcade.overlap(this.player1.bullet, this.player2.tank, null, null, this)) {
            this.hitTank(this.player1.bullet, this.player2.tank);
            this.player2.tank.body.x = (Math.random() * 240);
            this.player2.tank.body.y = 100;
            this['player2'].tank.body.reset((Math.random() * 240), 100);
            this[`player2`].tank.body.rotation = 0;
          }

          //  Bullet vs. the land
          this.bulletVsLand(this.player1.bullet);
          this.tankVsLand();
        } else if (this.player2.bullet.exists) {
          //  Bullet vs. the Tank
          if (this.physics.arcade.overlap(this.player2.bullet, this.player1.tank, null, null, this)){
            this.hitTank(this.player2.bullet, this.player1.tank);
            console.log("do I work");
            this.player1.tank.body.x = (Math.random() * 240 + 240);
            this.player1.tank.body.y = 100;
            this['player1'].tank.body.reset((Math.random() * 240 + 240), 100);
            this[`player1`].tank.body.rotation = 0;
            console.log("prob not");
          }

          //  Bullet vs. the land
          this.bulletVsLand(this.player2.bullet);
          this.tankVsLand();
        } else {
          this.tankVsLand();
          if (this.player1Turn && this.volley === 4) {
            game.lockRender = true;
            if (this.player1.score > this.player2.score) {
              $('#winner h1').text(`${player1} wins!`);
              $('#winner').css('display', 'flex');
            } else if (this.player1.score < this.player2.score) {
              $('#winner h1').text(`${player2} wins!`);
              $('#winner').css('display', 'flex');
            } else {
              $('#winner h1').text('Tie!');
              $('#winner').css('display', 'flex');
            }
            game.gamePaused();
          } else if (this.player1Turn) {
            //  Allow them to set the power between 100 and 600
            if (this.cursors.left.isDown && this.player1.power > 100) {
              this.player1.power -= 2;
            } else if (this.cursors.right.isDown && this.player1.power < 600) {
              this.player1.power += 2;
            }

            //  Allow them to set the angle
            if (this.cursors.up.isDown) {
              this.player1.turret.angle--;
            } else if (this.cursors.down.isDown) {
              this.player1.turret.angle++;
            }

            //  Update the text
            this.player1.powerText.text = 'Power: ' + this.player1.power;
            this.player1.angleText.text = 'Angle: ' + Math.round(this.player1.turret.angle * -1);
          } else {
            //  Allow them to set the power between 100 and 600
            if (this.cursors2.left.isDown && this.player2.power > 100) {
              this.player2.power -= 2;
            } else if (this.cursors2.right.isDown && this.player2.power < 600) {
              this.player2.power += 2;
            }
            //  Allow them to set the angle
            if (this.cursors2.up.isDown) {
              this.player2.turret.angle--;
            } else if (this.cursors2.down.isDown) {
              this.player2.turret.angle++;
            }
            //  Update the text
            this.player2.powerText.text = 'Power: ' + this.player2.power;
            this.player2.angleText.text = 'Angle: ' + Math.round(this.player2.turret.angle * -1);
          }
        }
      }
    };
    game.state.add('Game', PhaserGame, true);
    //$('canvas').attr('style', 'margin-top: 0');
  }
});
