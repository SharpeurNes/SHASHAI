import { generateReply, extractExpressionTag } from './llm.js';
import { enqueueSpeech } from './tts.js';
import { triggerVNyan } from './avatarClient.js';
import { findAnimationByExpression } from './animations.js';
import { emitEvent } from './controlPanel.js';

const DEBOUNCE_MS = 8000;
let pending = [];
let timer = null;

export function reportSubEvent(description) {
  pending.push(description);

  if (timer) clearTimeout(timer);
  timer = setTimeout(flush, DEBOUNCE_MS);
}

async function flush() {
  const events = pending;
  pending = [];
  timer = null;

  const summary = events.length === 1
    ? events[0]
    : `Plusieurs events d'un coup : ${events.join(', ')}`;

  const reply = await generateReply('Système', summary);

  if (reply.trim() === '[filtered]') return;

  const { tag, text } = extractExpressionTag(reply);
  emitEvent('sub_thanks', { text, tag });

  enqueueSpeech(text, async () => {
    emitEvent('speaking_started', { reply: text, tag });
    if (tag) {
      const anim = await findAnimationByExpression(tag);
      if (anim) triggerVNyan(anim.id);
    }
  });
}