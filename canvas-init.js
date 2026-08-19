/**
 * Site-wide init for the ball.js elastic-collision canvas that sits behind
 * every page's title. Re-skinned as ambient texture: --signal at low
 * opacity, thin/small balls, no other motion on the page. Respects
 * prefers-reduced-motion by drawing a single static frame instead of
 * looping requestAnimationFrame.
 */
(function () {
  function initCanvas(canvas) {
    var context = canvas.getContext('2d'),
        balls = [],
        numBalls = 120,
        bounce = -1.0,
        reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var signalVar = getComputedStyle(document.documentElement).getPropertyValue('--signal').trim() || '#1F6F6B';
    var fillColor = utils.colorToRGB(signalVar, 0.35);

    for (var radius, ball, i = 0; i < numBalls; i++) {
      radius = 3;
      ball = new Ball(radius, fillColor);
      ball.mass = radius;
      ball.lineWidth = 0;
      ball.x = Math.random() * canvas.width;
      ball.y = Math.random() * canvas.height;
      ball.vx = (Math.random() - 0.5) * 2;
      ball.vy = (Math.random() - 0.5) * 2;
      balls.push(ball);
    }

    function rotate (x, y, sin, cos, reverse) {
      return {
        x: (reverse) ? (x * cos + y * sin) : (x * cos - y * sin),
        y: (reverse) ? (y * cos - x * sin) : (y * cos + x * sin)
      };
    }

    function checkCollision (ball0, ball1) {
      var dx = ball1.x - ball0.x,
          dy = ball1.y - ball0.y,
          dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < ball0.radius + ball1.radius) {
        var angle = Math.atan2(dy, dx),
            sin = Math.sin(angle),
            cos = Math.cos(angle),
            pos0 = {x: 0, y: 0},
            pos1 = rotate(dx, dy, sin, cos, true),
            vel0 = rotate(ball0.vx, ball0.vy, sin, cos, true),
            vel1 = rotate(ball1.vx, ball1.vy, sin, cos, true),
            vxTotal = vel0.x - vel1.x;
        vel0.x = ((ball0.mass - ball1.mass) * vel0.x + 2 * ball1.mass * vel1.x) /
                 (ball0.mass + ball1.mass);
        vel1.x = vxTotal + vel0.x;
        pos0.x += vel0.x;
        pos1.x += vel1.x;
        var pos0F = rotate(pos0.x, pos0.y, sin, cos, false),
            pos1F = rotate(pos1.x, pos1.y, sin, cos, false);
        ball1.x = ball0.x + pos1F.x;
        ball1.y = ball0.y + pos1F.y;
        ball0.x = ball0.x + pos0F.x;
        ball0.y = ball0.y + pos0F.y;
        var vel0F = rotate(vel0.x, vel0.y, sin, cos, false),
            vel1F = rotate(vel1.x, vel1.y, sin, cos, false);
        ball0.vx = vel0F.x;
        ball0.vy = vel0F.y;
        ball1.vx = vel1F.x;
        ball1.vy = vel1F.y;
      }
    }

    function checkWalls (ball) {
      if (ball.x + ball.radius > canvas.width) {
        ball.x = canvas.width - ball.radius;
        ball.vx *= bounce;
      } else if (ball.x - ball.radius < 0) {
        ball.x = ball.radius;
        ball.vx *= bounce;
      }
      if (ball.y + ball.radius > canvas.height) {
        ball.y = canvas.height - ball.radius;
        ball.vy *= bounce;
      } else if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.vy *= bounce;
      }
    }

    function move (ball) {
      ball.x += ball.vx;
      ball.y += ball.vy;
      checkWalls(ball);
    }

    function draw (ball) {
      ball.draw(context);
    }

    function renderFrame () {
      context.clearRect(0, 0, canvas.width, canvas.height);
      balls.forEach(draw);
    }

    if (reduceMotion) {
      renderFrame();
      return;
    }

    (function drawFrame () {
      window.requestAnimationFrame(drawFrame);
      context.clearRect(0, 0, canvas.width, canvas.height);
      balls.forEach(move);
      for (var ballA, i = 0, len = balls.length - 1; i < len; i++) {
        ballA = balls[i];
        for (var ballB, j = i + 1; j < balls.length; j++) {
          ballB = balls[j];
          checkCollision(ballA, ballB);
        }
      }
      balls.forEach(draw);
    }());
  }

  window.addEventListener('load', function () {
    var canvas = document.getElementById('canvas');
    if (canvas) {
      initCanvas(canvas);
    }
  });
})();
