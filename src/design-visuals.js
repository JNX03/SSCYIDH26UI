/** Self-contained, non-interactive visual alternatives for the additional design drills. */
const hues = [
  ['Red', '#ed3d55'], ['Red-orange', '#f55b33'], ['Orange', '#f58b28'], ['Yellow-orange', '#ffc443'],
  ['Yellow', '#efda39'], ['Yellow-green', '#a6c94b'], ['Green', '#43ae78'], ['Blue-green', '#2ba7ae'],
  ['Blue', '#347bdf'], ['Blue-violet', '#6655cb'], ['Violet', '#9452bd'], ['Red-violet', '#cf4d9d'],
];
const supported = new Set(['design-wheel', 'design-palette', 'design-tint', 'design-saturation', 'design-contrast', 'design-consistency', 'design-feedback', 'design-target', 'design-choices', 'design-proximity', 'design-similarity', 'design-region', 'design-figureground', 'design-control', 'design-disclosure', 'design-recognition', 'design-prevention']);
const escape = text => String(text).replace(/[&<>"']/g, value => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[value]));
const color = value => /^#[a-f0-9]{6}$/i.test(value) ? value : '#8b5ad5';
const svg = (body, className = 'dv-icon', viewBox = '0 0 24 24') => `<svg class="${className}" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" fill="none" aria-hidden="true">${body}</svg>`;
const check = svg('<path d="m5 12 4 4L19 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>');
const close = svg('<path d="m7 7 10 10M17 7 7 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>');
const arrow = svg('<path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>');
const plus = svg('<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>');
const mockAction = (label, tone = '') => `<span class="dv-action ${tone}">${label}</span>`;
const lines = '<div class="dv-lines"><i></i><i></i><i></i></div>';
const field = (label, value) => `<div class="dv-field-pair"><span>${label}</span><div>${value}</div></div>`;
const chrome = '<div class="dv-chrome"><i></i><i></i><i></i><span>studio.space</span></div>';
const mock = (html, classes = '') => `<div class="dv-mock ${classes}">${html}</div>`;
const point = (angle, radius) => [110 + radius * Math.cos(angle * Math.PI / 180), 110 + radius * Math.sin(angle * Math.PI / 180)];
const formatPoint = p => p.map(n => n.toFixed(3)).join(' ');

function wheel(option) {
  const marks = (option.marks || []).filter(index => Number.isInteger(index) && index >= 0 && index < 12);
  const segments = hues.map(([name, fill], index) => {
    const start = index * 30 - 105;
    const end = start + 30;
    const outerStart = point(start, 81), outerEnd = point(end, 81);
    const innerEnd = point(end, 48), innerStart = point(start, 48);
    const d = `M ${formatPoint(outerStart)} A 81 81 0 0 1 ${formatPoint(outerEnd)} L ${formatPoint(innerEnd)} A 48 48 0 0 0 ${formatPoint(innerStart)} Z`;
    const [x, y] = point(index * 30 - 90, 97);
    return `<path d="${d}" fill="${fill}" fill-opacity="${marks.includes(index) ? 1 : .3}" stroke="white" stroke-width="2"/><text x="${x.toFixed(2)}" y="${(y + 2).toFixed(2)}" text-anchor="middle" fill="#645b71" font-size="5.7" font-family="Arial,sans-serif">${name}</text>`;
  }).join('');
  const connections = marks.length >= 2 ? `<polygon points="${marks.map(index => point(index * 30 - 90, 40).map(n => n.toFixed(2)).join(',')).join(' ')}" fill="${marks.length > 2 ? '#7c57d90b' : 'none'}" stroke="#494052" stroke-width="1.25" stroke-linejoin="round"/>` : '';
  const markers = marks.map(index => {
    const [x, y] = point(index * 30 - 90, 65);
    const [ix, iy] = point(index * 30 - 90, 40);
    return `<path d="M${ix} ${iy}L${x} ${y}" stroke="#494052" stroke-width="1"/><circle cx="${x}" cy="${y}" r="5" fill="white" stroke="#494052" stroke-width="1.4"/><circle cx="${ix}" cy="${iy}" r="2.6" fill="#494052"/>`;
  }).join('');
  return `<div class="dv-wheel-block"><span class="dv-overline">THE TRADITIONAL RYB WHEEL</span><svg class="dv-wheel" viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Color wheel marking ${escape(marks.map(index => hues[index][0]).join(', '))}">${segments}${connections}${markers}</svg><div class="dv-wheel-key">${marks.map(index => `<i style="background:${hues[index][1]}"></i>`).join('')}<span>Marked hues</span></div></div>`;
}

function colorStrip(option, type) {
  const colors = (option.colors || []).map(color);
  const labels = type === 'design-tint' ? ['Tint', 'Base', 'Shade'] : colors.map((_, index) => `0${index + 1}`);
  return `<div class="dv-color-study"><span class="dv-overline">${type === 'design-palette' ? 'PALETTE EXPLORATION' : 'A STUDY IN COLOR'}</span><div class="dv-color-strips">${colors.map((fill, index) => `<div><i style="background:${fill}"></i><span>${labels[index]}</span>${type === 'design-palette' ? `<small>${fill.toUpperCase()}</small>` : ''}</div>`).join('')}</div>${type === 'design-saturation' ? `<div class="dv-color-direction"><span>01</span><i></i>${arrow}<span>03</span></div>` : '<div class="dv-color-footnote">Observe the relationship between the swatches.</div>'}</div>`;
}

function member(name, role, index, varied) {
  const shape = varied ? ['round', 'square', 'round', 'square', 'square', 'round'][index] : role === 'Team' ? 'round' : 'square';
  const tone = varied ? ['violet', 'mint', 'coral', 'violet', 'coral', 'mint'][index] : role === 'Team' ? 'violet' : 'mint';
  return `<div class="dv-member"><i class="dv-avatar dv-${shape} dv-${tone}">${name[0]}</i><span>${name}</span><small>${role}</small></div>`;
}

export function renderDesignVisual(challenge, index) {
  if (!supported.has(challenge?.visual)) return null;
  const option = challenge.options?.[index];
  if (!option) return null;
  const good = option.variant === 'good';
  let content;
  switch (challenge.visual) {
    case 'design-wheel': content = wheel(option); break;
    case 'design-palette':
    case 'design-tint':
    case 'design-saturation': content = colorStrip(option, challenge.visual); break;
    case 'design-contrast':
      content = mock(`<span class="dv-event-tag">AFTER HOURS / VOL. 04</span><div class="dv-event-art"><i></i><i></i><i></i></div><strong class="dv-event-title">Make something<br>worth sharing.</strong><p class="dv-event-details ${good ? '' : 'dv-faint-details'}">Thu, 18 June · 18:00<br>Studio 4, Bangkok</p>`, 'dv-event-card');
      break;
    case 'design-consistency':
      content = mock(`${chrome}<div class="dv-mock-body"><span class="dv-overline">YOUR WORKSPACE</span><strong class="dv-title">A place for good ideas.</strong><div class="dv-toolbar ${good ? '' : 'dv-varied-toolbar'}">${mockAction('Write')}${mockAction('Sketch')}${mockAction('Explore')}</div><div class="dv-notebook"><span>Notes from today</span>${lines}</div></div>`);
      break;
    case 'design-feedback':
      content = mock(`${chrome}<div class="dv-mock-body"><span class="dv-overline">PROFILE SETTINGS</span><strong class="dv-title">Make it yours.</strong>${field('Display name', 'Alex Morgan')}<div class="dv-save-result">${good ? `<span class="dv-saved">${check} Changes saved</span>` : mockAction('Save changes')}</div><span class="dv-tiny">Your profile is visible to your team.</span></div>`);
      break;
    case 'design-target':
      content = `<div class="dv-target-stage">${mock(`<span class="dv-close-target ${good ? 'dv-large-target' : 'dv-small-target'}">${close}</span><span class="dv-overline">A LITTLE UPDATE</span><strong class="dv-title">Your space is ready.</strong><p>Everything you need to start<br>something new, in one place.</p><div class="dv-target-art"><i></i><i></i><i></i></div>`, 'dv-target-modal')}<span class="dv-pointer">${svg('<path d="m4 3 6 17 3-7 7-3Z" fill="#252034" stroke="white" stroke-width="1.2"/>')}</span></div>`;
      break;
    case 'design-choices':
      content = mock(`${chrome}<div class="dv-mock-body"><span class="dv-overline">START SOMETHING</span><strong class="dv-title">What brings you here?</strong><div class="dv-choice-grid ${good ? 'dv-category-grid' : 'dv-crowded-grid'}">${(good ? ['Design', 'Research', 'Writing'] : ['UI kit', 'Logo', 'Survey', 'Poster', 'Notes', 'Copy', 'Flow', 'Email', 'Icons', 'Quiz', 'Map', 'Audit']).map((label, itemIndex) => `<div><i class="dv-category-shape dv-shape-${itemIndex % 3}"></i><span>${label}</span></div>`).join('')}</div></div>`);
      break;
    case 'design-proximity':
      content = mock(`<span class="dv-overline">YOUR NEXT WORKSHOP</span><strong class="dv-title">Ideas into action.</strong><div class="dv-schedule ${good ? '' : 'dv-loose-labels'}">${[['Date', 'Saturday, 20 June'], ['Time', '10:00 – 12:00'], ['Place', 'The Creative Studio']].map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join('')}</div>`, 'dv-schedule-card');
      break;
    case 'design-similarity':
      content = mock(`<span class="dv-overline">THE PEOPLE BEHIND IT</span><strong class="dv-title">Your project crew.</strong><div class="dv-member-list">${[['Alex', 'Team'], ['Mina', 'Team'], ['Nico', 'Team'], ['Eli', 'Guest'], ['June', 'Guest'], ['Noah', 'Guest']].map(([name, role], memberIndex) => member(name, role, memberIndex, !good)).join('')}</div>`, 'dv-member-card');
      break;
    case 'design-region':
      content = `<div class="dv-region-study"><span class="dv-overline">LOOK AT THE GROUPS</span><div class="dv-region-boxes ${good ? '' : 'dv-no-regions'}">${[0, 1].map((_, groupIndex) => `<div>${[0, 1, 2, 3].map((_, dotIndex) => `<i class="dv-region-dot dv-dot-${(groupIndex + dotIndex) % 3}"></i>`).join('')}</div>`).join('')}</div><div class="dv-region-caption">Eight elements. Two possible groups.</div></div>`;
      break;
    case 'design-figureground':
      content = `<div class="dv-layer-study ${good ? 'dv-separated-layers' : 'dv-merged-layers'}"><div class="dv-background-page">${chrome}<div><strong>Your projects</strong>${lines}<div class="dv-background-tiles"><i></i><i></i><i></i></div>${lines}</div></div><i class="dv-backdrop"></i><div class="dv-layer-dialog"><span class="dv-dialog-symbol">${check}</span><strong>Ready to share?</strong><p>Your workspace is ready<br>for a little collaboration.</p>${mockAction('Invite your team')}</div></div>`;
      break;
    case 'design-control':
      content = mock(`${chrome}<div class="dv-mock-body dv-tour-body"><div class="dv-tour-art"><i></i><i></i><i></i><b></b></div><span class="dv-overline">WELCOME / 01 OF 04</span><strong class="dv-title">Make room for ideas.</strong><p>A little tour of your new creative space.</p><div class="dv-tour-footer">${good ? '<span class="dv-skip">Skip tour</span>' : '<span class="dv-tour-dots"><i></i><i></i><i></i><i></i></span>'}${mockAction(good ? `Next ${arrow}` : 'Next in 00:15', good ? '' : 'dv-disabled-action')}</div></div>`, 'dv-tour-card');
      break;
    case 'design-disclosure':
      content = mock(`<span class="dv-overline">NEW PROJECT</span><strong class="dv-title">Start with an idea.</strong>${field('Project name', 'My next chapter')}<div class="dv-advanced-settings ${good ? '' : 'dv-all-settings'}">${good ? '<span>Advanced settings <b>⌄</b></span>' : ['Visibility', 'Workspace', 'Region', 'Storage', 'Notifications', 'Version'].map((label, settingIndex) => `<span>${label}<i>${['Private', 'Personal', 'Global', 'Standard', 'Enabled', 'Latest'][settingIndex]}</i></span>`).join('')}</div>${mockAction('Create project', 'dv-full-action')}`, 'dv-settings-card');
      break;
    case 'design-recognition':
      content = mock(`<span class="dv-overline">MAKE A TRANSFER</span><strong class="dv-title">Who is it for?</strong>${good ? `<div class="dv-recipient-list">${[['Mina Chen', 'Recent recipient'], ['Alex Morgan', 'Saved recipient'], ['Noah Park', 'Saved recipient']].map(([name, detail], recipientIndex) => `<div><i class="dv-avatar dv-round dv-${['violet', 'mint', 'coral'][recipientIndex]}">${name[0]}</i><span><strong>${name}</strong><small>${detail}</small></span><b>›</b></div>`).join('')}</div>` : `${field('Recipient identifier', 'Enter account reference')}<p class="dv-recall-note">Enter the recipient’s exact account reference to continue.</p>${mockAction('Continue', 'dv-full-action dv-disabled-action')}`}`, 'dv-recipient-card');
      break;
    case 'design-prevention':
      content = mock(good ? `<span class="dv-danger-symbol">${close}</span><strong class="dv-title">Delete “Summer ideas”?</strong><p>This permanently removes the project<br>and its saved notes.</p><div class="dv-confirm-actions">${mockAction('Cancel', 'dv-secondary-action')}${mockAction('Delete project', 'dv-danger-action')}</div>` : `<span class="dv-overline">PROJECT SETTINGS</span><strong class="dv-title">Summer ideas</strong>${field('Project name', 'Summer ideas')}${lines}<div class="dv-confirm-actions">${mockAction('Save')}${mockAction('Delete', 'dv-danger-action')}</div>`, 'dv-delete-card');
      break;
  }
  return `<div class="dv-visual dv-visual-${challenge.visual}">${content}</div>`;
}
