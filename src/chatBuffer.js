const MAX_SIZE = 200;
let window = [];
let fallback = [];

export function addMessage(entry) {
  if (window.length >= MAX_SIZE) return;
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