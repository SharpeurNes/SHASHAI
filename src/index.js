import dotenv from 'dotenv';
import './twitchClient.js';
import { pickAndClearWindow, getWindowSize } from './chatBuffer.js';

dotenv.config();

const intervalSeconds = Number(process.env.PICK_INTERVAL_SECONDS) || 30;

console.log(`SHASHAI démarré. Tirage toutes les ${intervalSeconds}s.`);

setInterval(() => {
  console.log(`(fenêtre fermée, ${getWindowSize()} message(s) reçus)`);

  const picked = pickAndClearWindow();

  if (!picked) {
    console.log('-> aucun message cette fois-ci.');
    return;
  }

  console.log(`-> message retenu : [${picked.username}] ${picked.message}`);
}, intervalSeconds * 1000);