/**
 * Site-wide init for the ball.js elastic-collision canvas that sits behind
 * every page's title. Balls all start piled at the left edge and drift
 * right together, spreading into a density wave via collisions. Left/top/
 * bottom walls bounce normally; the right wall also bounces the ball back
 * (position clamped, velocity reversed) on the frame it's reached -- so
 * it's visibly seen rebounding, giving the compression-wave-reflects look
 * -- but is then marked and removed at the start of the next frame, so
 * density falls across the canvas as balls exit over time, until the whole
 * wave is cleared for good 15s after it starts. Re-skinned per the design
 * system: --signal at low opacity, no stroke. Respects
 * prefers-reduced-motion by drawing a single static frame instead of
 * animating.
 */
(function () {
  function initCanvas(canvas) {
    var context = canvas.getContext('2d'),
        balls = [],
        numBalls = 400,
        bounce = -1.0,
        reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var signalVar = getComputedStyle(document.documentElement).getPropertyValue('--signal').trim() || '#1F6F6B';
    var fillColor = utils.colorToRGB(signalVar, 0.35);

    for (var radius, ball, i = 0; i < numBalls; i++) {
      radius = 5;
      ball = new Ball(radius, fillColor);
      ball.mass = radius;
      ball.lineWidth = 0;
      ball.x = 0;
      ball.y = i * numBalls;
      ball.vx = 5;
      ball.vy = (Math.random() - 0.5) * 10;
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
        ball.isinframe = false;
        ball.x = canvas.width - ball.radius;
        ball.vx *= bounce;
        ball.vy *= bounce;
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

    function step () {
      // Balls marked isinframe=false last frame were still drawn once (in
      // their bounced-back position) -- remove them now, before this
      // frame's physics, not before that draw happened.
      balls = balls.filter(function (b) { return b.isinframe; });

      balls.forEach(move);
      for (var ballA, i = 0, len = balls.length - 1; i < len; i++) {
        ballA = balls[i];
        for (var ballB, j = i + 1; j < balls.length; j++) {
          ballB = balls[j];
          checkCollision(ballA, ballB);
        }
      }
    }

    function render () {
      context.clearRect(0, 0, canvas.width, canvas.height);
      balls.forEach(draw);
    }

    if (reduceMotion) {
      // Advance the simulation a bit so the static frame shows the wave
      // mid-flight rather than the initial left-edge pile, then draw
      // exactly once and stop.
      for (var f = 0; f < 60; f++) {
        step();
      }
      render();
      return;
    }

    var startTime = performance.now(),
        lifespan = 15000; // ms -- the whole wave clears after this, for good.

    (function drawFrame () {
      if (performance.now() - startTime > lifespan) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      window.requestAnimationFrame(drawFrame);
      step();
      render();
    }());
  }

  window.addEventListener('load', function () {
    var canvas = document.getElementById('canvas');
    if (canvas) {
      initCanvas(canvas);
    }
  });
})();
