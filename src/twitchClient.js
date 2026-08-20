import tmi from 'tmi.js';
import dotenv from 'dotenv';
import { addMessage } from './chatBuffer.js';
import { emitEvent } from './controlPanel.js';
import { reportSubEvent } from './subEvents.js';

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

client.on('subscription', (channel, username) => {
  reportSubEvent(`${username} vient de s'abonner pour la première fois`);
});

client.on('resub', (channel, username, months) => {
  reportSubEvent(`${username} vient de se réabonner pour le ${months}e mois`);
});

client.on('subgift', (channel, username, months, recipient) => {
  reportSubEvent(`${username} vient d'offrir un abonnement à ${recipient}`);
});

client.on('submysterygift', (channel, username, giftCount) => {
  reportSubEvent(`${username} vient d'offrir ${giftCount} abonnements au chat`);
});

client.on('raided', (channel, username, viewers) => {
  reportSubEvent(`${username} vient de raid le stream avec ${viewers} viewers`);
});

export function sendChatMessage(text) {
  client.say(process.env.TWITCH_CHANNEL, '[SHASHA] ' + text);
}


client.connect();