(() => {
  if (document.querySelector('.chairs-home-index')) return;

  const base = new URL('.', document.currentScript.src);
  const sections = [
    { category: 'The collection', name: 'Left Behind', page: 'collection.html' },
    { category: 'Poetry', name: 'What Remains', page: 'poetry.html' },
    { category: 'Find your chair', name: 'A Place to Land', page: 'next.html' },
    { category: 'About the project', name: 'More Than a Chair', page: 'about.html' }
  ];

  const index = document.createElement('section');
  index.className = 'chairs-home-index';
  index.setAttribute('aria-label', 'Abandoned Chairs');
  index.innerHTML = `
    <nav class="chairs-home-sections" aria-label="Explore Abandoned Chairs">
      ${sections.map((section, position) => `
        <a class="chairs-home-row" href="${new URL(section.page, base).href}" ${section.page === 'about.html' ? 'target="_blank" rel="noopener"' : ''} aria-label="${section.name}: ${section.category}${section.page === 'about.html' ? ' (opens in a new tab)' : ''}">
          <span class="chairs-home-number" aria-hidden="true">${String(position + 1).padStart(2, '0')}</span>
          <span class="chairs-home-name">${section.name}</span>
          <span class="chairs-home-category">${section.category}</span>
        </a>
      `).join('')}
    </nav>
    <button class="chairs-home-chair-close" type="button" aria-label="Hide chair" title="Hide chair"><span aria-hidden="true">(x)</span></button>
    <footer class="chairs-home-footer">
      <p>Objects left behind. Stories still here.</p>
      <p>Yuyao Wang</p>
    </footer>
  `;

  document.body.classList.add('chairs-home');
  document.body.append(index);
  const lettering = document.createElement('canvas');
  const ink = lettering.getContext('2d');
  let letteringFrame = 0;
  let letteringVersion = 0;
  const drawLettering = () => {
    letteringFrame = 0;
    if (document.documentElement.classList.contains('chairs-chair-hidden')) return;
    const width = innerWidth;
    const height = innerHeight;
    const ratio = Math.min(devicePixelRatio || 1, 2, 4096 / Math.max(width, height));
    lettering.width = Math.ceil(width * ratio);
    lettering.height = Math.ceil(height * ratio);
    ink.setTransform(ratio, 0, 0, ratio, 0, 0);
    const shade = ink.createLinearGradient(0, 0, 0, height);
    shade.addColorStop(0, 'rgb(23 32 57 / 27%)');
    shade.addColorStop(0.56, 'rgb(23 32 57 / 22%)');
    shade.addColorStop(1, 'rgb(23 32 57 / 12%)');
    ink.fillStyle = shade;
    ink.fillRect(0, 0, width, height);
    ink.textBaseline = 'alphabetic';
    navigation.querySelectorAll('span').forEach(element => {
      const style = getComputedStyle(element);
      ink.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      ink.fillStyle = style.color;
      ink.letterSpacing = style.letterSpacing;
      const node = element.firstChild;
      const source = node.textContent;
      const text = style.textTransform === 'uppercase' ? source.toUpperCase() : source;
      const range = document.createRange();
      const metrics = ink.measureText(text);
      const ascent = metrics.fontBoundingBoxAscent ?? metrics.actualBoundingBoxAscent;
      const descent = metrics.fontBoundingBoxDescent ?? metrics.actualBoundingBoxDescent;
      let line = '';
      let lineBox = null;
      let lineRight = 0;
      const paint = () => {
        if (!lineBox || !line) return;
        const baseline = lineBox.top + (lineBox.height - ascent - descent) / 2 + ascent;
        const measured = ink.measureText(line).width;
        ink.save();
        ink.translate(lineBox.left, baseline);
        if (measured) ink.scale((lineRight - lineBox.left) / measured, 1);
        ink.fillText(line, 0, 0);
        ink.restore();
      };
      for (let position = 0; position < text.length; position++) {
        range.setStart(node, position);
        range.setEnd(node, position + 1);
        const box = range.getBoundingClientRect();
        if (lineBox && Math.abs(box.top - lineBox.top) > 1) {
          paint();
          line = '';
          lineBox = null;
        }
        if (!lineBox) lineBox = box;
        lineRight = box.right;
        line += text[position];
      }
      paint();
    });
    index.dataset.letteringSize = `${width}x${height}`;
    window.chairsHomeLettering = { canvas: lettering, width, height, version: ++letteringVersion };
    window.dispatchEvent(new CustomEvent('chairs:lettering', { detail: window.chairsHomeLettering }));
  };
  const scheduleLettering = () => {
    if (!letteringFrame) letteringFrame = requestAnimationFrame(drawLettering);
  };
  const closeChair = index.querySelector('.chairs-home-chair-close');
  const navigation = index.querySelector('.chairs-home-sections');
  const positionClose = () => {
    if (!closeChair.isConnected) return;
    closeChair.style.removeProperty('top');
    const box = closeChair.getBoundingClientRect();
    const half = box.height / 2;
    const preferred = box.top + half;
    const obstacles = Array.from(navigation.querySelectorAll('.chairs-home-name, .chairs-home-category')).map(element => element.getBoundingClientRect()).filter(rect => rect.left < box.right && rect.right > box.left);
    const clear = center => center - half >= 68 && center + half <= innerHeight && obstacles.every(rect => center + half + 2 <= rect.top || center - half - 2 >= rect.bottom);
    if (clear(preferred)) return;
    const candidates = obstacles.flatMap(rect => [rect.top - half - 2, rect.bottom + half + 2]).filter(clear);
    candidates.sort((first, second) => Math.abs(first - preferred) - Math.abs(second - preferred));
    if (candidates.length) closeChair.style.top = `${candidates[0]}px`;
  };
  const navigationSize = new ResizeObserver(() => {
    positionClose();
    scheduleLettering();
  });
  navigationSize.observe(navigation);
  index.addEventListener('pointerover', scheduleLettering);
  index.addEventListener('pointerout', scheduleLettering);
  index.addEventListener('focusin', scheduleLettering);
  index.addEventListener('focusout', scheduleLettering);
  window.addEventListener('resize', scheduleLettering, { passive: true });
  window.addEventListener('scroll', scheduleLettering, { passive: true });
  document.fonts.addEventListener('loadingdone', scheduleLettering);
  window.addEventListener('resize', positionClose, { passive: true });
  document.fonts.ready.then(() => {
    positionClose();
    scheduleLettering();
  });
  scheduleLettering();
  positionClose();
  closeChair.addEventListener('click', () => {
    document.documentElement.classList.add('chairs-chair-hidden');
    window.dispatchEvent(new Event('chairs:close'));
    window.dispatchEvent(new CustomEvent('chairs:cursor-hover', { detail: false }));
    document.body.style.cursor = 'default';
    navigationSize.disconnect();
    window.removeEventListener('resize', positionClose);
    window.removeEventListener('resize', scheduleLettering);
    window.removeEventListener('scroll', scheduleLettering);
    document.fonts.removeEventListener('loadingdone', scheduleLettering);
    index.removeEventListener('pointerover', scheduleLettering);
    index.removeEventListener('pointerout', scheduleLettering);
    index.removeEventListener('focusin', scheduleLettering);
    index.removeEventListener('focusout', scheduleLettering);
    cancelAnimationFrame(letteringFrame);
    document.body.classList.remove('chairs-home-scene-ready');
    delete window.chairsHomeLettering;
    closeChair.remove();
    index.querySelector('.chairs-home-row').focus({ preventScroll: true });
  });
})();
