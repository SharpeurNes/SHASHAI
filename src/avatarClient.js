import WebSocket from 'ws';
import { emitEvent } from './controlPanel.js';

const VNYAN_URL = 'ws://localhost:6776/vnyan';

let socket = null;

function connect() {
  socket = new WebSocket(VNYAN_URL);

  socket.on('open', () => {
    console.log('✓ Connecté à VNyan.');
    emitEvent('status', { module: 'vnyan', state: 'ok' });
  });

  socket.on('close', () => {
    console.log('✗ Déconnecté de VNyan, nouvelle tentative dans 5s...');
    emitEvent('status', { module: 'vnyan', state: 'error' });
    setTimeout(connect, 5000);
  });

  socket.on('error', (err) => {
    console.error('Erreur WebSocket VNyan :', err.message);
  });
}

connect();

export function triggerVNyan(message) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.log('  (VNyan non connecté, trigger ignoré)');
    return;
  }

  socket.send(message);
  emitEvent('animation_triggered', { name: message });
}