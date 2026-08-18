const socket = io();
const connectionEl = document.getElementById('connection');
const logEl = document.getElementById('log');

// ---------- Stats "Session" ----------

const stats = { messages: 0, replies: 0, filtered: 0, errors: 0, animations: 0 };
const statEls = {
  messages: document.getElementById('stat-messages'),
  replies: document.getElementById('stat-replies'),
  filtered: document.getElementById('stat-filtered'),
  errors: document.getElementById('stat-errors'),
  animations: document.getElementById('stat-animations'),
};

function bumpStat(key) {
  stats[key]++;
  statEls[key].textContent = stats[key];
}

function trackStats(type) {
  if (type === 'message_picked') bumpStat('messages');
  if (type === 'reply_generated') bumpStat('replies');
  if (type === 'filtered') bumpStat('filtered');
  if (type === 'error') bumpStat('errors');
  if (type === 'animation_triggered') bumpStat('animations');
}

// ---------- Connexion ----------

socket.on('connect', () => {
  connectionEl.textContent = 'Connecté';
  connectionEl.className = 'connected';
});

socket.on('disconnect', () => {
  connectionEl.textContent = 'Déconnecté';
  connectionEl.className = 'disconnected';
});

// ---------- Pastilles de statut ----------

socket.on('status', ({ module, state }) => {
  const dot = document.querySelector(`.dot[data-module="${module}"]`);
  if (dot) {
    dot.classList.remove('ok', 'error');
    dot.classList.add(state);
  }
});

// ---------- Journal en direct ----------

function tagBadge(tag) {
  if (!tag) return '';
  return ` <span class="tag-badge">${tag}</span>`;
}

function describe(type, payload) {
  switch (type) {
    case 'message_picked':
      return `<span class="who">${payload.username}</span> — ${payload.message}`;
    case 'reply_generated':
      return payload.reply + tagBadge(payload.tag);
    case 'speaking_started':
      return `SHASHAI parle : "${payload.reply}"` + tagBadge(payload.tag);
    case 'error':
      return payload.message;
    case 'filtered':
      return `<span class="who">${payload.username}</span> — <em>message filtré</em>`;
    case 'animation_triggered':
      return `Animation déclenchée : <strong>${payload.name}</strong>`;
    case 'manual_tts':
      return `Texte manuel : "${payload.text}"` + tagBadge(payload.tag);
    case 'paused_state':
      return payload.paused ? 'Bot mis en pause' : 'Bot relancé';
    case 'caption':
      return `Affichage OBS: "${payload.duration}s"`;
    default:
      return JSON.stringify(payload);
  }
}

function addLogEntry(type, payload) {
  const entry = document.createElement('div');
  entry.className = 'entry';
  const time = new Date().toLocaleTimeString('fr-FR');
  entry.innerHTML = `
    <span class="time">${time}</span>
    <span class="type type-${type}">${type.replace(/_/g, ' ')}</span>
    <span class="content">${describe(type, payload)}</span>
  `;
  logEl.prepend(entry);
}

function isDisplayable(type) {
  const hidden = ['history', 'window_closed', 'status', 'all_time_stats', 'animations_list'];
  return !hidden.includes(type);
}

socket.on('history', (events) => {
  for (const { type, payload } of events) {
    trackStats(type);
    if (isDisplayable(type)) addLogEntry(type, payload);
  }
});

socket.onAny((type, payload) => {
  trackStats(type);
  if (isDisplayable(type)) addLogEntry(type, payload);
});

// ---------- Stats "Tout temps" ----------

socket.on('all_time_stats', (stats) => {
  document.getElementById('alltime-messages').textContent = stats.messages;
  document.getElementById('alltime-replies').textContent = stats.replies;
  document.getElementById('alltime-filtered').textContent = stats.filtered;
  document.getElementById('alltime-errors').textContent = stats.errors;
  document.getElementById('alltime-animations').textContent = stats.animations;
});

// ---------- Mode manuel (pause / TTS) ----------

const pauseBtn = document.getElementById('toggle-pause');
const manualText = document.getElementById('manual-text');
const manualSubmit = document.getElementById('manual-submit');

let paused = false;

pauseBtn.addEventListener('click', () => {
  socket.emit(paused ? 'resume' : 'pause');
});

manualSubmit.addEventListener('click', () => {
  const text = manualText.value.trim();
  if (!text) return;

  socket.emit('manual_tts', { text });
  manualText.value = '';
});

socket.on('paused_state', ({ paused: isPaused }) => {
  paused = isPaused;

  pauseBtn.textContent = paused ? 'Reprendre' : 'Pause';
  pauseBtn.classList.toggle('is-paused', paused);

  manualText.disabled = !paused;
  manualSubmit.disabled = !paused;
});

// ---------- Animations ----------

const animationsGrid = document.getElementById('animations-grid');

socket.on('animations_list', (animations) => {
  animationsGrid.innerHTML = '';

  for (const anim of animations) {
    const btn = document.createElement('button');
    btn.className = 'anim-btn';
    btn.textContent = anim.label;
    btn.addEventListener('click', () => {
      socket.emit('trigger_animation', { id: anim.id });
    });
    animationsGrid.appendChild(btn);
  }
});

document.getElementById('stop-anim-btn').addEventListener('click', () => {
  socket.emit('trigger_animation', { id: 'stop_anim' });
});