import { renderVisual } from './visuals.js';

const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const hues=['red','red-orange','orange','yellow-orange','yellow','yellow-green','green','blue-green','blue','blue-violet','violet','red-violet'];
// Each entry names a visible feature, rather than scoring the whole card's appearance.
const specs = {
  kerning:['letter-pair','One letter pair','Every gap changes','Compare the highlighted n–i gap. Kerning adjusts this individual pair; tracking changes spacing across the whole word.'],
  colorwheel:['wheel-hues','The marked hues','A different relationship','Follow the outlined color markers around the wheel and compare their positions.'],
  'design-wheel':['wheel-hues','The marked hues','A different relationship','Follow the outlined hue markers. Their positions, rather than the brightness of the wheel, define the color relationship.'],
  cart:['cost-breakdown','Charges before checkout','No charge breakdown','The outlined subtotal and shipping rows explain the final amount before the checkout action.'],
  hierarchy:['type-hierarchy','Headline comes first','Equal emphasis','Compare the large headline with the quieter paragraph. The size difference gives your eye a clear reading order.'],
  heading:['descriptive-heading','The heading names the content','A vague heading','Read the highlighted heading on its own. It tells you what this section contains before you open anything.'],
  leading:['line-height','Space between lines','Lines crowd together','Look between the outlined lines of body text. Enough vertical space helps your eye find the next line.'],
  measure:['line-length','A comfortable text measure','Very long lines','The outlined paragraph keeps each line short enough to return to the next line comfortably.'],
  alignment:['text-edge','A steady left edge','An inconsistent text edge','Follow the left edge of the outlined paragraph. A consistent starting point makes repeated reading easier.'],
  typeface:['letterforms','Readable supporting text','Decorative reading text','Look at the smaller outlined paragraph, where simple letterforms support the actual reading task.'],
  weight:['selective-weight','The key number stands out','Everything competes','The highlighted number has stronger emphasis than its supporting explanation.'],
  tracking:['body-spacing','Letters stay connected','Letters drift apart','Read the outlined sentence as a whole. Its letters remain close enough to form recognizable words.'],
  contrast:['text-contrast','Text against its background','Text fades into the surface','Compare the outlined supporting text with the surface directly behind it. The words remain distinguishable.'],
  saturation:['action-emphasis','One vivid action','Color competes everywhere','The outlined primary action owns the strongest accent; quieter surroundings let it stand out.'],
  palette:['palette-system','A connected set of colors','Unrelated color choices','Compare the outlined swatches as a set, rather than judging a single color in isolation.'],
  colorbalance:['color-balance','Accent within a quiet surface','Several competing accents','The highlighted accent occupies less visual space than the supporting surface.'],
  meaning:['explicit-status','Icon and status words','Color without a clear status','The highlighted message names the result and includes an icon, so its meaning survives without color.'],
  focus:['selected-state','Border and checkmark','A subtle tint alone','The outlined choice uses a visible border and a checkmark to show the selected state.'],
  keyboard:['keyboard-focus','A visible focus outline','No visible focus treatment','The highlighted field has a distinct outer ring that shows where a keyboard action will happen.'],
  grouping:['field-groups','Related fields stay together','Labels and fields drift apart','The outlined field groups keep each label near its input, with a clearer separation from other groups.'],
  proximity:['label-proximity','A label beside its field','A distant label','Look at the outlined label-and-input pair. Their close spacing makes the relationship immediate.'],
  formgroup:['form-sections','Meaningful form sections','One undifferentiated form','The highlighted section headings divide personal details from the delivery address.'],
  spacing:['content-spacing','Consistent breathing room','Crowded gaps','Look around the outlined action and paragraph: the gaps keep the related content clear without collisions.'],
  whitespace:['card-padding','Space protects the content','Content crowds the edges','The outlined content has room around its edges and before the action.'],
  density:['list-density','Primary and supporting details','Competing row details','Each outlined row gives the title priority, with quieter secondary information underneath.'],
  grid:['shared-grid','Repeated card edges','Misaligned card edges','Trace the outlined card edges. Shared widths and alignment create an orderly grid.'],
  rhythm:['row-rhythm','A repeated row structure','Uneven row spacing','The outlined rows repeat icon placement, alignment, and spacing so the changing content is easier to scan.'],
  consistency:['card-consistency','A shared card structure','Different structures for equal cards','The outlined titles and actions occupy the same positions within equivalent cards.'],
  button:['action-hierarchy','One clear primary action','Several inconsistent actions','The highlighted first action has the strongest treatment; the remaining actions stay available with less emphasis.'],
  navigation:['current-location','The current destination','No selected destination','The highlighted navigation item shows where you are, while neighboring destinations remain available.'],
  feedback:['action-feedback','The result is acknowledged','An unchanged action','The outlined success message confirms what happened after the action.'],
  success:['submission-result','A specific confirmation','No outcome confirmation','The outlined confirmation closes the loop and explains what happened.'],
  recognition:['labeled-actions','Labels beside familiar symbols','Unlabeled symbols','The highlighted menu labels explain the icons, so people do not have to recall their meanings.'],
  progressive:['advanced-options','Advanced options stay discoverable','Every option appears at once','The outlined advanced-settings row keeps extra choices available without filling the first step.'],
  recovery:['undo-action','A visible way to undo','No recovery action','The highlighted Undo action makes the routine change reversible.'],
  error:['error-guidance','An actionable correction','An unhelpful error code','The outlined error message gives a concrete correction next to the affected field.'],
  validation:['error-guidance','An actionable correction','An unhelpful error code','The highlighted message explains how to repair this input without starting the form again.'],
  affordance:['action-boundary','A recognizable action area','An action disguised as text','The outlined boundary and plus sign make the place to add a project look actionable.'],
  target:['tap-target','A generous play target','A tiny crowded target','Compare the outlined play control and the space around it. A larger target is easier to activate accurately.'],
  labels:['persistent-label','A label that stays visible','The field loses its meaning','The outlined label remains above the entered value, so the field can still be understood while typing.'],
  field:['persistent-label','A clear field label','An unlabeled value','The highlighted label names the information this field needs.'],
  placeholder:['helper-text','Instructions remain visible','Instructions disappear','The outlined helper text stays outside the field, where people can refer to it while typing.'],
  motion:['motion-choice','A reduced-motion setting','Animation without a calm option','The highlighted setting gives people control over animated effects.'],
  alt:['image-description','A useful image description','A filename, not a description','The highlighted description conveys the image’s useful content, rather than its file name.'],
  state:['result-state','The outcome is explicit','A status without an explanation','The outlined status names the successful result and is supported by a clear explanation.'],
  toggle:['setting-label','A direct setting name','A confusing negative label','The highlighted setting uses a direct label, so the switch’s effect is easier to predict.'],
  card:['card-anatomy','A clear product title','A disconnected card structure','The outlined title, description, and price remain grouped with the product they describe.'],
  tabs:['active-tab','A clear active view','All tabs look alike','The outlined tab has a visible active indicator that identifies the content you are viewing.'],
  menu:['menu-groups','Destructive action separated','Destructive action blends in','The highlighted destructive command is distinct from routine menu actions.'],
  search:['search-scope','The prompt explains the scope','A vague search prompt','The highlighted search prompt names what can be searched in this workspace.'],
  badge:['status-labels','Explicit, readable status words','Ambiguous status codes','The outlined badges state each status in words, with text that separates from its background.'],
  password:['password-support','Requirements and reveal control','Hidden password requirements','The outlined requirements are available before submission, with a visible reveal control nearby.'],
  required:['required-fields','Required versus optional','No stated convention','The highlighted labels explain which fields are necessary and which can be skipped.'],
  microcopy:['task-language','A concrete explanation','System-oriented language','The outlined message describes what the product does in familiar words.'],
  language:['task-language','Familiar words','Technical system terms','Read the highlighted sentence. It explains what happened without requiring technical vocabulary.'],
  empty:['empty-next-step','A useful first action','No way forward','The highlighted action gives this empty area a relevant starting point.'],
  loading:['loading-feedback','The task in progress is named','An unexplained wait','The highlighted loading message explains what the system is doing while the content is prepared.'],
  confirmation:['confirmation-consequence','A specific consequence','A vague confirmation','The highlighted message names the project and explains the permanent effect before the final action.'],
  action:['action-label','The label predicts the result','A generic progression label','Read the highlighted action label. It describes what the very next activation does.'],
  truncation:['filename-ending','The file extension survives','The distinguishing ending is lost','Compare the outlined filename ending. Middle truncation preserves the useful extension.'],
  'design-palette':['color-family','A connected color family','A different color family','Compare the outlined swatches as a family and relate them to the color relationship in the question.'],
  'design-tint':['tint-and-shade','One base hue, lighter and darker','The hue changes','The outlined strip keeps the same base hue between its lighter tint and darker shade.'],
  'design-saturation':['saturation-strip','One hue grows more vivid','The color family changes','Follow the outlined swatches from left to right: their intensity changes while the hue remains related.'],
  'design-contrast':['supporting-contrast','Readable event details','Details fade into the background','The highlighted date and location remain readable against the actual card surface.'],
  'design-consistency':['toolbar-consistency','A coherent set of actions','Equal actions look unrelated','The outlined toolbar uses the same shape, spacing, and treatment for equal action types.'],
  'design-feedback':['save-confirmation','A visible saved result','No acknowledgement of saving','The highlighted saved message acknowledges the completed action.'],
  'design-target':['close-target','A generous close target','A small close target','The highlighted close control has a larger target area around the same symbol.'],
  'design-choices':['grouped-choices','Three meaningful starting groups','Many competing initial choices','The outlined categories organize the first decision into a smaller set of meaningful choices.'],
  'design-proximity':['schedule-pairs','Each label stays with its value','Equal gaps hide the pairs','Each outlined schedule pair places the label closer to its matching detail than to the next group.'],
  'design-similarity':['role-similarity','Matching cues for matching roles','Cues vary independently of roles','The highlighted avatars repeat shape and color for the same role, with role words kept visible.'],
  'design-region':['common-regions','Separate enclosing boundaries','No meaningful group boundaries','The highlighted regions visibly enclose two related sets of elements.'],
  'design-figureground':['active-dialog','An active layer stands apart','The layers compete','The highlighted dialog separates the message from a quieter background layer.'],
  'design-control':['skip-control','A visible Skip tour action','A forced timed introduction','The highlighted Skip tour control lets someone begin their task without finishing an optional tour.'],
  'design-disclosure':['discoverable-settings','Advanced settings remain available','Every setting competes immediately','The outlined advanced-settings row leaves the first step focused while keeping extra choices discoverable.'],
  'design-recognition':['recognized-recipient','Names with recognizable context','An identifier must be recalled','The highlighted recipient list shows names and useful context instead of requiring an exact reference from memory.'],
  'design-prevention':['destructive-consequence','The consequence is explained','Destruction beside routine actions','The highlighted confirmation explains what will be removed before the destructive action is committed.'],
};
const targetClasses={
  hierarchy:['vg-type-title'],heading:['vg-type-title'],leading:['vg-reading'],measure:['vg-reading'],alignment:['vg-align'],typeface:['vg-typeface'],weight:['vg-number'],tracking:['vg-reading'],contrast:['vg-contrast'],saturation:['vg-btn'],palette:['vg-swatches'],colorbalance:['vg-poster-dot'],meaning:['vg-status'],focus:['vg-select-option'],keyboard:['vg-field'],grouping:['vg-groups'],proximity:['vg-groups'],formgroup:['vg-section-label'],spacing:['vg-space'],whitespace:['vg-space'],density:['vg-density-list'],grid:['vg-gallery-item'],rhythm:['vg-list-row'],consistency:['vg-tiny-link'],button:['vg-btn'],navigation:['vg-nav-active'],feedback:['vg-feedback'],success:['vg-feedback'],recognition:['vg-recognition-menu'],progressive:['vg-advanced'],recovery:['vg-undo-toast'],error:['vg-error-text'],validation:['vg-error-text'],affordance:['vg-upload'],target:['vg-play'],labels:['vg-label'],field:['vg-label'],placeholder:['vg-helper-text'],motion:['vg-setting-row'],alt:['vg-alt-caption'],state:['vg-order-state'],toggle:['vg-setting-row'],card:['vg-product-info'],tabs:['vg-tab-active'],menu:['vg-menu-delete'],search:['vg-search-field'],badge:['vg-badge'],password:['vg-password-rules'],required:['vg-label'],microcopy:['vg-small-title'],language:['vg-small-title'],empty:['vg-btn'],loading:['vg-loading-state'],confirmation:['vg-small-title'],action:['vg-btn'],truncation:['vg-truncated-list'],
  'design-palette':['dv-color-strips'],'design-tint':['dv-color-strips'],'design-saturation':['dv-color-strips'],'design-contrast':['dv-event-details'],'design-consistency':['dv-toolbar'],'design-feedback':['dv-save-result'],'design-target':['dv-close-target'],'design-choices':['dv-choice-grid'],'design-proximity':['dv-schedule'],'design-similarity':['dv-avatar'],'design-region':['dv-region-boxes'],'design-figureground':['dv-layer-dialog'],'design-control':['dv-skip'],'design-disclosure':['dv-advanced-settings'],'design-recognition':['dv-recipient-list'],'design-prevention':['dv-delete-card'],
};
const courseLabels={
  'course-ux-meaning':['The complete task','Compare the touchpoints in the highlighted scenario with the goal in the question.'],
  'course-user-centered':['Evidence about real use','The highlighted action connects a design decision to people, context, or observed behavior.'],
  'course-color-basics':['The color decision','Compare the specific foreground, surface, or color role named in the highlighted scenario.'],
  'course-type-basics':['The reading decision','Focus on the text size, letterforms, or spacing named in the highlighted scenario.'],
  'course-ui-blocks':['The component’s purpose','The highlighted detail connects a building block to the interaction it needs to support.'],
  'course-hsv':['The changing color property','Notice whether the highlighted change affects hue, saturation, or value.'],
  'course-raster-vector':['Pixels versus paths','The highlighted description distinguishes pixel detail from a shape defined by paths.'],
  'course-image-formats':['The asset’s actual need','The highlighted choice matches the image format to its transparency, content, or delivery requirement.'],
  'course-motion':['The purpose of the transition','Focus on the useful feedback or control named in the highlighted description.'],
  'course-icons':['A recognizable symbol','The highlighted details connect the icon to its meaning and surrounding labels.'],
  'course-depth':['The layer relationship','The highlighted scenario explains how depth communicates hierarchy or separation.'],
  'course-type-anatomy':['The named letter feature','Look for the anatomical feature described in the highlighted sentence.'],
  'course-visual-principles':['A meaningful visual relationship','The highlighted choice uses visual differences to communicate actual relationships.'],
  'course-applied-principles':['A visual cue with a purpose','The highlighted detail explains what the design cue helps someone understand or do.'],
  'course-atomic':['A reusable part within a system','Trace the reusable component relationship described in the highlighted choice.'],
  'course-heuristics':['The person’s next step','The highlighted behavior supports the task rather than adding uncertainty or unnecessary effort.'],
  'course-composition':['A clear visual priority','The highlighted description names the relationship that organizes the composition.'],
  'course-grids':['A shared layout structure','The highlighted detail connects a grid rule to alignment and flexible content.'],
  'course-responsive':['Behavior as space changes','The highlighted scenario describes how the interface adapts, rather than just shrinking one screenshot.'],
  'course-roles':['The expertise the task needs','The highlighted action connects disciplines around the outcome, rather than an isolated handoff.'],
  'course-ui-deliverables':['The behavior behind the screen','The highlighted description includes information an isolated screenshot cannot communicate.'],
  'course-ux-deliverables':['The question the artifact answers','The highlighted scenario uses the deliverable to investigate a specific task or relationship.'],
  'course-copy':['Specific, useful wording','Read the concrete action or correction in the highlighted scenario.'],
  'course-research':['Observed behavior, not a guess','The highlighted action produces evidence about a realistic task.'],
  'course-architecture':['A route people can understand','The highlighted choice organizes information around understandable tasks and finding routes.'],
};

export function getAnswerInsight(question){
  if(String(question.visual).startsWith('course-')){const [label,tip]=courseLabels[question.lessonId]||['The task-specific detail','Compare the highlighted action with the principle and the goal in the question.'];return {key:'scenario-detail',label,wrongLabel:'A different approach',tip,targets:['vg-course-scenario-copy']};}
  const [key,label,wrongLabel,tip]=specs[question.visual]||['specific-detail',question.principle||'The task-relevant detail','Compare the same detail',question.takeaway||'Compare the highlighted feature in both examples.'];
  let specificTip=tip;
  if(question.visual==='colorwheel')specificTip=question.wheel==='tertiary'?'The six outlined markers sit between neighboring primary and secondary colors. Compare them with the other wheel’s three primary positions.':question.wheel==='complementary'?'Trace the two outlined hues across the center: complementary hues are directly opposite on this wheel.':'The outlined hues sit next to one another, forming a neighboring color family.';
  if(question.visual==='design-wheel'){const names=(question.options[question.correct].marks||[]).map(index=>hues[index]);specificTip=`The outlined hues are ${names.join(', ')}. ${tip}`;}
  return {key,label,wrongLabel,tip:specificTip,targets:targetClasses[question.visual]||[]};
}

/** Neutral scene descriptions are used before answering; no correctness is disclosed. */
export function describeAnswerVisual(question,index,revealed=false){
  const option=question.options[index];
  if(revealed){const insight=getAnswerInsight(question);return `${index===question.correct?'Correct example':'Comparison example'}. ${index===question.correct?insight.label:insight.wrongLabel}.`;}
  if(option.heading)return `${option.heading}. ${option.detail||''}`;
  if(question.visual==='kerning')return 'A typography specimen showing the word Kerning and highlighted spaces between letters.';
  if(question.visual==='design-wheel')return `Traditional RYB wheel marking ${(option.marks||[]).map(i=>hues[i]).join(', ')}.`;
  if(question.visual==='colorwheel')return 'A traditional RYB color wheel with selected hue positions marked.';
  return `A ${String(question.topic||'design').replaceAll('-',' ')} example. Compare its visible arrangement, wording, and controls with the other option.`;
}

// A small generated-markup reader keeps annotation deterministic in browsers and Node tests.
function readTree(html){
  const root={tag:'#root',children:[],classes:[],parent:null};const stack=[root];const nodes=[];const tags=/<\/?([a-zA-Z][\w:-]*)(?:\s[^<>]*?)?\s*\/?>/g;let match;
  while((match=tags.exec(html))){const token=match[0];const tag=match[1].toLowerCase();if(token.startsWith('</')){let i=stack.length-1;while(i>0&&stack[i].tag!==tag)i--;if(i>0){stack[i].closeStart=match.index;stack[i].end=tags.lastIndex;stack.length=i;}continue;}
    const attrs={};for(const a of token.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/g))attrs[a[1]]=a[3];const parent=stack.at(-1);const node={tag,attrs,classes:(attrs.class||'').split(/\s+/).filter(Boolean),children:[],parent,start:match.index,openEnd:tags.lastIndex,closeStart:null,end:tags.lastIndex,token};parent.children.push(node);nodes.push(node);if(!token.endsWith('/>')&&!['br','hr','img','input','meta','link','wbr','source'].includes(tag))stack.push(node);
  }return {root,nodes};
}
const has=(node,cls)=>node.classes.includes(cls);
const descendants=node=>node.children.flatMap(child=>[child,...descendants(child)]);
const cls=(tree,name)=>tree.nodes.filter(node=>has(node,name));
function textNodeWithin(node){return node?.children.find(n=>n.tag==='p')||node?.children.find(n=>n.tag==='strong')||node;}
function targetNodes(tree,question,correct,insight){
  if(question.visual==='kerning'){const word=cls(tree,correct?'vg-pair':'vg-all-gaps')[0];const spans=word?.children.filter(n=>n.tag==='span')||[];return correct?[spans[3]?.children.find(n=>n.tag==='i')].filter(Boolean):spans.map(n=>n.children.find(n=>n.tag==='i')).filter(Boolean);}
  if(['colorwheel','design-wheel'].includes(question.visual)){const svg=tree.nodes.find(n=>n.tag==='svg'&&(has(n,'dv-wheel')||has(n.parent,'vg-colorwheel')));return svg?descendants(svg).filter(n=>n.tag==='circle'&&(question.visual==='colorwheel'||n.attrs.r==='5')):[];}
  if(question.visual==='cart'){const rows=cls(tree,'vg-price-row');return correct?rows.filter(n=>!has(n,'vg-total')):rows.filter(n=>has(n,'vg-total'));}
  if(String(question.visual).startsWith('course-'))return cls(tree,'vg-course-scenario-copy').map(textNodeWithin);
  let targets=insight.targets.flatMap(name=>cls(tree,name));
  if(question.visual==='contrast')targets=targets.map(n=>n.children.find(c=>c.tag==='p')||n);
  if(question.visual==='alignment')targets=targets.map(n=>n.children.find(c=>c.tag==='p')||n);
  if(question.visual==='typeface')targets=targets.map(n=>n.children.find(c=>c.tag==='p')||n);
  if(['spacing','whitespace'].includes(question.visual))targets=targets.map(n=>n.children.find(c=>c.tag==='p')||n);
  if(['density','grid','rhythm'].includes(question.visual))targets=targets.flatMap(n=>question.visual==='grid'||question.visual==='rhythm'?[n]:n.children);
  if(['recognition','grouping','proximity'].includes(question.visual))targets=targets.flatMap(n=>n.children);
  if(question.visual==='button'||question.visual==='action'||question.visual==='saturation')targets=targets.slice(0,1);
  if(question.visual==='focus'||question.visual==='motion'||question.visual==='toggle')targets=targets.slice(0,1);
  if(['feedback','success'].includes(question.visual))targets=targets.map(textNodeWithin);
  if(question.visual==='loading')targets=correct?cls(tree,'vg-muted'):cls(tree,'vg-loading-dots');
  if(question.visual==='truncation')targets=targets.flatMap(n=>n.children.map(row=>row.children.find(c=>c.tag==='span')).filter(Boolean));
  if(question.visual==='design-proximity'||question.visual==='design-region'||question.visual==='design-choices')targets=targets.flatMap(n=>n.children);
  if(question.visual==='design-prevention')targets=correct?targets.map(textNodeWithin):cls(tree,'dv-confirm-actions');
  if(!correct&&question.visual==='design-control')targets=cls(tree,'dv-disabled-action');
  if(!correct&&question.visual==='navigation')targets=cls(tree,'vg-nav-demo').flatMap(n=>n.children.filter(c=>c.tag==='span').slice(1));
  if(!correct&&question.visual==='formgroup')targets=cls(tree,'vg-form-section');
  if(!correct&&['labels','field'].includes(question.visual))targets=cls(tree,'vg-field');
  if(!correct&&question.visual==='password')targets=cls(tree,'vg-password-note');
  if(!correct&&question.visual==='progressive')targets=cls(tree,'vg-mini-fields');
  if(!correct&&question.visual==='design-recognition')targets=cls(tree,'dv-field-pair');
  if(!correct&&question.visual==='tabs')targets=cls(tree,'vg-tabs');
  if(!correct&&question.visual==='empty')targets=cls(tree,'vg-empty-state').map(textNodeWithin);
  return targets.length?targets:tree.nodes.filter(n=>n.tag==='strong'||n.tag==='p').slice(0,1);
}
function annotateMarkup(html,question,correct,insight){
  const tree=readTree(html);const targets=targetNodes(tree,question,correct,insight);const edits=[];
  targets.forEach((node,index)=>{
    const svgTarget=node.tag==='circle';const focusClass=`ai-feature-focus ai-focus-${insight.key}${index===0?' ai-feature-primary':''}`;
    let token=node.token;
    if(node.attrs.class!==undefined)token=token.replace(/class=(["'])(.*?)\1/,(_,quote,value)=>`class=${quote}${value} ${focusClass}${quote}`);else token=token.replace(/^<([\w:-]+)/,`<$1 class="${focusClass}"`);
    token=token.replace(/\s*\/?>$/,ending=>` data-ai-feature="${insight.key}"${index===0?' data-ai-primary="true"':''}${ending}`);
    if(svgTarget){token=token.replace(/stroke=(["']).*?\1/,`stroke="${correct?'#1f995f':'#c95b65'}"`).replace(/stroke-width=(["']).*?\1/,'stroke-width="3"');const cx=Number(node.attrs.cx),cy=Number(node.attrs.cy),r=Number(node.attrs.r);if(index===0&&Number.isFinite(cx)&&Number.isFinite(cy))edits.push({start:node.openEnd,end:node.openEnd,text:`<text class="ai-svg-feature-number" x="${cx}" y="${cy+(r>10?5:2)}" text-anchor="middle" fill="${r>10?'white':correct?'#127943':'#b13e49'}" font-family="Arial,sans-serif" font-weight="800" font-size="${r>10?15:6}">1</text>`});}
    if(insight.key==='scenario-detail'&&node.closeStart){const body=html.slice(node.openEnd,node.closeStart);const prefix=body.split(/(\s+)/).slice(0,13).join('');if(prefix&&!prefix.includes('<')){edits.push({start:node.openEnd,end:node.openEnd,text:'<mark class="ai-scenario-action">'});edits.push({start:node.openEnd+prefix.length,end:node.openEnd+prefix.length,text:'</mark>'});}}
    edits.push({start:node.start,end:node.openEnd,text:token});
  });
  edits.sort((a,b)=>b.start-a.start||b.end-a.end);for(const edit of edits)html=html.slice(0,edit.start)+edit.text+html.slice(edit.end);
  return {html,count:targets.length};
}

export function renderAnnotatedVisual(question,index,revealed=false){
  const original=renderVisual(question,index);
  if(!revealed)return original;
  const insight=getAnswerInsight(question);const correct=index===question.correct;const result=annotateMarkup(original,question,correct,insight);
  return `<div class="ai-annotated ${correct?'ai-correct':'ai-compare'} ai-kind-${insight.key}" data-ai-focus="${insight.key}" data-ai-targets="${result.count}"><div class="ai-scene">${result.html}</div><span class="ai-feature-caption"><b>1</b><span>${correct?'Look here':'Compare'}: ${escape(correct?insight.label:insight.wrongLabel)}</span></span></div>`;
}

export function renderVisualComparisonTip(question){const insight=getAnswerInsight(question);return `<aside class="ai-comparison-tip"><span class="ai-tip-marker">1</span><div><strong>What to spot: ${escape(insight.label)}</strong><p>${escape(insight.tip)}</p></div></aside>`;}
