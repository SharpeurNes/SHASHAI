import tmi from 'tmi.js';
import dotenv from 'dotenv';
import { addMessage } from './chatBuffer.js';

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
    timestamp: Date.now(),
  });

  console.log(`[${tags['display-name']}] ${message}`);
});

client.connect();