import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { readFile, writeFile } from 'fs/promises';
import { loadAnimations } from './animations.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.static('public'));

const lastStatuses = {};
const eventLog = [];

const STATS_PATH = './logs/stats.json';

async function loadAllTimeStats() {
  try {
    const raw = await readFile(STATS_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { messages: 0, replies: 0, filtered: 0, errors: 0, animations: 0 };
  }
}

let allTimeStats = await loadAllTimeStats();

async function saveAllTimeStats() {
  await writeFile(STATS_PATH, JSON.stringify(allTimeStats, null, 2), 'utf-8');
}

const STAT_KEY_BY_EVENT = {
  message_picked: 'messages',
  reply_generated: 'replies',
  filtered: 'filtered',
  error: 'errors',
  animation_triggered: 'animations',
};

async function bumpAllTimeStats(type) {
  const key = STAT_KEY_BY_EVENT[type];
  if (!key) return;

  allTimeStats[key]++;
  await saveAllTimeStats();
  io.emit('all_time_stats', allTimeStats);
}

const commandHandlers = {};

export function onCommand(name, handler) {
  commandHandlers[name] = handler;
}

io.on('connection', async (socket) => {
  console.log('  (panneau de contrôle connecté)');

  for (const [module, state] of Object.entries(lastStatuses)) {
    socket.emit('status', { module, state });
  }

  socket.emit('all_time_stats', allTimeStats);
  socket.emit('animations_list', await loadAnimations());
  socket.emit('history', eventLog);

  for (const [name, handler] of Object.entries(commandHandlers)) {
    socket.on(name, handler);
  }
});

export function startControlPanel(port = 3000) {
  httpServer.listen(port, () => {
    console.log(`✓ Panneau de contrôle disponible sur http://localhost:${port}`);
  });
}

export function emitEvent(type, payload) {
  const isEmptyWindow = type === 'window_closed' && payload.windowSize === 0;

  if (!isEmptyWindow) {
    eventLog.push({ timestamp: new Date().toISOString(), type, payload });
  }

  if (type === 'status') {
    lastStatuses[payload.module] = payload.state;
  }

  bumpAllTimeStats(type);

  io.emit(type, payload);
}

export function setupGracefulShutdown() {
  process.on('SIGINT', async () => {
    const stopTime = new Date();
    const filename = stopTime.toISOString().replace(/[:.]/g, '-');
    const filePath = `./logs/session_${filename}.json`;

    console.log(`\nArrêt en cours, sauvegarde des logs (${eventLog.length} événements)...`);

    await writeFile(
      filePath,
      JSON.stringify({ stoppedAt: stopTime.toISOString(), events: eventLog }, null, 2),
      'utf-8'
    );

    console.log(`✓ Logs sauvegardés : ${filePath}`);
    process.exit(0);
  });
}