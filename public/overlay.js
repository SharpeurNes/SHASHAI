const socket = io();
const captionEl = document.getElementById('caption');

let currentTimer = null;

function adjustFontSize(text) {
  if (text.length > 160) return '16px';
  if (text.length > 100) return '18px';
  if (text.length > 60) return '22px';
  return '26px';
}

socket.on('caption', ({ text, duration }) => {
  if (currentTimer) clearInterval(currentTimer);

  captionEl.style.fontSize = adjustFontSize(text);
  captionEl.textContent = '';
  captionEl.classList.add('visible');

    const totalMs = (duration || text.length * 0.05) * 1000 * 0.85;
  const delayPerChar = totalMs / text.length;

  let i = 0;
  currentTimer = setInterval(() => {
    captionEl.textContent += text[i];
    i++;

    if (i >= text.length) {
      clearInterval(currentTimer);
      setTimeout(() => captionEl.classList.remove('visible'), 2500);
    }
  }, delayPerChar);
});