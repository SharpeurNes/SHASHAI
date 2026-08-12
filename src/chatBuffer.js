const MAX_SIZE = 200;
let window = [];
let fallback = [];

function isOnlyEmotes(message, emotesTag) {
  if (!emotesTag) return false;

  const nonSpaceLength = message.replace(/\s/g, '').length;

  let emoteCharCount = 0;
  for (const ranges of Object.values(emotesTag)) {
    for (const range of ranges) {
      const [start, end] = range.split('-').map(Number);
      emoteCharCount += end - start + 1;
    }
  }

  return emoteCharCount >= nonSpaceLength;
}

export function addMessage(entry) {
  if (window.length >= MAX_SIZE) return;

  const wordCount = entry.message.trim().split(/\s+/).filter(Boolean).length;

  if (wordCount <= 2) return; // trop court
  if (entry.message.startsWith('!')) return; // commande bot
  if (isOnlyEmotes(entry.message, entry.emotes)) return; // uniquement des emotes

  window.push(entry);
}

export function pickAndClearWindow() {
  if (window.length > 0) {
    const index = Math.floor(Math.random() * window.length);
    const picked = window[index];

    // les recalés de cette fenêtre deviennent le nouveau filet de secours
    fallback = window.filter((_, i) => i !== index);
    window = [];

    return picked;
  }

  // fenêtre vide : on repêche dans le filet de secours sans le vider
  if (fallback.length > 0) {
    const index = Math.floor(Math.random() * fallback.length);
    const [picked] = fallback.splice(index, 1); // on retire uniquement celui-ci
    return picked;
  }

  return null;
}

export function getWindowSize() {
  return window.length;
}