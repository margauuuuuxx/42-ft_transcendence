const BALL_RADIUS = 8;
const PADDLE_WIDTH = 15;
const LOGICAL_W = 1000;
const LOGICAL_H = 600;

type InputState = {
	up: boolean;
	down: boolean;
};

type ThemeId = "classic" | "neon" | "retro";

type GameSettings = {
  theme: ThemeId;

  ballSpeed: number;
  paddleHeight: number;
  paddleSpeed: number;

  enableShake: boolean;
  enableFlash: boolean;
  enablePowerUps: boolean,
  countdownStepMs: number;
  goMs: number;
};

const DEFAULT_SETTINGS: GameSettings = {
  theme: "classic",
  ballSpeed: 300,
  paddleHeight: 125,
  paddleSpeed: 300,
  enableShake: true,
  enableFlash: true,
  enablePowerUps: false,
  countdownStepMs: 350,
  goMs: 250,
};

type GameState = {
	ball: {
		x: number;
		y: number;
	};
	right_paddle: number;
	left_paddle: number;
	score: {
		left: number;
		right: number;
	};
	finished: boolean;
	winner: string | null;
	powerUps?: { kind: "big_paddle" | "slow_ball"; x:number; y:number; r:number }[];
	effects?: { left:{ bigPaddle:boolean }, right:{ bigPaddle:boolean }, slowBall?: boolean };
};

class GameClient {
	private wssUrl : string;
	private socket! : WebSocket;
	private canvas : HTMLCanvasElement | null;
	private ctx : CanvasRenderingContext2D | null | undefined;
	private inputStateLeft: InputState;
	private inputStateRight: InputState;
	private gameState: GameState | null;
	private quarter: number | null;
	private mid: number | null;
	private paused: boolean;
	private autoFinishTimer: number | null;
	private requestPause(pause: boolean) {
		if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
		this.socket.send(JSON.stringify({ type: "pause_set", payload: { paused: pause } }));
	}
	private handleVisibility = () => { if (document.hidden) { this.requestPause(true); } };
	private domObserver: MutationObserver | null;
	private handleBlur = () => { this.requestPause(true); }
	private handlePageHide = () => {
		this.requestPause(true);
		this.disconnect();
	};
	private waitingStart: boolean;
	private countdown: number | null;
	private countdownGoUntil: number;
	private flashAlpha: number;
	private shakeUntil: number;
	private shakeMag: number;
	private prevBallX: number | null;
	private prevDx: number | null;
	private prevScore: { left: number; right: number } | null;
	private rafId: number | null;
	private lastFrameTs: number;
	private startCountdown() {
		if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
		if (this.countdown !== null) return;
		this.sendSettings();

		this.requestPause(true);
		this.waitingStart = false;
		const steps = [3, 2, 1, 0];
		const stepMs = this.settings.countdownStepMs;
		let i = 0;
		const advance = () => {
			const v = steps[i++];
			if (v === undefined) return;

			if (v === 0) {
				this.countdown = 0;
				this.countdownGoUntil = performance.now() + this.settings.goMs;
				setTimeout(() => {
					this.countdown = null;
					this.countdownGoUntil = 0;
					this.requestPause(false);
				}, this.settings.goMs);
				return;
			}
			this.countdown = v;
			setTimeout(advance, stepMs);
		};
		advance();
	}
	private startRenderLoop() {
		if (this.rafId) return;
		const loop = (ts: number) => {
			const dt = Math.min((ts - this.lastFrameTs) / 1000, 0.05);
			this.lastFrameTs = ts;
			if (this.flashAlpha > 0)
				this.flashAlpha = Math.max(0, this.flashAlpha - dt * 1.5);
			if (this.canvas && this.gameState) this.draw();
			this.rafId = requestAnimationFrame(loop);
		};
		this.rafId = requestAnimationFrame(loop);
	};
	private triggerFlash(strength = 0.35) {
		this.flashAlpha = Math.max(this.flashAlpha, strength);
	};
	private triggerShake(ms = 140, mag = 8) {
		this.shakeUntil = performance.now() + ms;
		this.shakeMag = mag;
	};
	private settings: GameSettings;
	private sendSettings() {
		if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
		this.socket.send(JSON.stringify({ type: "settings", payload: this.settings }));
	}
	private readOptionsFromUI() {
		const themeEl = document.getElementById("opt-theme") as HTMLSelectElement | null;
		const ballSpeedEl = document.getElementById("opt-ballSpeed") as HTMLInputElement | null;
		const paddleHeightEl = document.getElementById("opt-paddleHeight") as HTMLInputElement | null;
		const paddleSpeedEl = document.getElementById("opt-paddleSpeed") as HTMLInputElement | null;
		const shakeEl = document.getElementById("opt-shake") as any;
		const flashEl = document.getElementById("opt-flash") as any;
		const theme = (themeEl?.value || "classic") as ThemeId;
		const powerUpsEl = document.getElementById("opt-powerups") as any;
		const num = (v: any, fallback: number) => {
			const n = Number(v);
			return Number.isFinite(n) ? n : fallback;
		};
		const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
		const ballSpeed = clamp(num(ballSpeedEl?.value, DEFAULT_SETTINGS.ballSpeed), 50, 1200);
		const paddleHeight = clamp(num(paddleHeightEl?.value, DEFAULT_SETTINGS.paddleHeight), 40, 260);
		const paddleSpeed = clamp(num(paddleSpeedEl?.value, DEFAULT_SETTINGS.paddleSpeed), 50, 1200);
		const enableShake = !!(shakeEl?.checked ?? true);
		const enableFlash = !!(flashEl?.checked ?? true);
		const enablePowerUps = !!(powerUpsEl?.checked ?? true);

		this.settings = {
			...this.settings,
			theme,
			ballSpeed,
			paddleHeight,
			paddleSpeed,
			enableShake,
			enableFlash,
			enablePowerUps,
		};
	}
	private writeOptionsToUI() {
		const themeEl = document.getElementById("opt-theme") as HTMLSelectElement | null;
		const ballSpeedEl = document.getElementById("opt-ballSpeed") as HTMLInputElement | null;
		const paddleHeightEl = document.getElementById("opt-paddleHeight") as HTMLInputElement | null;
		const paddleSpeedEl = document.getElementById("opt-paddleSpeed") as HTMLInputElement | null;
		const shakeEl = document.getElementById("opt-shake") as any;
		const flashEl = document.getElementById("opt-flash") as any;
		if (themeEl) themeEl.value = this.settings.theme;
		if (ballSpeedEl) ballSpeedEl.value = String(this.settings.ballSpeed);
		if (paddleHeightEl) paddleHeightEl.value = String(this.settings.paddleHeight);
		if (paddleSpeedEl) paddleSpeedEl.value = String(this.settings.paddleSpeed);
		if (shakeEl) shakeEl.checked = this.settings.enableShake;
		if (flashEl) flashEl.checked = this.settings.enableFlash;
	}
	private getThemeColors() {
		switch (this.settings.theme) {
			case "neon":
			return { bg: "#050510", mid: "#39ff14", paddleL: "#00e5ff", paddleR: "#ff2bd6", ball: "#ffffff" };
			case "retro":
			return { bg: "#f5f1e6", mid: "#222222", paddleL: "#1f2937", paddleR: "#111827", ball: "#111827" };
			default:
			return { bg: "#151516", mid: "#444445", paddleL: "#ffffff", paddleR: "#ffffff", ball: "#ffffff" };
		}
	}
	private getPowerUpColor(kind: "big_paddle" | "slow_ball"): string {
		switch (kind) {
			case "big_paddle":
			return "#0CAD7C";
			case "slow_ball":
			return "#2455D4";
			default:
			return "#ffffff";
		}
	}

	constructor() {
		this.wssUrl = `wss://${window.location.host}/wss/game`;
		this.canvas = null;
		this.ctx = null;
		this.inputStateLeft = { up: false, down: false };
		this.inputStateRight = { up: false, down: false };
		this.gameState = null;
		this.quarter = null;
		this.mid = null;
		this.paused = false;
		this.domObserver = null;
		this.waitingStart = true;
		this.countdown = null;
		this.countdownGoUntil = 0;
		this.flashAlpha = 0;
		this.shakeUntil = 0;
		this.shakeMag = 0;
		this.prevBallX = null;
		this.prevDx = null;
		this.prevScore = null;
		this.rafId = null;
		this.lastFrameTs = performance.now();
		this.settings = { ...DEFAULT_SETTINGS };
		this.autoFinishTimer = null;
	}

	init() {
		this.draw();
		this.startRenderLoop();
		document.addEventListener("keyup", this.handleKeyboardUp);
        document.addEventListener("keydown", this.handleKeyboardDown);
		document.addEventListener("visibilitychange", this.handleVisibility);
		window.addEventListener("blur", this.handleBlur);
		window.addEventListener("pagehide", this.handlePageHide);
		this.settings = { ...DEFAULT_SETTINGS };
		this.writeOptionsToUI();
		document.getElementById("apply-options")?.addEventListener("click", () => {
			this.readOptionsFromUI();
			this.sendSettings();
			this.draw();
		});
		document.getElementById("reset-options")?.addEventListener("click", () => {
			this.settings = { ...DEFAULT_SETTINGS };
			this.writeOptionsToUI();
			this.sendSettings();
			this.draw();
		});
	}

	fitCanvasToContainer(canvas: HTMLCanvasElement) {
		const parent = canvas.parentElement as HTMLElement;
		if (!parent) return;

		const rect = parent.getBoundingClientRect();
		const cssW = Math.max(1, Math.floor(rect.width));
		const cssH = Math.max(1, Math.floor(rect.height));

		const dpr = window.devicePixelRatio || 1;

		const pxW = Math.floor(cssW * dpr);
		const pxH = Math.floor(cssH * dpr);

		if (canvas.width !== pxW || canvas.height !== pxH) {
			canvas.width = pxW;
			canvas.height = pxH;
		}

		canvas.style.width = `${cssW}px`;
		canvas.style.height = `${cssH}px`;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		const scale = Math.min(cssW / LOGICAL_W, cssH / LOGICAL_H);
		const offsetX = (cssW - LOGICAL_W * scale) / 2;
		const offsetY = (cssH - LOGICAL_H * scale) / 2;

		ctx.setTransform(
			dpr * scale, 0,
			0, dpr * scale,
			dpr * offsetX, dpr * offsetY
		);
	}

	connectIfCanvasPresent() {
		this.canvas = document.getElementById("pongCanvas") as HTMLCanvasElement | null;
		if (!this.canvas) { return false; }
		if (this.canvas && this.canvas.offsetParent === null) { this.requestPause(true); }

		this.canvas.addEventListener("click", () => {
			if (this.waitingStart) this.startCountdown();
		});

		if (!this.domObserver) {
			this.domObserver = new MutationObserver(() => {
			const stillHere = document.getElementById("pongCanvas");
			if (!stillHere) {
				this.disconnect();
			}
			});
			this.domObserver.observe(document.body, { childList: true, subtree: true });
		}

		this.fitCanvasToContainer(this.canvas!);
		window.addEventListener("resize", () => this.fitCanvasToContainer(this.canvas!));

		const ro = new ResizeObserver(() => this.fitCanvasToContainer(this.canvas!));
		ro.observe(this.canvas.parentElement as Element);

		this.quarter = LOGICAL_W / 6;
		this.mid = LOGICAL_W / 2;

		if (this.socket && (this.socket.readyState == WebSocket.OPEN || this.socket.readyState == WebSocket.CONNECTING)){
			return true;
		}

		this.socket = new WebSocket(this.wssUrl);
		this.socket.addEventListener('open', () => {
			this.waitingStart = true;
			this.countdown = null;
			this.paused = true;
			this.requestPause(true);
			this.socket.send(JSON.stringify({
				type: "canvas_info",
				payload: {
					width: LOGICAL_W,
					height: LOGICAL_H,
				},
			}));
		});

		this.socket.addEventListener("message", (event) => {
			try {
				const msg = JSON.parse(event.data);
				if (msg.type === 'gameState' && msg.payload){
					this.paused = !!msg.payload.paused;
					const previousScore = this.gameState ? { left: this.gameState.score.left, right: this.gameState.score.right } : null;
					const wasFinished = this.gameState ? this.gameState.finished : false;
					this.gameState = msg.payload;
					const scoreNow = this.gameState!.score;
					if (this.prevScore) {
						if (scoreNow.left !== this.prevScore.left || scoreNow.right !== this.prevScore.right) {
							this.triggerFlash(0.45);
							this.triggerShake(180, 10);
						}
					}
					this.prevScore = { left: scoreNow.left, right: scoreNow.right };
					const ballX = this.gameState!.ball.x;
					if (this.prevBallX !== null) {
						const dx = ballX - this.prevBallX;
						const sign = Math.sign(dx);
						if (this.prevDx !== null) {
							const prevSign = Math.sign(this.prevDx);
							if (sign !== 0 && prevSign !== 0 && sign !== prevSign)
								this.triggerShake(50, 1);
						}
						this.prevDx = dx;
					}
					this.prevBallX = ballX;
					this.draw();
					
					// Check if game just finished
					if (this.gameState && !wasFinished && this.gameState.finished) {
						console.log('🎮 Game just finished!');
						// Check if this is a tournament match
						const tournamentMatch = sessionStorage.getItem('tournamentMatch');
						console.log('🎮 Tournament match in storage?', !!tournamentMatch, tournamentMatch);
						if (tournamentMatch) {
							// For tournament matches, set a 3-second timer to auto-finish
							console.log('🏆 Tournament match ended - setting 3-second auto-finish timer');
							this.autoFinishTimer = window.setTimeout(() => {
								console.log('⏰ 3 seconds elapsed - calling handleGameEnd()');
								this.handleGameEnd();
							}, 3000);
						} else {
							console.log('🎲 Regular game - waiting for R key');
						}
					}
				}
			} catch (_) {
			}
		});

		this.socket.addEventListener('close', () => {
			this.disconnect();
		});
		return true;
	}

	sendInput(left: boolean, reset: boolean){
		if (this.paused && !reset) return;

		if (reset){
			const message = {
				type: 'reset',
				payload: null,
			};
			this.socket.send(JSON.stringify(message));
		}
		else if (left){
			const message = {
				type: 'input_left',
				payload: this.inputStateLeft,
			};
			this.socket.send(JSON.stringify(message));
		}
		else{
			const message = {
				type: 'input_right',
				payload: this.inputStateRight,
			};
			this.socket.send(JSON.stringify(message));
		}
	}

	handleKeyboardUp = (event: KeyboardEvent) => {
		const keyName = event.key;
		if (keyName === "ArrowUp"){
			event.preventDefault();
			this.inputStateRight.up = false;
			this.sendInput(false, false);
		}
		if (keyName === "ArrowDown"){
			event.preventDefault();
			this.inputStateRight.down = false;
			this.sendInput(false, false);
		}
		if (keyName === "w"){
			this.inputStateLeft.up = false;
			this.sendInput(true, false);
		}
		if (keyName === "s"){
			this.inputStateLeft.down = false;
			this.sendInput(true, false);
		}
	}

	handleKeyboardDown = (event: KeyboardEvent) => {
		const keyName = event.key;
		if (this.waitingStart && (event.key === "Enter" || event.key === " ")) {
			event.preventDefault();
			this.startCountdown();
			return;
		}
		if (this.waitingStart)
				return;
		if (event.key === "Escape") {
			event.preventDefault();
			if (this.socket && this.socket.readyState === WebSocket.OPEN)
				this.socket.send(JSON.stringify({ type: "pause" }));
		}
		if (this.paused)
			return;
		if (keyName === "ArrowUp"){
			event.preventDefault();
			this.inputStateRight.up = true;
			this.sendInput(false, false);
		}
		if (keyName === "ArrowDown"){
			event.preventDefault();
			this.inputStateRight.down = true;
			this.sendInput(false, false);
		}
		if (keyName === "w"){
			this.inputStateLeft.up = true;
			this.sendInput(true, false);
		}
		if (keyName === "s"){
			this.inputStateLeft.down = true;
			this.sendInput(true, false);
		}
		if (keyName === "r" && this.gameState && this.gameState.finished){
			event.preventDefault();
			// Check if this is a tournament match
			const tournamentMatch = sessionStorage.getItem('tournamentMatch');
			if (tournamentMatch) {
				// Cancel the auto-finish timer if R is pressed during countdown
				if (this.autoFinishTimer) {
					console.log('❌ R pressed - cancelling auto-finish');
					clearTimeout(this.autoFinishTimer);
					this.autoFinishTimer = null;
				}
			}
			// Allow restart for both tournament and regular games
			this.sendInput(false, true);
		}
	}

	draw_field(){
		if (!this.ctx)
			return ;
		this.ctx.beginPath();
		this.ctx.fillStyle = this.getThemeColors().bg;
		this.ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

		this.ctx.beginPath();
		this.ctx.lineWidth = 10;
		this.ctx.setLineDash([60, 30]);
		this.ctx.moveTo(LOGICAL_W / 2, 0);
		this.ctx.lineTo(LOGICAL_W / 2, LOGICAL_H);
		this.ctx.strokeStyle = this.getThemeColors().mid;
		this.ctx.stroke();
	}

	drawLeftPaddle(){
		if (!this.ctx || !this.gameState)
			return ;
		const leftH = (this.gameState.effects?.left.bigPaddle ? this.settings.paddleHeight * 1.8 : this.settings.paddleHeight);
		this.ctx.fillStyle = this.getThemeColors().paddleL;
		this.ctx.fillRect(
			PADDLE_WIDTH,
			this.gameState.left_paddle - (leftH / 2),
			PADDLE_WIDTH,
			leftH
		);
	}
	
	drawRightPaddle(){
		if (!this.ctx || !this.gameState)
			return ;
		const rightH = (this.gameState.effects?.right.bigPaddle ? this.settings.paddleHeight * 1.8 : this.settings.paddleHeight);
		this.ctx.fillStyle = this.getThemeColors().paddleR;
		this.ctx.fillRect(
			LOGICAL_W - (PADDLE_WIDTH * 2),
			this.gameState.right_paddle - (rightH / 2),
			PADDLE_WIDTH,
			rightH
		);
	}

	drawBall(){
		if (!this.ctx || !this.gameState)
			return ;
		this.ctx.fillStyle = this.getThemeColors().ball;
		this.ctx.beginPath();
		this.ctx.arc(this.gameState.ball.x, this.gameState.ball.y, BALL_RADIUS, 0, 2 * Math.PI);
		this.ctx.fill();
	}

	drawPlayersScore(){
		if (!this.ctx || !this.gameState)
			return ;
		this.ctx.textAlign = "center";
		this.ctx.font = "20px 'Press Start 2P'";
		this.ctx.fillText('PLAYER 1', this.mid! - this.quarter!, 20);
		this.ctx.fillText('PLAYER 2', this.mid! + this.quarter!, 20);
		this.ctx.font = "48px 'Press Start 2P'";
		this.ctx.fillText(this.gameState.score.left.toString(), this.mid! - this.quarter!, 80);
		this.ctx.fillText(this.gameState.score.right.toString(), this.mid! + this.quarter!, 80);
	}

	drawWinner() {
		if (!this.ctx || !this.gameState) return;

		// Check if this is a tournament match
		const tournamentMatch = sessionStorage.getItem('tournamentMatch');
		const isTournament = !!tournamentMatch;

		this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
		this.ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
		this.ctx.textAlign = "center";
		this.ctx.font = "36px 'Press Start 2P'";
		const winnerText = (this.gameState.winner! === "left" ? "PLAYER 1 WINS!" : "PLAYER 2 WINS!");
		this.ctx.fillStyle = "white";
		this.ctx.fillText(winnerText, LOGICAL_W / 2, LOGICAL_H / 2);
		this.ctx.font = "24px 'Press Start 2P'";
		
		if (isTournament) {
			this.ctx.fillText("Press 'R' to restart (3s)", LOGICAL_W / 2, (LOGICAL_H / 2) + 50);
		} else {
			this.ctx.fillText("Click 'R' to launch a new match", LOGICAL_W / 2, (LOGICAL_H / 2) + 50);
		}
		this.ctx.textBaseline = "middle";
	}

	drawPauseMenu() {
		if (!this.ctx || !this.canvas) return;

		this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
		this.ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
		this.ctx.textAlign = "center";
		this.ctx.textBaseline = "middle";
		this.ctx.fillStyle = "white";
		this.ctx.font = "48px 'Press Start 2P'";
		this.ctx.fillText("PAUSED", LOGICAL_W / 2, LOGICAL_H / 2 - 40);
		this.ctx.font = "20px 'Press Start 2P'";
		this.ctx.fillText("ESC  Resume",  LOGICAL_W / 2, LOGICAL_H / 2 + 20);
	}

	showPauseMenu() { this.paused = true; this.draw(); }

	hidePauseMenu() { this.paused = false; this.draw(); }

	drawStartMenu() {
		if (!this.ctx) return;
		this.requestPause(true);
		this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
		this.ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
		this.ctx.textAlign = "center";
		this.ctx.textBaseline = "middle";
		this.ctx.fillStyle = "white";
		this.ctx.font = "48px 'Press Start 2P'";
		this.ctx.fillText("PONG", LOGICAL_W / 2, LOGICAL_H / 2 - 90);
		this.ctx.font = "28px 'Press Start 2P'";
		this.ctx.fillText("CLICK TO PLAY", LOGICAL_W / 2, LOGICAL_H / 2);
		this.ctx.font = "16px 'Press Start 2P'";
		this.ctx.fillText("Enter / Space", LOGICAL_W / 2, LOGICAL_H / 2 + 60);
	}

	drawCountdown() {
		if (!this.ctx) return;

		this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
		this.ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
		this.ctx.textAlign = "center";
		this.ctx.textBaseline = "middle";
		this.ctx.fillStyle = "white";
		this.ctx.font = "72px 'Press Start 2P'";
		const now = performance.now();
		if (this.countdown === 0 && now < this.countdownGoUntil)
			this.ctx.fillText("GO!", LOGICAL_W / 2, LOGICAL_H / 2);
		else if (this.countdown !== null)
			this.ctx.fillText(String(this.countdown), LOGICAL_W / 2, LOGICAL_H / 2);
	}

	drawPowerUps() {
		if (!this.ctx || !this.gameState?.powerUps) return;
		const now = performance.now();
		for (const p of this.gameState.powerUps) {
			const base = p.r * 2;
			const pulse = 1 + 0.08 * Math.sin(now / 180);
			const size = base * pulse;
			const x = p.x - size / 2;
			const y = p.y - size / 2;
			this.ctx.save();
			this.ctx.lineWidth = 4;
			this.ctx.fillStyle = this.getPowerUpColor(p.kind);
			this.ctx.beginPath();
			this.ctx.rect(x, y, size, size);
			this.ctx.fill();
			this.ctx.font = "18px 'Press Start 2P'";
			this.ctx.textAlign = "center";
			this.ctx.textBaseline = "middle";
			this.ctx.fillStyle = "white";
			const label = p.kind === "big_paddle" ? "|" : "*";
			this.ctx.fillText(label, p.x, p.y + 1);
			this.ctx.restore();
		}
	}

	draw(){
		if (!this.canvas)
			return ;
		this.ctx = this.canvas.getContext("2d");
		if (!this.ctx || !this.gameState)
			return ;
		this.ctx.save();
		if (this.settings.enableShake && performance.now() < this.shakeUntil) {
			const mag = this.shakeMag;
			const ox = (Math.random() * 2 - 1) * mag;
			const oy = (Math.random() * 2 - 1) * mag;
			this.ctx.translate(ox, oy);
		}
		this.draw_field();
		this.drawLeftPaddle();
		this.drawRightPaddle();
		this.drawBall();
		this.drawPowerUps();
		this.drawPlayersScore();
		if (this.gameState.finished) this.drawWinner();
		else if (this.waitingStart) this.drawStartMenu();
		else if (this.paused && this.countdown === null) this.drawPauseMenu();
		else if (this.countdown !== null) this.drawCountdown();

		if (this.settings.enableFlash && this.flashAlpha > 0) {
			this.ctx.fillStyle = `rgba(255,255,255,${this.flashAlpha})`;
			this.ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
		}
		this.ctx.restore();
	}

	handleGameEnd() {
		if (!this.gameState) return;

		const scoreLeft = this.gameState.score.left;
		const scoreRight = this.gameState.score.right;

		// Disconnect from game
		this.disconnect();

		// Check if this is a tournament match
		const tournamentMatch = sessionStorage.getItem('tournamentMatch');
		if (tournamentMatch) {
			const match = JSON.parse(tournamentMatch);
			const winner = scoreLeft >= 5 ? 'left' : 'right';
			const winnerName = winner === 'left' ? match.player1 : match.player2;

			// Post result to tournament API
			this.postTournamentResult(match, scoreLeft, scoreRight, winner, winnerName);
		} else {
			// Regular game - just show scores
			this.showGameEndScreen(scoreLeft, scoreRight, null, null);
		}
	}

	async postTournamentResult(match: any, scoreLeft: number, scoreRight: number, winner: string, winnerName: string) {
		const TOURNAMENT_API = `${window.location.protocol}//${window.location.host}/api/tournament`;

		try {
			console.log('📤 Posting match result to tournament API...');
			const response = await fetch(`${TOURNAMENT_API}/tournaments/matches`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					tournament_id: match.tournamentId,
					player_left_alias: match.player1,
					player_right_alias: match.player2,
					winner: winner,
					score_left: scoreLeft,
					score_right: scoreRight
				})
			});

			if (response.ok) {
				const result = await response.json();
				console.log('✅ Match result recorded:', result);
				
				// Clear tournament match data
				sessionStorage.removeItem('tournamentMatch');

				// Show game end screen with tournament info
				this.showGameEndScreen(scoreLeft, scoreRight, winnerName, match.tournamentId);
			} else {
				console.error('❌ Failed to post tournament result');
				alert('Failed to record match result to tournament.');
				this.showGameEndScreen(scoreLeft, scoreRight, winnerName, match.tournamentId);
			}
		} catch (error) {
			console.error('❌ Error posting tournament result:', error);
			alert('Error recording match result.');
			this.showGameEndScreen(scoreLeft, scoreRight, winnerName, match.tournamentId);
		}
	}

	showGameEndScreen(scoreLeft: number, scoreRight: number, winnerName: string | null, tournamentId: number | null) {
		// Create a modal overlay
		const modal = document.createElement('div');
		modal.id = 'game-end-modal';
		modal.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background-color: rgba(0, 0, 0, 0.8);
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 10000;
			font-family: 'Press Start 2P', monospace;
		`;
		
		const isTournament = winnerName && tournamentId;
		const winnerIsLeft = scoreLeft >= 10;
		
		modal.innerHTML = `
			<div style="
				background: white;
				border: 4px solid black;
				padding: 40px;
				max-width: 600px;
				width: 90%;
				text-align: center;
				color: black;
			">
				<h1 style="font-size: 36px; font-weight: bold; margin-bottom: 30px; text-transform: uppercase; font-family: 'Press Start 2P', monospace; line-height: 1.5; color: white;">GAME OVER</h1>
				
				<div style="
					margin-bottom: 30px;
					padding: 20px;
					background: white;
					border: 4px solid black;
				">
					<h2 style="font-size: 18px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; font-family: 'Press Start 2P', monospace;">Final Score</h2>
					<div style="display: flex; justify-content: space-around; align-items: center; font-size: 28px; font-weight: bold; font-family: 'Press Start 2P', monospace;">
						<div style="flex: 1; color: black;">
							<p style="font-size: 14px; margin-bottom: 15px; text-transform: uppercase;">Player 1</p>
							<p>${scoreLeft}</p>
						</div>
						<div style="font-size: 24px; color: black;">-</div>
						<div style="flex: 1; color: black;">
							<p style="font-size: 14px; margin-bottom: 15px; text-transform: uppercase;">Player 2</p>
							<p>${scoreRight}</p>
						</div>
					</div>
				</div>

				${isTournament ? `
					<div style="
						margin-bottom: 30px;
						padding: 20px;
						background: white;
						border: 4px solid black;
					">
						<h2 style="font-size: 24px; font-weight: bold; color: white; margin-bottom: 15px; text-transform: uppercase; font-family: 'Press Start 2P', monospace; line-height: 1.5;">WINNER</h2>
						<p style="font-size: 28px; font-weight: bold; font-family: 'Press Start 2P', monospace; color: black;">${winnerName}</p>
						<p style="font-size: 10px; color: #6b7280; margin-top: 15px; font-family: monospace; text-transform: uppercase;">Match result recorded</p>
						<p style="font-size: 10px; color: #6b7280; font-family: monospace; text-transform: uppercase;">Deploying to blockchain...</p>
					</div>

					<div style="display: flex; flex-direction: column; gap: 15px;">
						<a href="/tournament" 
						   style="
							   display: block;
							   background: black;
							   color: white;
							   padding: 15px;
							   font-size: 12px;
							   font-weight: bold;
							   text-decoration: none;
							   text-transform: uppercase;
							   font-family: 'Press Start 2P', monospace;
							   border: 2px solid black;
							   transition: all 0.2s;
						   "
						   onmouseover="this.style.background='white'; this.style.color='black';"
						   onmouseout="this.style.background='black'; this.style.color='white';">
							View Brackets
						</a>
						<a href="/leaderboard" 
						   style="
							   display: block;
							   background: white;
							   color: black;
							   padding: 15px;
							   font-size: 12px;
							   font-weight: bold;
							   text-decoration: none;
							   text-transform: uppercase;
							   font-family: 'Press Start 2P', monospace;
							   border: 2px solid black;
							   transition: all 0.2s;
						   "
						   onmouseover="this.style.background='black'; this.style.color='white';"
						   onmouseout="this.style.background='white'; this.style.color='black';">
							View Leaderboard
						</a>
					</div>
				` : `
					<div style="display: flex; flex-direction: column; gap: 15px;">
						<a href="/game" 
						   style="
							   display: block;
							   background: black;
							   color: white;
							   padding: 15px;
							   font-size: 12px;
							   font-weight: bold;
							   text-decoration: none;
							   text-transform: uppercase;
							   font-family: 'Press Start 2P', monospace;
							   border: 2px solid black;
						   "
						   onmouseover="this.style.background='white'; this.style.color='black';"
						   onmouseout="this.style.background='black'; this.style.color='white';">
							Play Again
						</a>
						<a href="/" 
						   style="
							   display: block;
							   background: white;
							   color: black;
							   padding: 15px;
							   font-size: 12px;
							   font-weight: bold;
							   text-decoration: none;
							   text-transform: uppercase;
							   font-family: 'Press Start 2P', monospace;
							   border: 2px solid black;
						   "
						   onmouseover="this.style.background='black'; this.style.color='white';"
						   onmouseout="this.style.background='white'; this.style.color='black';">
							Back to Home
						</a>
					</div>
				`}
			</div>
		`;
		
		document.body.appendChild(modal);
	}

	disconnect(){
		// Clear auto-finish timer if exists
		if (this.autoFinishTimer) {
			clearTimeout(this.autoFinishTimer);
			this.autoFinishTimer = null;
		}
		
		if (this.socket && this.socket.readyState == WebSocket.OPEN){
			this.socket.close();
		}
		if (this.domObserver) {
			this.domObserver.disconnect();
			this.domObserver = null;
		}
		document.removeEventListener("keyup", this.handleKeyboardUp);
        document.removeEventListener("keydown", this.handleKeyboardDown);
		document.removeEventListener("visibilitychange", this.handleVisibility);
		window.removeEventListener("blur", this.handleBlur);
		window.removeEventListener("pagehide", this.handlePageHide);
		this.hidePauseMenu();
		this.paused = false;
		this.inputStateLeft.up = false;
		this.inputStateLeft.down = false;
		this.inputStateRight.up = false;
		this.inputStateRight.down = false;
	}
}

export const gameClient = new GameClient();
