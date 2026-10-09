const DEFAULT_CRITERIA = [
  { id: 'adaptability', label: 'Adaptability', value: 7.4, weight: 28 },
  { id: 'reuse', label: 'Material reuse', value: 8.1, weight: 18 },
  { id: 'social', label: 'Social / economic use', value: 8.5, weight: 22 },
  { id: 'heritage', label: 'Heritage value', value: 5.9, weight: 10 },
  { id: 'architectural', label: 'Architectural quality', value: 6.4, weight: 8 },
  { id: 'change', label: 'Change required', value: 7.0, weight: 14 },
];

const DECISION_LABELS = [
  { id: 'retain', label: 'Retain', tone: 'keep' },
  { id: 'adapt', label: 'Adapt', tone: 'adapt' },
  { id: 'reuse', label: 'Reuse', tone: 'reuse' },
  { id: 'replace', label: 'Replace', tone: 'replace' },
  { id: 'new', label: 'New', tone: 'new' },
];

const DEFAULT_MATERIALS = ['Brick', 'Concrete', 'Steel', 'Timber', 'Glass', 'Stone'];
const ARCHITECTURE_PROMPTS = [
  'Look for a useful fabric that is still culturally legible.',
  'Check whether the existing building supports local daily life, not only formal image.',
  'Ask what is structurally robust versus what is simply familiar.',
  'Separate value from image: identify what is useful, durable, and legible.',
  'Test whether intervention improves or erodes the site’s capacity to function.'
];

const state = {
  activeImageId: null,
  siteName: 'St Philip’s Marsh',
  question: 'What should remain, what should change, what can be reused, and what is genuinely new?',
  images: [],
};

const board = document.getElementById('board');
const activeImage = document.getElementById('activeImage');
const imageStrip = document.getElementById('imageStrip');
const criteriaList = document.getElementById('criteriaList');
const decisionBoard = document.getElementById('decisionBoard');
const materialList = document.getElementById('materialList');
const overallScore = document.getElementById('overallScore');
const siteTitle = document.getElementById('siteTitle');
const siteNameInput = document.getElementById('siteNameInput');
const analysisQuestion = document.getElementById('analysisQuestion');
const annotationLayer = document.getElementById('annotationLayer');
const imageInput = document.getElementById('imageInput');
const analysisNotes = document.getElementById('analysisNotes');

function createDefaultSiteSvg() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 900">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#efe7de"/>
          <stop offset="100%" stop-color="#d7d0ca"/>
        </linearGradient>
        <linearGradient id="block1" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#a69485"/>
          <stop offset="100%" stop-color="#7d6d60"/>
        </linearGradient>
        <linearGradient id="block2" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#c9af8d"/>
          <stop offset="100%" stop-color="#8d745d"/>
        </linearGradient>
      </defs>
      <rect width="1400" height="900" fill="url(#bg)"/>
      <rect x="0" y="0" width="1400" height="900" fill="none" stroke="#2f302d" stroke-opacity="0.14" stroke-width="2"/>
      <g opacity="0.64">
        <path d="M0 640L1400 640" stroke="#403a35" stroke-opacity="0.22" stroke-width="2"/>
        <path d="M0 710L1400 710" stroke="#403a35" stroke-opacity="0.16" stroke-width="2"/>
        <path d="M0 780L1400 780" stroke="#403a35" stroke-opacity="0.18" stroke-width="2"/>
      </g>
      <g>
        <rect x="110" y="290" width="430" height="420" fill="url(#block1)"/>
        <rect x="175" y="240" width="300" height="70" fill="#d7c8b4" opacity="0.88"/>
        <rect x="210" y="350" width="120" height="280" fill="#b9a892" opacity="0.7"/>
        <rect x="392" y="350" width="110" height="280" fill="#ad9376" opacity="0.75"/>
        <rect x="180" y="465" width="270" height="18" fill="#6f5c4e" opacity="0.9"/>
        <rect x="555" y="200" width="285" height="510" fill="url(#block2)"/>
        <rect x="610" y="260" width="180" height="350" fill="#dcc1a0" opacity="0.76"/>
        <rect x="630" y="235" width="140" height="36" fill="#d2b491"/>
        <rect x="980" y="245" width="270" height="465" fill="#9d8b7f"/>
        <rect x="1015" y="290" width="200" height="340" fill="#c7b7a2" opacity="0.7"/>
        <path d="M930 690H1270L1335 820H870Z" fill="#73706d" opacity="0.7"/>
      </g>
      <g opacity="0.35" stroke="#191813" stroke-width="2" fill="none">
        <path d="M95 720L420 520L760 620L1085 500L1320 610"/>
        <path d="M95 740L420 560L760 650L1085 560L1320 660"/>
      </g>
      <g fill="#4b433e" fill-opacity="0.36">
        <circle cx="278" cy="160" r="26"/>
        <circle cx="940" cy="190" r="18"/>
        <circle cx="1208" cy="145" r="24"/>
      </g>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function makeImageEntry(name, src, type = 'default') {
  return {
    id: crypto.randomUUID(),
    name,
    src,
    type,
    criteria: structuredClone(DEFAULT_CRITERIA),
    decisions: ['retain'],
    materials: ['Brick', 'Concrete', 'Steel'],
    notes: ARCHITECTURE_PROMPTS.slice(0, 2),
    annotations: [
      { id: crypto.randomUUID(), x: 29, y: 52, label: 'Retain', tone: 'keep', text: 'The structural shell still reads clearly and is legible at the urban scale.' },
      { id: crypto.randomUUID(), x: 57, y: 43, label: 'Adapt', tone: 'adapt', text: 'This block could be reprogrammed without losing the industrial character.' },
      { id: crypto.randomUUID(), x: 76, y: 68, label: 'Reuse', tone: 'reuse', text: 'Existing materials and floor plates suggest reuse potential.' }
    ],
  };
}

function normalizeWeights(criteria) {
  const total = criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
  if (!total) return criteria;

  return criteria.map((criterion) => ({
    ...criterion,
    weight: Number(((criterion.weight / total) * 100).toFixed(1)),
  }));
}

function getActiveImage() {
  return state.images.find((image) => image.id === state.activeImageId);
}

function updateHeader() {
  const active = getActiveImage();
  if (!active) return;
  siteTitle.textContent = active.name || state.siteName;
  siteNameInput.value = active.name || state.siteName;
}

function getWeightedAverage(image) {
  const totalWeight = image.criteria.reduce((sum, item) => sum + item.weight, 0) || 1;
  const weightedScore = image.criteria.reduce((sum, item) => sum + (item.value * item.weight), 0);
  return Number((weightedScore / totalWeight).toFixed(1));
}

function renderCriteria() {
  const image = getActiveImage();
  if (!image) return;

  let normalized = normalizeWeights(image.criteria);
  image.criteria = normalized;

  criteriaList.innerHTML = '';
  normalized.forEach((criterion) => {
    const weighted = Number(((criterion.value * criterion.weight) / 100).toFixed(2));
    const row = document.createElement('div');
    row.className = 'criterion';
    row.innerHTML = `
      <div class="criterion-header">
        <span class="criterion-name">${criterion.label}</span>
        <span class="criterion-value">${criterion.value.toFixed(1)} / 10</span>
      </div>
      <div class="score-row">
        <input type="range" min="1" max="10" step="0.1" value="${criterion.value}" data-criterion="${criterion.id}" data-kind="value" />
        <span class="weight-box">${criterion.weight.toFixed(0)}%</span>
      </div>
      <div class="weight-row">
        <input type="range" min="0" max="100" step="1" value="${criterion.weight}" data-criterion="${criterion.id}" data-kind="weight" />
        <span class="weight-box">${weighted.toFixed(2)}</span>
      </div>
      <span class="calc-line">Weighted value: ${weighted.toFixed(2)} = ${criterion.value.toFixed(1)} × ${criterion.weight.toFixed(0)}%</span>
    `;
    criteriaList.appendChild(row);
  });

  const overall = getWeightedAverage(image);
  overallScore.textContent = `Overall ${overall.toFixed(1)}`;
}

function renderDecisionBoard() {
  const image = getActiveImage();
  if (!image) return;

  decisionBoard.innerHTML = '';
  DECISION_LABELS.forEach((decision) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `decision-chip ${image.decisions.includes(decision.id) ? 'selected' : ''}`;
    chip.dataset.decision = decision.id;
    chip.textContent = decision.label;
    chip.style.borderColor = image.decisions.includes(decision.id) ? 'transparent' : 'rgba(24,21,19,0.12)';
    chip.addEventListener('click', () => {
      const activeSet = new Set(image.decisions);
      if (activeSet.has(decision.id)) {
        activeSet.delete(decision.id);
      } else {
        activeSet.add(decision.id);
      }
      image.decisions = Array.from(activeSet);
      renderDecisionBoard();
    });
    decisionBoard.appendChild(chip);
  });
}

function renderMaterials() {
  const image = getActiveImage();
  if (!image) return;

  materialList.innerHTML = '';
  const allMaterials = [...new Set([...DEFAULT_MATERIALS, ...image.materials])];

  allMaterials.forEach((material) => {
    const tag = document.createElement('button');
    tag.type = 'button';
    tag.className = `material-tag ${image.materials.includes(material) ? 'selected' : ''}`;
    tag.textContent = material;
    tag.addEventListener('click', () => {
      if (image.materials.includes(material)) {
        image.materials = image.materials.filter((item) => item !== material);
      } else {
        image.materials = [...image.materials, material];
      }
      renderMaterials();
    });
    materialList.appendChild(tag);
  });
}

function renderAnnotations() {
  const image = getActiveImage();
  if (!image) return;

  annotationLayer.innerHTML = '';

  image.annotations.forEach((annotation) => {
    const pin = document.createElement('button');
    pin.type = 'button';
    pin.className = 'annotation-pin';
    pin.dataset.type = annotation.tone;
    pin.style.left = `${annotation.x}%`;
    pin.style.top = `${annotation.y}%`;
    pin.setAttribute('aria-label', annotation.label);

    pin.addEventListener('click', () => {
      const existing = document.querySelector('.annotation-card.active');
      if (existing) existing.remove();

      const card = document.createElement('div');
      card.className = 'annotation-card active';
      card.innerHTML = `<strong>${annotation.label}</strong>${annotation.text}`;
      card.style.left = `${annotation.x}%`;
      card.style.top = `${annotation.y}%`;
      annotationLayer.appendChild(card);
    });

    annotationLayer.appendChild(pin);
  });
}

function renderImageStrip() {
  imageStrip.innerHTML = '';

  state.images.forEach((image) => {
    const card = document.createElement('div');
    card.className = `image-card ${image.id === state.activeImageId ? 'active' : ''}`;
    card.innerHTML = `
      <img src="${image.src}" alt="${image.name}" />
      <span class="image-label">${image.name}</span>
    `;
    card.addEventListener('click', () => {
      state.activeImageId = image.id;
      updateHeader();
      renderImageStrip();
      renderAnnotations();
      renderCriteria();
      renderDecisionBoard();
      renderMaterials();
    });
    imageStrip.appendChild(card);
  });
}

function updateSiteText() {
  const active = getActiveImage();
  if (!active) return;
  active.name = siteNameInput.value.trim() || 'Untitled view';
  state.siteName = active.name;
  siteTitle.textContent = active.name;
  renderImageStrip();
}

function setActiveImageFromUpload(file) {
  const reader = new FileReader();
  reader.onload = function (event) {
    const image = makeImageEntry(file.name.replace(/\.[^.]+$/, ''), event.target.result, 'upload');
    state.images.push(image);
    state.activeImageId = image.id;
    updateHeader();
    renderImageStrip();
    renderAnnotations();
    renderCriteria();
    renderDecisionBoard();
    renderMaterials();
  };
  reader.readAsDataURL(file);
}

function handleFileSelection(event) {
  const files = Array.from(event.target.files || []);
  files.forEach(setActiveImageFromUpload);
  event.target.value = '';
}

function addAnnotation(xPercent, yPercent) {
  const image = getActiveImage();
  if (!image) return;

  const tone = ['keep', 'adapt', 'reuse', 'replace', 'new'][Math.floor(Math.random() * 5)];
  const label = DECISION_LABELS.find((item) => item.tone === tone)?.label || 'Study';
  const text = ARCHITECTURE_PROMPTS[Math.floor(Math.random() * ARCHITECTURE_PROMPTS.length)];

  image.annotations.push({
    id: crypto.randomUUID(),
    x: xPercent,
    y: yPercent,
    tone,
    label,
    text,
  });

  renderAnnotations();
}

function addMaterial() {
  const image = getActiveImage();
  const input = document.getElementById('materialInput');
  const value = input.value.trim();
  if (!image || !value) return;

  image.materials = [...new Set([...image.materials, value])];
  input.value = '';
  renderMaterials();
}

function resetScenario() {
  const active = getActiveImage();
  if (!active) return;
  active.criteria = structuredClone(DEFAULT_CRITERIA);
  active.decisions = ['retain'];
  active.materials = ['Brick', 'Concrete', 'Steel'];
  active.annotations = [
    { id: crypto.randomUUID(), x: 29, y: 52, label: 'Retain', tone: 'keep', text: 'The structural shell still reads clearly and is legible at the urban scale.' },
    { id: crypto.randomUUID(), x: 57, y: 43, label: 'Adapt', tone: 'adapt', text: 'This block could be reprogrammed without losing the industrial character.' },
    { id: crypto.randomUUID(), x: 76, y: 68, label: 'Reuse', tone: 'reuse', text: 'Existing materials and floor plates suggest reuse potential.' }
  ];
  renderCriteria();
  renderDecisionBoard();
  renderMaterials();
  renderAnnotations();
}

function bindEvents() {
  document.getElementById('addImageBtn').addEventListener('click', () => imageInput.click());
  document.getElementById('newScenarioBtn').addEventListener('click', resetScenario);
  document.getElementById('clearImagesBtn').addEventListener('click', () => {
    state.images = [makeImageEntry('St Philip’s Marsh', createDefaultSiteSvg())];
    state.activeImageId = state.images[0].id;
    renderImageStrip();
    renderAnnotations();
    renderCriteria();
    renderDecisionBoard();
    renderMaterials();
    updateHeader();
  });

  imageInput.addEventListener('change', handleFileSelection);
  siteNameInput.addEventListener('input', updateSiteText);
  analysisQuestion.addEventListener('input', () => {
    state.question = analysisQuestion.value;
  });

  document.getElementById('addMaterialBtn').addEventListener('click', addMaterial);
  document.getElementById('materialInput').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') addMaterial();
  });

  board.addEventListener('click', (event) => {
    const rect = board.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    addAnnotation(x, y);
  });

  document.addEventListener('input', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;

    const image = getActiveImage();
    if (!image) return;

    const criterionId = target.dataset.criterion;
    const kind = target.dataset.kind;
    if (!criterionId || !kind) return;

    const criterion = image.criteria.find((item) => item.id === criterionId);
    if (!criterion) return;

    if (kind === 'value') criterion.value = Number(target.value);
    if (kind === 'weight') criterion.weight = Number(target.value);

    renderCriteria();
  });
}

function init() {
  const initial = makeImageEntry('St Philip’s Marsh', createDefaultSiteSvg());
  state.images = [initial];
  state.activeImageId = initial.id;
  activeImage.src = initial.src;

  updateHeader();
  renderImageStrip();
  renderCriteria();
  renderDecisionBoard();
  renderMaterials();
  renderAnnotations();
  bindEvents();
}

init();
