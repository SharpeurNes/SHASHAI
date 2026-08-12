import dotenv from 'dotenv';
import { writeFile } from 'fs/promises';
import { execFile } from 'child_process';
import { emitEvent } from './controlPanel.js';

dotenv.config();

const CHATTERBOX_URL = process.env.CHATTERBOX_URL;
const CHATTERBOX_VOICE = process.env.CHATTERBOX_VOICE;

export async function checkTtsServer() {
  try {
    const response = await fetch(`${CHATTERBOX_URL}/health`);
    const data = await response.json();
    if (!data.model_loaded) {
      throw new Error('Le modèle Chatterbox n\'est pas encore chargé.');
    }
    console.log('✓ Serveur Chatterbox détecté et prêt.');
  } catch (err) {
    console.error(
      `✗ Impossible de joindre le serveur Chatterbox sur ${CHATTERBOX_URL}.\n` +
      `  Lance-le d'abord avec : uv run uvicorn app.main:app --host 0.0.0.0 --port 4123\n` +
      `  (dans le dossier chatterbox-tts-api)`
    );
    process.exit(1);
  }
}

export async function generateSpeech(text) {
  const response = await fetch(`${CHATTERBOX_URL}/v1/audio/speech`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: text,
      voice: CHATTERBOX_VOICE,
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
      ['--no-video', '--really-quiet', `--audio-device=${MPV_AUDIO_DEVICE}`, filePath],
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
      if (onPlaybackStart) onPlaybackStart();
      await playSpeech(audio);
      emitEvent('status', { module: 'tts', state: 'ok' });
    })
    .catch((err) => {
      console.error('Erreur dans la file audio :', err.message);
      emitEvent('status', { module: 'tts', state: 'error' });
    });

  return queue;
}