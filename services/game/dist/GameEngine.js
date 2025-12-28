const PADDLE_WIDTH = 15;
const MAX_SCORE = 5;
const MAX_BOUNCE_ANGLE = Math.PI / 4;
const BALL_RADIUS = 8;
const ITERATION_SPEED = 0.1;
const MAX_SPEED_MULT = 1000;
const DEFAULT_ENGINE_SETTINGS = {
    ballSpeed: 300,
    paddleHeight: 125,
    paddleSpeed: 300,
    enablePowerUps: true,
};
export class GameEngine {
    scheduleNextSpawn() { this.nextSpawnAt = this.t + this.rand(1, 5); } // temps de spawn
    maybeSpawnPowerUp() {
        if (!this.settings.enablePowerUps)
            return;
        if (this.t < this.nextSpawnAt)
            return;
        if (this.powerUps.some(p => p.alive))
            return;
        const r = 14;
        let pos = this.randomPowerUpPos(r);
        let tries = 0;
        while (tries++ < 10) {
            const dx = this.ball.x - pos.x;
            const dy = this.ball.y - pos.y;
            if (dx * dx + dy * dy > (120 * 120))
                break;
            pos = this.randomPowerUpPos(r);
        }
        const ttl = this.rand(10, 20); //temps de vie
        const kind = Math.random() < 0.6 ? "big_paddle" : "slow_ball";
        this.powerUps.push({
            id: crypto.randomUUID?.() ?? String(Math.random()),
            kind,
            x: pos.x,
            y: pos.y,
            r,
            alive: true,
            expiresAt: this.t + ttl,
        });
        this.scheduleNextSpawn();
    }
    applyBigPaddle(side) {
        const duration = 5;
        this.effects[side].bigPaddleUntil = Math.max(this.effects[side].bigPaddleUntil, this.t + duration);
    }
    checkPowerUpPickup() {
        for (const p of this.powerUps) {
            if (!p.alive)
                continue;
            const dx = this.ball.x - p.x;
            const dy = this.ball.y - p.y;
            const rr = (BALL_RADIUS + p.r) * (BALL_RADIUS + p.r);
            if (dx * dx + dy * dy <= rr) {
                p.alive = false;
                if (p.kind === "big_paddle") {
                    if (this.lastHitter)
                        this.applyBigPaddle(this.lastHitter);
                }
                else if (p.kind === "slow_ball") {
                    this.applySlowBall();
                }
            }
        }
    }
    getPaddleHeight(side) {
        const base = this.settings.paddleHeight;
        const boosted = base * 1.8;
        const active = this.effects[side].bigPaddleUntil > this.t;
        return active ? boosted : base;
    }
    rand(min, max) {
        return Math.random() * (max - min) + min;
    }
    randomPowerUpPos(r) {
        const margin = r + 20;
        const x = this.rand(margin, this.canvas_size.width - margin);
        const y = this.rand(margin, this.canvas_size.height - margin);
        return { x, y };
    }
    expirePowerUps() {
        for (const p of this.powerUps) {
            if (!p.alive)
                continue;
            if (this.t >= p.expiresAt)
                p.alive = false;
        }
    }
    applySlowBall() {
        const duration = 4;
        const factor = this.effects.slowBallFactor;
        this.effects.slowBallUntil = Math.max(this.effects.slowBallUntil, this.t + duration);
        if (!this.slowActive) {
            this.ball.vx *= factor;
            this.ball.vy *= factor;
            this.slowActive = true;
        }
    }
    updateSlowBallTransition() {
        const factor = this.effects.slowBallFactor;
        const activeNow = this.effects.slowBallUntil > this.t;
        if (!activeNow && this.slowActive) {
            this.ball.vx /= factor;
            this.ball.vy /= factor;
            this.slowActive = false;
        }
    }
    constructor(height, width, cfg) {
        this.settings = { ...DEFAULT_ENGINE_SETTINGS };
        this.nextSpawnAt = 0;
        this.canvas_size = { height: height, width: width, midH: height / 2, midW: width / 2 };
        this.ball = { x: width / 2, y: height / 2, vx: this.settings.ballSpeed, vy: 0 };
        this.left_paddle = { x: PADDLE_WIDTH * 2, y: height / 2 };
        this.right_paddle = { x: this.canvas_size.width - (PADDLE_WIDTH * 2), y: height / 2 };
        this.score = { left: 0, right: 0 };
        this.inputLeft = { up: false, down: false };
        this.inputRight = { up: false, down: false };
        this.callCount = 0;
        this.finished = false;
        this.winner = null;
        this.powerUps = [];
        this.lastHitter = null;
        this.t = 0;
        this.effects = {
            left: { bigPaddleUntil: 0 },
            right: { bigPaddleUntil: 0 },
            slowBallUntil: 0,
            slowBallFactor: 0.6,
        };
        this.scheduleNextSpawn();
        this.slowActive = false;
    }
    applySettings(s) {
        if (!s)
            return;
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const num = (v, fallback) => {
            const n = Number(v);
            return Number.isFinite(n) ? n : fallback;
        };
        this.settings.ballSpeed = clamp(num(s.ballSpeed, this.settings.ballSpeed), 50, 1200);
        this.settings.paddleHeight = clamp(num(s.paddleHeight, this.settings.paddleHeight), 40, 260);
        this.settings.paddleSpeed = clamp(num(s.paddleSpeed, this.settings.paddleSpeed), 50, 1200);
        this.settings.enablePowerUps = !!s.enablePowerUps;
        if (!this.settings.enablePowerUps) {
            this.powerUps = [];
        }
    }
    getInputRight(input) {
        this.inputRight = input;
    }
    getInputLeft(input) {
        this.inputLeft = input;
    }
    updatePaddle(input, paddle, dt, midHeight) {
        if (input.up && paddle - midHeight > 0)
            paddle -= this.settings.paddleSpeed * dt;
        if (input.down && paddle + midHeight < this.canvas_size.height)
            paddle += this.settings.paddleSpeed * dt;
        return paddle;
    }
    isFinished() {
        return this.score.left === MAX_SCORE || this.score.right === MAX_SCORE;
    }
    willHitWall(pos, delta, max) {
        const next = pos + delta;
        return next - BALL_RADIUS < 0 || next + BALL_RADIUS > max;
    }
    touchPaddle(paddle, side) {
        const ballLeft = this.ball.x - BALL_RADIUS;
        const ballRight = this.ball.x + BALL_RADIUS;
        const mid = this.getPaddleHeight(side) / 2;
        const compare = (greater, rhs) => {
            if (greater && (ballLeft >= rhs || ballRight >= rhs))
                return true;
            if (!greater && (ballLeft <= rhs || ballRight <= rhs))
                return true;
            return false;
        };
        const overlapX = (this.ball.vx < 0 && compare(true, paddle.x - PADDLE_WIDTH) && compare(false, paddle.x)) ||
            (this.ball.vx > 0 && compare(true, paddle.x) && compare(false, paddle.x + PADDLE_WIDTH));
        const overlapY = (this.ball.y + BALL_RADIUS >= paddle.y - mid &&
            this.ball.y - BALL_RADIUS <= paddle.y + mid);
        return overlapX && overlapY;
    }
    updateBallVector(midPaddleY, dir) {
        const relativeIntersectY = midPaddleY - this.ball.y;
        const normalizedRelativeIntersectionY = relativeIntersectY / (this.settings.paddleHeight / 2);
        const bounceAngle = normalizedRelativeIntersectionY * MAX_BOUNCE_ANGLE;
        const clamp = Math.min(ITERATION_SPEED * this.callCount, MAX_SPEED_MULT);
        const realSpeed = this.settings.ballSpeed + clamp;
        this.ball.vx = dir * realSpeed * Math.cos(bounceAngle);
        this.ball.vy = realSpeed * -Math.sin(bounceAngle);
    }
    updateBallPos(dt) {
        if (this.willHitWall(this.ball.y, this.ball.vy * dt, this.canvas_size.height))
            this.ball.vy *= -1;
        else if (this.touchPaddle(this.left_paddle, "left")) {
            this.lastHitter = "left";
            this.callCount++;
            this.updateBallVector(this.left_paddle.y, 1);
        }
        else if (this.touchPaddle(this.right_paddle, "right")) {
            this.lastHitter = "right";
            this.callCount++;
            this.updateBallVector(this.right_paddle.y, -1);
        }
        else if (this.ball.x - BALL_RADIUS <= 0 || this.ball.x + BALL_RADIUS >= this.canvas_size.width) {
            if (this.ball.x - BALL_RADIUS <= 0)
                this.score.right += 1;
            else
                this.score.left += 1;
            this.ball.x = this.canvas_size.midW;
            this.ball.y = this.canvas_size.midH;
            this.ball.vx = this.settings.ballSpeed * (this.ball.vx < 0 ? 1 : -1);
            this.ball.vy = 0;
            this.callCount = 0;
            this.powerUps.forEach(p => p.alive = false);
            this.scheduleNextSpawn();
            return;
        }
        this.ball.x += this.ball.vx * dt;
        this.ball.y += this.ball.vy * dt;
    }
    getState(dt) {
        if (dt > 0) {
            if (!this.isFinished()) {
                this.t += dt;
                const leftMid = this.getPaddleHeight("left") / 2;
                const rightMid = this.getPaddleHeight("right") / 2;
                this.right_paddle.y = this.updatePaddle(this.inputRight, this.right_paddle.y, dt, rightMid);
                this.left_paddle.y = this.updatePaddle(this.inputLeft, this.left_paddle.y, dt, leftMid);
                this.updateBallPos(dt);
                this.updateSlowBallTransition();
                this.maybeSpawnPowerUp();
                this.expirePowerUps();
                this.checkPowerUpPickup();
            }
            else {
                this.finished = true;
                this.winner = (this.score.left === MAX_SCORE ? 'left' : 'right');
            }
        }
        let msg = {
            type: 'gameState',
            payload: {
                ball: {
                    x: this.ball.x,
                    y: this.ball.y,
                },
                right_paddle: this.right_paddle.y,
                left_paddle: this.left_paddle.y,
                score: {
                    left: this.score.left,
                    right: this.score.right
                },
                finished: this.finished,
                winner: this.winner,
                paused: false,
                powerUps: this.powerUps.filter(p => p.alive).map(p => ({ kind: p.kind, x: p.x, y: p.y, r: p.r })),
                effects: {
                    left: { bigPaddle: this.effects.left.bigPaddleUntil > this.t },
                    right: { bigPaddle: this.effects.right.bigPaddleUntil > this.t },
                    slowBall: this.effects.slowBallUntil > this.t,
                }
            }
        };
        return msg;
    }
}
