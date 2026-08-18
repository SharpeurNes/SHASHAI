import dotenv from 'dotenv';
import './twitchClient.js';
import './avatarClient.js';
import { generateReply, extractExpressionTag } from './llm.js';
import { checkTtsServer, enqueueSpeech } from './tts.js';
import { findAnimationByExpression } from './animations.js';
import { triggerVNyan } from './avatarClient.js';
import { startControlPanel, emitEvent, setupGracefulShutdown, onCommand } from './controlPanel.js';
import { pickAndClearWindow, getWindowSize, setPaused, isPaused } from './chatBuffer.js';


dotenv.config();

const intervalSeconds = Number(process.env.PICK_INTERVAL_SECONDS) || 30;

async function start() {
  await checkTtsServer();

  startControlPanel();
  setupGracefulShutdown();
  
  onCommand('pause', () => {
    setPaused(true);
    emitEvent('paused_state', { paused: true });
  });

  onCommand('resume', () => {
    setPaused(false);
    emitEvent('paused_state', { paused: false });
  });

  onCommand('trigger_animation', ({ id }) => {
    triggerVNyan(id);
  });

  onCommand('manual_tts', ({ text }) => {
    if (!text || !text.trim()) return;

    const { tag, text: cleanText } = extractExpressionTag(text.trim());

    emitEvent('manual_tts', { text: cleanText, tag });

    enqueueSpeech(cleanText, async (duration) => {
      emitEvent('speaking_started', { reply: cleanText, tag });
      emitEvent('caption', { text: cleanText, duration });

      if (tag) {
        const anim = await findAnimationByExpression(tag);
        if (anim) triggerVNyan(anim.id);
      }
    });
  });

  console.log(`SHASHAI démarré. Tirage toutes les ${intervalSeconds}s.`);

  setInterval(async () => {
    if (isPaused()) return;
    
    const windowSize = getWindowSize();
    emitEvent('window_closed', { windowSize });

    const picked = pickAndClearWindow();

    if (!picked) return;

    console.log(`-> message retenu : [${picked.username}] ${picked.message}`);
    emitEvent('message_picked', picked);

    let reply, tag, text;
    try {
      reply = await generateReply(picked.username, picked.message);
      emitEvent('status', { module: 'llm', state: 'ok' });

      if (reply.trim() === '[filtered]') {
        emitEvent('filtered', { username: picked.username, message: picked.message });
        return;
      }

      console.log(`-> réponse générée : ${reply}`);
      ({ tag, text } = extractExpressionTag(reply));
      emitEvent('reply_generated', { reply: text, tag });
    } catch (err) {
      console.error('Erreur LLM :', err.message);
      emitEvent('status', { module: 'llm', state: 'error' });
      return;
    }

    enqueueSpeech(text, async (duration) => {
      emitEvent('speaking_started', { reply: text, tag });
      emitEvent('caption', { text, duration });

      if (tag) {
        const anim = await findAnimationByExpression(tag);
        if (anim) triggerVNyan(anim.id);
      }
    });
  }, intervalSeconds * 1000);
}

start();