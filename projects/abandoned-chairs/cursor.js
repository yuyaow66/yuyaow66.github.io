(() => {
  if (window.chairsCursor) return;
  const media = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (!media.matches) return;

  const cursor = document.createElement('div');
  cursor.className = 'chairs-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  const dot = document.createElement('span');
  dot.className = 'chairs-cursor-dot';
  const ring = document.createElement('span');
  ring.className = 'chairs-cursor-ring';
  cursor.append(dot, ring);
  document.body.append(cursor);

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let x = 0;
  let y = 0;
  let ringX = 0;
  let ringY = 0;
  let visible = false;
  let sceneHover = false;
  let target = null;
  let frame = 0;
  let previousTime = 0;

  function render(time) {
    const delta = Math.min((time - previousTime) || 16.7, 50);
    previousTime = time;
    const ease = reducedMotion.matches ? 1 : 1 - Math.exp(-delta / 70);
    ringX += (x - ringX) * ease;
    ringY += (y - ringY) * ease;
    dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
    const domHover = target instanceof Element && Boolean(target.closest('a, button, input, textarea, select, [role="button"], [data-cursor-hover]'));
    const canvasHover = target instanceof HTMLElement && target.style.cursor === 'pointer';
    cursor.classList.toggle('is-hovering', sceneHover || domHover || canvasHover || document.body.style.cursor === 'pointer');
    if (visible) frame = requestAnimationFrame(render);
  }

  function move(event) {
    if (event.pointerType === 'touch' || !media.matches) {
      hide();
      return;
    }
    x = event.clientX;
    y = event.clientY;
    target = event.target;
    if (!visible) {
      ringX = x;
      ringY = y;
      visible = true;
      cursor.classList.add('is-visible');
      document.documentElement.classList.add('chairs-cursor-active');
      previousTime = 0;
      frame = requestAnimationFrame(render);
    }
  }

  function pointerDown(event) {
    if (event.pointerType === 'touch') hide();
  }

  function hide() {
    visible = false;
    sceneHover = false;
    target = null;
    cursor.classList.remove('is-visible', 'is-hovering');
    document.documentElement.classList.remove('chairs-cursor-active');
    cancelAnimationFrame(frame);
  }

  function hover(event) {
    sceneHover = Boolean(event.detail);
  }

  function visibility() {
    if (document.hidden) hide();
  }

  function pointerOut(event) {
    if (!event.relatedTarget) hide();
  }

  window.addEventListener('pointermove', move, { passive: true });
  window.addEventListener('pointerdown', pointerDown, { passive: true });
  window.addEventListener('blur', hide);
  window.addEventListener('chairs:cursor-hover', hover);
  document.addEventListener('pointerout', pointerOut);
  document.addEventListener('visibilitychange', visibility);
  media.addEventListener('change', hide);

  window.chairsCursor = {
    destroy() {
      hide();
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', pointerDown);
      window.removeEventListener('blur', hide);
      window.removeEventListener('chairs:cursor-hover', hover);
      document.removeEventListener('pointerout', pointerOut);
      document.removeEventListener('visibilitychange', visibility);
      media.removeEventListener('change', hide);
      cursor.remove();
      delete window.chairsCursor;
    }
  };
})();
