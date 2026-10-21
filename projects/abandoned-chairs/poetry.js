(() => {
  const poems = Array.from(document.querySelectorAll('.chairs-poetry-poem'));
  const choices = Array.from(document.querySelectorAll('.chairs-poetry-choice'));
  const action = document.querySelector('.chairs-poetry-action');
  const pause = document.querySelector('.chairs-poetry-pause');
  const readingButton = document.querySelector('.chairs-poetry-reading');
  const motionButton = document.querySelector('.chairs-poetry-motion');
  const controls = document.querySelector('.chairs-poetry-controls');
  const folio = document.querySelector('.chairs-poetry-folio');
  const status = document.querySelector('.chairs-poetry-status');
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const aboutTrigger = document.getElementById('chairs-poetry-about-trigger');
  const aboutPanel = document.getElementById('chairs-poetry-about');
  const aboutClose = document.getElementById('chairs-poetry-about-close');
  const chairDefinitions = [{"file": "poetry-chair-red.png", "bounds": [273, 50, 980, 1251], "shape": [[-0.0637, -0.5], [-0.1461, -0.4833], [-0.1936, -0.45], [-0.2669, -0.2669], [-0.2935, 0.0495], [-0.2835, 0.4825], [0.2127, 0.4825], [0.2835, 0.266], [0.2877, 0.0995], [0.1928, -0.1003], [0.1636, -0.3002], [0.122, -0.4167], [0.082, -0.4667], [-0.0246, -0.5]], "source": "chair47.jpg"}, {"file": "poetry-chair.png", "bounds": [114, 7, 1077, 1397], "shape": [[0.0083, -0.5], [-0.0428, -0.4712], [-0.3284, -0.4568], [-0.2306, 0.0612], [-0.3464, 0.0755], [-0.2083, 0.277], [-0.0608, 0.4209], [0.0558, 0.4993], [0.0615, 0.4993], [0.091, 0.4784], [0.0694, 0.4353], [0.0658, 0.3201], [0.3378, 0.3058], [0.3457, 0.2914], [0.327, 0.2626], [0.345, 0.0468], [0.0766, -0.0827], [0.0147, -0.5]], "source": "chair14.jpg"}, {"file": "poetry-chair-gray.png", "bounds": [47, 130, 1085, 1349], "shape": [[-0.1419, -0.4836], [-0.3134, -0.418], [-0.4184, -0.3031], [-0.4036, -0.0898], [-0.4249, 0.0906], [-0.3847, 0.2711], [-0.3503, 0.2875], [-0.338, 0.4844], [0.3396, 0.4844], [0.3511, 0.2875], [0.3823, 0.2711], [0.4233, 0.0906], [0.4044, -0.139], [0.4217, -0.3031], [0.3421, -0.4016], [0.1608, -0.4836]], "source": "chair5.jpg"}, {"file": "poetry-chair-black.png", "bounds": [12, 20, 1116, 1400], "shape": [[-0.3341, -0.5], [-0.3652, -0.471], [-0.3304, -0.2391], [-0.2551, -0.2246], [-0.2529, -0.2101], [-0.3181, -0.1812], [-0.3051, -0.0942], [-0.3826, -0.0652], [-0.3942, -0.0217], [-0.2572, 0.1522], [-0.1333, 0.2391], [-0.2174, 0.2971], [-0.2297, 0.3406], [0.013, 0.3551], [0.0435, 0.3841], [0.0529, 0.4855], [0.0841, 0.4855], [0.0819, 0.4275], [0.1522, 0.413], [0.208, 0.3696], [0.3275, 0.2536], [0.392, 0.1667], [0.3971, 0.1232], [0.3783, 0.0797], [0.2942, 0.0072], [0.363, -0.0942], [0.1754, -0.1812], [0.0812, -0.1957], [0.063, -0.2246], [-0.0442, -0.2391], [0.0428, -0.2681], [0.079, -0.2971], [0.0841, -0.3986], [0.0601, -0.4565], [0.0348, -0.471], [-0.321, -0.5]], "source": "chair13.jpg"}, {"file": "poetry-chair-burgundy.png", "bounds": [25, 29, 1130, 1343], "shape": [[-0.059, -0.5], [-0.1001, -0.4391], [-0.1176, -0.1956], [-0.2584, -0.1499], [-0.4197, -0.0282], [-0.3725, 0.0175], [-0.3527, 0.0632], [-0.3246, 0.4132], [-0.3086, 0.4285], [0.2325, 0.4437], [0.2325, 0.4893], [0.2827, 0.4893], [0.3215, 0.2306], [0.3421, 0.2002], [0.3474, 0.0936], [0.3908, 0.0479], [0.4197, -0.1347], [0.3345, -0.1499], [0.3253, -0.1651], [0.3413, -0.4848], [-0.0498, -0.5]], "source": "chair40.jpg"}];
  const chairPhotos = chairDefinitions.map(definition => {
    const image = new Image();
    image.decoding = 'async';
    return { ...definition, image };
  });
  let chairReady = null;
  const loadChairPhotos = () => {
    if (!chairReady) {
      chairReady = Promise.all(chairPhotos.map(asset => new Promise(resolve => {
        asset.image.onload = () => resolve(true);
        asset.image.onerror = () => resolve(false);
        asset.image.src = `${asset.file}?v=20261020-chair-pool-1`;
      }))).then(() => chairPhotos.some(asset => asset.image.naturalWidth > 0));
    }
    return chairReady;
  };
  const modes = [
    { effect: 'peel', action: 'Light the match', hint: 'Touch the paper to ignite it. Drag to carry the flame across the page.', quiet: 'The words hold traces of red, green, and white paint.' },
    { effect: 'weave', action: 'Push the chair', hint: 'Move your mouse to guide the chair through the woven words. Drag to pull the fabric.', quiet: 'Words held together like the woven seat of a chair.' },
    { effect: 'flight', action: 'Unfold the chair', hint: 'Move to guide the photographed chairs. Touch the page to set more words free.', quiet: 'The words become little photographed chairs taking a walk.' },
    { effect: 'rain', action: 'Start the downpour', hint: 'Touch or drag across the text to loosen its letters. Each falling letter splashes when it lands.', quiet: 'Letters fall like rain beside an abandoned chair.' }
  ];
  if (!poems.length || !action || !pause || !readingButton || !motionButton || !controls) return;

  const stages = poems.map((article, index) => {
    const text = article.querySelector('.chairs-poetry-text');
    const source = text.textContent;
    const fragment = document.createDocumentFragment();
    source.split('\n').forEach((line, lineIndex, lines) => {
      const lineNode = document.createElement('span');
      lineNode.className = 'chairs-poetry-line';
      const leading = line.match(/^\s*/)[0];
      const indentation = Math.min(3, (leading.match(/\t/g) || []).length || Math.floor(leading.length / 6));
      lineNode.style.setProperty('--poem-indent', `${indentation * 2.2}ch`);
      if (!line.trim()) lineNode.classList.add('is-stanza-space');
      line.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { lineNode.append(document.createTextNode(part)); return; }
        const word = document.createElement('span');
        word.className = 'chairs-poetry-word';
        word.textContent = part;
        lineNode.append(word);
      });
      fragment.append(lineNode);
      if (lineIndex < lines.length - 1) fragment.append(document.createTextNode('\n'));
    });
    text.replaceChildren(fragment);
    const hint = document.createElement('p');
    hint.className = 'chairs-poetry-hint';
    hint.id = `${article.id}-hint`;
    const stage = document.createElement('div');
    stage.className = 'chairs-poetry-stage';
    stage.setAttribute('role', 'group');
    stage.setAttribute('aria-label', `${article.querySelector('h2').textContent} interactive poem`);
    stage.setAttribute('aria-describedby', hint.id);
    stage.dataset.effect = modes[index].effect;
    const canvas = document.createElement('canvas');
    canvas.className = 'chairs-poetry-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    text.before(hint, stage);
    stage.append(text, canvas);
    return { article, text, source, stage, canvas, hint, mode: modes[index], inView: false };
  });

  let active = null;
  let effect = null;
  let ctx = null;
  let frame = 0;
  let lastTime = 0;
  let elapsed = 0;
  let paused = false;
  let reading = true;
  let resizeTimer = 0;
  let preparation = 0;
  let pointer = { x: -1000, y: -1000, dx: 0, dy: 0, active: false, pressed: false };
  const random = (min, max) => min + Math.random() * (max - min);
  const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    if (active) active.stage.dataset.running = 'false';
  };
  const dispose = () => {
    stop();
    effect?.dispose?.();
    effect = null;
    if (active) {
      active.stage.classList.remove('is-motion-ready');
      active.stage.dataset.running = 'false';
    }
  };
  const draw = stamp => {
    frame = 0;
    if (!effect || paused || aboutPanel?.open || document.hidden || motionPreference.matches || !active.inView) return;
    const dt = lastTime ? Math.min((stamp - lastTime) / 1000, 0.04) : 1 / 60;
    lastTime = stamp;
    elapsed += dt;
    ctx.clearRect(0, 0, active.width, active.height);
    effect.frame(dt, elapsed);
    active.stage.dataset.running = 'true';
    frame = requestAnimationFrame(draw);
  };
  const start = () => {
    if (!frame && effect && !paused && !aboutPanel?.open && !document.hidden && !motionPreference.matches && active.inView) frame = requestAnimationFrame(draw);
  };
  const prepare = () => {
    dispose();
    if (!active) return;
    const item = active;
    const quiet = motionPreference.matches;
    const staticText = quiet || reading;
    item.hint.textContent = item.mode.hint;
    item.hint.hidden = staticText;
    controls.hidden = staticText;
    item.stage.classList.toggle('is-artboard', !staticText);
    item.stage.tabIndex = staticText ? -1 : 0;
    action.hidden = staticText;
    pause.hidden = staticText;
    readingButton.hidden = false;
    motionButton.hidden = quiet;
    readingButton.setAttribute('aria-pressed', String(reading || quiet));
    motionButton.setAttribute('aria-pressed', String(!reading && !quiet));
    if (staticText) return;
    const showReadingFallback = () => {
      reading = true;
      item.stage.classList.remove('is-artboard');
      item.stage.tabIndex = -1;
      item.hint.hidden = true;
      controls.hidden = true;
      action.hidden = true;
      pause.hidden = true;
      readingButton.hidden = false;
      readingButton.setAttribute('aria-pressed', 'true');
      motionButton.setAttribute('aria-pressed', 'false');
    };
    const factory = window.ChairsPoetryEffects?.[item.mode.effect];
    ctx = item.canvas.getContext('2d');
    if (!ctx || !factory) {
      showReadingFallback();
      return;
    }
    const box = item.stage.getBoundingClientRect();
    item.width = box.width;
    item.height = box.height;
    const ratio = 3;
    item.canvas.width = Math.round(box.width * ratio);
    item.canvas.height = Math.round(box.height * ratio);
    ctx.setTransform(item.canvas.width / box.width, 0, 0, item.canvas.height / box.height, 0, 0);
    item.stage.dataset.pixelRatio = String(ratio);
    item.stage.dataset.renderer = 'canvas2d';
    const availableChairs = chairPhotos.filter(asset => asset.image.naturalWidth > 0);
    const chairCount = availableChairs.length;
    const primaryChairIndex = item.mode.effect === 'weave' ? Math.min(2, chairCount - 1) : 0;
    const chairShape = availableChairs[primaryChairIndex]?.shape || [];
    item.stage.dataset.chairAsset = availableChairs[primaryChairIndex]?.file || '';
    item.stage.dataset.chairAssetCount = String(chairCount);
    item.stage.dataset.chairAssets = availableChairs.map(asset => asset.file).join(',');
    const renderedChairVariants = new Set();
    const style = getComputedStyle(item.text);
    const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    ctx.font = font;
    const fontMetrics = ctx.measureText('Mg');
    const ascent = fontMetrics.fontBoundingBoxAscent ?? fontMetrics.actualBoundingBoxAscent;
    const descent = fontMetrics.fontBoundingBoxDescent ?? fontMetrics.actualBoundingBoxDescent;
    const words = Array.from(item.text.querySelectorAll('.chairs-poetry-word'), node => {
      const bounds = node.getBoundingClientRect();
      const y = bounds.top - box.top;
      return { text: node.textContent, x: bounds.left - box.left, y, width: bounds.width, height: bounds.height, baseline: y + (bounds.height - ascent - descent) / 2 + ascent };
    });
    const drawWord = (word, x = word.x, y = word.y, options = {}) => {
      ctx.save();
      ctx.font = font;
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = options.color ?? style.color;
      ctx.globalAlpha = Math.max(0, Math.min(1, options.alpha ?? 1));
      ctx.translate(x + word.width / 2, y + word.height / 2);
      ctx.rotate(options.rotation ?? 0);
      ctx.scale(options.scale ?? 1, options.scale ?? 1);
      ctx.fillText(word.text, -word.width / 2, word.baseline - word.y - word.height / 2);
      ctx.restore();
    };
    const drawChair = (x, y, size, rotation, color, alpha = 1, variant = primaryChairIndex) => {
      if (!chairCount) return;
      const selectedIndex = Number.isFinite(variant) ? Math.trunc(variant) : primaryChairIndex;
      const index = (selectedIndex % chairCount + chairCount) % chairCount;
      const asset = availableChairs[index];
      if (!renderedChairVariants.has(index)) {
        renderedChairVariants.add(index);
        item.stage.dataset.chairVariantsUsed = Array.from(renderedChairVariants).sort().join(',');
      }
      const [left, top, right, bottom] = asset.bounds;
      const sourceWidth = right - left;
      const sourceHeight = bottom - top;
      const drawWidth = size * sourceWidth / sourceHeight;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation || 0);
      ctx.globalAlpha *= Math.max(0, Math.min(1, alpha));
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(asset.image, left, top, sourceWidth, sourceHeight, -drawWidth / 2, -size / 2, drawWidth, size);
      ctx.restore();
    };
    elapsed = 0;
    pointer = { x: -1000, y: -1000, dx: 0, dy: 0, active: false, pressed: false };
    const visibleBounds = () => {
      const bounds = item.stage.getBoundingClientRect();
      const top = Math.max(0, -bounds.top + 20);
      const bottom = Math.min(item.height, innerHeight - bounds.top - 16);
      return { top: Math.min(top, item.height), bottom: Math.max(Math.min(item.height, top + 140), bottom) };
    };
    try {
      effect = factory({ ctx, width: box.width, height: box.height, pixelRatio: ratio, stage: item.stage, text: item.source, font, color: style.color, words, drawWord, drawChair, chairShape, chairCount, chairIndex: primaryChairIndex, random, visibleBounds });
      ctx.clearRect(0, 0, box.width, box.height);
      effect.frame(0, 0);
    } catch (error) {
      console.error('Unable to render the interactive poem.', error);
      effect?.dispose?.();
      effect = null;
      showReadingFallback();
      return;
    }
    item.stage.classList.add('is-motion-ready');
    start();
  };
  const refresh = () => {
    const version = ++preparation;
    const resources = reading || motionPreference.matches ? [document.fonts.ready] : [document.fonts.ready, loadChairPhotos()];
    Promise.all(resources).then(([, photoLoaded]) => {
      if (version !== preparation) return;
      if (photoLoaded === false) reading = true;
      prepare();
    });
  };
  const selectPoem = (id, announce = false) => {
    const selected = stages.find(item => item.article.id === id) || stages[0];
    if (selected === active) return;
    dispose();
    active = selected;
    selected.article.querySelector('.chairs-poetry-credit').after(controls);
    const selectedChoice = choices.find(choice => choice.hash === `#${selected.article.id}`);
    if (folio) {
      folio.querySelector('.chairs-poetry-folio-order').textContent = `Poem ${String(stages.indexOf(selected) + 1).padStart(2, '0')}`;
    }
    const index = selectedChoice?.parentElement;
    if (index && index.scrollWidth > index.clientWidth) {
      const left = selectedChoice.offsetLeft - index.offsetLeft;
      if (left < index.scrollLeft) index.scrollLeft = left;
      else if (left + selectedChoice.offsetWidth > index.scrollLeft + index.clientWidth) index.scrollLeft = left + selectedChoice.offsetWidth - index.clientWidth;
    }
    stages.forEach(item => { item.article.hidden = item !== selected; });
    choices.forEach(choice => {
      if (choice.hash === `#${selected.article.id}`) choice.setAttribute('aria-current', 'true');
      else choice.removeAttribute('aria-current');
    });
    paused = false;
    action.textContent = selected.mode.action;
    action.removeAttribute('aria-pressed');
    action.setAttribute('aria-controls', selected.text.id);
    pause.textContent = 'Pause motion';
    pause.setAttribute('aria-pressed', 'false');
    if (announce) status.textContent = `${selected.article.querySelector('h2').textContent}, by ${selected.article.querySelector('.chairs-poetry-credit').textContent}`;
    refresh();
  };
  choices.forEach(choice => {
    choice.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      selectPoem(choice.hash.slice(1), true);
      history.replaceState(null, '', choice.hash);
    });
  });
  const trigger = () => {
    if (!effect) return;
    if (paused) {
      paused = false;
      pause.textContent = 'Pause motion';
      pause.setAttribute('aria-pressed', 'false');
    }
    const bounds = active.stage.getBoundingClientRect();
    if (bounds.top > innerHeight * 0.4 || bounds.bottom < 120) active.stage.scrollIntoView({ block: 'start', behavior: 'instant' });
    effect.burst();
    start();
  };
  stages.forEach(item => {
    const updatePointer = (type, event) => {
      if (active !== item || !effect || paused) return;
      const box = item.stage.getBoundingClientRect();
      const x = event.clientX - box.left;
      const y = event.clientY - box.top;
      const pressed = type === 'down' || (type === 'move' && (event.buttons & 1) !== 0);
      pointer = { x, y, dx: pointer.active ? x - pointer.x : 0, dy: pointer.active ? y - pointer.y : 0, active: type !== 'leave', pressed };
      effect.pointer?.(type, pointer);
    };
    item.stage.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      updatePointer('down', event);
      if (effect && !paused) item.stage.setPointerCapture(event.pointerId);
    });
    item.stage.addEventListener('pointermove', event => updatePointer('move', event), { passive: true });
    item.stage.addEventListener('pointerup', event => updatePointer('up', event));
    item.stage.addEventListener('pointercancel', event => updatePointer('leave', event));
    item.stage.addEventListener('pointerleave', event => { if (!pointer.pressed) updatePointer('leave', event); });
    item.stage.addEventListener('lostpointercapture', event => {
      const bounds = item.stage.getBoundingClientRect();
      const inside = event.clientX >= bounds.left && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
      updatePointer(inside ? 'up' : 'leave', event);
    });
    item.stage.addEventListener('keydown', event => {
      if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); trigger(); }
      if (event.key === 'Escape') prepare();
    });
  });
  action.addEventListener('click', trigger);
  const setReading = value => {
    if (reading === value) return;
    reading = value;
    paused = false;
    pause.textContent = 'Pause motion';
    pause.setAttribute('aria-pressed', 'false');
    refresh();
  };
  readingButton.addEventListener('click', () => setReading(true));
  motionButton.addEventListener('click', () => setReading(false));
  pause.addEventListener('click', () => {
    paused = !paused;
    pause.textContent = paused ? 'Resume motion' : 'Pause motion';
    pause.setAttribute('aria-pressed', String(paused));
    if (paused) { stop(); active.stage.dataset.running = 'false'; }
    else start();
  });
  if (aboutTrigger && aboutPanel && aboutClose) {
    let aboutCloseTimer = 0;
    const closeAbout = () => {
      if (!aboutPanel.open || aboutPanel.classList.contains('is-closing')) return;
      if (motionPreference.matches) {
        aboutPanel.close();
        return;
      }
      aboutPanel.classList.add('is-closing');
      aboutCloseTimer = setTimeout(() => { if (aboutPanel.open) aboutPanel.close(); }, 300);
    };
    aboutTrigger.addEventListener('click', () => {
      if (aboutPanel.open) return;
      const cursor = document.querySelector('.chairs-cursor');
      if (cursor) aboutPanel.append(cursor);
      aboutPanel.showModal();
      aboutPanel.scrollTop = 0;
      aboutTrigger.setAttribute('aria-expanded', 'true');
      stop();
    });
    aboutClose.addEventListener('click', closeAbout);
    aboutPanel.addEventListener('cancel', event => {
      event.preventDefault();
      closeAbout();
    });
    aboutPanel.addEventListener('click', event => {
      if (event.target !== aboutPanel) return;
      const bounds = aboutPanel.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeAbout();
    });
    aboutPanel.addEventListener('animationend', event => {
      if (event.target === aboutPanel && event.animationName === 'chairs-poetry-about-out') aboutPanel.close();
    });
    aboutPanel.addEventListener('close', () => {
      clearTimeout(aboutCloseTimer);
      aboutPanel.classList.remove('is-closing');
      aboutTrigger.setAttribute('aria-expanded', 'false');
      const cursor = aboutPanel.querySelector('.chairs-cursor');
      if (cursor) document.body.append(cursor);
      aboutTrigger.focus({ preventScroll: true });
      start();
    });
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(refresh, 160);
  }, { passive: true });
  window.addEventListener('pagehide', dispose);
  window.addEventListener('pageshow', event => { if (event.persisted) refresh(); });
  window.addEventListener('blur', () => {
    pointer = { ...pointer, active: false, pressed: false };
    effect?.pointer?.('leave', pointer);
  });
  motionPreference.addEventListener('change', refresh);
  window.addEventListener('hashchange', () => selectPoem(location.hash.slice(1), true));
  const visibilityObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const item = stages.find(candidate => candidate.stage === entry.target);
      item.inView = entry.isIntersecting && entry.intersectionRatio >= 0.2;
      if (item === active) { if (item.inView) start(); else stop(); }
    });
  }, { threshold: [0, 0.2, 0.5] });
  stages.forEach(item => visibilityObserver.observe(item.stage));
  selectPoem(location.hash.slice(1));
})();
