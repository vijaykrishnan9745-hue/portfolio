// Generates dummy SVG artwork so the layout looks real before you add your own work.
import { writeFileSync } from 'node:fs';

const rand = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const palettes = [
  ['#2238c7', '#7aa2ff'], ['#0f766e', '#5eead4'], ['#9333ea', '#f0abfc'],
  ['#c2410c', '#fdba74'], ['#0369a1', '#7dd3fc'], ['#be123c', '#fda4af'],
];

function ui(i, w, h) {
  const r = rand(i * 97 + 13);
  const [a, b] = palettes[i % palettes.length];
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
<rect width="${w}" height="${h}" fill="url(#g)"/>`;
  const px = w * 0.1, py = h * 0.14, pw = w * 0.8, ph = h * 0.86;
  s += `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="18" fill="#0b0d14" opacity=".92"/>`;
  s += `<circle cx="${px + 24}" cy="${py + 22}" r="5" fill="#fff" opacity=".3"/><circle cx="${px + 42}" cy="${py + 22}" r="5" fill="#fff" opacity=".3"/><circle cx="${px + 60}" cy="${py + 22}" r="5" fill="#fff" opacity=".3"/>`;
  s += `<rect x="${px + 24}" y="${py + 48}" width="${pw * 0.1}" height="${ph - 72}" rx="8" fill="#fff" opacity=".06"/>`;
  const cx = px + 24 + pw * 0.1 + 18;
  s += `<rect x="${cx}" y="${py + 48}" width="${pw * 0.3}" height="14" rx="7" fill="#fff" opacity=".7"/>`;
  const cols = 3, cw = (pw - (cx - px) - 24 - 28) / cols;
  for (let c = 0; c < cols; c++) {
    s += `<rect x="${cx + c * (cw + 14)}" y="${py + 84}" width="${cw}" height="${ph * 0.2}" rx="10" fill="${c === i % 3 ? b : '#fff'}" opacity="${c === i % 3 ? 0.8 : 0.08}"/>`;
  }
  for (let k = 0; k < 6; k++) {
    const y = py + 84 + ph * 0.2 + 26 + k * 26;
    if (y > py + ph - 30) break;
    s += `<rect x="${cx}" y="${y}" width="${(pw - (cx - px) - 24) * (0.4 + r() * 0.6)}" height="10" rx="5" fill="#fff" opacity="${0.08 + r() * 0.1}"/>`;
  }
  return s + '</svg>';
}

function art(i, w, h) {
  const r = rand(i * 31 + 7);
  const [a, b] = palettes[(i + 2) % palettes.length];
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#101218"/>`;
  for (let k = 0; k < 5; k++) {
    s += `<circle cx="${r() * w}" cy="${r() * h}" r="${30 + r() * 90}" fill="${k % 2 ? a : b}" opacity="${0.35 + r() * 0.5}"/>`;
  }
  s += `<rect x="${w * 0.12}" y="${h * 0.62}" width="${w * 0.45}" height="14" rx="7" fill="#fff" opacity=".85"/><rect x="${w * 0.12}" y="${h * 0.72}" width="${w * 0.28}" height="10" rx="5" fill="#fff" opacity=".35"/>`;
  return s + '</svg>';
}

function photo(i, w, h) {
  const [a, b] = palettes[i % palettes.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="#0b0d14"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/><circle cx="${w * 0.5}" cy="${h * 0.4}" r="${w * 0.16}" fill="${b}" opacity=".55"/><path d="M${w * 0.15} ${h} Q${w * 0.5} ${h * 0.55} ${w * 0.85} ${h}Z" fill="${b}" opacity=".4"/></svg>`;
}

for (let i = 1; i <= 5; i++) writeFileSync(`public/images/projects/p${i}.svg`, ui(i, 1200, 900));
for (let i = 1; i <= 11; i++) writeFileSync(`public/images/garden/g${i}.svg`, i % 2 ? ui(i + 10, 800, 600) : art(i, 800, 600));
for (let i = 1; i <= 4; i++) writeFileSync(`public/images/gallery/photo-${i}.svg`, photo(i, 800, 1000));
console.log('placeholders written');
