(() => {
  const base = new URL('.', document.currentScript.src);
  if (location.pathname === base.pathname || location.pathname === new URL('index.html', base).pathname || location.pathname === new URL('collection.html', base).pathname) return;
  if (document.body.classList.contains('chairs-about-page') || document.body.classList.contains('chairs-location-page') || document.querySelector('.chairs-about-button')) return;

  const link = document.createElement('a');
  link.className = 'chairs-about-button';
  link.href = new URL('about.html', document.currentScript.src).href;
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = 'About';
  link.setAttribute('aria-label', 'About (opens in a new tab)');

  document.body.classList.add('chairs-has-about');
  document.body.append(link);
})();
