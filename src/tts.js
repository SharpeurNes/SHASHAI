import dotenv from 'dotenv';
import { writeFile } from 'fs/promises';
import { execFile } from 'child_process';
import { emitEvent } from './controlPanel.js';

dotenv.config();

const CHATTERBOX_URL = process.env.CHATTERBOX_URL;
const CHATTERBOX_VOICE = process.env.CHATTERBOX_VOICE;

let ttsAvailable = false;

async function pingTts() {
  try {
    const response = await fetch(`${CHATTERBOX_URL}/health`);
    const data = await response.json();
    return !!data.model_loaded;
  } catch {
    return false;
  }
}

export async function checkTtsServer() {
  ttsAvailable = await pingTts();
  emitEvent('status', { module: 'tts', state: ttsAvailable ? 'ok' : 'error' });
  console.log(ttsAvailable
    ? '✓ Serveur Chatterbox détecté et prêt.'
    : `  (Chatterbox non joignable sur ${CHATTERBOX_URL}, nouvelle tentative périodique...)`);

  setInterval(async () => {
    const nowAvailable = await pingTts();
    if (nowAvailable !== ttsAvailable) {
      ttsAvailable = nowAvailable;
      emitEvent('status', { module: 'tts', state: ttsAvailable ? 'ok' : 'error' });
      console.log(nowAvailable ? '✓ Chatterbox reconnecté.' : '✗ Chatterbox devenu injoignable.');
    }
  }, 10000);
}

export function isTtsAvailable() {
  return ttsAvailable;
}

export async function generateSpeech(text) {
  const response = await fetch(`${CHATTERBOX_URL}/v1/audio/speech`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: text,
      voice: CHATTERBOX_VOICE,
      language: 'fr',
      exaggeration: 0.55,
      cfg_weight: 0.7,
      temperature: 0.65,
    }),
  });

  if (!response.ok) {
    throw new Error(`Erreur Chatterbox (${response.status}): ${await response.text()}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

const MPV_AUDIO_DEVICE = 'wasapi/{552843d5-3f22-49ed-8d1c-596ff7dc85bd}';

export async function playSpeech(audioBuffer) {
  const filePath = './audio-debug/latest.wav';
  await writeFile(filePath, audioBuffer);
  console.log(`  (audio sauvegardé : ${filePath})`);

  return new Promise((resolve, reject) => {
    execFile(
      'mpv',
      ['--no-video', '--really-quiet', '--volume=160', `--audio-device=${MPV_AUDIO_DEVICE}`, filePath],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

let queue = Promise.resolve();

export function enqueueSpeech(text, onPlaybackStart) {
  queue = queue
    .then(async () => {
      const audio = await generateSpeech(text);
      const duration = getWavDuration(audio);

      if (onPlaybackStart) onPlaybackStart(duration);
      await playSpeech(audio);
      emitEvent('status', { module: 'tts', state: 'ok' });
    })
    .catch((err) => {
      console.error('Erreur dans la file audio :', err.message);
      emitEvent('status', { module: 'tts', state: 'error' });
    });

  return queue;
}

function getWavDuration(buffer) {
  const sampleRate = buffer.readUInt32LE(24);
  const channels = buffer.readUInt16LE(22);
  const bitsPerSample = buffer.readUInt16LE(34);
  const dataIndex = buffer.indexOf('data') + 4;
  const dataSize = buffer.readUInt32LE(dataIndex);

  return dataSize / (sampleRate * channels * (bitsPerSample / 8));
}