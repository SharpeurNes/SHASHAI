import { vts } from './vtsClient.js';

vts.on('connect', async () => {
  const response = await vts.hotkeysInCurrentModel();
  console.log('Hotkeys disponibles :', response.availableHotkeys);
});