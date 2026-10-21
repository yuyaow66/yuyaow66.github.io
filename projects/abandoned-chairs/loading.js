(() => {
  if (window.chairsLoader) return;

  const script = document.currentScript;
  const base = new URL('.', script.src);
  const page = script.dataset.page;
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const startedAt = performance.now();
  const inertElements = new Map();
  const previousBusy = document.body?.getAttribute('aria-busy') ?? null;
  let loader;
  let observer;
  let resources;
  let label;
  let percent;
  let track;
  let frame = 0;
  let previousTime = 0;
  let displayed = 0;
  let target = 0;
  let ready = false;
  let completing = false;
  let leaving = false;
  let exitTimer = 0;
  let stallTimer = 0;
  let removed = false;

  root.classList.add('chairs-loading');

  function lockContent() {
    Array.from(document.body.children).forEach(element => {
      if (element === loader || element.matches('script, style, link, .chairs-cursor') || inertElements.has(element)) return;
      inertElements.set(element, element.inert);
      element.inert = true;
    });
  }

  function remove() {
    if (removed) return;
    removed = true;
    clearTimeout(exitTimer);
    clearTimeout(stallTimer);
    cancelAnimationFrame(frame);
    observer?.disconnect();
    resources?.disconnect();
    inertElements.forEach((inert, element) => { element.inert = inert; });
    inertElements.clear();
    if (previousBusy === null) document.body.removeAttribute('aria-busy');
    else document.body.setAttribute('aria-busy', previousBusy);
    root.classList.remove('chairs-loading', 'chairs-loader-mounted');
    loader?.remove();
    window.removeEventListener('pageshow', restore);
  }

  function leave() {
    if (leaving) return;
    leaving = true;
    clearTimeout(stallTimer);
    if (!loader || reducedMotion.matches) {
      remove();
      return;
    }
    loader.classList.add('is-leaving');
    loader.addEventListener('transitionend', event => {
      if (event.target === loader && event.propertyName === 'opacity') remove();
    });
    exitTimer = setTimeout(remove, 500);
  }

  function render(time) {
    frame = 0;
    if (removed || leaving || !loader) return;
    const delta = Math.min(time - previousTime || 16.7, 50);
    previousTime = time;
    displayed = reducedMotion.matches ? target : displayed + (target - displayed) * (1 - Math.exp(-delta / 110));
    if (Math.abs(target - displayed) < 0.001) displayed = target;
    loader.style.setProperty('--progress', displayed);
    const value = Math.floor(displayed * 100);
    percent.textContent = `${value}%`;
    track.setAttribute('aria-valuenow', value);
    if (displayed !== target) frame = requestAnimationFrame(render);
    else if (ready) {
      label.textContent = 'Ready';
      exitTimer = setTimeout(leave, Math.max(220, 900 - (performance.now() - startedAt)));
    }
  }

  function schedule() {
    if (!frame && loader && !leaving && !removed) {
      previousTime = 0;
      frame = requestAnimationFrame(render);
    }
  }

  function showActions(failed = false) {
    if (!loader || ready || leaving || removed) return;
    loader.querySelector('.chairs-loader-actions').hidden = false;
    label.textContent = failed ? 'Unable to load the chairs' : 'Still loading…';
  }

  function progress(value) {
    if (ready || removed || leaving || !Number.isFinite(value)) return;
    target = Math.max(target, Math.min(0.96, value));
    clearTimeout(stallTimer);
    stallTimer = setTimeout(() => showActions(), 15000);
    schedule();
  }

  function complete() {
    if (ready || removed || leaving) return;
    ready = true;
    target = 1;
    clearTimeout(stallTimer);
    if (loader) loader.querySelector('.chairs-loader-actions').hidden = true;
    schedule();
  }

  function mount() {
    if (removed || loader) return;
    loader = document.createElement('div');
    loader.className = 'chairs-loader';
    loader.innerHTML = `
      <div class="chairs-loader-content">
        <p class="chairs-loader-title">Abandoned Chairs</p>
        <div class="chairs-loader-track" role="progressbar" aria-label="${page === 'home' ? 'Loading the chair' : 'Loading Left Behind'}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
          <div class="chairs-loader-fill"></div>
          <div class="chairs-loader-marker"><img class="chairs-loader-chair" src="${new URL('poetry-chair-red.png', base).href}" alt="" width="80" height="98" fetchpriority="high" decoding="async"></div>
        </div>
        <div class="chairs-loader-details"><span class="chairs-loader-label" role="status">${page === 'home' ? 'Loading the chair' : 'Loading Left Behind'}</span><span class="chairs-loader-percent" aria-hidden="true">0%</span></div>
        <div class="chairs-loader-actions" hidden><button type="button" data-retry>Try again</button><button type="button" data-continue>Continue</button></div>
      </div>`;
    document.body.append(loader);
    root.classList.add('chairs-loader-mounted');
    document.body.setAttribute('aria-busy', 'true');
    label = loader.querySelector('.chairs-loader-label');
    percent = loader.querySelector('.chairs-loader-percent');
    track = loader.querySelector('.chairs-loader-track');
    loader.querySelector('[data-retry]').addEventListener('click', () => location.reload());
    loader.querySelector('[data-continue]').addEventListener('click', leave);
    lockContent();
    observer = new MutationObserver(lockContent);
    observer.observe(document.body, { childList: true });
    schedule();
    if (!ready) stallTimer = setTimeout(() => showActions(), 15000);
  }

  function restore(event) {
    if (event.persisted) leave();
  }

  if (page === 'home' && typeof PerformanceObserver === 'function') {
    const weights = new Map([
      [new URL('medias/glass_chair.glb', base).pathname, 0.24],
      [new URL('medias/qwantani_moon_noon_puresky_4k.hdr', base).pathname, 0.62]
    ]);
    const loaded = new Set();
    resources = new PerformanceObserver(list => {
      list.getEntries().forEach(entry => {
        const path = new URL(entry.name).pathname;
        if (weights.has(path)) loaded.add(path);
      });
      progress(0.06 + Array.from(loaded).reduce((sum, path) => sum + weights.get(path), 0));
    });
    resources.observe({ type: 'resource', buffered: true });
  }

  window.chairsLoader = {
    progress,
    ready() {
      if (ready || completing || removed || leaving) return;
      if (page === 'home' && (!window.chairsHomeRendered || !document.body.classList.contains('chairs-home-scene-ready'))) return;
      completing = true;
      const styles = page === 'home' ? Array.from(document.querySelectorAll('link[rel="stylesheet"]')).filter(link => ['home.css', 'about.css'].includes(new URL(link.href).pathname.split('/').pop())) : [];
      Promise.all(styles.map(link => link.sheet ? Promise.resolve() : new Promise(resolve => {
        link.addEventListener('load', resolve, { once: true });
        link.addEventListener('error', resolve, { once: true });
      }))).then(() => document.fonts.ready).then(() => requestAnimationFrame(() => requestAnimationFrame(complete)));
    },
    fail() {
      clearTimeout(stallTimer);
      showActions(true);
    }
  };
  window.addEventListener('pageshow', restore);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
