(() => {
  const form = document.getElementById('chairs-location-form');
  const input = document.getElementById('chairs-location-input');
  const submit = document.getElementById('chairs-location-submit');
  const status = document.getElementById('chairs-location-status');
  const results = document.getElementById('chairs-location-results');
  const address = document.getElementById('chairs-location-address');
  const close = document.getElementById('chairs-location-close');
  const mapElement = document.getElementById('chairs-location-map');
  const streetElement = document.getElementById('chairs-location-streetview');
  const streetStatus = document.getElementById('chairs-location-street-status');
  const tabs = Array.from(document.querySelectorAll('[data-location-view]'));
  if (!form || !input || !submit || !status || !results || !address || !close || !mapElement || !streetElement || !streetStatus) return;

  let loaderPromise = null;
  let rejectLoader = null;
  let servicesPromise = null;
  let services = null;
  let map = null;
  let panorama = null;
  let queryVersion = 0;
  let streetVersion = 0;
  let authenticationFailed = false;
  const places = [];
  const previousAuthFailure = window.gm_authFailure;

  const connectionError = code => Object.assign(new Error(code), { code });
  const setStatus = (message, error = false) => {
    status.textContent = message;
    status.dataset.state = error ? 'error' : 'ready';
  };
  const setBusy = busy => {
    form.setAttribute('aria-busy', String(busy));
    submit.disabled = busy;
  };
  const streetMessage = (message, state) => {
    streetStatus.textContent = message;
    streetStatus.hidden = false;
    streetElement.dataset.state = state;
    streetElement.setAttribute('aria-busy', String(state === 'loading'));
    if (panorama) panorama.setVisible(false);
    if (state === 'empty') setStatus('No nearby Street View. Pin saved.');
    if (state === 'error') setStatus('Street View unavailable. Retry the pin.', true);
  };
  const timed = (promise, milliseconds, code) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(connectionError(code)), milliseconds);
    Promise.resolve(promise).then(value => {
      clearTimeout(timer);
      resolve(value);
    }, error => {
      clearTimeout(timer);
      reject(error);
    });
  });

  window.gm_authFailure = () => {
    authenticationFailed = true;
    servicesPromise = null;
    queryVersion++;
    streetVersion++;
    if (rejectLoader) rejectLoader(connectionError('MAPS_AUTH'));
    setBusy(false);
    setStatus('Google Maps could not connect. Please try again later.', true);
    if (!results.hidden) {
      results.hidden = true;
      document.body.classList.remove('chairs-map-open');
      if (panorama) panorama.setVisible(false);
      window.wakeSketch?.();
    }
    if (typeof previousAuthFailure === 'function') previousAuthFailure();
  };

  const loadGoogleMaps = () => {
    const apiKey = String(window.chairsMapsConfig?.apiKey || '').trim();
    if (!apiKey) return Promise.reject(connectionError('MAPS_NOT_CONFIGURED'));
    if (authenticationFailed) return Promise.reject(connectionError('MAPS_AUTH'));
    if (window.google?.maps?.importLibrary) return Promise.resolve();
    if (loaderPromise) return loaderPromise;
    loaderPromise = new Promise((resolve, reject) => {
      const callbackName = '__chairsMapsReady';
      const script = document.createElement('script');
      let settled = false;
      let timer = 0;
      const finish = error => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        script.onerror = null;
        if (window[callbackName] === ready) delete window[callbackName];
        rejectLoader = null;
        if (error) {
          script.remove();
          loaderPromise = null;
          reject(error);
        } else {
          resolve();
        }
      };
      const ready = () => {
        if (!window.google?.maps?.importLibrary) finish(connectionError('MAPS_NETWORK'));
        else finish();
      };
      rejectLoader = finish;
      window[callbackName] = ready;
      const url = new URL('https://maps.googleapis.com/maps/api/js');
      url.searchParams.set('key', apiKey);
      url.searchParams.set('loading', 'async');
      url.searchParams.set('v', 'weekly');
      url.searchParams.set('auth_referrer_policy', 'origin');
      url.searchParams.set('callback', callbackName);
      script.src = url.href;
      script.async = true;
      script.onerror = () => finish(connectionError('MAPS_NETWORK'));
      timer = setTimeout(() => finish(connectionError('MAPS_TIMEOUT')), 20000);
      document.head.append(script);
    });
    return loaderPromise;
  };

  const getServices = () => {
    if (servicesPromise) return servicesPromise;
    servicesPromise = loadGoogleMaps().then(async () => {
      const [maps, marker, geocoding, streetView] = await timed(Promise.all([
        google.maps.importLibrary('maps'),
        google.maps.importLibrary('marker'),
        google.maps.importLibrary('geocoding'),
        google.maps.importLibrary('streetView')
      ]), 20000, 'MAPS_TIMEOUT');
      services = {
        ...maps,
        ...marker,
        ...streetView,
        geocoder: new geocoding.Geocoder(),
        streetService: new streetView.StreetViewService()
      };
      return services;
    }).catch(error => {
      servicesPromise = null;
      throw error;
    });
    return servicesPromise;
  };

  const resizeViews = () => {
    requestAnimationFrame(() => {
      if (results.hidden || !window.google?.maps?.event) return;
      if (map) google.maps.event.trigger(map, 'resize');
      if (panorama) google.maps.event.trigger(panorama, 'resize');
    });
  };
  const showView = view => {
    results.dataset.view = view;
    tabs.forEach(tab => {
      const selected = tab.dataset.locationView === view;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    resizeViews();
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => showView(tab.dataset.locationView));
    tab.addEventListener('keydown', event => {
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      tabs[next].focus();
      showView(tabs[next].dataset.locationView);
    });
  });

  const selectPlace = async place => {
    const version = ++streetVersion;
    address.textContent = place.address;
    if (map) map.panTo(place.position);
    streetMessage('Looking for Street View nearby…', 'loading');
    try {
      const response = await timed(services.streetService.getPanorama({
        location: place.position,
        radius: 100,
        sources: [services.StreetViewSource.GOOGLE, services.StreetViewSource.OUTDOOR],
        preference: services.StreetViewPreference.NEAREST
      }), 15000, 'STREET_TIMEOUT');
      if (version !== streetVersion || results.hidden) return;
      const location = response?.data?.location;
      if (!location?.pano) {
        streetMessage('No Street View is available near this location.', 'empty');
        showView('map');
        return;
      }
      if (!panorama) {
        panorama = new services.StreetViewPanorama(streetElement, {
          pano: location.pano,
          visible: true,
          motionTracking: false,
          motionTrackingControl: false,
          addressControl: true,
          enableCloseButton: false
        });
      } else {
        panorama.setPano(location.pano);
        panorama.setVisible(true);
      }
      streetStatus.hidden = true;
      streetElement.dataset.state = 'ready';
      streetElement.setAttribute('aria-busy', 'false');
      showView('streetview');
    } catch (error) {
      if (version !== streetVersion || results.hidden) return;
      const code = String(error?.code || error?.message || error);
      if (code.includes('ZERO_RESULTS')) streetMessage('No Street View is available near this location.', 'empty');
      else streetMessage('Street View could not load. Select this pin again to retry.', 'error');
      showView('map');
    }
  };

  const reveal = () => {
    const wasHidden = results.hidden;
    results.hidden = false;
    document.body.classList.add('chairs-map-open');
    window.noLoop?.();
    if (wasHidden) showView('map');
    resizeViews();
  };
  const fitPlaces = () => {
    if (places.length === 1) {
      map.setCenter(places[0].position);
      map.setZoom(17);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    places.forEach(place => bounds.extend(place.position));
    map.fitBounds(bounds, 48);
  };
  const submitError = error => {
    const code = String(error?.code || error?.message || error);
    if (code.includes('MAPS_NOT_CONFIGURED')) return 'The map is not connected yet. Please try again soon.';
    if (code.includes('MAPS_AUTH') || code.includes('REQUEST_DENIED') || code.includes('OVER_QUERY_LIMIT')) return 'Google Maps is unavailable right now. Please try again later.';
    if (code.includes('ZERO_RESULTS') || code.includes('INVALID_REQUEST') || code.includes('LOCATION_NOT_FOUND')) return 'That place could not be found. Try a full street address and city.';
    return 'The location could not load. Check your connection and try again.';
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const version = ++queryVersion;
    const value = input.value.trim();
    if (!value) {
      setBusy(false);
      setStatus('Enter a place or street address first.', true);
      input.focus();
      return;
    }
    setBusy(true);
    setStatus('Finding your place…');
    try {
      const api = await getServices();
      if (version !== queryVersion) return;
      const response = await timed(api.geocoder.geocode({ address: value }), 15000, 'GEOCODING_TIMEOUT');
      if (version !== queryVersion) return;
      const result = response.results?.[0];
      const location = result?.geometry?.location;
      const latitude = typeof location?.lat === 'function' ? location.lat() : location?.lat;
      const longitude = typeof location?.lng === 'function' ? location.lng() : location?.lng;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) throw connectionError('LOCATION_NOT_FOUND');
      const position = { lat: latitude, lng: longitude };
      let place = places.find(item => (result.place_id && item.id === result.place_id) || (Math.abs(item.position.lat - latitude) < 0.0000001 && Math.abs(item.position.lng - longitude) < 0.0000001));
      const added = !place;
      reveal();
      if (!map) {
        map = new api.Map(mapElement, {
          center: position,
          zoom: 17,
          mapId: String(window.chairsMapsConfig?.mapId || 'DEMO_MAP_ID'),
          streetViewControl: false,
          mapTypeControl: false
        });
      }
      if (!place) {
        place = { id: result.place_id || '', address: result.formatted_address || value, position };
        place.marker = new api.AdvancedMarkerElement({ map, position, title: place.address, gmpClickable: true });
        place.marker.addEventListener('gmp-click', () => {
          queryVersion++;
          setBusy(false);
          reveal();
          setStatus('Pin selected.');
          void selectPlace(place);
        });
        places.push(place);
      }
      void selectPlace(place);
      if (added) fitPlaces();
      setStatus(`${added ? 'Pin added' : 'Pin selected'}. ${places.length} ${places.length === 1 ? 'place' : 'places'} on the map.`);
    } catch (error) {
      if (version === queryVersion) {
        setStatus(submitError(error), true);
        if (!places.length && !results.hidden) {
          results.hidden = true;
          document.body.classList.remove('chairs-map-open');
          window.wakeSketch?.();
        }
      }
    } finally {
      if (version === queryVersion) setBusy(false);
    }
  });

  close.addEventListener('click', () => {
    queryVersion++;
    streetVersion++;
    setBusy(false);
    results.hidden = true;
    document.body.classList.remove('chairs-map-open');
    if (panorama) panorama.setVisible(false);
    window.wakeSketch?.();
    setStatus(places.length ? 'Your pins stay on this page. Enter another place to reopen the map.' : '');
    input.focus();
  });

  showView('map');
})();
