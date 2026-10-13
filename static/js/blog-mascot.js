(() => {
  const spriteURL = document.currentScript.dataset.sprite;
  const framesURL = document.currentScript.dataset.frames;
  const pet = document.getElementById('blog-mascot');
  const canvas = document.getElementById('mascot-canvas');
  const context = canvas.getContext('2d');
  const character = document.getElementById('mascot-character');
  const message = document.getElementById('mascot-message');
  const restore = document.getElementById('mascot-restore');
  const rest = document.getElementById('mascot-rest');
  const desktop = matchMedia('(min-width: 1024px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const image = new Image();
  const storage = {
    get(key) { try { return localStorage.getItem(`durian-mascot-${key}`); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(`durian-mascot-${key}`, value); } catch {} },
  };
  const sequences = {
    idle: { row: 0, frames: [0, 0, 0, 0, 0, 1, 2, 3, 0, 0, 0, 0], interval: 220 },
    wave: { row: 1, frames: [0, 1, 2, 1, 2, 3], interval: 180 },
    happy: { row: 2, frames: [0, 1, 2, 3], interval: 230 },
    rest: { row: 3, frames: [0, 1, 2, 2, 2, 3], interval: 500 },
  };
  let state = 'idle';
  let frame = 0;
  let lastFrame = 0;
  let animation = 0;
  let loaded = false;
  let atlas;
  let hidden = storage.get('hidden') === 'true';
  let messageTimer;
  let drag;
  let moved = false;

  function draw() {
    const sequence = sequences[state];
    const rectangle = atlas.frames[sequence.row][sequence.frames[frame]];
    const scale = Math.min((canvas.width - 24) / atlas.maxWidth, (canvas.height - 24) / atlas.maxHeight);
    const width = rectangle.width * scale;
    const height = rectangle.height * scale;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, rectangle.x, rectangle.y, rectangle.width, rectangle.height,
      (canvas.width - width) / 2, canvas.height - 12 - height, width, height);
    pet.dataset.action = state;
    pet.dataset.frame = String(frame);
  }
  function tick(now) {
    animation = 0;
    if (document.hidden || hidden || !desktop.matches || !loaded) return;
    if (!reduced.matches && now - lastFrame >= sequences[state].interval) {
      lastFrame = now;
      frame++;
      if (frame >= sequences[state].frames.length) {
        frame = 0;
        if (state === 'wave' || state === 'happy') state = 'idle';
      }
      draw();
    }
    if (!reduced.matches) animation = requestAnimationFrame(tick);
  }
  function start() {
    cancelAnimationFrame(animation);
    if (loaded && !hidden && desktop.matches) { draw(); animation = requestAnimationFrame(tick); }
  }
  function say(text) {
    clearTimeout(messageTimer); message.textContent = text; message.hidden = false;
    messageTimer = setTimeout(() => { message.hidden = true; }, 3500);
  }
  function act(action) {
    state = action; frame = 0; lastFrame = 0;
    rest.setAttribute('aria-label', action === 'rest' ? '唤醒宠物' : '让宠物休息');
    rest.title = action === 'rest' ? '唤醒' : '休息';
    start();
  }
  function visibility() {
    pet.hidden = hidden || !loaded;
    restore.hidden = !hidden || !loaded;
    start();
  }
  document.getElementById('mascot-wave').onclick = () => { act('wave'); say('你好呀，欢迎来逛逛！'); };
  rest.onclick = () => { const resting = state !== 'rest'; act(resting ? 'rest' : 'idle'); say(resting ? '我休息一下，慢慢看哦。' : '我醒啦！'); };
  document.getElementById('mascot-hide').onclick = () => {
    hidden = true; storage.set('hidden', 'true'); visibility(); restore.focus();
  };
  restore.onclick = () => { hidden = false; storage.set('hidden', 'false'); act('wave'); visibility(); };
  character.addEventListener('click', event => { if (!moved || event.detail === 0) { act('happy'); say('今天也要记得休息一下呀。'); } });
  character.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    const bounds = pet.getBoundingClientRect();
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: bounds.left, top: bounds.top };
    moved = false; character.setPointerCapture(event.pointerId);
  });
  character.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 5) moved = true;
    if (!moved) return;
    pet.style.left = `${Math.max(0, Math.min(innerWidth - pet.offsetWidth - 24, drag.left + dx))}px`;
    pet.style.top = `${Math.max(45, Math.min(innerHeight - pet.offsetHeight - 48, drag.top + dy))}px`;
    pet.style.bottom = 'auto';
  });
  function endDrag() { drag = null; }
  character.addEventListener('pointerup', endDrag);
  character.addEventListener('pointercancel', endDrag);
  window.addEventListener('resize', () => {
    if (pet.style.top) {
      pet.style.left = `${Math.max(0, Math.min(parseFloat(pet.style.left), innerWidth - 204))}px`;
      pet.style.top = `${Math.max(45, Math.min(parseFloat(pet.style.top), innerHeight - 228))}px`;
    }
  });
  document.addEventListener('visibilitychange', start);
  desktop.addEventListener('change', start);
  reduced.addEventListener('change', start);
  image.onerror = () => { pet.hidden = true; restore.hidden = true; };
  const decoded = new Promise((resolve, reject) => { image.onload = resolve; image.addEventListener('error', reject); });
  image.src = spriteURL;
  Promise.all([decoded, fetch(framesURL).then(response => {
    if (!response.ok) throw new Error('Unable to load mascot frames');
    return response.json();
  })]).then(([, data]) => { atlas = data; loaded = true; visibility(); }).catch(() => { pet.hidden = true; restore.hidden = true; });
})();
