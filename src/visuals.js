import {renderDesignVisual} from './design-visuals.js';
const icon = (name) => {
  const paths = {
    check: '<path d="m5 12 4 4L19 6"/>',
    arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
    home: '<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/>',
    settings: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',
    file: '<path d="M6 3h9l4 4v14H6Z"/><path d="M14 3v5h5M9 12h7M9 16h5"/>',
    plus: '<path d="M12 4v16M4 12h16"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="2"/><path d="m3 18 6-6 4 4 3-3 5 5"/>',
    alert: '<path d="m12 3 10 18H2Z"/><path d="M12 9v5m0 3v1"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m3 6 9 7 9-7"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    heart: '<path d="M12 21 3 12a6 6 0 0 1 9-8 6 6 0 0 1 9 8Z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.file}</svg>`;
};
const button = (text, kind = '') => `<span class="vg-btn ${kind}">${text}</span>`;
const field = (label, value = '', extra = '') => `<div class="vg-field-wrap">${label ? `<span class="vg-label">${label}</span>` : ''}<div class="vg-field ${extra}">${value || '<span class="vg-muted">Enter your email</span>'}</div></div>`;
const lines = (count = 3, cls = '') => `<div class="vg-lines ${cls}">${Array.from({length:count}, (_,i) => `<i style="--line-width:${i===count-1?'62%':'100%'}"></i>`).join('')}</div>`;
const card = (content, cls = '') => `<div class="vg-app ${cls}">${content}</div>`;
const bookCopy = 'Good design starts with a little curiosity. Give every idea the room it needs to become something useful.';
const plant = `<div class="vg-plant"><span class="vg-leaf vg-leaf-1"></span><span class="vg-leaf vg-leaf-2"></span><span class="vg-leaf vg-leaf-3"></span><span class="vg-pot"></span></div>`;


const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const courseSvg = (inside, cls = '') => `<svg class="vg-course-diagram ${cls}" viewBox="0 0 250 86" fill="none" aria-hidden="true">${inside}</svg>`;
const miniScreen = (x, y, width = 60, height = 48) => `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="5" fill="white" stroke="#d9cdec"/><path d="M${x} ${y+10}h${width}" stroke="#e8e0f2"/><circle cx="${x+6}" cy="${y+5}" r="1.2" fill="#b59bde"/><circle cx="${x+10}" cy="${y+5}" r="1.2" fill="#e1d4f3"/><rect x="${x+7}" y="${y+17}" width="${width-14}" height="${height-24}" rx="2" fill="#eee6f9"/>`;
const miniPerson = (x, y, tone = '#cab5e8') => `<circle cx="${x}" cy="${y}" r="8" fill="${tone}"/><path d="M${x-14} ${y+24}q0-16 14-16t14 16" fill="${tone}"/>`;

function courseIllustration(challenge, option) {
  const lesson = challenge.lessonId || challenge.id.replace(/-\d+$/, '');
  const symbol = String(option.symbol || '').toLowerCase();
  const colors = ['#c0a5e6','#dacaf0','#a9bfa2','#e4c7af','#d5b3ca'];
  const palette = `<div class="vg-course-palette">${colors.map((color,i)=>`<span style="background:${color};height:${[42,62,50,70,55][i]}px"></span>`).join('')}</div>`;
  switch (lesson) {
    case 'course-ux-meaning':
      return symbol.includes('screen') || symbol.includes('visual')
        ? courseSvg(`${miniScreen(76,10,98,64)}<rect x="91" y="36" width="33" height="22" rx="3" fill="#c5ade6"/><path d="M134 39h24m-24 6h18m-18 6h21" stroke="#c0a9df" stroke-width="3"/>`)
        : courseSvg(`<path d="M37 43h176" stroke="#d7c7ee" stroke-width="2" stroke-dasharray="4 5"/>${[42,125,208].map((x,i)=>`<circle cx="${x}" cy="43" r="${i===1?18:13}" fill="${i===1?'#b79bdc':'#e2d6f3'}" stroke="white" stroke-width="4"/><path d="m${x-4} 43 3 3 6-6" stroke="white" stroke-width="2"/>`).join('')}`);
    case 'course-user-centered':
      return courseSvg(`<circle cx="125" cy="42" r="33" stroke="#d7c8eb" stroke-dasharray="4 4"/>${miniPerson(125,30,'#bca0e1')}<rect x="28" y="16" width="47" height="26" rx="5" fill="#e8dff5"/><path d="M38 25h26m-26 7h18" stroke="#bda4de" stroke-width="3"/><rect x="177" y="44" width="46" height="26" rx="5" fill="#e8dff5"/><path d="M187 53h26m-26 7h18" stroke="#bda4de" stroke-width="3"/><path d="m77 28 12 6m72 17 12 6" stroke="#c7b3e2" stroke-width="2"/>`);
    case 'course-color-basics':
      return palette;
    case 'course-type-basics':
      return `<div class="vg-course-type"><span>Aa</span><div><i></i><i></i><i></i></div></div>`;
    case 'course-ui-blocks':
      return courseSvg(`${miniScreen(46,7,158,72)}<rect x="59" y="27" width="35" height="39" rx="3" fill="#d1bee9"/><rect x="104" y="27" width="86" height="8" rx="3" fill="#d1bee9"/><rect x="104" y="43" width="66" height="4" rx="2" fill="#d1bee9"/><rect x="104" y="53" width="52" height="14" rx="3" fill="#b99bdf"/>`);
    case 'course-hsv':
      return `<div class="vg-course-hsv"><div><span>H</span><i class="vg-hue-bar"></i></div><div><span>S</span><i class="vg-saturation-bar"></i></div><div><span>V</span><i class="vg-value-bar"></i></div></div>`;
    case 'course-raster-vector':
      return symbol.includes('raster') || symbol.includes('pixel') || symbol.includes('photo')
        ? courseSvg(`<g transform="translate(87 8)">${Array.from({length:7},(_,row)=>Array.from({length:7},(_,col)=>`<rect x="${col*10}" y="${row*10}" width="9" height="9" fill="${Math.abs(col-3)+Math.abs(row-3)<4?'#b89cdc':'#e9e0f5'}"/>`).join('')).join('')}</g>`)
        : courseSvg(`<path d="M67 66C67-2 183-2 183 66Z" fill="#e7dcf4" stroke="#b89cdc" stroke-width="2"/><path d="M67 66V19m116 47V19M67 19h116" stroke="#cdb7e6" stroke-dasharray="3 3"/>${[[67,66],[183,66],[67,19],[183,19]].map(([x,y])=>`<rect x="${x-3}" y="${y-3}" width="6" height="6" rx="1" fill="white" stroke="#a98acb"/>`).join('')}<circle cx="125" cy="31" r="4" fill="#b89cdc"/>`);
    case 'course-image-formats':
      return courseSvg(`<rect x="65" y="9" width="120" height="66" rx="6" fill="#ebe4f2"/><circle cx="153" cy="29" r="10" fill="#d8bfdc"/><path d="m65 65 37-37 28 28 18-15 37 34H65Z" fill="#baa4d1"/><path d="m65 65 37-37 28 28" stroke="#9e82bc" stroke-width="2"/><rect x="152" y="59" width="41" height="17" rx="4" fill="white" stroke="#d5c3e9"/><path d="M160 67h24" stroke="#bda4da" stroke-width="3"/>`);
    case 'course-motion':
      return courseSvg(`<path d="M43 58C82 58 88 25 125 25s46 33 82 33" stroke="#d1bee9" stroke-width="2" stroke-dasharray="4 4"/><circle cx="44" cy="58" r="10" fill="#eae2f5"/><circle cx="86" cy="40" r="11" fill="#dbcbef"/><circle cx="128" cy="25" r="12" fill="#c8b1e4"/><circle cx="171" cy="42" r="13" fill="#b697dc"/><circle cx="208" cy="58" r="14" fill="#a181cf"/>`);
    case 'course-icons':
      return `<div class="vg-course-icons">${['home','search','heart','mail','settings','file'].map(name=>`<span>${icon(name)}</span>`).join('')}</div>`;
    case 'course-depth':
      return `<div class="vg-course-depth"><i></i><i></i><i><span></span><span></span></i></div>`;
    case 'course-type-anatomy':
      return `<div class="vg-course-anatomy"><i></i><i></i><i></i><span>Ag</span><b>x-height</b></div>`;
    case 'course-visual-principles':
      return courseSvg(`<rect x="49" y="17" width="58" height="52" rx="5" fill="#cfbce8"/><circle cx="149" cy="28" r="11" fill="#b89cdd"/><circle cx="183" cy="28" r="11" fill="#dcccf0"/><path d="M136 51h62m-62 10h48" stroke="#c2a9df" stroke-width="5" stroke-linecap="round"/><path d="M37 8v70m176-70v70" stroke="#d9caec" stroke-dasharray="3 3"/>`);
    case 'course-applied-principles':
      return courseSvg(`${miniScreen(54,9,142,68)}<rect x="66" y="29" width="48" height="35" rx="3" fill="#c4abe1"/><path d="M126 32h54m-54 9h41" stroke="#bda3dc" stroke-width="4" stroke-linecap="round"/><rect x="126" y="51" width="47" height="13" rx="4" fill="#ab8bce"/>`);
    case 'course-atomic':
      return courseSvg(`<circle cx="39" cy="43" r="10" fill="#cbb7e8"/><path d="m59 43 23 0m-6-5 6 5-6 5" stroke="#c9b5e4" stroke-width="2"/><rect x="94" y="24" width="44" height="38" rx="7" fill="#eadff6"/><circle cx="108" cy="43" r="6" fill="#b79bdc"/><path d="M119 40h11m-11 6h8" stroke="#b79bdc" stroke-width="2"/><path d="m149 43 23 0m-6-5 6 5-6 5" stroke="#c9b5e4" stroke-width="2"/>${miniScreen(183,15,48,55)}`);
    case 'course-heuristics':
      return courseSvg(`${miniScreen(62,10,126,66)}<circle cx="125" cy="43" r="13" fill="#c6b0e3"/><path d="m119 43 4 4 8-8" stroke="white" stroke-width="2"/><path d="M102 65h46" stroke="#c6b0e3" stroke-width="3" stroke-linecap="round"/>`);
    case 'course-composition':
      return `<div class="vg-course-composition"><i></i><i></i><i></i><span></span></div>`;
    case 'course-grids':
      return `<div class="vg-course-grid">${Array.from({length:6},(_,i)=>`<i><span style="height:${[25,38,18,31,20,38][i]}px"></span></i>`).join('')}<b></b><b></b></div>`;
    case 'course-responsive':
      return courseSvg(`${miniScreen(25,9,116,65)}${miniScreen(129,24,68,50)}${miniScreen(185,35,32,43)}<path d="M141 44h-4m60 10h-6" stroke="#c4a9e1" stroke-width="2"/>`);
    case 'course-roles':
      return courseSvg(`${[62,125,188].map((x,i)=>`${miniPerson(x,28,['#c8b1e5','#b99cda','#dac8ee'][i])}<rect x="${x-22}" y="61" width="44" height="6" rx="3" fill="#ddd0ed"/>`).join('')}`);
    case 'course-ui-deliverables':
      return courseSvg(`<rect x="75" y="4" width="123" height="69" rx="5" fill="#e3d8f0" stroke="#d4c3e8"/>${miniScreen(51,17,124,65)}<rect x="63" y="36" width="33" height="33" rx="3" fill="#c5ade3"/><path d="M106 39h54m-54 9h42m-42 9h47" stroke="#b99dda" stroke-width="4" stroke-linecap="round"/>`);
    case 'course-ux-deliverables':
      return courseSvg(`<path d="M50 43h150" stroke="#c7afe2" stroke-width="2"/>${[52,125,198].map((x,i)=>`<circle cx="${x}" cy="43" r="5" fill="#b397d5"/><rect x="${x-24}" y="${i===1?5:55}" width="48" height="25" rx="3" fill="${i===1?'#e9dfb8':'#dfd1ef'}"/><path d="M${x-15} ${i===1?15:65}h30m-30 6h20" stroke="#b8a2ce" stroke-width="2"/>`).join('')}`);
    case 'course-copy':
      return courseSvg(`<rect x="50" y="12" width="150" height="62" rx="6" fill="white" stroke="#d9c9ed"/><path d="M65 29h89" stroke="#b69cd7" stroke-width="6" stroke-linecap="round"/><path d="M65 43h115m-115 9h90" stroke="#e0d4ef" stroke-width="3" stroke-linecap="round"/><rect x="65" y="61" width="46" height="7" rx="3" fill="#c2a8df"/><path d="m170 23 8-8 6 6-8 8-9 3Z" fill="#e2c4ac"/>`);
    case 'course-research':
      return courseSvg(`${miniPerson(70,34,'#c4abdf')}${miniPerson(181,34,'#dbc9ed')}<path d="M96 13h60a6 6 0 0 1 6 6v19a6 6 0 0 1-6 6h-40l-11 8v-8h-9a6 6 0 0 1-6-6V19a6 6 0 0 1 6-6Z" fill="white" stroke="#d0bce8"/><path d="M105 25h42m-42 9h30" stroke="#c7b0e0" stroke-width="3" stroke-linecap="round"/>`);
    case 'course-architecture':
      return courseSvg(`<path d="M125 30v15M54 45h142M54 45v13m71-13v13m71-13v13" stroke="#c4abdf" stroke-width="1.6"/><rect x="102" y="8" width="46" height="22" rx="5" fill="#bda2dc"/>${[54,125,196].map(x=>`<rect x="${x-24}" y="58" width="48" height="20" rx="4" fill="#e4d8f2"/><path d="M${x-13} 68h26" stroke="#c1a9dc" stroke-width="3"/>`).join('')}`);
    default:
      return `<div class="vg-course-icons"><span>${icon(symbol in {home:1,search:1,heart:1,mail:1,settings:1,file:1,image:1,eye:1,lock:1} ? symbol : 'file')}</span><span>${icon('arrow')}</span><span>${icon('image')}</span></div>`;
  }
}

function renderCourseConcept(challenge, option) {
  return `<div class="vg-course-scenario"><div class="vg-course-art">${courseIllustration(challenge,option)}</div><div class="vg-course-scenario-copy"><strong>${escapeHtml(option.heading || option.label)}</strong><p>${escapeHtml(option.detail || '')}</p></div></div>`;
}

/** Render original, non-interactive design mockups inside the app's answer buttons. */
export function renderVisual(challenge, optionIndex, compact = false) {
  const designed=renderDesignVisual(challenge,optionIndex);
  if(designed!==null)return designed;
  const option = challenge.options[optionIndex];
  const good = option.variant === 'good' || option.variant === 'kerning';
  const type = challenge.visual;
  let content = '';
  switch (type) {
    case 'course-concept':
    case 'course-color':
    case 'course-image':
    case 'course-shadow':
    case 'course-motion':
    case 'course-grid':
      content = renderCourseConcept(challenge, option);
      break;
    case 'colorwheel': {
      const wheelColors=['#f52b35','#fa6527','#ff9627','#ffc226','#f2e82b','#9bcf3c','#52a64b','#49b996','#3f86c8','#4d56ad','#8252ab','#d01480'];
      const point=(r,a)=>[150+r*Math.cos(a*Math.PI/180),150+r*Math.sin(a*Math.PI/180)];
      const sections=wheelColors.map((color,i)=>{const a=i*30-105,b=a+30,p1=point(108,a),p2=point(108,b),p3=point(53,b),p4=point(53,a);return `<path d="M${p1} A108 108 0 0 1 ${p2} L${p3} A53 53 0 0 0 ${p4} Z" fill="${color}"/>`;}).join('');
      const points=challenge.wheel==='tertiary'?(good?[1,3,5,7,9,11]:[0,4,8]):challenge.wheel==='complementary'?(good?[0,6]:[0,2]):(good?[0,1,2]:[0,4,8]);
      const marks=points.map(i=>{const a=i*30-90,p=point(111,a),inner=point(52,a);return `<path d="M${inner} L${p}" stroke="white" stroke-width="4"/><circle cx="${p[0]}" cy="${p[1]}" r="21" fill="${wheelColors[i]}" stroke="white" stroke-width="4"/>`;}).join('');
      content=`<div class="vg-colorwheel"><svg viewBox="0 0 300 300" aria-hidden="true">${sections}${marks}</svg></div><span class="vg-wheel-model">TRADITIONAL RYB COLOR WHEEL</span>`;
      break;
    }
    case 'kerning':
      content = `<div class="vg-kerning ${option.variant === 'kerning' ? 'vg-pair' : 'vg-all-gaps'}" aria-label="${option.variant === 'kerning' ? 'One pair of letters highlighted' : 'Spacing between every letter highlighted'}">${'Kerning'.split('').map((letter,i) => `<span>${letter}${i < 6 ? '<i></i>' : ''}</span>`).join('')}</div>`;
      break;
    case 'heading':
      content = card(`<div class="vg-type-page"><span class="vg-eyebrow">YOUR WORKSPACE</span><strong class="vg-type-title">${good?'Your saved<br>projects.':'A little<br>inspiration.'}</strong><p>Everything you’re working on, together in one place.</p><div class="vg-nav-tiles"><i></i><i></i><i></i></div></div>`);
      break;
    case 'hierarchy':
      content = card(`<div class="vg-type-page ${good?'':'vg-flat-type'}"><span class="vg-eyebrow">THE EVERYDAY JOURNAL</span><strong class="vg-type-title">Small rituals.<br>Better days.</strong><p>A little inspiration for a slower, more intentional life.</p><span class="vg-text-link">Read the story ${icon('arrow')}</span></div>`);
      break;
    case 'leading':
      content = card(`<strong class="vg-serif-head">Room to breathe.</strong><p class="vg-reading ${good?'':'vg-tight-leading'}">${bookCopy} A comfortable rhythm makes the next sentence feel effortless.</p>`, 'vg-copy-card');
      break;
    case 'measure':
      content = card(`<strong class="vg-serif-head">A moment to pause.</strong><p class="vg-reading ${good?'vg-good-measure':'vg-long-measure'}">${bookCopy} Making things clear is a quiet kind of kindness.</p>`, 'vg-copy-card');
      break;
    case 'alignment':
      content = card(`<div class="vg-align ${good?'':'vg-misaligned'}"><span class="vg-eyebrow">MEET YOUR NEXT READ</span><strong class="vg-small-title">Made for curious minds.</strong><p>Stories that help you see the everyday a little differently. Explore new ideas, find fresh perspectives, and follow your curiosity somewhere good.</p>${button('Explore the collection')}</div>`);
      break;
    case 'typeface':
      content = card(`<div class="vg-typeface ${good?'':'vg-decorative'}"><span class="vg-eyebrow">YOUR SPACE, SIMPLIFIED</span><strong>Make yourself<br>at home.</strong><p>Thoughtful objects for everyday living.</p>${button('Find your favorites')}</div>`);
      break;
    case 'weight':
      content = card(`<div class="vg-weights ${good?'':'vg-everything-bold'}"><span class="vg-eyebrow">OVERVIEW</span><strong>Your weekly activity</strong><div class="vg-number">24.6 <span>km</span></div><p>Looking good! You walked 12% more this week.</p></div>`);
      break;
    case 'tracking':
      content = card(`<span class="vg-eyebrow">A NEW PERSPECTIVE</span><strong class="vg-serif-head">Less, but better.</strong><p class="vg-reading ${good?'':'vg-wide-body'}">Simple things, thoughtfully made. A place for ideas that make everyday life a little better.</p>`);
      break;
    case 'contrast':
      content = card(`<div class="vg-contrast ${good?'':'vg-low-contrast'}"><span class="vg-eyebrow">YOUR NEXT ADVENTURE</span><strong>Somewhere new<br>starts here.</strong><p>Find a place that feels like you.</p>${button('Explore places')}</div>`);
      break;
    case 'saturation':
      content = card(`<div class="vg-saturation ${good?'':'vg-saturated-ui'}"><span class="vg-eyebrow">YOUR WEEKLY INSPIRATION</span><strong class="vg-small-title">A little good in your inbox.</strong><p>Fresh ideas, new perspectives, and a moment to get curious.</p>${field('Email address','hello@studio.co')}${button('Join the community','vg-wide')}</div>`);
      break;
    case 'palette':
    case 'colorbalance':
      content = `<div class="vg-palette ${good?'':'vg-clashing'}"><div class="vg-color-poster"><span class="vg-eyebrow">A LITTLE EVERYDAY JOY</span><strong>Make<br>good things.</strong><div class="vg-poster-dot"></div><span class="vg-poster-caption">Ideas worth bringing to life. ↗</span></div><div class="vg-swatches">${Array.from({length:5},()=>'<i></i>').join('')}</div></div>`;
      break;
    case 'meaning':
      content = card(`<span class="vg-eyebrow">PAYMENT STATUS</span><div class="vg-status ${good?'vg-green':'vg-color-status'}">${good?`${icon('check')} Payment successful`:'<i></i> Order #1048'}</div><p>${good?'Your order is confirmed. A little something good is on its way.':'You can view the current status of your order above.'}</p><div class="vg-receipt">ORDER #1048 <strong>$48.00</strong></div>`);
      break;
    case 'focus':
      content = card(`<strong class="vg-small-title">How do you like to create?</strong><p>Choose your workspace style.</p><div class="vg-select-option ${good?'vg-clear-selected':'vg-subtle-selected'}"><span>${icon('image')} A little visual inspiration</span>${good?icon('check'):''}</div><div class="vg-select-option"><span>${icon('file')} A clean, quiet canvas</span></div>`);
      break;
    case 'keyboard':
      content = card(`<strong class="vg-small-title">Ready for your next chapter?</strong><p>Join a community of curious people.</p><div class="vg-field-wrap"><span class="vg-label">Your email</span><div class="vg-field ${good?'vg-focused':''}">hello@studio.co<span class="vg-caret"></span></div></div>${button('Join the community', 'vg-wide')}`);
      break;
    case 'formgroup':
      content = card(`<strong class="vg-small-title">A little about you.</strong><div class="vg-form-section">${good?'<span class="vg-section-label">Personal details</span>':''}${field('Name','Alex Morgan')}${field('Email','alex@studio.co')}</div><div class="vg-form-section ${good?'vg-section-spaced':''}">${good?'<span class="vg-section-label">Delivery address</span>':''}${field('Street address','18 Garden Lane')}</div>`,'vg-form-card vg-group-form');
      break;
    case 'grouping':
    case 'proximity':
      content = card(`<strong class="vg-small-title">Make it yours</strong><div class="vg-groups ${good?'':'vg-ungrouped'}"><div><span class="vg-label">First name</span><div class="vg-field">Alex</div></div><div><span class="vg-label">Last name</span><div class="vg-field">Morgan</div></div></div><span class="vg-label">Email address</span><div class="vg-field">alex@studio.co</div>`, 'vg-form-card');
      break;
    case 'spacing':
    case 'whitespace':
      content = card(`<div class="vg-space ${good?'':'vg-cramped'}"><span class="vg-eyebrow">A FRESH START</span><strong>Find your focus.</strong><p>A calmer space for your ideas, projects, and the things that matter.</p>${button('Create your space')}${good?'':lines(4)}</div>`);
      break;
    case 'density':
      content = card(`<strong class="vg-small-title">Your saved collections</strong><div class="vg-density-list ${good?'':'vg-dense-list'}">${['Small spaces, big ideas','Things worth keeping','A little inspiration'].map((name,i)=>`<div><strong>${name}</strong><span>${[12,8,24][i]} items · Updated today</span>${good?'':'<small>Private / Category '+(i+1)+' / ID 1048 / Auto-sync on</small>'}</div>`).join('')}</div>`);
      break;
    case 'grid':
      content = `<div class="vg-gallery ${good?'':'vg-broken-grid'}">${['Sage','Dune','Clay','Stone','Olive','Cloud'].map((name,i)=>`<div class="vg-gallery-item vg-gallery-${i}"><span>${name}</span></div>`).join('')}</div>`;
      break;
    case 'rhythm':
      content = card(`<span class="vg-eyebrow">YOUR COLLECTION</span><div class="vg-list ${good?'':'vg-uneven-list'}">${['Weekend reads','Ideas for later','Little discoveries'].map((name,i)=>`<div class="vg-list-row"><span class="vg-folder vg-folder-${i}">${icon('file')}</span><span>${name}<small>${[12,8,24][i]} saved items</small></span>${icon('chevron')}</div>`).join('')}</div>`);
      break;
    case 'consistency':
      content = `<div class="vg-consistent-cards ${good?'':'vg-inconsistent-cards'}">${['Make something','Find inspiration','Share an idea'].map((name,i)=>`<div><span class="vg-card-thumb vg-thumb-${i}">${icon(['image','file','heart'][i])}</span><strong>${name}</strong><span class="vg-tiny-copy">A little room to create.</span><span class="vg-tiny-link">Explore →</span></div>`).join('')}</div>`;
      break;
    case 'button':
      content = card(`<strong class="vg-small-title">Your next move.</strong><p>Choose where you want to go.</p><div class="vg-button-stack ${good?'':'vg-inconsistent'}">${button('Create a project')}${button('Explore templates',good?'vg-secondary':'vg-strange')}${button('Invite your team',good?'vg-secondary':'vg-round')}</div>`);
      break;
    case 'cart':
      content = card(`<div class="vg-cart-product"><div class="vg-product-dot">${plant}</div><div>Little green friend<small>Desk planter · Sage</small></div><strong>$32</strong></div>${good?'<div class="vg-price-row"><span>Subtotal</span><span>$32.00</span></div><div class="vg-price-row"><span>Shipping</span><span>$5.00</span></div>':''}<div class="vg-price-row vg-total"><strong>Total</strong><strong>$37.00</strong></div>${button('Continue to checkout','vg-wide')}`,'vg-cart');
      break;
    case 'navigation':
      content = card(`<div class="vg-nav-demo"><span class="vg-mini-brand">arc.</span>${good?'<span class="vg-nav-active">Overview</span><span>Projects</span><span>Team</span>':'<span>Discover</span><span>Space</span><span>More</span>'}</div><div class="vg-nav-body"><span class="vg-eyebrow">YOUR WORKSPACE</span><strong>Good morning, Alex.</strong>${lines(3)}<div class="vg-nav-tiles"><i></i><i></i><i></i></div></div>`,'vg-wide-card');
      break;
    case 'feedback':
    case 'success':
      content = card(`<div class="vg-feedback">${good?`<span class="vg-success-icon">${icon('check')}</span><strong>${challenge.topic==='forms'?'Message sent!':"You're all set!"}</strong><p>${challenge.topic==='forms'?'Thanks for reaching out. We’ll get back to you within two working days.':'Your changes have been saved.'}</p>${button('Back to your workspace')}`:`<span class="vg-neutral-icon">${icon('file')}</span><strong>Edit your profile</strong><p>Manage your personal information.</p>${button('Save changes','vg-muted-btn')}`}</div>`);
      break;
    case 'recognition':
      content = card(`<strong class="vg-small-title">Your workspace</strong><div class="vg-recognition-menu ${good?'':'vg-unlabeled-menu'}">${['Home','Projects','Settings'].map((name,i)=>`<div><span>${icon(['home','file','settings'][i])}</span>${good?`<span>${name}</span>`:''}</div>`).join('')}</div>${lines(2)}`);
      break;
    case 'progressive':
      content = card(`<span class="vg-eyebrow">NEW PROJECT</span><strong class="vg-small-title">Let's start with the basics.</strong>${field('Project name','My next big idea')}${good?'<div class="vg-advanced">Advanced settings <span>⌄</span></div>':`<div class="vg-mini-fields">${field('Visibility','Private')}${field('Region','Asia Pacific')}${field('Storage','Standard')}${field('Version','v1.0')}</div>`}${button('Create project','vg-wide')}`,'vg-form-card');
      break;
    case 'recovery':
      content = card(`<strong class="vg-small-title">Your saved projects</strong><div class="vg-list-row"><span class="vg-folder">${icon('file')}</span><span>Website refresh<small>Updated just now</small></span></div><div class="vg-undo-toast"><span>Project archived</span>${good?'<strong>Undo</strong>':''}</div>${lines(2)}`);
      break;
    case 'error':
    case 'validation':
      content = card(`<strong class="vg-small-title">Welcome back.</strong>${field('Email address','alex@studio','vg-error-field')}<span class="vg-error-text">${good?'Add a domain, like alex@studio.co.':'Invalid input. Error 422.'}</span>${field('Password','••••••••')}${button('Sign in','vg-wide')}`,'vg-form-card');
      break;
    case 'affordance':
      content = card(`<strong class="vg-small-title">Bring your ideas together.</strong><p>A place for everything you’re working on.</p><div class="vg-upload ${good?'':'vg-no-affordance'}">${icon('plus')}<strong>Add your first project</strong><span>Start with a blank canvas</span></div>`);
      break;
    case 'target':
      content = card(`<strong class="vg-small-title">A sound for every mood.</strong><div class="vg-music-art"><i></i><i></i><i></i></div><span class="vg-track-name">Slow Sunday <small>A little room to breathe</small></span><div class="vg-player ${good?'':'vg-tiny-targets'}"><span>↶</span><span class="vg-play">▶</span><span>↷</span></div>`,'vg-music-card');
      break;
    case 'placeholder':
      content = card(`<strong class="vg-small-title">A name for your space.</strong><p>Make it easy for your team to find you.</p>${field('Workspace name','little-studio')}<span class="vg-helper-text">${good?'Use 3–24 lowercase letters, numbers, or dashes.':''}</span>${button('Create workspace','vg-wide')}`,'vg-form-card');
      break;
    case 'labels':
    case 'field':
      content = card(`<strong class="vg-small-title">Stay in the loop.</strong><p>Good things, straight to your inbox.</p>${field(good?'Email address':'',good?'alex@studio.co':'alex@studio.co')}${field(good?'Your name':'',good?'Alex Morgan':'Alex Morgan')}${button('Subscribe','vg-wide')}`,'vg-form-card');
      break;
    case 'motion':
      content = card(`<strong class="vg-small-title">Make yourself comfortable.</strong><div class="vg-setting-row"><span>${good?'Reduce motion':'Play animations'}<small>${good?'Limit animated effects':'Keep things moving'}</small></span><span class="vg-switch vg-on"><i></i></span></div><div class="vg-motion-demo ${good?'':'vg-many-motions'}"><i></i><i></i><i></i></div><p>${good?'A quieter experience, your way.':'Everything is always moving.'}</p>`);
      break;
    case 'alt':
      content = card(`<div class="vg-photo-scene">${plant}</div><div class="vg-alt-caption">${icon('image')}<span>${good?'A leafy plant in a terracotta pot on a sunny shelf.':'Image_2026_1048.jpg'}</span></div>`,'vg-photo-card');
      break;
    case 'state':
      content = card(`<strong class="vg-small-title">Your order</strong><div class="vg-order-state ${good?'':'vg-color-only'}"><i></i><span>${good?'Payment successful':'Order #1048'}</span>${good?icon('check'):''}</div><p>${good?'You’re all set. We’ll email your receipt and send an update when your order ships.':'Check your order status above.'}</p><div class="vg-receipt">ORDER #1048 <strong>$48.00</strong></div>`);
      break;
    case 'toggle':
      content = card(`<strong class="vg-small-title">Make it feel like you.</strong><div class="vg-setting-row"><span>${good?'Email notifications':'Disable email notifications'}<small>A weekly dose of inspiration</small></span><span class="vg-switch vg-on"><i></i></span></div><div class="vg-setting-row"><span>${good?'Product updates':'Don’t hide product updates'}<small>See what’s new</small></span><span class="vg-switch"><i></i></span></div>`);
      break;
    case 'card':
      content = `<div class="vg-product-card ${good?'':'vg-no-card-group'}"><div class="vg-product-photo">${plant}<span class="vg-heart">${icon('heart')}</span></div><div class="vg-product-info"><span class="vg-eyebrow">A LITTLE GREENERY</span><strong>The everyday planter</strong><div><span>Bring a little outside in.</span><b>$32</b></div></div></div>`;
      break;
    case 'tabs':
      content = card(`<strong class="vg-small-title">Your library</strong><div class="vg-tabs ${good?'':'vg-unclear-tabs'}"><span class="vg-tab-active">All projects</span><span>Favorites</span><span>Archived</span></div><div class="vg-nav-tiles"><i></i><i></i><i></i></div>${lines(2)}`);
      break;
    case 'menu':
      content = card(`<div class="vg-menu-heading"><strong class="vg-small-title">Project settings</strong><span>•••</span></div><div class="vg-menu-demo ${good?'':'vg-menu-mixed'}"><span>${icon('file')} Rename project</span><span>${icon('download')} Export project</span><span class="vg-menu-delete">${icon('close')} Delete project</span></div>`);
      break;
    case 'search':
      content = card(`<strong class="vg-small-title">Find your next favorite.</strong><div class="vg-field vg-search-field">${icon('search')}<span class="vg-muted">${good?'Search projects, people, and files':'Search'}</span><span class="vg-search-shortcut">⌘ K</span></div>${good?'<span class="vg-label vg-recent-label">RECENT SEARCHES</span><div class="vg-search-chips"><span>Brand identity</span><span>Website</span></div>':lines(4)}`);
      break;
    case 'badge':
      content = card(`<strong class="vg-small-title">Your projects</strong><div class="vg-badge-list">${['Website refresh','Brand guidelines','Summer campaign'].map((name,i)=>`<div><span>${name}</span><span class="vg-badge vg-badge-${good?i:'same'}">${good?['In progress','Complete','Draft'][i]:['IP','CMP','DRF'][i]}</span></div>`).join('')}</div>`);
      break;
    case 'password':
      content = card(`<strong class="vg-small-title">Create your account.</strong>${field('Email address','alex@studio.co')}<span class="vg-label">Password</span><div class="vg-field vg-password">•••••••••• ${good?icon('eye'):''}</div>${good?'<div class="vg-password-rules"><span>✓ 8 characters or more</span><span>✓ A number or symbol</span></div>':'<span class="vg-muted vg-password-note">Password must meet security policy.</span>'}${button('Create account','vg-wide')}`,'vg-form-card');
      break;
    case 'required':
      content = card(`<strong class="vg-small-title">Let's get to know you.</strong>${field(good?'Full name *':'Full name','Alex Morgan')}${field(good?'Company (optional)':'Company','Studio Co.')}<span class="vg-muted vg-password-note">${good?'* Required fields':'Please complete the form.'}</span>${button('Continue','vg-wide')}`,'vg-form-card');
      break;
    case 'microcopy':
    case 'language':
      content = card(`<div class="vg-copy-icon">${icon('lock')}</div><strong class="vg-small-title">${good?'Your work is safe.':'Data synchronization complete.'}</strong><p>${good?'We save your changes as you go, so you can focus on the good stuff.':'All modifications have been persisted to the remote infrastructure successfully.'}</p>${button(good?'Keep creating':'Acknowledge')}`);
      break;
    case 'empty':
      content = card(`<div class="vg-empty-state"><span class="vg-empty-icon">${icon('file')}</span><strong>${good?'Your next great idea starts here.':'No data found.'}</strong><p>${good?'Create your first project and give your ideas a little room to grow.':'There are no records to display.'}</p>${good?button('Create a project'):''}</div>`);
      break;
    case 'loading':
      content = card(`<div class="vg-loading-state">${good?'<div class="vg-skeleton-photo"></div><div class="vg-skeleton-lines"><i></i><i></i><i></i></div>':'<span class="vg-loading-dots">...</span>'}<span class="vg-muted">${good?'Finding good things for you…':''}</span></div>`);
      break;
    case 'confirmation':
      content = card(`<span class="vg-delete-icon">${icon('alert')}</span><strong class="vg-small-title">${good?'Delete “Summer campaign”?':'Are you sure?'}</strong><p>${good?'This project and its files will be permanently deleted. You can’t undo this.':'Do you want to proceed with this action?'}</p><div class="vg-action-pair">${button(good?'Keep project':'No','vg-secondary')}${button(good?'Delete project':'Yes','vg-danger')}</div>`);
      break;
    case 'action':
      content = card(`<strong class="vg-small-title">A little adventure awaits.</strong><p>Discover places made for making memories.</p><div class="vg-action-pair">${button(good?'Explore places':'Continue')}${button('Learn more','vg-secondary')}</div><div class="vg-landscape"><i></i><i></i><span></span></div>`);
      break;
    case 'truncation':
      content = card(`<strong class="vg-small-title">Recently opened</strong><div class="vg-truncated-list ${good?'':'vg-clip-text'}">${['Brand-exploration-visual-direction.pdf','Summer-campaign-final-assets.zip','Website-accessibility-audit.docx'].map((t,i)=>`<div>${icon('file')}<span title="${t}">${good?['Brand-exploration…direction.pdf','Summer-campaign…assets.zip','Website-accessibility…audit.docx'][i]:t}</span>${icon('chevron')}</div>`).join('')}</div>`);
      break;
    default:
      content = card(`<span class="vg-eyebrow">THOUGHTFULLY DESIGNED</span><strong class="vg-small-title">A little more clarity.</strong>${lines(3)}${button('Keep exploring')}`);
  }
  return `<div class="vg-visual vg-visual-${type} ${good?'vg-is-good':'vg-is-bad'} ${compact?'vg-compact':''}">${content}</div>`;
}
