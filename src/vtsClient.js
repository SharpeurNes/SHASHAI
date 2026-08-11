import { ApiClient } from 'vtubestudio';
import WebSocket from 'ws';
import { readFile, writeFile } from 'fs/promises';

const TOKEN_PATH = './vts-auth-token.txt';

async function getAuthToken() {
  try {
    return await readFile(TOKEN_PATH, 'utf-8');
  } catch {
    return undefined; // pas encore de token, première connexion
  }
}

async function setAuthToken(token) {
  await writeFile(TOKEN_PATH, token, 'utf-8');
}

export const vts = new ApiClient({
  authTokenGetter: getAuthToken,
  authTokenSetter: setAuthToken,
  pluginName: 'SHASHAI',
  pluginDeveloper: 'Toi', // remplace par ton pseudo/nom si tu veux
  webSocketFactory: (url) => new WebSocket(url),
  url: 'ws://localhost:8001',
});

vts.on('connect', () => {
  console.log('✓ Connecté à VTube Studio.');
});

vts.on('disconnect', () => {
  console.log('✗ Déconnecté de VTube Studio.');
});

export async function triggerHotkey(hotkeyID) {
  try {
    await vts.hotkeyTrigger({ hotkeyID });
  } catch (err) {
    console.error('Erreur en déclenchant le hotkey VTube Studio :', err.message);
  }
}

const SPEAKING_HOTKEYS = [
  'd27258e424204029b6a66e16364aad3e', // Anim Shake
  '5455fb2f31e741cd9a962b25dcf55c3f', // Shock
];

export async function triggerRandomSpeakingAnimation() {
  const id = SPEAKING_HOTKEYS[Math.floor(Math.random() * SPEAKING_HOTKEYS.length)];
  await triggerHotkey(id);
}