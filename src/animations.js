import { readFile } from 'fs/promises';

const ANIMATIONS_PATH = './data/animations.json';

export async function loadAnimations() {
  try {
    const raw = await readFile(ANIMATIONS_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Impossible de charger data/animations.json :', err.message);
    return [];
  }
}

export async function findAnimationByExpression(tag) {
  const animations = await loadAnimations();
  return animations.find((a) => a.expression === tag) || null;
}