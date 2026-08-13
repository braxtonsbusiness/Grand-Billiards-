const BALL_RADIUS = 13;
const FRICTION = 0.985;
const POCKETS = [
  [58, 58], [550, 50], [1042, 58], [58, 562], [550, 570], [1042, 562],
];

export class EightBallGame {
  constructor(canvas, { onWin, onMessage }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onWin = onWin;
    this.onMessage = onMessage;
    this.balls = [];
    this.dragStart = null;
    this.aimLongerShots = 0;
    this.ballInHand = false;
    this.remainingShots = 0;
    this.lastPocketed = [];
    this.bindInput();
    this.startMatch(false);
    requestAnimationFrame(() => this.loop());
  }

  startMatch(live = true) {
    this.balls = this.createRack();
    this.live = live;
    this.remainingShots = 15;
    this.lastPocketed = [];
    this.onMessage(live ? 'Break shot: pocket balls 1-7, then legally sink the 8 ball to win.' : 'Watch an ad to start a live match.');
  }

  createRack() {
    const balls = [{ id: 0, x: 285, y: 310, vx: 0, vy: 0, color: '#f8f8f8', label: '' }];
    const colors = ['#f6c945', '#2d65c8', '#d23d3d', '#6e3dbd', '#ef7d22', '#20975c', '#7d1f1f', '#111', '#f6c945', '#2d65c8', '#d23d3d', '#6e3dbd', '#ef7d22', '#20975c', '#7d1f1f'];
    let id = 1;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col <= row; col++) {
        balls.push({ id, x: 735 + row * 24, y: 310 + (col - row / 2) * 28, vx: 0, vy: 0, color: colors[id - 1], label: String(id) });
        id += 1;
      }
    }
    return balls;
  }

  bindInput() {
    this.canvas.addEventListener('pointerdown', (event) => {
      const point = this.pointer(event);
      const cue = this.balls.find((ball) => ball.id === 0);
      if (this.ballInHand) {
        cue.x = Math.min(1010, Math.max(90, point.x)); cue.y = Math.min(530, Math.max(90, point.y)); cue.vx = 0; cue.vy = 0; this.ballInHand = false; this.onMessage('Cue ball placed. Take your shot.'); return;
      }
      if (!this.live || this.isMoving()) return;
      this.dragStart = point;
    });
    this.canvas.addEventListener('pointerup', (event) => {
      if (!this.dragStart || !this.live) return;
      const cue = this.balls.find((ball) => ball.id === 0);
      const point = this.pointer(event);
      cue.vx = (this.dragStart.x - point.x) * 0.12;
      cue.vy = (this.dragStart.y - point.y) * 0.12;
      this.dragStart = null;
      this.aimLongerShots = Math.max(0, this.aimLongerShots - 1);
      this.lastPocketed = [];
    });
    this.canvas.addEventListener('pointermove', (event) => { if (this.dragStart) this.pointerNow = this.pointer(event); });
  }

  pointer(event) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * (this.canvas.width / rect.width), y: (event.clientY - rect.top) * (this.canvas.height / rect.height) };
  }

  enableBallInHand() { this.ballInHand = true; this.onMessage('Tap anywhere on the cloth to place the cue ball.'); }
  enableAimLonger() { this.aimLongerShots = 1; this.onMessage('Aim longer active for your next shot.'); }
  isMoving() { return this.balls.some((ball) => Math.hypot(ball.vx, ball.vy) > 0.15); }

  loop() {
    this.physics();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }

  physics() {
    for (const ball of this.balls) {
      ball.x += ball.vx; ball.y += ball.vy; ball.vx *= FRICTION; ball.vy *= FRICTION;
      if (Math.abs(ball.vx) < 0.03) ball.vx = 0;
      if (Math.abs(ball.vy) < 0.03) ball.vy = 0;
      if (ball.x < 75 || ball.x > 1025) ball.vx *= -1;
      if (ball.y < 75 || ball.y > 545) ball.vy *= -1;
      ball.x = Math.min(1025, Math.max(75, ball.x)); ball.y = Math.min(545, Math.max(75, ball.y));
    }
    for (let i = 0; i < this.balls.length; i++) {
      for (let j = i + 1; j < this.balls.length; j++) this.collide(this.balls[i], this.balls[j]);
    }
    const pocketed = [];
    this.balls = this.balls.filter((ball) => {
      const sunk = this.isPocketed(ball);
      if (sunk) pocketed.push(ball);
      return !sunk;
    });
    if (pocketed.length) this.handlePocketed(pocketed);
    if (!this.balls.some((ball) => ball.id === 0)) {
      this.balls.unshift({ id: 0, x: 285, y: 310, vx: 0, vy: 0, color: '#f8f8f8', label: '' });
      this.ballInHand = true;
      if (this.live) this.onMessage('Scratch! Ball in hand is active. Tap the cloth to place the cue ball.');
    }
  }

  collide(a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, distance = Math.hypot(dx, dy);
    if (distance === 0 || distance > BALL_RADIUS * 2) return;
    const nx = dx / distance, ny = dy / distance, p = 2 * (a.vx * nx + a.vy * ny - b.vx * nx - b.vy * ny) / 2;
    a.vx -= p * nx; a.vy -= p * ny; b.vx += p * nx; b.vy += p * ny;
    const overlap = BALL_RADIUS * 2 - distance;
    a.x -= nx * overlap / 2; a.y -= ny * overlap / 2; b.x += nx * overlap / 2; b.y += ny * overlap / 2;
  }

  handlePocketed(pocketed) {
    const objectBalls = pocketed.filter((ball) => ball.id > 0 && ball.id !== 8);
    if (objectBalls.length) {
      this.remainingShots = Math.max(0, this.remainingShots - objectBalls.length);
      this.onMessage(`${objectBalls.length} object ball${objectBalls.length > 1 ? 's' : ''} down. Clear balls 1-7 before the 8. Remaining: ${this.remainingObjectBalls()}.`);
    }
    if (pocketed.some((ball) => ball.id === 8)) {
      if (this.remainingObjectBalls() === 0) {
        this.live = false;
        this.onMessage('Legal 8 ball! Match complete.');
        this.onWin();
      } else {
        this.live = false;
        this.onMessage('8 ball went early. Match lost. Watch an ad to rack again.');
      }
    }
  }

  remainingObjectBalls() { return this.balls.filter((ball) => ball.id > 0 && ball.id !== 8).length; }

  isPocketed(ball) { return POCKETS.some(([x, y]) => Math.hypot(ball.x - x, ball.y - y) < 28); }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const felt = ctx.createLinearGradient(0, 0, 1100, 620);
    felt.addColorStop(0, '#050505'); felt.addColorStop(0.5, '#142116'); felt.addColorStop(1, '#050505');
    ctx.fillStyle = '#7a5310'; ctx.fillRect(18, 18, 1064, 584);
    ctx.fillStyle = '#111'; ctx.fillRect(38, 38, 1024, 544);
    ctx.fillStyle = felt; ctx.fillRect(62, 62, 976, 496);
    ctx.strokeStyle = '#f3c865'; ctx.lineWidth = 5; ctx.strokeRect(62, 62, 976, 496);
    for (const [x, y] of POCKETS) { ctx.beginPath(); ctx.fillStyle = '#020202'; ctx.arc(x, y, 31, 0, Math.PI * 2); ctx.fill(); }
    const cue = this.balls.find((ball) => ball.id === 0);
    if (this.dragStart && cue) this.drawAim(ctx, cue);
    for (const ball of this.balls) this.drawBall(ctx, ball);
    ctx.fillStyle = 'rgba(0,0,0,.48)'; ctx.fillRect(76, 76, 254, 38);
    ctx.fillStyle = '#ffd86d'; ctx.font = '18px Georgia'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(`Object balls left: ${this.remainingObjectBalls()}`, 92, 95);
  }

  drawAim(ctx, cue) {
    const target = this.pointerNow ?? this.dragStart;
    const length = this.aimLongerShots ? 520 : 280;
    const angle = Math.atan2(this.dragStart.y - target.y, this.dragStart.x - target.x);
    ctx.setLineDash([12, 12]); ctx.strokeStyle = '#ffd86d'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cue.x, cue.y); ctx.lineTo(cue.x + Math.cos(angle) * length, cue.y + Math.sin(angle) * length); ctx.stroke(); ctx.setLineDash([]);
  }

  drawBall(ctx, ball) {
    const shine = ctx.createRadialGradient(ball.x - 5, ball.y - 6, 2, ball.x, ball.y, BALL_RADIUS);
    shine.addColorStop(0, '#fff'); shine.addColorStop(0.25, ball.color); shine.addColorStop(1, '#111');
    ctx.beginPath(); ctx.fillStyle = shine; ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2); ctx.fill();
    if (ball.label) { ctx.fillStyle = '#fff'; ctx.font = '11px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ball.label, ball.x, ball.y); }
  }
}
