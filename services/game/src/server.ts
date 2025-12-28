// server.ts
import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import { WebSocket, RawData } from 'ws';
import { GameEngine } from './GameEngine.js';

const PORT = 7777;
const FRAME_RATE = 1000 / 60;
const fastify = Fastify();

let gameEngine: GameEngine | null = null;
let flagGameEngineReady = false;
let lastUpdate = Date.now();
let intervalId: NodeJS.Timeout;
let width: number;
let height: number;
let paused = false;
let settings = {
  ballSpeed: 300,
  paddleHeight: 125,
  paddleSpeed: 300,
};

async function start() {
  await fastify.register(websocket);

  fastify.get('/wss/game', { websocket: true }, (connection, req) => {
    const socket = connection.socket as WebSocket;
    const startGameLoop = () => {
      if (flagGameEngineReady) {
        intervalId = setInterval(() => {
          const now = Date.now();
          const rawDt = (now - lastUpdate) / 1000;
          const dtClamped = Math.min(rawDt, 0.05);
          const dt = paused ? 0 : dtClamped;

          const state = gameEngine?.getState(dt);
          if (state && state.type === "gameState") {
            state.payload.paused = paused;
          }
          socket.send(JSON.stringify(state));
          lastUpdate = now;
        }, FRAME_RATE);
      }
    };

    socket.on('message', (data: RawData) => {
      const raw = data.toString();
      let msg: any;

      try { msg = JSON.parse(raw); }
      catch { console.warn('Invalid JSON'); return; }

      if (msg.type === 'canvas_info' && msg.payload) {
        width = msg.payload.width;
        height = msg.payload.height;
        gameEngine = new GameEngine(height, width, settings);
        flagGameEngineReady = true;
        paused = false;
        lastUpdate = Date.now();
        paused = false;
        socket.send(JSON.stringify({ type: "paused", payload: { paused } }));
        startGameLoop();
      }
      else if (msg.type === "settings" && msg.payload) {
        settings.ballSpeed = Math.max(150, Math.min(900, Number(msg.payload.ballSpeed ?? 300)));
        settings.paddleHeight = Math.max(60, Math.min(220, Number(msg.payload.paddleHeight ?? 125)));
        settings.paddleSpeed = Math.max(150, Math.min(900, Number(msg.payload.paddleSpeed ?? 300)));
        gameEngine?.applySettings(msg.payload);
      }
      else if (msg.type === 'input_left' && msg.payload) {
        if (!paused) gameEngine?.getInputLeft(msg.payload);
      }
      else if (msg.type === 'input_right' && msg.payload) {
        if (!paused) gameEngine?.getInputRight(msg.payload);
      }
      else if (msg.type === 'pause') {
        paused = !paused;
        lastUpdate = Date.now();
        socket.send(JSON.stringify({ type: "paused", payload: { paused } }));
      }
      else if (msg.type === 'pause_set' && msg.payload) {
        paused = !!msg.payload.paused;
        lastUpdate = Date.now();
        socket.send(JSON.stringify({ type: "paused", payload: { paused } }));
      }
      else if (msg.type === 'reset') {
        clearInterval(intervalId);
        gameEngine = null;
        flagGameEngineReady = false;
        gameEngine = new GameEngine(height, width);
        flagGameEngineReady = true;
        paused = false;
        lastUpdate = Date.now();
        startGameLoop();
      }
    });

    socket.on('close', () => {
      if (intervalId) { clearInterval(intervalId); }
      flagGameEngineReady = false;
      gameEngine = null;
      paused = false;
    });
  });

  await fastify.listen({ port: PORT, host: '0.0.0.0' });
}

start().catch(err => {
  console.error(err);
  process.exit(1);
});