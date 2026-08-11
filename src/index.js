import dotenv from 'dotenv';
import './twitchClient.js';
import { pickAndClearWindow, getWindowSize } from './chatBuffer.js';
import { generateReply } from './llm.js';
import { checkTtsServer, enqueueSpeech } from './tts.js';
import { triggerRandomSpeakingAnimation } from './vtsClient.js';
import './vtsClient.js';

dotenv.config();

const intervalSeconds = Number(process.env.PICK_INTERVAL_SECONDS) || 30;

async function start() {
  await checkTtsServer();

  console.log(`SHASHAI démarré. Tirage toutes les ${intervalSeconds}s.`);

  setInterval(async () => {
    console.log(`(fenêtre fermée, ${getWindowSize()} message(s) reçus)`);

    const picked = pickAndClearWindow();

    if (!picked) {
      console.log('-> aucun message cette fois-ci.');
      return;
    }

    console.log(`-> message retenu : [${picked.username}] ${picked.message}`);

    try {
      const reply = await generateReply(picked.username, picked.message);
      console.log(`-> réponse générée : ${reply}`);

      enqueueSpeech(reply);
      triggerRandomSpeakingAnimation();
    } catch (err) {
      console.error('Erreur pendant la génération :', err.message);
    }
  }, intervalSeconds * 1000);
}

start();