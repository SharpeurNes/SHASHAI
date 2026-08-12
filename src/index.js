import dotenv from 'dotenv';
import './twitchClient.js';
import './vtsClient.js';
import { pickAndClearWindow, getWindowSize } from './chatBuffer.js';
import { generateReply } from './llm.js';
import { checkTtsServer, enqueueSpeech } from './tts.js';
import { triggerRandomSpeakingAnimation } from './vtsClient.js';
import { startControlPanel, emitEvent, setupGracefulShutdown } from './controlPanel.js';

dotenv.config();

const intervalSeconds = Number(process.env.PICK_INTERVAL_SECONDS) || 30;

async function start() {
  await checkTtsServer();

  startControlPanel();
  setupGracefulShutdown();

  console.log(`SHASHAI démarré. Tirage toutes les ${intervalSeconds}s.`);

  setInterval(async () => {
    const windowSize = getWindowSize();
    emitEvent('window_closed', { windowSize });

    const picked = pickAndClearWindow();

    if (!picked) return;

    console.log(`-> message retenu : [${picked.username}] ${picked.message}`);
    emitEvent('message_picked', picked);

    let reply;
    try {
      reply = await generateReply(picked.username, picked.message);
      emitEvent('status', { module: 'llm', state: 'ok' });

      if (reply.trim() === '[filtered]') {
        emitEvent('filtered', { username: picked.username, message: picked.message });
        return;
      }

      console.log(`-> réponse générée : ${reply}`);
      emitEvent('reply_generated', { reply });
    } catch (err) {
      console.error('Erreur LLM :', err.message);
      emitEvent('status', { module: 'llm', state: 'error' });
      return;
    }

    enqueueSpeech(reply, () => {
      emitEvent('speaking_started', { reply });
      triggerRandomSpeakingAnimation();
    });
  }, intervalSeconds * 1000);
}

start();