import tmi from 'tmi.js';
import dotenv from 'dotenv';
import { addMessage } from './chatBuffer.js';
import { emitEvent } from './controlPanel.js';

dotenv.config();

const client = new tmi.Client({
  identity: {
    username: process.env.TWITCH_BOT_USERNAME,
    password: process.env.TWITCH_OAUTH_TOKEN,
  },
  channels: [process.env.TWITCH_CHANNEL],
});

client.on('message', (channel, tags, message, self) => {
  if (self) return;

  addMessage({
    username: tags['display-name'],
    message,
    emotes: tags.emotes,
    timestamp: Date.now(),
  });
});

client.on('connected', () => {
  console.log('✓ Connecté à Twitch.');
  emitEvent('status', { module: 'twitch', state: 'ok' });
});

client.on('disconnected', () => {
  console.log('✗ Déconnecté de Twitch.');
  emitEvent('status', { module: 'twitch', state: 'error' });
});

client.connect();