/** Six original animal friends. The array order is the persisted multiplayer avatar ID. */
const outline = '#514354';
const ink = '#3e3446';
const palette = [
  { id: 'fox', name: 'Pip', animal: 'Fox', label: 'Pip the fox', color: '#f3a162', backdrop: '#fff0da' },
  { id: 'bunny', name: 'Lumi', animal: 'Bunny', label: 'Lumi the bunny', color: '#edb4ce', backdrop: '#fcebf4' },
  { id: 'panda', name: 'Bao', animal: 'Panda', label: 'Bao the panda', color: '#bcb3e7', backdrop: '#eeebfa' },
  { id: 'frog', name: 'Miso', animal: 'Frog', label: 'Miso the frog', color: '#a5ce91', backdrop: '#edf5df' },
  { id: 'cat', name: 'Cleo', animal: 'Cat', label: 'Cleo the cat', color: '#ecc27c', backdrop: '#fff3d9' },
  { id: 'penguin', name: 'Pico', animal: 'Penguin', label: 'Pico the penguin', color: '#a9ccdf', backdrop: '#e8f4fb' },
];
const moods = new Set(['idle', 'happy', 'thinking']);
const shape = (body, fill, extra = '') => `<path d="${body}" fill="${fill}" stroke="${outline}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const ellipse = (cx, cy, rx, ry, fill, extra = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
const cheek = (x, y, width = 8) => ellipse(x, y, width, 4.3, '#ee9bac', 'opacity=".66"');

function eyes(points, mood, panda = false) {
  return `<g class="sk-eyes">${points.map(([x, y], index) => {
    if (mood === 'happy') return `<path d="M${x - 5.3} ${y + 1} Q${x} ${y - 6.4} ${x + 5.3} ${y + 1}" fill="none" stroke="${panda ? '#fffaf5' : ink}" stroke-width="3.2" stroke-linecap="round"/>`;
    const dx = mood === 'thinking' ? -1.4 : 0;
    const dy = mood === 'thinking' ? -1.1 : 0;
    return `${panda ? ellipse(x, y, 8.2, 9, '#fffaf5') : ''}${ellipse(x + dx, y + dy, panda ? 5.5 : 6.1, panda ? 6.5 : 7.1, ink)}${ellipse(x + dx - 1.7, y + dy - 2.4, 1.9, 2.1, '#ffffff')}${ellipse(x + dx + 2, y + dy + 2.3, .85, .95, '#ffffff', 'opacity=".8"')}${mood === 'thinking' && index === 0 ? `<path class="sk-brow" d="M${x - 6} ${y - 12} Q${x} ${y - 15} ${x + 6} ${y - 11}" fill="none" stroke="${outline}" stroke-width="2.2" stroke-linecap="round"/>` : ''}`;
  }).join('')}</g>`;
}

function mouth(y, mood, width = 7) {
  if (mood === 'happy') return `<path d="M${64 - width} ${y} Q64 ${y + 4} ${64 + width} ${y} Q${64 + width - 1} ${y + 10} 64 ${y + 10} Q${65 - width} ${y + 10} ${64 - width} ${y}Z" fill="${ink}"/><path d="M59 ${y + 7} Q64 ${y + 4} 69 ${y + 7} Q64 ${y + 12} 59 ${y + 7}" fill="#ef9cad"/>`;
  if (mood === 'thinking') return `<path d="M61 ${y + 2} Q65 ${y - 1} 69 ${y + 2}" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>`;
  return `<path d="M${64 - width} ${y} Q64 ${y + 7} ${64 + width} ${y}" fill="none" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/>`;
}

function animalArt(id, mood) {
  switch (id) {
    case 'fox':
      return `${shape('M24 58C18 46 17 25 23 16C35 16 46 28 50 40Z', '#efa065')}${shape('M78 40C83 28 94 16 105 16C112 27 109 48 103 59Z', '#efa065')}<path d="M27 27Q39 31 43 43L27 48Z" fill="#d77d81"/><path d="M100 27Q88 31 85 43L100 48Z" fill="#d77d81"/>${shape('M22 58Q28 39 47 40Q64 33 81 40Q101 39 107 59C117 77 106 97 88 108Q64 122 40 108C21 98 11 78 22 58Z', '#f4a15f')}<path d="M23 70Q39 69 53 82Q64 88 75 82Q90 69 105 70C103 87 87 105 64 108C41 105 25 88 23 70Z" fill="#fff5e9"/>${cheek(33, 84)}${cheek(95, 84)}${eyes([[46, 67], [82, 67]], mood)}<path d="M59 82Q64 79 69 82Q69 86 64 88Q59 86 59 82Z" fill="${ink}"/>${mouth(91, mood)}<path d="m22 73-6 4 8 4m82-8 6 4-8 4" fill="#f4a15f" stroke="${outline}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>`;
    case 'bunny':
      return `${shape('M42 56C32 41 23 20 32 12C42 5 51 29 54 50Z', '#fff8ef')}${shape('M74 49C77 29 87 6 97 13C107 21 98 43 88 57Z', '#fff8ef')}<path d="M39 43C34 33 29 19 34 18C39 17 45 33 47 44Z" fill="#efb6c9"/><path d="M81 44C84 33 91 17 95 19C100 22 93 36 88 47Z" fill="#efb6c9"/>${shape('M25 72C24 51 43 41 64 44C85 41 104 51 103 72C112 97 95 116 64 117C33 116 16 97 25 72Z', '#fff8ef')}${ellipse(55, 96, 13, 9, '#ffffff')}${ellipse(73, 96, 13, 9, '#ffffff')}${cheek(34, 94)}${cheek(94, 94)}${eyes([[47, 77], [81, 77]], mood)}<path d="M60 90Q64 88 68 90Q67 94 64 95Q61 94 60 90Z" fill="#d996ab" stroke="${outline}" stroke-width="1.6"/>${mouth(99, mood, 6)}<path d="M29 62q3-6 8-7m54 0q5 1 8 7" fill="none" stroke="#f0e3da" stroke-width="3" stroke-linecap="round"/>`;
    case 'panda':
      return `${ellipse(32, 35, 15, 16, '#716077', `stroke="${outline}" stroke-width="3.4"`)}${ellipse(96, 35, 15, 16, '#716077', `stroke="${outline}" stroke-width="3.4"`)}${ellipse(32, 35, 7, 8, '#aa96b0')}${ellipse(96, 35, 7, 8, '#aa96b0')}${shape('M22 68C21 43 39 31 64 33C89 31 107 43 106 68L107 83C104 108 85 118 64 118C43 118 24 108 21 83Z', '#fffaf4')}${ellipse(44, 73, 15, 18, '#716077', 'transform="rotate(15 44 73)"')}${ellipse(84, 73, 15, 18, '#716077', 'transform="rotate(-15 84 73)"')}${cheek(33, 94, 7.7)}${cheek(95, 94, 7.7)}${eyes([[45, 73], [83, 73]], mood, true)}${ellipse(64, 91, 5.2, 3.5, ink)}${mouth(98, mood, 6)}<path d="M58 42q6-3 12 0" fill="none" stroke="#eee5e9" stroke-width="3" stroke-linecap="round"/>`;
    case 'frog':
      return `${shape('M22 61C14 48 21 28 37 27C48 25 56 32 59 41Q64 39 69 41C72 32 80 25 91 27C107 28 114 48 106 61C117 76 111 96 94 105Q64 119 34 105C17 96 11 76 22 61Z', '#acd28e')}${ellipse(39, 49, 13, 15, '#f8f7dc')}${ellipse(89, 49, 13, 15, '#f8f7dc')}${eyes([[41, 49], [87, 49]], mood)}${cheek(31, 79, 9)}${cheek(97, 79, 9)}${ellipse(59, 71, 1.4, 1.7, '#72915d')}${ellipse(69, 71, 1.4, 1.7, '#72915d')}${mouth(85, mood, 13)}<path d="M27 92q6 5 11 5m52 0q6-1 11-5" fill="none" stroke="#92bc77" stroke-width="3" stroke-linecap="round"/>`;
    case 'cat':
      return `${shape('M22 61C18 47 17 27 23 21C36 23 46 34 48 45Z', '#f0c77f')}${shape('M80 45C84 34 94 23 105 21C112 28 110 47 106 61Z', '#f0c77f')}<path d="m26 31 15 14-14 7Z" fill="#e6a3a7"/><path d="m102 31-15 14 14 7Z" fill="#e6a3a7"/>${shape('M22 62Q26 43 45 43Q64 36 83 43Q103 43 107 62C114 83 102 110 78 115Q64 119 50 115C26 110 14 83 22 62Z', '#f1c97f')}<path d="M54 43v10m10-12v13m10-11v10" fill="none" stroke="#d7a45b" stroke-width="4" stroke-linecap="round"/>${ellipse(64, 93, 21, 13, '#fff5df')}${cheek(33, 88)}${cheek(95, 88)}${eyes([[46, 73], [82, 73]], mood)}<path d="M59 87Q64 84 69 87L64 92Z" fill="#d88f9b" stroke="${outline}" stroke-width="1.6" stroke-linejoin="round"/>${mouth(97, mood, 6)}<path d="m15 84 15 4m-15 6 15-1m68-5 15-4m-15 9 15 1" fill="none" stroke="${outline}" stroke-width="2.2" stroke-linecap="round"/>`;
    case 'penguin':
      return `${shape('M28 69C27 43 43 29 58 29Q58 24 64 22Q70 24 71 29C88 29 103 44 101 69L105 88C108 108 87 120 64 120C41 120 20 108 23 88Z', '#78879b')}<path d="M31 71C34 51 49 51 64 62C79 51 94 51 97 71L98 86C97 104 83 113 64 114C45 113 31 104 30 86Z" fill="#fffaf2"/>${eyes([[47, 77], [81, 77]], mood)}${cheek(35, 94, 7.8)}${cheek(93, 94, 7.8)}<path d="M57 88Q64 84 71 88L64 96Z" fill="#edb35f" stroke="${outline}" stroke-width="2" stroke-linejoin="round"/>${mouth(101, mood, 5)}<path d="M34 48q4-7 11-9" fill="none" stroke="#9daab9" stroke-width="3" stroke-linecap="round"/>`;
  }
  return '';
}

function draw(sidekick, mood) {
  return `<svg class="sidekick-art sidekick-art--${sidekick.id} sidekick-art--${mood}" xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" aria-hidden="true" focusable="false"><circle cx="64" cy="68" r="54" fill="${sidekick.backdrop}"/>${ellipse(64, 113, 35, 5.5, outline, 'opacity=".08"')}<g class="sk-face">${animalArt(sidekick.id, mood)}</g></svg>`;
}

export const sidekicks = palette.map(sidekick => ({
  id: sidekick.id, name: sidekick.name, animal: sidekick.animal, label: sidekick.label, color: sidekick.color, svg: draw(sidekick, 'idle'),
}));

export function renderSidekick(value, mood = 'idle') {
  let index = 0;
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < palette.length) index = value;
  else if (typeof value === 'string') {
    const named = palette.findIndex(sidekick => sidekick.id === value);
    if (named >= 0) index = named;
    else if (/^[0-5]$/.test(value)) index = Number(value);
  }
  const expression = moods.has(mood) ? mood : 'idle';
  return draw(palette[index], expression);
}
