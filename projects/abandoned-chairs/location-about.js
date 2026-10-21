(() => {
  const trigger = document.getElementById('chairs-location-about-trigger');
  const panel = document.getElementById('chairs-location-about');
  const close = document.getElementById('chairs-location-about-close');
  if (!trigger || !panel || !close) return;
  let closeTimer = 0;

  const closePanel = () => {
    if (!panel.open || panel.classList.contains('is-closing')) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      panel.close();
      return;
    }
    panel.classList.add('is-closing');
    closeTimer = setTimeout(() => {
      if (panel.open) panel.close();
    }, 300);
  };

  trigger.addEventListener('click', () => {
    if (panel.open) return;
    const cursor = document.querySelector('.chairs-cursor');
    if (cursor) panel.append(cursor);
    document.body.classList.add('chairs-page-info-open');
    panel.showModal();
    panel.scrollTop = 0;
    window.noLoop?.();
  });
  close.addEventListener('click', closePanel);
  panel.addEventListener('cancel', event => {
    event.preventDefault();
    closePanel();
  });
  panel.addEventListener('click', event => {
    if (event.target !== panel) return;
    const bounds = panel.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closePanel();
  });
  panel.addEventListener('animationend', event => {
    if (event.target === panel && event.animationName === 'chairs-location-about-out') panel.close();
  });
  panel.addEventListener('close', () => {
    clearTimeout(closeTimer);
    panel.classList.remove('is-closing');
    document.body.classList.remove('chairs-page-info-open');
    const cursor = panel.querySelector('.chairs-cursor');
    if (cursor) document.body.append(cursor);
    window.wakeSketch?.();
  });
})();
