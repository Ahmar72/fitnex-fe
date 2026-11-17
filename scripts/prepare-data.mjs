// Builds a slim exercises.json + copies images from the dataset folder.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataset = path.resolve(root, '..', 'exercises-dataset-main');
const raw = JSON.parse(fs.readFileSync(path.join(dataset, 'data', 'exercises.json'), 'utf8'));

const LANGS = ['en', 'es', 'fr', 'it', 'tr', 'ru', 'pl', 'hi', 'zh', 'ko'];
const outImages = path.join(root, 'public', 'images');
const outVideos = path.join(root, 'public', 'videos');
const outData = path.join(root, 'public', 'data');
const outSteps = path.join(outData, 'steps');
fs.mkdirSync(outImages, { recursive: true });
fs.mkdirSync(outVideos, { recursive: true });
fs.mkdirSync(outSteps, { recursive: true });

const slim = [];
let copied = 0;
for (const e of raw) {
  const file = path.basename(e.image);
  const src = path.join(dataset, 'images', file);
  if (!fs.existsSync(src)) continue;
  const dest = path.join(outImages, file);
  if (!fs.existsSync(dest)) { fs.copyFileSync(src, dest); copied++; }
  slim.push({
    id: e.id,
    name: e.name,
    bodyPart: e.body_part,
    equipment: e.equipment,
    target: e.target,
    muscleGroup: e.muscle_group,
    secondary: e.secondary_muscles,
    image: `images/${file}`,
    gif: copyGif(e.gif_url),
    steps: e.instruction_steps.en,
  });
  // Per-exercise multilingual steps, loaded lazily on the detail page.
  const steps = {};
  for (const l of LANGS) if (e.instruction_steps[l]) steps[l] = e.instruction_steps[l];
  fs.writeFileSync(path.join(outSteps, `${e.id}.json`), JSON.stringify(steps));
}

fs.writeFileSync(path.join(outData, 'exercises.json'), JSON.stringify(slim));
console.log(`exercises: ${slim.length}, images copied: ${copied}`);
console.log(`attribution: ${raw[0].attribution}`);

function copyGif(rel) {
  const file = path.basename(rel);
  const src = path.join(dataset, 'videos', file);
  if (!fs.existsSync(src)) return null;
  const dest = path.join(outVideos, file);
  if (!fs.existsSync(dest)) fs.copyFileSync(src, dest);
  return `videos/${file}`;
}
