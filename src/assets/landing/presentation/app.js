const DEFAULT_LANGUAGE = 'en';
const SUPPORTED_LANGUAGES = ['ru', 'en', 'es', 'et', 'hy'];
const LANGUAGE_STORAGE_KEY = 'e-stream-pitch-language';
const APP_BASE_URL = new URL('.', document.currentScript?.src || window.location.href).href;
const IS_EMBEDDED = window.parent !== window && new URLSearchParams(window.location.search).get('embed') === '1';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const SWIPE_THRESHOLD_PX = 44;
const SWIPE_AXIS_RATIO = 1.15;
const pageVisualViewport = getPageVisualViewport();

const refs = {
  app: document.getElementById('app'),
  languageSelect: document.getElementById('languageSelect'),
  languageLabel: document.getElementById('languageLabel'),
  screenUp: document.getElementById('screenUp'),
  screenDown: document.getElementById('screenDown'),
  screenUpLabel: document.getElementById('screenUpLabel'),
  screenDownLabel: document.getElementById('screenDownLabel'),
};

const state = {
  language: DEFAULT_LANGUAGE,
  documents: {},
  currentIndex: 0,
  screenCount: 0,
  wheelLocked: false,
  lastWheelDirection: 0,
  wheelTimer: 0,
  touchActive: false,
  touchStartX: 0,
  touchStartY: 0,
  touchLastX: 0,
  touchLastY: 0,
  viewportWidth: 0,
  viewportHeight: 0,
  viewportResizeTimer: 0,
};

void init();

async function init() {
  syncViewportHeight();
  state.language = detectLanguage();
  if (IS_EMBEDDED) {
    document.querySelector('.topbar')?.setAttribute('hidden', '');
  } else {
    syncLanguageRoute(state.language);
  }

  try {
    state.documents = await loadDocuments();
    render();
    attachEvents();
    notifyHost('ready');
  } catch (error) {
    console.error(error);
    renderError();
    notifyHost('error');
  }
}

function notifyHost(action) {
  if (IS_EMBEDDED) {
    window.parent.postMessage({ type: 'e-stream-presentation', action, language: state.language }, window.location.origin);
  }
}

function detectLanguage() {
  const explicitLanguage = getExplicitLanguageFromUrl();
  if (IS_EMBEDDED) {
    return isSupportedLanguage(explicitLanguage) ? explicitLanguage : DEFAULT_LANGUAGE;
  }

  if (isSupportedLanguage(explicitLanguage)) {
    writeStoredLanguage(explicitLanguage);
    return explicitLanguage;
  }

  const storedLanguage = readStoredLanguage();
  if (isSupportedLanguage(storedLanguage)) {
    return storedLanguage;
  }

  return DEFAULT_LANGUAGE;
}

function getExplicitLanguageFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const queryLanguage = params.get('lang');
  const hashLanguage = window.location.hash.replace(/^#\/?/, '').split('/')[0];
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  const routeLanguage = SUPPORTED_LANGUAGES.find(language => pathSegments.includes(language));

  return queryLanguage || hashLanguage || routeLanguage;
}

function isSupportedLanguage(language) {
  return Boolean(language && SUPPORTED_LANGUAGES.includes(language));
}

function readStoredLanguage() {
  try {
    return window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredLanguage(language) {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // The app can still work if storage is unavailable.
  }
}

function syncLanguageRoute(language) {
  if (!window.history?.replaceState) {
    return;
  }

  const url = new URL(window.location.href);
  const basePath = new URL(APP_BASE_URL).pathname.replace(/\/+$/, '');
  url.pathname = `${basePath}/${language}`;

  url.searchParams.delete('lang');

  const hashLanguage = url.hash.replace(/^#\/?/, '').split('/')[0];
  if (isSupportedLanguage(hashLanguage)) {
    url.hash = '';
  }

  window.history.replaceState({ language }, '', `${url.pathname}${url.search}${url.hash}`);
}

async function loadDocuments() {
  const documents = {};
  const languages = IS_EMBEDDED ? [state.language] : SUPPORTED_LANGUAGES;

  for (const language of languages) {
    const response = await fetch(new URL(`content/${language}.json`, APP_BASE_URL), { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`Failed to load content/${language}.json`);
    }

    documents[language] = await response.json();
  }

  return documents;
}

function render(options = {}) {
  const suppressCurrentAnimation = Boolean(options.suppressCurrentAnimation);
  const content = state.documents[state.language] || state.documents[DEFAULT_LANGUAGE];

  if (!content || !refs.app) {
    return;
  }

  document.documentElement.lang = content.locale || state.language;
  document.querySelector('.topbar')?.setAttribute('aria-label', content.ui?.languageLabel || 'Language');
  document.querySelector('.screen-nav')?.setAttribute('aria-label', content.ui?.screenNavigation || 'Screen navigation');
  document.title = content.meta?.title || 'E-stream';

  if (refs.languageLabel) {
    refs.languageLabel.textContent = content.ui?.languageLabel || 'Language';
  }

  if (refs.screenUpLabel) {
    refs.screenUpLabel.textContent = content.ui?.previousScreen || 'Previous screen';
  }

  if (refs.screenDownLabel) {
    refs.screenDownLabel.textContent = content.ui?.nextScreen || 'Next screen';
  }

  if (refs.languageSelect) {
    refs.languageSelect.innerHTML = (content.locales || [])
      .map(locale => `<option value="${escapeAttribute(locale.code)}">${escapeHtml(locale.label)}</option>`)
      .join('');
    refs.languageSelect.value = state.language;
  }

  const sourceScreens = content.screens?.length ? content.screens : [content.hero, content.hero, content.hero];
  const activeScreens = sourceScreens.filter(screen => !screen?.disabled);
  const screens = activeScreens.length ? activeScreens : sourceScreens;
  state.screenCount = screens.length;
  state.currentIndex = clamp(state.currentIndex, 0, Math.max(state.screenCount - 1, 0));
  refs.app.innerHTML = `
    <div class="screen-track" style="transform: translate3d(0, -${state.currentIndex * state.viewportHeight}px, 0);">
      ${screens.map((screen, index) => renderScreen(screen, index, suppressCurrentAnimation && index === state.currentIndex)).join('')}
    </div>
  `;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      updateCurrentScreenClass();
      fitArmenianRecipientText();
    });
    document.fonts?.ready.then(fitArmenianRecipientText);
  });
  updateNavigationState();
}

function fitArmenianRecipientText() {
  if (state.language !== 'hy') return;
  refs.app.querySelectorAll('.hand-signal-scene__recipient').forEach(node => {
    const card = node.querySelector('rect');
    if (!card) return;
    node.querySelectorAll('text').forEach(text => {
      const available = Number(card.getAttribute('width')) - Number(text.getAttribute('x')) - 20;
      if (available > 0 && text.getComputedTextLength() > available) {
        text.setAttribute('textLength', String(available));
        text.setAttribute('lengthAdjust', 'spacingAndGlyphs');
      }
    });
  });
}

function renderScreen(screen, index, suppressAnimation = false) {
  const headingId = `screenTitle-${index}`;
  const suppressClass = suppressAnimation ? ' is-animation-suppressed' : '';

  if (screen.signalScene) {
    return `
      <section class="screen-panel screen-panel--scene screen-panel--signal${suppressClass}" data-screen-index="${index}" aria-labelledby="${headingId}">
        ${renderSignalScene(screen.signalScene, headingId)}
      </section>
    `;
  }

  if (screen.handSignalScene) {
    return `
      <section class="screen-panel screen-panel--scene" data-screen-index="${index}" aria-labelledby="${headingId}">
        ${renderHandSignalScene(screen.handSignalScene, headingId)}
      </section>
    `;
  }

  if (screen.evidenceScene) {
    return `
      <section class="screen-panel screen-panel--scene screen-panel--evidence" data-screen-index="${index}" aria-labelledby="${headingId}">
        ${renderEvidenceScene(screen.evidenceScene, headingId)}
      </section>
    `;
  }

  if (screen.operatorScene) {
    return `
      <section class="screen-panel screen-panel--scene screen-panel--operator" data-screen-index="${index}" aria-labelledby="${headingId}">
        ${renderOperatorScene(screen.operatorScene, headingId)}
      </section>
    `;
  }

  if (screen.rightsScene) {
    return `
      <section class="screen-panel screen-panel--scene screen-panel--rights" data-screen-index="${index}" aria-labelledby="${headingId}">
        ${renderRightsScene(screen.rightsScene, headingId)}
      </section>
    `;
  }

  if (screen.trustScene) {
    return `
      <section class="screen-panel screen-panel--scene screen-panel--trust" data-screen-index="${index}" aria-labelledby="${headingId}">
        ${renderTrustScene(screen.trustScene, headingId)}
      </section>
    `;
  }

  if (screen.futureScene) {
    return `
      <section class="screen-panel screen-panel--scene screen-panel--future" data-screen-index="${index}" aria-labelledby="${headingId}">
        ${renderFutureScene(screen.futureScene, headingId)}
      </section>
    `;
  }

  if (screen.finalScene) {
    return `
      <section class="screen-panel screen-panel--scene screen-panel--final" data-screen-index="${index}" aria-labelledby="${headingId}">
        ${renderFinalScene(screen.finalScene, headingId)}
      </section>
    `;
  }

  if (screen.staticHandScene) {
    return `
      <section class="screen-panel screen-panel--scene" data-screen-index="${index}" aria-labelledby="${headingId}">
        ${renderStaticHandScene(screen.staticHandScene, headingId)}
      </section>
    `;
  }

  const hero = screen.hero || screen;
  return `
    <section class="screen-panel" data-screen-index="${index}" aria-labelledby="${headingId}">
      ${renderHero(hero, headingId, index)}
    </section>
  `;
}

function renderHero(hero, headingId, index) {
  const keywords = (hero.keywords || [])
    .map(keyword => `<span class="hero__keyword">${escapeHtml(keyword)}</span>`)
    .join('');
  const keywordsVariantClass = (hero.keywords || []).length === 1 ? ' hero__keywords--statement' : '';
  const logo = hero.logoSrc
    ? renderHeroImageLogo(hero.logoSrc, hero.logoAlt, index)
    : renderHeroLogo(hero.logoAlt, `heroLogoTitle-${index}`, index);
  const logoVariantClass = hero.logoSrc ? ' hero__logo--new' : '';

  return `
    <div class="hero">
      <div class="hero__logo${logoVariantClass}">
        ${logo}
        <span class="hero__logo-shine" aria-hidden="true"></span>
      </div>
      <div class="hero__copy">
        <h1 class="hero__brand" id="${headingId}">${escapeHtml(hero.brand)}</h1>
        <p class="hero__keywords${keywordsVariantClass}" aria-label="${escapeAttribute(hero.keywordsLabel)}">${keywords}</p>
        ${hero.description ? `<p class="hero__description">${escapeHtml(hero.description)}</p>` : ''}
      </div>
    </div>
  `;
}

function renderHeroImageLogo(src, alt, index) {
  const logoPath = src.split(/[?#]/, 1)[0];

  if (!logoPath.endsWith('e-stream-logotype.svg')) {
    return `<img class="hero-logo hero-logo--image" src="${escapeAttribute(src)}" alt="${escapeAttribute(alt || 'E-stream')}" />`;
  }

  const titleId = `heroNewLogoTitle-${index}`;

  return `
    <svg class="hero-logo hero-new-logo" viewBox="0 0 47.892151 45.393356" role="img" aria-labelledby="${titleId}" focusable="false">
      <title id="${titleId}">${escapeHtml(alt || 'E-stream')}</title>
      <g transform="translate(-89.95833 -84.931249)">
        <g class="hero-new-logo__mark">
          <path
            class="hero-new-logo__shield"
            d="m 113.15629,84.93125 c -6.6172,5.731796 -15.908589,6.088756 -23.197957,3.542636 1.976085,15.369464 0.05211,31.571274 23.197957,41.850714 8.0269,-3.36954 12.95108,-7.43514 16.06071,-11.95668 l -1.45173,-0.648 c -0.38457,-0.17183 -2.332,-1.24719 -2.57089,-1.83278 -1.33552,-3.27381 -1.75407,-7.5924 -0.4437,-12.88272 0.24082,-0.97126 1.70241,-2.15753 3.5309,-3.078444 l 5.40469,-2.72195 c 0.67138,-0.33817 1.12097,-0.59762 1.48504,-0.81717 0.25237,-2.62397 0.51551,-5.26367 0.93837,-7.91297 -7.89562,2.59641 -16.16153,1.84889 -22.95339,-3.542636 z m -18.663214,6.220096 c 0.485384,-3e-4 1.049495,0.006 1.703432,0.006 h 19.207612 c 3.74952,0 6.76796,3.55119 6.76796,7.96214 v 0.43434 h 1.22167 c 0.56944,0 1.19811,0.42974 1.02798,0.912004 -1.84469,5.22866 -2.3909,10.60099 0,16.52428 0.192,0.47574 -0.45854,0.912 -1.02798,0.912 h -1.22167 v 1.25854 c 0,4.41094 -3.01912,8.02839 -6.76796,7.96155 l -4.71043,-0.0837 c -4.19855,-0.0749 -12.17221,-8.08543 -14.852413,-13.66419 -1.798243,-3.7429 -3.078592,-11.32899 -3.771609,-17.432774 -0.510531,-4.49725 -0.973486,-4.78728 2.423408,-4.78946 z" />
          <path
            class="hero-new-logo__core"
            d="m 103.49686,96.954196 c -1.58506,0 -2.86076,1.49325 -2.86076,3.348294 v 15.72175 c 0,1.85499 1.2757,3.34829 2.86076,3.34829 0.094,0 0.18725,-0.006 0.27911,-0.0164 0.0906,0.0113 0.1809,0.017 0.27345,0.017 h 13.11386 c 1.44992,0 2.61722,-1.36615 2.61722,-3.06321 0,-1.69704 -1.1673,-3.06322 -2.61722,-3.06322 h -10.8052 v -2.28468 h 11.01714 c 1.33857,0 2.41639,-1.26139 2.41639,-2.8279 0,-1.56654 -1.07782,-2.8279 -2.41639,-2.8279 h -11.01714 v -2.22439 h 10.78243 c 1.44992,0 2.61779,-1.36614 2.61779,-3.06322 0,-1.697034 -1.16787,-3.063224 -2.61779,-3.063224 h -13.02086 c -0.10081,0 -0.20038,0.008 -0.29859,0.0211 -0.10648,-0.0139 -0.21443,-0.0222 -0.3242,-0.0222 z m 13.02789,1.48097 a 1.6194812,1.6194811 0 0 1 1.61904,1.619714 1.6194812,1.6194811 0 0 1 -1.61904,1.61912 1.6194812,1.6194811 0 0 1 -1.61972,-1.61912 1.6194812,1.6194811 0 0 1 1.61972,-1.619714 z" />
          <path
            class="hero-new-logo__signal"
            d="m 134.19589,97.136716 a 3.654623,11.247201 0 0 0 -3.65459,11.247204 3.654623,11.247201 0 0 0 3.65459,11.24722 3.654623,11.247201 0 0 0 3.6546,-11.24722 3.654623,11.247201 0 0 0 -3.6546,-11.247204 z m -1.02242,4.747424 c 0.39295,0 0.71058,0.27139 0.95695,0.64245 0.24626,0.37103 0.44857,0.87325 0.61984,1.48253 0.34198,1.21856 0.54825,2.86983 0.54825,4.69481 0,1.82498 -0.20627,3.47807 -0.54825,4.69664 -0.17127,0.60927 -0.37358,1.10905 -0.61984,1.48008 -0.24637,0.37104 -0.564,0.64246 -0.95695,0.64246 -0.39306,0 -0.70774,-0.27142 -0.954,-0.64246 -0.24637,-0.37103 -0.44914,-0.87081 -0.62041,-1.48008 -0.34209,-1.21857 -0.54825,-2.87166 -0.54825,-4.69664 0,-1.82498 0.20616,-3.47625 0.54825,-4.69481 0.17127,-0.60928 0.37404,-1.1115 0.62041,-1.48253 0.24626,-0.37106 0.56094,-0.64245 0.954,-0.64245 z m 0,0.58127 c -0.11395,0 -0.27831,0.0939 -0.47054,0.38364 -0.19246,0.28972 -0.38378,0.74509 -0.54452,1.31733 -0.32147,1.14445 -0.52627,2.75669 -0.52627,4.53755 0,1.78085 0.2048,3.39492 0.52627,4.53939 0.16074,0.57223 0.35206,1.02576 0.54452,1.31549 0.19223,0.28973 0.35693,0.38303 0.47054,0.38303 0.11407,0 0.28127,-0.0933 0.47361,-0.38303 0.19222,-0.28973 0.38377,-0.74326 0.54451,-1.31549 0.32136,-1.14447 0.5256,-2.75854 0.5256,-4.53939 0,-1.78086 -0.20424,-3.3931 -0.5256,-4.53755 -0.16074,-0.57224 -0.35229,-1.02761 -0.54451,-1.31733 -0.19234,-0.28973 -0.35988,-0.38364 -0.47361,-0.38364 z" />
          <circle class="hero-new-logo__dot-ring" cx="116.51852" cy="100.07845" r="1.1016234" />
          <circle class="hero-new-logo__dot" cx="116.51852" cy="100.07845" r="1.1016234" />
        </g>
      </g>
    </svg>
  `;
}

function renderHeroLogo(logoAlt, titleId, index) {
  const clipId = `heroLogoClip-${index}`;

  return `
    <svg class="hero-logo" viewBox="0 0 54.329498 52.922871" role="img" aria-labelledby="${titleId}" focusable="false">
      <title id="${titleId}">${escapeHtml(logoAlt)}</title>
      <defs>
        <clipPath id="${clipId}">
          <path d="m 105.88966,123.29583 c -7.79002,6.68247 -18.72738,7.0989 -27.30841,4.1305 2.32622,17.9187 0.0609,36.80791 27.30841,48.79237 27.86849,-11.58612 24.02754,-30.21766 27.02109,-48.79237 -9.29465,3.02706 -19.02607,2.15529 -27.02109,-4.1305 z m -0.0129,6.93136 a 31.200721,49.046158 0.82754313 0 1 24.02644,18.04954 h 0.003 a 49.046158,31.200721 89.172454 0 1 -24.02799,18.05213 49.046158,31.200721 89.172454 0 1 -24.33805,-18.05161 h -5.2e-4 a 31.200721,49.046158 0.82754313 0 1 24.33753,-18.05006 z m 24.02644,18.04954 h -7.44192 a 16.744436,16.744436 0 0 0 0.003,-0.0382 16.744436,16.744436 0 0 0 -16.74419,-16.74471 16.744436,16.744436 0 0 0 -16.7442,16.74471 16.744436,16.744436 0 0 0 0.003,0.0388 16.744436,16.744436 0 0 0 16.74162,16.70544 16.744436,16.744436 0 0 0 16.74161,-16.70544 h 7.44244 a 31.200721,49.046158 0.82754313 0 0 -5.2e-4,-5.2e-4 z M 97.56718,136.86916 c 0.13096,0 0.25949,0.009 0.38654,0.0233 0.1174,-0.0133 0.23603,-0.0217 0.35709,-0.0217 h 15.55668 c 1.73247,0 3.12746,1.39448 3.12746,3.12694 0,1.73249 -1.39499,3.12746 -3.12746,3.12746 h -12.88191 v 2.27066 h 13.16354 c 1.5973,0 2.88304,1.28442 2.88613,2.88096 l -22.88646,5.2e-4 h 22.88646 c 10e-6,0.002 5.2e-4,0.003 5.2e-4,0.005 0,1.59922 -1.28743,2.88664 -2.88665,2.88664 h -13.16354 v 2.33268 h 12.91033 c 1.73248,0 3.12746,1.395 3.12746,3.12746 0,1.73245 -1.39498,3.12694 -3.12746,3.12694 H 98.22864 c -0.11097,0 -0.22022,-0.006 -0.32815,-0.0171 -0.10974,0.0105 -0.22071,0.0165 -0.33331,0.0165 -1.89372,0 -3.41839,-1.52467 -3.41839,-3.4184 v -8.05997 -7.98969 c 0,-1.89372 1.52467,-3.4184 3.41839,-3.4184 z" />
        </clipPath>
        <filter id="heroLogoGlow-${index}" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.6" flood-color="#003366" flood-opacity="0.16" />
        </filter>
      </defs>
      <g transform="translate(-78.58125 -123.29583)">
        <g class="hero-logo__mark">
          <path
            class="hero-logo__crest"
            d="m 105.88966,123.29583 c -7.79002,6.68247 -18.72738,7.0989 -27.30841,4.1305 2.32622,17.9187 0.0609,36.80791 27.30841,48.79237 27.86849,-11.58612 24.02754,-30.21766 27.02109,-48.79237 -9.29465,3.02706 -19.02607,2.15529 -27.02109,-4.1305 z m -0.0129,6.93136 a 31.200721,49.046158 0.82754313 0 1 24.02644,18.04954 h 0.003 a 49.046158,31.200721 89.172454 0 1 -24.02799,18.05213 49.046158,31.200721 89.172454 0 1 -24.33805,-18.05161 h -5.2e-4 a 31.200721,49.046158 0.82754313 0 1 24.33753,-18.05006 z m 24.02644,18.04954 h -7.44192 a 16.744436,16.744436 0 0 0 0.003,-0.0382 16.744436,16.744436 0 0 0 -16.74419,-16.74471 16.744436,16.744436 0 0 0 -16.7442,16.74471 16.744436,16.744436 0 0 0 0.003,0.0388 16.744436,16.744436 0 0 0 16.74162,16.70544 16.744436,16.744436 0 0 0 16.74161,-16.70544 h 7.44244 a 31.200721,49.046158 0.82754313 0 0 -5.2e-4,-5.2e-4 z M 97.56718,136.86916 c 0.13096,0 0.25949,0.009 0.38654,0.0233 0.1174,-0.0133 0.23603,-0.0217 0.35709,-0.0217 h 15.55668 c 1.73247,0 3.12746,1.39448 3.12746,3.12694 0,1.73249 -1.39499,3.12746 -3.12746,3.12746 h -12.88191 v 2.27066 h 13.16354 c 1.5973,0 2.88304,1.28442 2.88613,2.88096 l -22.88646,5.2e-4 h 22.88646 c 10e-6,0.002 5.2e-4,0.003 5.2e-4,0.005 0,1.59922 -1.28743,2.88664 -2.88665,2.88664 h -13.16354 v 2.33268 h 12.91033 c 1.73248,0 3.12746,1.395 3.12746,3.12746 0,1.73245 -1.39498,3.12694 -3.12746,3.12694 H 98.22864 c -0.11097,0 -0.22022,-0.006 -0.32815,-0.0171 -0.10974,0.0105 -0.22071,0.0165 -0.33331,0.0165 -1.89372,0 -3.41839,-1.52467 -3.41839,-3.4184 v -8.05997 -7.98969 c 0,-1.89372 1.52467,-3.4184 3.41839,-3.4184 z" />
          <circle class="hero-logo__dot-ring" cx="113.82999" cy="156.62251" r="2.8988869" />
          <circle class="hero-logo__dot" cx="113.82999" cy="156.62251" r="2.8988869" />
          <path class="hero-logo__trace hero-logo__trace--upper" pathLength="1" d="M81.53964 148.27725 A31.200721 49.046158 0.82754313 0 1 105.87717 130.22719 A31.200721 49.046158 0.82754313 0 1 129.90361 148.27673" />
          <path class="hero-logo__trace hero-logo__trace--lower" pathLength="1" d="M81.54016 148.27725 A49.046158 31.200721 89.172454 0 0 105.87821 166.32886 A49.046158 31.200721 89.172454 0 0 129.9062 148.27673" />
        </g>
      </g>
    </svg>
  `;
}

function renderSignalScene(scene, headingId) {
  const nodes = scene.nodes || {};

  return `
    <div class="signal-scene">
      <h2 class="sr-only" id="${headingId}">${escapeHtml(scene.ariaLabel || 'E-stream signal scene')}</h2>
      <svg class="signal-scene__svg" viewBox="0 0 1000 640" role="img" aria-labelledby="${headingId}" focusable="false">
        <defs>
          <linearGradient id="scenePhoneGlass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="100%" stop-color="#eef3f7" />
          </linearGradient>
          <linearGradient id="sceneInkFade" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#003366" stop-opacity="0.08" />
            <stop offset="45%" stop-color="#003366" stop-opacity="0.78" />
            <stop offset="100%" stop-color="#9a171b" stop-opacity="0.72" />
          </linearGradient>
          <filter id="sceneSoftShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#102030" flood-opacity="0.16" />
          </filter>
        </defs>

        <text class="signal-scene__title" x="500" y="18" text-anchor="middle">${escapeHtml(scene.title || '')}</text>

        <path id="signalTrustPath" class="signal-scene__line signal-scene__line--one" d="M500 320 C434 276 384 256 345 250" />
        <path id="signalRemotePath" class="signal-scene__line signal-scene__line--two" d="M500 320 C566 276 616 256 655 250" />
        <path id="signalGeoPath" class="signal-scene__line signal-scene__line--three" d="M500 320 C434 374 382 404 340 410" />
        <path id="signalProofPath" class="signal-scene__line signal-scene__line--four" d="M500 320 C566 374 618 404 660 410" />

        ${renderSignalPacket('signalTrustPath', 0)}
        ${renderSignalPacket('signalRemotePath', 0.35)}
        ${renderSignalPacket('signalGeoPath', 0.7)}
        ${renderSignalPacket('signalProofPath', 1.05)}

        ${renderSceneNode(nodes.trust, 'trust', 228, 198, 0)}
        ${renderSceneNode(nodes.remote, 'remote', 772, 198, 0.2)}
        ${renderSceneNode(nodes.geo, 'geo', 228, 472, 0.4)}
        ${renderSceneNode(nodes.proof, 'proof', 772, 472, 0.6)}

        <g class="signal-scene__phone" filter="url(#sceneSoftShadow)">
          <rect class="signal-scene__phone-body" x="396" y="118" width="208" height="404" rx="42" />
          <rect class="signal-scene__phone-screen" x="416" y="150" width="168" height="332" rx="28" />
          <rect class="signal-scene__camera" x="464" y="166" width="72" height="8" rx="4" />
          <image class="signal-scene__app-logo" href="assets/images/e-stream-logotype.svg" x="472" y="194" width="56" height="53" preserveAspectRatio="xMidYMid meet" aria-hidden="true" />
          ${scene.settingsIcon ? `
            <image class="signal-scene__settings-gear-art" href="${escapeAttribute(scene.settingsIcon)}" x="470" y="254" width="60" height="60" preserveAspectRatio="xMidYMid meet" aria-hidden="true" />
          ` : `
            <g class="signal-scene__settings-gear" transform="translate(500 284) scale(0.64)" aria-hidden="true">
              <circle class="signal-scene__settings-gear-ring" r="18" />
              <path class="signal-scene__settings-gear-tooth" d="M0 -29 L6 -27 L8 -21 L3 -18 H-3 L-8 -21 L-6 -27 Z" />
              <path class="signal-scene__settings-gear-tooth" d="M0 -29 L6 -27 L8 -21 L3 -18 H-3 L-8 -21 L-6 -27 Z" transform="rotate(45)" />
              <path class="signal-scene__settings-gear-tooth" d="M0 -29 L6 -27 L8 -21 L3 -18 H-3 L-8 -21 L-6 -27 Z" transform="rotate(90)" />
              <path class="signal-scene__settings-gear-tooth" d="M0 -29 L6 -27 L8 -21 L3 -18 H-3 L-8 -21 L-6 -27 Z" transform="rotate(135)" />
              <path class="signal-scene__settings-gear-tooth" d="M0 -29 L6 -27 L8 -21 L3 -18 H-3 L-8 -21 L-6 -27 Z" transform="rotate(180)" />
              <path class="signal-scene__settings-gear-tooth" d="M0 -29 L6 -27 L8 -21 L3 -18 H-3 L-8 -21 L-6 -27 Z" transform="rotate(225)" />
              <path class="signal-scene__settings-gear-tooth" d="M0 -29 L6 -27 L8 -21 L3 -18 H-3 L-8 -21 L-6 -27 Z" transform="rotate(270)" />
              <path class="signal-scene__settings-gear-tooth" d="M0 -29 L6 -27 L8 -21 L3 -18 H-3 L-8 -21 L-6 -27 Z" transform="rotate(315)" />
              <circle class="signal-scene__settings-gear-core" r="7" />
            </g>
          `}
          <g class="signal-scene__settings-list">
            <rect class="signal-scene__settings-row" x="444" y="316" width="112" height="22" rx="11" />
            <rect class="signal-scene__settings-line" x="456" y="324" width="52" height="6" rx="3" />
            <circle class="signal-scene__settings-toggle" cx="540" cy="327" r="8" />
            <rect class="signal-scene__settings-row" x="444" y="352" width="112" height="22" rx="11" />
            <rect class="signal-scene__settings-line" x="456" y="360" width="66" height="6" rx="3" />
            <circle class="signal-scene__settings-toggle signal-scene__settings-toggle--active" cx="540" cy="363" r="8" />
            <rect class="signal-scene__settings-row" x="444" y="388" width="112" height="22" rx="11" />
            <rect class="signal-scene__settings-line" x="456" y="396" width="46" height="6" rx="3" />
            <circle class="signal-scene__settings-toggle" cx="540" cy="399" r="8" />
            <rect class="signal-scene__settings-row signal-scene__settings-row--soft" x="456" y="426" width="88" height="10" rx="5" />
          </g>
        </g>
      </svg>
    </div>
  `;
}

function renderEvidenceScene(scene, headingId) {
  const cardGradientId = `${headingId}-evidenceCard`;
  const connectorGradientId = `${headingId}-evidenceConnector`;
  const connectorA = `${headingId}-evidenceConnectorA`;
  const connectorB = `${headingId}-evidenceConnectorB`;
  const connectorC = `${headingId}-evidenceConnectorC`;
  const connectorD = `${headingId}-evidenceConnectorD`;
  const steps = scene.steps || [];
  const positions = [
    { x: 42, y: 118, icon: 'record' },
    { x: 307, y: 118, icon: 'storage' },
    { x: 572, y: 118, icon: 'trim' },
    { x: 837, y: 118, icon: 'link' },
  ];

  return `
    <div class="evidence-scene">
      <h2 class="sr-only" id="${headingId}">${escapeHtml(scene.ariaLabel || 'E-stream evidence chain')}</h2>
      <svg class="evidence-scene__svg" viewBox="0 0 1120 640" role="img" aria-labelledby="${headingId}" focusable="false">
        <defs>
          <linearGradient id="${cardGradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="100%" stop-color="#f3f7fb" />
          </linearGradient>
          <linearGradient id="${connectorGradientId}" gradientUnits="userSpaceOnUse" x1="100" y1="290" x2="1000" y2="448">
            <stop offset="0%" stop-color="#003366" stop-opacity="0.62" />
            <stop offset="64%" stop-color="#003366" stop-opacity="0.72" />
            <stop offset="100%" stop-color="#9a171b" stop-opacity="0.72" />
          </linearGradient>
        </defs>

        <text class="evidence-scene__title" x="560" y="18" text-anchor="middle">${escapeHtml(scene.title || '')}</text>
        ${renderSvgCenteredLines(scene.subtitle || [], 560, 54, 'evidence-scene__subtitle', 23)}

        <path id="${connectorA}" class="evidence-scene__connector" pathLength="1" style="stroke: url(#${connectorGradientId}); --connector-delay: 0.38s;" d="M262 218 H307" />
        <path id="${connectorB}" class="evidence-scene__connector" pathLength="1" style="stroke: url(#${connectorGradientId}); --connector-delay: 0.54s;" d="M527 218 H572" />
        <path id="${connectorC}" class="evidence-scene__connector" pathLength="1" style="stroke: url(#${connectorGradientId}); --connector-delay: 0.7s;" d="M792 218 H837" />
        <path id="${connectorD}" class="evidence-scene__connector evidence-scene__connector--down" pathLength="1" style="stroke: url(#${connectorGradientId}); --connector-delay: 1.08s;" d="M947 318 C900 358 760 376 560 390" />

        ${renderEvidencePacket(connectorA, 0.38)}
        ${renderEvidencePacket(connectorB, 0.54)}
        ${renderEvidencePacket(connectorC, 0.7)}
        ${renderEvidencePacket(connectorD, 1.08)}

        ${positions.map((position, index) => renderEvidenceStep(steps[index], position, index)).join('')}
        ${renderEvidenceOutput(scene.output || {})}
      </svg>
    </div>
  `;
}

function renderEvidenceStep(step = {}, position, index = 0) {
  const width = 220;
  const height = 200;
  const delay = 0.1 + index * 0.16;
  const lines = step.lines || [];
  const lineY = lines.length > 3 ? 124 : 132;
  const lineGap = lines.length > 3 ? 20 : 21;

  return `
    <g class="evidence-scene__step" style="--step-delay: ${delay}s;" transform="translate(${position.x} ${position.y})">
      <rect class="evidence-scene__card" width="${width}" height="${height}" rx="28" />
      ${step.image ? renderEvidenceImage(step.image, width / 2, 10, 111, 'step') : renderEvidenceIcon(position.icon, width / 2, 48)}
      ${renderSvgCenteredLines(Array.isArray(step.title) ? step.title : [step.title], width / 2, 88, 'evidence-scene__step-title', 21)}
      ${renderSvgCenteredLines(lines, width / 2, lineY, 'evidence-scene__step-line', lineGap)}
    </g>
  `;
}

function renderEvidenceOutput(output = {}) {
  return `
    <g class="evidence-scene__output" transform="translate(80 390)">
      <rect class="evidence-scene__output-card" width="960" height="150" rx="34" />
      ${output.image ? renderEvidenceImage(output.image, 88, 75, 98, 'output') : `
        <g class="evidence-scene__output-icon" transform="translate(42 38)">
          <rect x="0" y="0" width="92" height="66" rx="14" />
          <path d="M40 22 L62 33 L40 44 Z" />
        </g>
      `}
      <text class="evidence-scene__output-title" x="168" y="50">${escapeHtml(output.title || '')}</text>
      ${renderSvgTextLines(output.lines || [], 168, 84, 'evidence-scene__output-line', 22)}
    </g>
  `;
}

function renderEvidenceImage(image, centerX, centerY, size, modifier) {
  const offset = size / 2;

  if (modifier === 'output') {
    const clipSize = 108;
    const clipOffset = clipSize / 2;
    const artSize = Math.round(size * 1.62);
    const artOffset = artSize / 2;
    const clipId = 'evidenceOutputImageClip';

    return `
      <clipPath id="${clipId}">
        <rect x="${centerX - clipOffset}" y="${centerY - clipOffset}" width="${clipSize}" height="${clipSize}" rx="18" />
      </clipPath>
      <image class="evidence-scene__image evidence-scene__image--${modifier}" href="${escapeAttribute(image)}" x="${centerX - artOffset}" y="${centerY - artOffset}" width="${artSize}" height="${artSize}" preserveAspectRatio="xMidYMid meet" clip-path="url(#${clipId})" />
    `;
  }

  if (modifier === 'step') {
    const plateSize = Math.round(size * 1.2);
    const plateOffset = plateSize / 2;

    return `
      <rect class="evidence-scene__image-backplate" x="${centerX - plateOffset}" y="${centerY - plateOffset}" width="${plateSize}" height="${plateSize}" rx="30" />
      <image class="evidence-scene__image evidence-scene__image--${modifier}" href="${escapeAttribute(image)}" x="${centerX - offset}" y="${centerY - offset}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet" />
    `;
  }

  return `
    <image class="evidence-scene__image evidence-scene__image--${modifier}" href="${escapeAttribute(image)}" x="${centerX - offset}" y="${centerY - offset}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet" />
  `;
}

function renderEvidencePacket(pathId, delay) {
  return `
    <circle class="evidence-scene__packet" r="6" style="--packet-delay: ${delay}s">
      <animateMotion dur="1.9s" begin="${delay}s" repeatCount="indefinite" rotate="auto">
        <mpath href="#${pathId}" />
      </animateMotion>
    </circle>
  `;
}

function renderEvidenceIcon(type, cx, cy) {
  if (type === 'storage') {
    return `
      <g class="evidence-scene__icon" transform="translate(${cx - 30} ${cy - 30})">
        <ellipse cx="30" cy="12" rx="28" ry="10" />
        <path d="M2 12 V48 C2 54 15 60 30 60 C45 60 58 54 58 48 V12" />
        <path d="M2 30 C2 36 15 42 30 42 C45 42 58 36 58 30" />
      </g>
    `;
  }

  if (type === 'trim') {
    return `
      <g class="evidence-scene__icon" transform="translate(${cx - 34} ${cy - 24})">
        <rect x="0" y="8" width="68" height="34" rx="9" />
        <path d="M12 25 H56" />
        <path d="M24 8 V42" />
        <path d="M44 8 V42" />
      </g>
    `;
  }

  if (type === 'link') {
    return `
      <g class="evidence-scene__icon" transform="translate(${cx - 32} ${cy - 24})">
        <path d="M26 15 L18 15 C9 15 4 21 4 28 C4 35 9 41 18 41 H28" />
        <path d="M38 15 H46 C55 15 60 21 60 28 C60 35 55 41 46 41 H36" />
        <path d="M22 28 H42" />
      </g>
    `;
  }

  return `
    <g class="evidence-scene__icon" transform="translate(${cx - 30} ${cy - 30})">
      <rect x="6" y="4" width="48" height="58" rx="10" />
      <path d="M25 23 L41 32 L25 41 Z" />
      <path d="M16 51 H44" />
    </g>
  `;
}

function renderOperatorScene(scene, headingId) {
  const queue = scene.queue || {};
  const active = scene.active || {};
  const reaction = scene.reaction || {};
  const livePathId = `${headingId}-operatorLivePath`;
  const subtitleLines = scene.subtitle || [];
  const consoleY = subtitleLines.length > 0 ? 104 : 64;

  return `
    <div class="operator-scene">
      <h2 class="sr-only" id="${headingId}">${escapeHtml(scene.ariaLabel || 'E-stream operator console')}</h2>
      <svg class="operator-scene__svg" viewBox="0 0 1120 640" role="img" aria-labelledby="${headingId}" focusable="false">
        <defs>
          <linearGradient id="${headingId}-operatorPanel" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="100%" stop-color="#f3f7fb" />
          </linearGradient>
          <linearGradient id="${headingId}-operatorLiveGradient" gradientUnits="userSpaceOnUse" x1="304" y1="176" x2="348" y2="240">
            <stop offset="0%" stop-color="#9a171b" stop-opacity="0.78" />
            <stop offset="100%" stop-color="#003366" stop-opacity="0.72" />
          </linearGradient>
        </defs>

        <text class="operator-scene__title" x="560" y="18" text-anchor="middle">${escapeHtml(scene.title || '')}</text>
        ${renderSvgCenteredLines(subtitleLines, 560, 54, 'operator-scene__subtitle', 22)}

        <g class="operator-scene__console" transform="translate(18 ${consoleY})">
          <rect class="operator-scene__shell" width="1084" height="600" rx="40" />
          <g class="operator-scene__sidebar">
            <path class="operator-scene__sidebar-bg" d="M0 40 C0 18 18 0 40 0 H190 V600 H40 C18 600 0 582 0 560 Z" />
            <circle class="operator-scene__sidebar-logo" cx="52" cy="54" r="24" />
            <text class="operator-scene__sidebar-logo-text" x="52" y="63" text-anchor="middle">E</text>
            <text class="operator-scene__sidebar-brand" x="88" y="61">E-stream</text>
            ${renderOperatorSidebarItem(scene.sidebarItems?.[0], 17, 132, true)}
            ${renderOperatorSidebarItem(scene.sidebarItems?.[1], 17, 186, false)}
            ${renderOperatorSidebarItem(scene.sidebarItems?.[2], 17, 240, false)}
            ${renderOperatorStatus(scene.operatorStatus)}
          </g>

          <g class="operator-scene__workspace" transform="translate(208 36)">
            <rect class="operator-scene__topline" x="0" y="0" width="850" height="62" rx="23" />
            <text class="operator-scene__topline-label" x="24" y="35">${escapeHtml(scene.topline || '')}</text>
            <g class="operator-scene__metric" transform="translate(620 2)">
              <text class="operator-scene__metric-label" x="0" y="22">${escapeHtml(scene.metric?.label || '')}</text>
              <text class="operator-scene__metric-value" x="0" y="44">${escapeHtml(scene.metric?.value || '')}</text>
            </g>
            ${renderOperatorSoundAlert()}

            <g class="operator-scene__queue" transform="translate(0 104)">
              <text class="operator-scene__section-label" x="0" y="0">${escapeHtml(queue.title || '')}</text>
              ${renderOperatorQueueCard(queue.cards?.[0], 0, 24, true)}
              ${renderOperatorQueueCard(queue.cards?.[1], 0, 138, false)}
              ${renderOperatorQueueCard(queue.cards?.[2], 0, 252, false)}
            </g>

            <path id="${livePathId}" class="operator-scene__live-path" pathLength="1" style="stroke: url(#${headingId}-operatorLiveGradient);" d="M304 176 C336 176 328 240 348 240" />
            ${renderOperatorPacket(livePathId)}

            <g class="operator-scene__active" transform="translate(348 116)">
              <rect class="operator-scene__active-card" width="300" height="344" rx="34" />
              <text class="operator-scene__active-eyebrow" x="28" y="38">${escapeHtml(active.eyebrow || '')}</text>
              <text class="operator-scene__active-title" x="28" y="72">${escapeHtml(active.title || '')}</text>
              <g class="operator-scene__video" transform="translate(28 94)">
                <rect class="operator-scene__video-bg" width="244" height="104" rx="21" />
                <path class="operator-scene__video-wave operator-scene__video-wave--one" d="M70 36 C94 22 128 22 154 36" />
                <path class="operator-scene__video-wave operator-scene__video-wave--two" d="M58 58 C92 36 136 36 172 58" />
                <text class="operator-scene__video-live" x="122" y="88" text-anchor="middle">LIVE</text>
              </g>
              ${renderSvgTextLines(active.lines || [], 28, 236, 'operator-scene__active-line', 22)}
            </g>

            <g class="operator-scene__reaction" transform="translate(658 118)">
              <text class="operator-scene__section-label" x="0" y="0">${escapeHtml(reaction.title || '')}</text>
              ${renderOperatorReactionSteps(reaction.steps || [])}
            </g>
          </g>
        </g>

        ${scene.footer ? `<text class="operator-scene__footer" x="560" y="606" text-anchor="middle">${escapeHtml(scene.footer)}</text>` : ''}
      </svg>
    </div>
  `;
}

function renderOperatorSidebarItem(item = {}, x, y, active = false) {
  const count = item.count ? `<text class="operator-scene__sidebar-count" x="163" y="31" text-anchor="middle">${escapeHtml(item.count)}</text>` : '';

  return `
    <g class="operator-scene__sidebar-item${active ? ' operator-scene__sidebar-item--active' : ''}" transform="translate(${x} ${y})">
      <rect width="156" height="40" rx="15" />
      <text x="18" y="26">${escapeHtml(item.label || '')}</text>
      ${count}
    </g>
  `;
}

function renderOperatorSoundAlert() {
  return `
    <g class="operator-scene__sound-alert" transform="translate(790 20) scale(0.54)" aria-hidden="true">
      <path class="operator-scene__sound-speaker" d="M0 16 H8 L20 7 V33 L8 24 H0 Z" />
      <path class="operator-scene__sound-wave operator-scene__sound-wave--one" d="M27 13 C31 17 31 23 27 27" />
      <path class="operator-scene__sound-wave operator-scene__sound-wave--two" d="M34 7 C42 15 42 25 34 33" />
    </g>
  `;
}

function renderOperatorStatus(status = {}) {
  return `
    <g class="operator-scene__operator-status" transform="translate(17 516)">
      <rect width="156" height="58" rx="19" />
      <text class="operator-scene__operator-status-label" x="18" y="23">${escapeHtml(status.label || '')}</text>
      <circle class="operator-scene__operator-status-dot" cx="24" cy="41" r="5" />
      <text class="operator-scene__operator-status-value" x="36" y="46">${escapeHtml(status.value || '')}</text>
    </g>
  `;
}

function renderOperatorQueueCard(card = {}, x, y, live = false) {
  const statusClass = (card.status || card.tone || '').toLowerCase();
  const doneClass = statusClass === 'done' ? ' operator-scene__queue-card--done' : '';

  return `
    <g class="operator-scene__queue-card${live ? ' operator-scene__queue-card--live' : ''}${doneClass}" transform="translate(${x} ${y})">
      <rect width="304" height="92" rx="24" />
      <circle class="operator-scene__queue-dot" cx="264" cy="17" r="8" />
      <text class="operator-scene__queue-title" x="22" y="39">${escapeHtml(card.title || '')}</text>
      ${renderOperatorQueueMeta(card)}
      ${card.status ? `<text class="operator-scene__queue-status" x="238" y="24" text-anchor="end">${escapeHtml(card.status)}</text>` : ''}
    </g>
  `;
}

function renderOperatorQueueMeta(card = {}) {
  if (!card.onlineName) {
    return `<text class="operator-scene__queue-meta" x="22" y="64">${escapeHtml(card.meta || '')}</text>`;
  }

  return `
    <text class="operator-scene__queue-meta" x="22" y="64">
      <tspan>${escapeHtml(card.meta || '')}</tspan>
      <tspan class="operator-scene__queue-online-dot" dx="6">●</tspan>
      <tspan class="operator-scene__queue-online-name" dx="4">${escapeHtml(card.onlineName)}</tspan>
    </text>
  `;
}

function renderOperatorPacket(pathId) {
  return `
    <circle class="operator-scene__packet" r="6" style="--packet-delay: 0.7s">
      <animateMotion dur="2.2s" begin="0.7s" repeatCount="indefinite" rotate="auto">
        <mpath href="#${pathId}" />
      </animateMotion>
    </circle>
  `;
}

function renderOperatorReactionSteps(steps) {
  return steps
    .map((step, index) => {
      const y = 32 + index * 66;
      return `
        <g class="operator-scene__reaction-step" style="--reaction-delay: ${0.2 + index * 0.18}s;" transform="translate(0 ${y})">
          <circle class="operator-scene__reaction-dot" cx="14" cy="14" r="8" />
          <path class="operator-scene__reaction-line" d="M14 24 V56" />
          <text class="operator-scene__reaction-title" x="30" y="19">${escapeHtml(step.title || '')}</text>
          ${renderOperatorReactionCaption(step)}
        </g>
      `;
    })
    .join('');
}

function renderOperatorReactionCaption(step = {}) {
  if (!step.operatorName) {
    return `<text class="operator-scene__reaction-caption" x="30" y="42">${escapeHtml(step.caption || '')}</text>`;
  }

  return `
    <text class="operator-scene__reaction-caption" x="30" y="42">
      <tspan>${escapeHtml(step.caption || '')}</tspan>
      <tspan class="operator-scene__reaction-caption-name" dx="4">${escapeHtml(step.operatorName)}</tspan>
    </text>
  `;
}

function renderRightsScene(scene, headingId) {
  const incoming = scene.incoming || {};
  const stack = scene.stack || {};
  const route = scene.route || {};
  const transferPathId = `${headingId}-rightsTransferPath`;
  const routePathId = `${headingId}-rightsRoutePath`;
  const subtitleLines = scene.subtitle || [];
  const consoleY = subtitleLines.length > 0 ? 104 : 64;

  return `
    <div class="rights-scene">
      <h2 class="sr-only" id="${headingId}">${escapeHtml(scene.ariaLabel || 'E-stream civic evidence contour')}</h2>
      <svg class="rights-scene__svg" viewBox="0 0 1120 640" role="img" aria-labelledby="${headingId}" focusable="false">
        <defs>
          <linearGradient id="${headingId}-rightsTransferGradient" gradientUnits="userSpaceOnUse" x1="452" y1="278" x2="514" y2="278">
            <stop offset="0%" stop-color="#003366" stop-opacity="0.72" />
            <stop offset="100%" stop-color="#9a171b" stop-opacity="0.72" />
          </linearGradient>
          <linearGradient id="${headingId}-rightsRouteGradient" gradientUnits="userSpaceOnUse" x1="674" y1="450" x2="501" y2="478">
            <stop offset="0%" stop-color="#003366" stop-opacity="0.72" />
            <stop offset="100%" stop-color="#9a171b" stop-opacity="0.72" />
          </linearGradient>
        </defs>

        <text class="rights-scene__title" x="560" y="18" text-anchor="middle">${escapeHtml(scene.title || '')}</text>
        ${renderSvgCenteredLines(subtitleLines, 560, 54, 'rights-scene__subtitle', 22)}

        <g class="rights-scene__console" transform="translate(18 ${consoleY})">
          <rect class="rights-scene__shell" width="1084" height="600" rx="40" />
          <g class="rights-scene__sidebar">
            <path class="rights-scene__sidebar-bg" d="M0 40 C0 18 18 0 40 0 H190 V600 H40 C18 600 0 582 0 560 Z" />
            <circle class="rights-scene__sidebar-logo" cx="52" cy="54" r="24" />
            <text class="rights-scene__sidebar-logo-text" x="52" y="63" text-anchor="middle">E</text>
            <text class="rights-scene__sidebar-brand" x="88" y="61">E-stream</text>
            ${renderRightsSidebarItem(scene.sidebarItems?.[0], 17, 132, true)}
            ${renderRightsSidebarItem(scene.sidebarItems?.[1], 17, 186, false)}
            ${renderRightsSidebarItem(scene.sidebarItems?.[2], 17, 240, false)}
          </g>

          <g class="rights-scene__workspace" transform="translate(226 34)">
            <rect class="rights-scene__topline" x="0" y="0" width="832" height="62" rx="23" />
            <text class="rights-scene__topline-label" x="24" y="35">${escapeHtml(scene.topline || '')}</text>
            ${renderRightsMetric(scene.metrics?.[0], 610, 14)}
            ${renderRightsMetric(scene.metrics?.[1], 728, 14)}

            ${(scene.filters || []).length ? `
              <g class="rights-scene__filters" transform="translate(0 84)">
                ${(scene.filters || []).map((filter, index) => renderRightsFilter(filter, index)).join('')}
              </g>
            ` : ''}

            <g class="rights-scene__incoming" transform="translate(0 ${(scene.filters || []).length ? 151 : 111})">
              <text class="rights-scene__section-label" x="0" y="-15">${escapeHtml(incoming.title || '')}</text>
              <g class="rights-scene__timeline-list" transform="translate(0 30)">
                ${renderRightsTimeline(incoming.items || [])}
              </g>
            </g>

            <path id="${transferPathId}" class="rights-scene__transfer-path" pathLength="1" style="stroke: url(#${headingId}-rightsTransferGradient);" d="M452 278 C474 252 492 252 514 278" />
            ${renderRightsPacket(transferPathId)}
            <path id="${routePathId}" class="rights-scene__transfer-path rights-scene__transfer-path--route" pathLength="1" style="stroke: url(#${headingId}-rightsRouteGradient); --rights-path-delay: 1.08s;" d="M674 450 C640 472 552 450 501 478" />
            ${renderRightsPacket(routePathId, 1.22)}

            <g class="rights-scene__stack" transform="translate(516 96)">
              <text class="rights-scene__section-label" x="0" y="0">${escapeHtml(stack.title || '')}</text>
              <rect class="rights-scene__stack-zone" x="0" y="24" width="316" height="330" rx="30" />
              <text class="rights-scene__stack-title" x="28" y="68">${escapeHtml(stack.heading || '')}</text>
              ${renderSvgTextLines(stack.lines || [], 28, 104, 'rights-scene__stack-line', 25)}
              ${renderRightsStackItems(stack.items || [])}
            </g>

            <g class="rights-scene__route" transform="translate(0 454)">
              <text class="rights-scene__section-label" x="0" y="0">${escapeHtml(route.title || '')}</text>
              ${(route.items || []).map((item, index) => renderRightsRouteItem(item, index)).join('')}
            </g>
          </g>
        </g>

        ${scene.footer ? `<text class="rights-scene__footer" x="560" y="606" text-anchor="middle">${escapeHtml(scene.footer)}</text>` : ''}
      </svg>
    </div>
  `;
}

function renderRightsSidebarItem(item = {}, x, y, active = false) {
  return `
    <g class="rights-scene__sidebar-item${active ? ' rights-scene__sidebar-item--active' : ''}" transform="translate(${x} ${y})">
      <rect width="156" height="40" rx="15" />
      <text x="18" y="26">${escapeHtml(item.label || '')}</text>
    </g>
  `;
}

function renderRightsMetric(metric = {}, x, y) {
  return `
    <g class="rights-scene__metric" transform="translate(${x} ${y})">
      <text class="rights-scene__metric-label" x="0" y="4">${escapeHtml(metric.label || '')}</text>
      <text class="rights-scene__metric-value" x="0" y="25">${escapeHtml(metric.value || '')}</text>
    </g>
  `;
}

function renderRightsFilter(filter, index) {
  const x = index * 108;

  return `
    <g class="rights-scene__filter" transform="translate(${x} 0)">
      <rect width="92" height="32" rx="16" />
      <text x="46" y="21" text-anchor="middle">${escapeHtml(filter || '')}</text>
    </g>
  `;
}

function renderRightsTimeline(items) {
  return items
    .map((item, index) => {
      const y = 28 + index * 76;
      return `
        <g class="rights-scene__timeline-item" style="--timeline-delay: ${0.12 + index * 0.16}s;" transform="translate(0 ${y})">
          <circle class="rights-scene__timeline-dot" cx="14" cy="30" r="7" />
          <path class="rights-scene__timeline-line" d="M14 40 V74" />
          <rect class="rights-scene__timeline-card" x="34" y="0" width="414" height="66" rx="20" />
          <text class="rights-scene__timeline-time" x="56" y="27">${escapeHtml(item.time || '')}</text>
          <text class="rights-scene__timeline-title" x="132" y="27">${escapeHtml(item.title || '')}</text>
          <text class="rights-scene__timeline-meta" x="56" y="50">${escapeHtml(item.meta || '')}</text>
          <text class="rights-scene__timeline-status" x="345" y="50">${escapeHtml(item.status || '')}</text>
        </g>
      `;
    })
    .join('');
}

function renderRightsPacket(pathId, delay = 0.86) {
  return `
    <circle class="rights-scene__packet" r="6" style="--packet-delay: ${delay}s">
      <animateMotion dur="2.3s" begin="${delay}s" repeatCount="indefinite" rotate="auto">
        <mpath href="#${pathId}" />
      </animateMotion>
    </circle>
  `;
}

function renderRightsStackItems(items) {
  return items
    .map((item, index) => {
      const y = 200 + index * 70;
      return `
        <g class="rights-scene__stack-item" style="--stack-delay: ${0.38 + index * 0.18}s;" transform="translate(26 ${y})">
          <rect width="276" height="62" rx="20" />
          <circle cx="22" cy="31" r="9" />
          <text class="rights-scene__stack-item-title" x="46" y="26">${escapeHtml(item.title || '')}</text>
          <text class="rights-scene__stack-item-caption" x="46" y="47">${escapeHtml(item.caption || '')}</text>
        </g>
      `;
    })
    .join('');
}

function renderRightsRouteItem(item = {}, index) {
  const x = index * 204;

  return `
    <g class="rights-scene__route-item" style="--route-delay: ${0.2 + index * 0.14}s;" transform="translate(${x} 24)">
      <rect width="186" height="58" rx="21" />
      <text class="rights-scene__route-title" x="18" y="24">${escapeHtml(item.title || '')}</text>
      <text class="rights-scene__route-caption" x="18" y="42">${escapeHtml(item.caption || '')}</text>
    </g>
  `;
}

function renderTrustScene(scene, headingId) {
  const center = scene.center || {};
  const pillars = scene.pillars || [];
  const pathA = `${headingId}-trustPathA`;
  const pathB = `${headingId}-trustPathB`;
  const pathC = `${headingId}-trustPathC`;
  const pathD = `${headingId}-trustPathD`;

  return `
    <div class="trust-scene">
      <h2 class="sr-only" id="${headingId}">${escapeHtml(scene.ariaLabel || 'E-stream trust principles')}</h2>
      <svg class="trust-scene__svg" viewBox="0 0 1120 640" role="img" aria-labelledby="${headingId}" focusable="false">
        <text class="trust-scene__title" x="560" y="18" text-anchor="middle">${escapeHtml(scene.title || '')}</text>
        ${renderSvgCenteredLines(scene.subtitle || [], 560, 54, 'trust-scene__subtitle', 22)}

        <g class="trust-scene__diagram" transform="translate(0 38)">
          <g class="trust-scene__orbits" aria-hidden="true">
            <path class="trust-scene__orbit trust-scene__orbit--wide" d="M246 321 C320 85 806 85 874 321 C800 563 320 563 246 321Z" />
            <path class="trust-scene__orbit trust-scene__orbit--tight" d="M356 321 C408 183 710 183 764 321 C710 461 408 461 356 321Z" />
          </g>

          ${renderTrustPillar(pillars[0], 0, 44, 405, 176, 0)}
          ${renderTrustPillar(pillars[1], 0, 414, 405, -174, 1)}
          ${renderTrustPillar(pillars[2], 750, 44, -405, 176, 2)}
          ${renderTrustPillar(pillars[3], 750, 414, -405, -174, 3)}

          <path id="${pathA}" class="trust-scene__arrow" style="--arrow-delay: 1.68s;" pathLength="1" d="M370 146 C392 166 384 262 405 286" />
          <path id="${pathB}" class="trust-scene__arrow" style="--arrow-delay: 1.78s;" pathLength="1" d="M370 516 C394 494 384 376 405 356" />
          <path id="${pathC}" class="trust-scene__arrow" style="--arrow-delay: 1.88s;" pathLength="1" d="M750 146 C728 166 736 262 715 286" />
          <path id="${pathD}" class="trust-scene__arrow" style="--arrow-delay: 1.98s;" pathLength="1" d="M750 516 C726 494 736 376 715 356" />

          <g class="trust-scene__center" transform="translate(405 220)">
            <g class="trust-scene__center-body">
              <rect class="trust-scene__center-card" width="310" height="202" rx="38" />
              ${renderTrustLogo()}
              ${renderSvgCenteredLines([center.title, ...(center.lines || [])].filter(Boolean), 155, 132, 'trust-scene__center-claim', 23)}
            </g>
          </g>
        </g>

        <text class="trust-scene__footer" x="560" y="606" text-anchor="middle">${escapeHtml(scene.footer || '')}</text>
      </svg>
    </div>
  `;
}

function renderTrustPillar(pillar = {}, x, y, fromX, fromY, index = 0) {
  return `
    <g class="trust-scene__pillar" style="--pillar-delay: ${0.66 + index * 0.1}s; --pillar-from-x: ${fromX}px; --pillar-from-y: ${fromY}px;" transform="translate(${x} ${y})">
      <g class="trust-scene__pillar-body">
        <rect class="trust-scene__pillar-card" width="370" height="172" rx="34" />
        <text class="trust-scene__pillar-title" x="32" y="58">${escapeHtml(pillar.title || '')}</text>
        ${renderSvgTextLines(pillar.lines || [], 32, 92, 'trust-scene__pillar-line', 22)}
      </g>
    </g>
  `;
}

function renderTrustLogo() {
  return `
    <image class="trust-scene__logo" href="assets/images/e-stream-logotype.svg" x="117" y="24" width="76" height="72" preserveAspectRatio="xMidYMid meet" aria-hidden="true" />
  `;
}

function renderFutureScene(scene, headingId) {
  const left = scene.left || {};
  const center = scene.center || {};
  const right = scene.right || {};
  const events = scene.events || [];
  const pathA = `${headingId}-futurePathA`;
  const pathB = `${headingId}-futurePathB`;
  const pathC = `${headingId}-futurePathC`;

  return `
    <div class="future-scene">
      <h2 class="sr-only" id="${headingId}">${escapeHtml(scene.ariaLabel || 'E-stream future safety environment')}</h2>
      <svg class="future-scene__svg" viewBox="0 0 1120 640" role="img" aria-labelledby="${headingId}" focusable="false">
        <defs>
          <linearGradient id="${headingId}-futureFlow" gradientUnits="userSpaceOnUse" x1="350" y1="210" x2="770" y2="210">
            <stop offset="0%" stop-color="#003366" stop-opacity="0.66" />
            <stop offset="58%" stop-color="#315777" stop-opacity="0.7" />
            <stop offset="100%" stop-color="#9a171b" stop-opacity="0.72" />
          </linearGradient>
        </defs>

        <text class="future-scene__title" x="560" y="18" text-anchor="middle">${escapeHtml(scene.title || '')}</text>
        ${renderSvgCenteredLines(scene.subtitle || [], 560, 54, 'future-scene__subtitle', 22)}

        <g class="future-scene__diagram" transform="translate(0 82)">
          <path id="${pathA}" class="future-scene__flow" pathLength="1" style="stroke: url(#${headingId}-futureFlow); --flow-delay: 0.28s;" d="M350 210 C362 190 374 188 390 210" />
          <path id="${pathB}" class="future-scene__flow" pathLength="1" style="stroke: url(#${headingId}-futureFlow); --flow-delay: 0.52s;" d="M730 210 C746 188 758 190 770 210" />
          <path id="${pathC}" class="future-scene__flow future-scene__flow--down" pathLength="1" style="stroke: url(#${headingId}-futureFlow); --flow-delay: 0.76s;" d="M560 326 C560 340 560 348 560 352" />
          ${renderFuturePacket(pathA, 0.3)}
          ${renderFuturePacket(pathB, 0.54)}
          ${renderFuturePacket(pathC, 0.78)}

          ${renderFutureCard(left, 20, 94, 'launch', 0)}
          ${renderFutureCore(center, 390, 68)}
          ${renderFutureCard(right, 770, 94, 'alert', 2)}

          <g class="future-scene__events" transform="translate(35 352)">
            ${(events || []).map((event, index) => renderFutureEvent(event, index)).join('')}
          </g>
        </g>

        ${scene.footer ? `<text class="future-scene__footer" x="560" y="624" text-anchor="middle">${escapeHtml(scene.footer)}</text>` : ''}
      </svg>
    </div>
  `;
}

function renderFutureCard(card = {}, x, y, modifier, index = 0) {
  const iconX = modifier === 'launch' ? 117 : 108;
  const iconY = modifier === 'launch' ? -38 : -50;
  const fallbackIcon = modifier === 'launch' ? renderFutureLaunchIcon() : renderFutureAlertIcon();

  return `
    <g class="future-scene__card future-scene__card--${modifier}" style="--future-card-delay: ${0.16 + index * 0.12}s; --future-icon-delay: ${0.42 + index * 0.12}s;" transform="translate(${x} ${y})">
      <rect class="future-scene__card-bg" width="330" height="230" rx="36" />
      <g class="future-scene__floating-icon" transform="translate(${iconX} ${iconY})">
        ${renderFutureFloatingIcon(card.image, modifier, fallbackIcon)}
      </g>
      <text class="future-scene__card-title" x="165" y="100" text-anchor="middle">${escapeHtml(card.title || '')}</text>
      ${renderSvgCenteredLines(card.lines || [], 165, 136, 'future-scene__card-line', 25)}
    </g>
  `;
}

function renderFutureCore(center = {}, x, y) {
  const titleLines = Array.isArray(center.title) ? center.title : [center.title];

  return `
    <g class="future-scene__core" style="--future-icon-delay: 0.52s;" transform="translate(${x} ${y})">
      <rect class="future-scene__core-bg" width="340" height="258" rx="40" />
      <g class="future-scene__floating-icon" transform="translate(122 -52)">
        ${renderFutureFloatingIcon(center.image, 'core', renderFutureHouseIcon())}
      </g>
      ${renderSvgCenteredLines(titleLines, 170, 118, 'future-scene__core-title', 27)}
      ${renderSvgCenteredLines(center.lines || [], 170, 184, 'future-scene__core-line', 24)}
    </g>
  `;
}

function renderFutureFloatingIcon(image, modifier, fallbackIcon) {
  if (image) {
    return `
      <g class="future-scene__floating-icon-art future-scene__floating-icon-art--image">
        <image class="future-scene__floating-icon-image future-scene__floating-icon-image--${modifier}" href="${escapeAttribute(image)}" x="-20" y="-20" width="146" height="146" preserveAspectRatio="xMidYMid meet" />
      </g>
    `;
  }

  return `
    <g class="future-scene__floating-icon-art">
      <rect class="future-scene__icon-plate future-scene__icon-plate--${modifier}" x="-16" y="-16" width="128" height="${modifier === 'launch' ? 96 : 126}" rx="30" />
      <g class="future-scene__card-icon future-scene__card-icon--${modifier}">
        ${fallbackIcon}
      </g>
    </g>
  `;
}

function renderFutureLaunchIcon() {
  return `
    <rect x="0" y="0" width="44" height="62" rx="13" />
    <circle cx="22" cy="34" r="9" />
    <path d="M58 9 H94" />
    <path d="M58 31 H84" />
    <path d="M58 53 H96" />
  `;
}

function renderFutureAlertIcon() {
  return `
    <path d="M16 16 C16 7 23 0 32 0 H82 C91 0 98 7 98 16 V58 C98 67 91 74 82 74 H50 L28 94 V74 H32 C23 74 16 67 16 58 Z" />
    <circle cx="42" cy="38" r="7" />
    <path d="M62 30 C72 34 76 44 72 54" />
    <path d="M78 22 C94 34 98 54 86 70" />
  `;
}

function renderFutureHouseIcon() {
  return `
    <g class="future-scene__house">
      <path d="M48 0 L94 38 V98 H2 V38 Z" />
      <path d="M31 98 V58 H65 V98" />
      <circle cx="48" cy="42" r="9" />
    </g>
  `;
}

function renderFutureEvent(event = {}, index = 0) {
  const positions = [
    [0, 0],
    [356, 0],
    [712, 0],
    [178, 104],
    [534, 104]
  ];
  const [x, y] = positions[index] || [index * 356, 0];
  const hasCaption = Boolean(event.caption);

  return `
    <g class="future-scene__event" style="--event-delay: ${0.5 + index * 0.1}s;" transform="translate(${x} ${y})">
      <rect width="338" height="84" rx="30" />
      ${event.image ? `
        <rect class="future-scene__event-icon-backplate" x="11" y="7" width="78" height="70" rx="20" />
        <image class="future-scene__event-icon" href="${escapeAttribute(event.image)}" x="10" y="1" width="82" height="82" preserveAspectRatio="xMidYMid meet" />
      ` : `
        <circle cx="51" cy="42" r="14" />
      `}
      <text x="90" y="${hasCaption ? 36 : 48}">${escapeHtml(event.title || '')}</text>
      ${hasCaption ? `<text class="future-scene__event-caption" x="90" y="60">${escapeHtml(event.caption || '')}</text>` : ''}
    </g>
  `;
}

function renderFuturePacket(pathId, delay) {
  return `
    <circle class="future-scene__packet" r="6" style="--packet-delay: ${delay}s">
      <animateMotion dur="2.4s" begin="${delay}s" repeatCount="indefinite" rotate="auto">
        <mpath href="#${pathId}" />
      </animateMotion>
    </circle>
  `;
}

function renderFinalScene(scene, headingId) {
  const words = scene.words || [];
  const formula = scene.formula || {};
  const wordCardWidth = words.length === 2 ? 320 : 232;
  const wordGap = words.length === 2 ? 40 : 28;
  const wordsWidth = words.length * wordCardWidth + Math.max(words.length - 1, 0) * wordGap;
  const wordsX = (1120 - wordsWidth) / 2;

  return `
    <div class="final-scene">
      <h2 class="sr-only" id="${headingId}">${escapeHtml(scene.ariaLabel || 'E-stream final manifesto')}</h2>
      <svg class="final-scene__svg" viewBox="0 0 1120 640" role="img" aria-labelledby="${headingId}" focusable="false">
        ${renderFinalLogo()}
        <text class="final-scene__title" x="560" y="210" text-anchor="middle">${escapeHtml(scene.title || '')}</text>
        ${renderSvgCenteredLines(scene.lines || [], 560, 244, 'final-scene__line', 28)}

        <g class="final-scene__words" transform="translate(${wordsX} 296)">
          ${words.map((word, index) => renderFinalWord(word, index, wordCardWidth, wordGap)).join('')}
        </g>

        <g class="final-scene__formula" transform="translate(275 442)">
          <rect class="final-scene__formula-card" width="570" height="100" rx="34" />
          <text class="final-scene__formula-main" x="285" y="43" text-anchor="middle">${escapeHtml(formula.main || '')}</text>
          <text class="final-scene__formula-sub" x="285" y="73" text-anchor="middle">${escapeHtml(formula.sub || '')}</text>
        </g>

        ${scene.footer ? `<text class="final-scene__footer" x="560" y="574" text-anchor="middle">${escapeHtml(scene.footer)}</text>` : ''}
        ${scene.contact ? `
          <a class="final-scene__contact-link" href="mailto:${escapeAttribute(scene.contact)}" aria-label="${escapeAttribute(scene.contact)}">
            <text class="final-scene__contact" x="560" y="608" text-anchor="middle">${escapeHtml(scene.contact)}</text>
          </a>
        ` : ''}
      </svg>
    </div>
  `;
}

function renderFinalLogo() {
  return `
    <svg class="final-scene__logo" x="497" y="46" width="126" height="120" viewBox="0 0 47.892151 45.393356" aria-hidden="true" focusable="false">
      <g transform="translate(-89.95833 -84.931249)">
        <path class="final-scene__logo-shield" d="m 113.15629,84.93125 c -6.6172,5.731796 -15.908589,6.088756 -23.197957,3.542636 1.976085,15.369464 0.05211,31.571274 23.197957,41.850714 8.0269,-3.36954 12.95108,-7.43514 16.06071,-11.95668 l -1.45173,-0.648 c -0.38457,-0.17183 -2.332,-1.24719 -2.57089,-1.83278 -1.33552,-3.27381 -1.75407,-7.5924 -0.4437,-12.88272 0.24082,-0.97126 1.70241,-2.15753 3.5309,-3.078444 l 5.40469,-2.72195 c 0.67138,-0.33817 1.12097,-0.59762 1.48504,-0.81717 0.25237,-2.62397 0.51551,-5.26367 0.93837,-7.91297 -7.89562,2.59641 -16.16153,1.84889 -22.95339,-3.542636 z m -18.663214,6.220096 c 0.485384,-3e-4 1.049495,0.006 1.703432,0.006 h 19.207612 c 3.74952,0 6.76796,3.55119 6.76796,7.96214 v 0.43434 h 1.22167 c 0.56944,0 1.19811,0.42974 1.02798,0.912004 -1.84469,5.22866 -2.3909,10.60099 0,16.52428 0.192,0.47574 -0.45854,0.912 -1.02798,0.912 h -1.22167 v 1.25854 c 0,4.41094 -3.01912,8.02839 -6.76796,7.96155 l -4.71043,-0.0837 c -4.19855,-0.0749 -12.17221,-8.08543 -14.852413,-13.66419 -1.798243,-3.7429 -3.078592,-11.32899 -3.771609,-17.432774 -0.510531,-4.49725 -0.973486,-4.78728 2.423408,-4.78946 z" />
        <path class="final-scene__logo-core" d="m 103.49686,96.954196 c -1.58506,0 -2.86076,1.49325 -2.86076,3.348294 v 15.72175 c 0,1.85499 1.2757,3.34829 2.86076,3.34829 0.094,0 0.18725,-0.006 0.27911,-0.0164 0.0906,0.0113 0.1809,0.017 0.27345,0.017 h 13.11386 c 1.44992,0 2.61722,-1.36615 2.61722,-3.06321 0,-1.69704 -1.1673,-3.06322 -2.61722,-3.06322 h -10.8052 v -2.28468 h 11.01714 c 1.33857,0 2.41639,-1.26139 2.41639,-2.8279 0,-1.56654 -1.07782,-2.8279 -2.41639,-2.8279 h -11.01714 v -2.22439 h 10.78243 c 1.44992,0 2.61779,-1.36614 2.61779,-3.06322 0,-1.697034 -1.16787,-3.063224 -2.61779,-3.063224 h -13.02086 c -0.10081,0 -0.20038,0.008 -0.29859,0.0211 -0.10648,-0.0139 -0.21443,-0.0222 -0.3242,-0.0222 z m 13.02789,1.48097 a 1.6194812,1.6194811 0 0 1 1.61904,1.619714 1.6194812,1.6194811 0 0 1 -1.61904,1.61912 1.6194812,1.6194811 0 0 1 -1.61972,-1.61912 1.6194812,1.6194811 0 0 1 1.61972,-1.619714 z" />
        <path class="final-scene__logo-signal" d="m 134.19589,97.136716 a 3.654623,11.247201 0 0 0 -3.65459,11.247204 3.654623,11.247201 0 0 0 3.65459,11.24722 3.654623,11.247201 0 0 0 3.6546,-11.24722 3.654623,11.247201 0 0 0 -3.6546,-11.247204 z m -1.02242,4.747424 c 0.39295,0 0.71058,0.27139 0.95695,0.64245 0.24626,0.37103 0.44857,0.87325 0.61984,1.48253 0.34198,1.21856 0.54825,2.86983 0.54825,4.69481 0,1.82498 -0.20627,3.47807 -0.54825,4.69664 -0.17127,0.60927 -0.37358,1.10905 -0.61984,1.48008 -0.24637,0.37104 -0.564,0.64246 -0.95695,0.64246 -0.39306,0 -0.70774,-0.27142 -0.954,-0.64246 -0.24637,-0.37103 -0.44914,-0.87081 -0.62041,-1.48008 -0.34209,-1.21857 -0.54825,-2.87166 -0.54825,-4.69664 0,-1.82498 0.20616,-3.47625 0.54825,-4.69481 0.17127,-0.60928 0.37404,-1.1115 0.62041,-1.48253 0.24626,-0.37106 0.56094,-0.64245 0.954,-0.64245 z m 0,0.58127 c -0.11395,0 -0.27831,0.0939 -0.47054,0.38364 -0.19246,0.28972 -0.38378,0.74509 -0.54452,1.31733 -0.32147,1.14445 -0.52627,2.75669 -0.52627,4.53755 0,1.78085 0.2048,3.39492 0.52627,4.53939 0.16074,0.57223 0.35206,1.02576 0.54452,1.31549 0.19223,0.28973 0.35693,0.38303 0.47054,0.38303 0.11407,0 0.28127,-0.0933 0.47361,-0.38303 0.19222,-0.28973 0.38377,-0.74326 0.54451,-1.31549 0.32136,-1.14447 0.5256,-2.75854 0.5256,-4.53939 0,-1.78086 -0.20424,-3.3931 -0.5256,-4.53755 -0.16074,-0.57224 -0.35229,-1.02761 -0.54451,-1.31733 -0.19234,-0.28973 -0.35988,-0.38364 -0.47361,-0.38364 z" />
        <circle class="final-scene__logo-dot-ring" cx="116.51852" cy="100.07845" r="1.1016234" />
        <circle class="final-scene__logo-dot" cx="116.51852" cy="100.07845" r="1.1016234" />
      </g>
    </svg>
  `;
}

function renderFinalWord(word = {}, index = 0, cardWidth = 232, gap = 28) {
  const cardHeight = 112;
  const centerX = cardWidth / 2;
  const x = index * (cardWidth + gap);

  return `
    <g class="final-scene__word" style="--final-word-delay: ${0.28 + index * 0.12}s;" transform="translate(${x} 0)">
      <rect width="${cardWidth}" height="${cardHeight}" rx="32" />
      <text class="final-scene__word-title" x="${centerX}" y="46" text-anchor="middle">${escapeHtml(word.title || '')}</text>
      <text class="final-scene__word-caption" x="${centerX}" y="78" text-anchor="middle">${escapeHtml(word.caption || '')}</text>
    </g>
  `;
}

function renderStaticHandScene(scene, headingId) {
  return `
    <div class="static-hand-scene">
      <h2 class="sr-only" id="${headingId}">${escapeHtml(scene.ariaLabel || 'Phone held in hand')}</h2>
      <svg class="static-hand-scene__svg" viewBox="0 0 1000 640" role="img" aria-labelledby="${headingId}" focusable="false">
        <g class="static-hand-scene__lineart">
          <path class="static-hand-scene__phone-outline" d="M456 24 H792 C816 24 836 44 836 68 V500 C836 532 812 556 780 556 H566" />
          <path class="static-hand-scene__phone-left" d="M456 24 V356" />
          <path class="static-hand-scene__phone-bottom" d="M570 438 H836" />
          <circle class="static-hand-scene__home" cx="690" cy="502" r="22" />
          <path class="static-hand-scene__hand-line" d="M220 628 C226 526 244 430 284 320 C304 266 326 226 356 210 L456 158" />
          <path class="static-hand-scene__hand-line" d="M456 158 V356 C456 378 468 386 488 376 C536 352 566 310 602 270 C640 228 704 220 742 252 C780 284 778 328 742 372 C702 420 672 468 638 526 C608 576 562 610 512 632 V640" />
        </g>
      </svg>
    </div>
  `;

  const screenGradientId = `${headingId}-staticPhoneGlass`;
  const shadowId = `${headingId}-staticHandShadow`;

  return `
    <div class="static-hand-scene">
      <h2 class="sr-only" id="${headingId}">${escapeHtml(scene.ariaLabel || 'Phone held in hand')}</h2>
      <svg class="static-hand-scene__svg" viewBox="0 0 1000 640" role="img" aria-labelledby="${headingId}" focusable="false">
        <defs>
          <linearGradient id="${screenGradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="100%" stop-color="#edf3f7" />
          </linearGradient>
          <filter id="${shadowId}" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="22" stdDeviation="24" flood-color="#102030" flood-opacity="0.14" />
          </filter>
        </defs>

        <g class="static-hand-scene__figure" filter="url(#${shadowId})">
          <path class="static-hand-scene__sleeve" d="M342 526 C390 492 468 488 540 520 L566 640 H286 L302 576 C310 552 322 536 342 526 Z" />
          <path class="static-hand-scene__wrist" d="M374 452 C388 416 430 398 474 410 C526 424 554 470 548 532 C512 570 428 574 376 536 C356 510 358 480 374 452 Z" />
          <path class="static-hand-scene__palm" d="M342 318 C370 274 442 256 514 280 C590 306 638 370 630 452 C623 526 558 574 476 572 C386 570 322 514 316 430 C312 380 320 344 342 318 Z" />

          <path class="static-hand-scene__finger static-hand-scene__finger--index" d="M610 162 C664 154 724 184 736 230 C740 246 728 260 710 258 C664 254 626 230 606 198 C596 182 596 166 610 162 Z" />
          <path class="static-hand-scene__finger static-hand-scene__finger--middle" d="M612 238 C674 230 744 264 754 314 C758 332 744 346 724 342 C674 336 628 308 606 272 C596 256 598 242 612 238 Z" />
          <path class="static-hand-scene__finger static-hand-scene__finger--ring" d="M606 318 C660 316 718 346 730 390 C735 408 722 424 704 420 C660 414 626 392 604 360 C592 342 592 322 606 318 Z" />
          <path class="static-hand-scene__finger static-hand-scene__finger--little" d="M592 396 C634 398 680 422 690 458 C695 476 682 490 666 486 C630 478 602 460 586 432 C576 414 578 398 592 396 Z" />

          <g class="static-hand-scene__phone">
            <rect class="static-hand-scene__phone-body" x="398" y="68" width="230" height="502" rx="46" />
            <rect class="static-hand-scene__phone-screen" x="418" y="104" width="190" height="428" rx="30" fill="url(#${screenGradientId})" />
            <rect class="static-hand-scene__camera" x="474" y="124" width="78" height="8" rx="4" />
            <circle class="static-hand-scene__record-dot" cx="513" cy="188" r="13" />
            <rect class="static-hand-scene__screen-line static-hand-scene__screen-line--one" x="456" y="264" width="114" height="10" rx="5" />
            <rect class="static-hand-scene__screen-line static-hand-scene__screen-line--two" x="440" y="292" width="146" height="10" rx="5" />
            <rect class="static-hand-scene__screen-line static-hand-scene__screen-line--three" x="464" y="452" width="98" height="9" rx="4.5" />
          </g>

          <path class="static-hand-scene__thumb" d="M328 352 C358 314 414 306 466 324 C512 340 548 374 548 410 C548 434 528 450 502 444 C454 432 418 396 374 398 C342 400 312 380 328 352 Z" />
          <path class="static-hand-scene__thumb-line" d="M384 352 C424 356 462 376 494 406" />
        </g>
      </svg>
    </div>
  `;
}

function renderHandSignalScene(scene, headingId) {
  const gradientId = `${headingId}-handPhoneGlass`;
  const signalToServerGradientId = `${headingId}-handSignalToServerGradient`;
  const branchOneGradientId = `${headingId}-handSignalBranchOneGradient`;
  const branchTwoGradientId = `${headingId}-handSignalBranchTwoGradient`;
  const branchThreeGradientId = `${headingId}-handSignalBranchThreeGradient`;
  const shadowId = `${headingId}-handSoftShadow`;
  const pathA = `${headingId}-handSignalA`;
  const pathB = `${headingId}-handSignalB`;
  const pathC = `${headingId}-handSignalC`;
  const pathD = `${headingId}-handSignalD`;
  const server = scene.server || {};
  const targets = scene.targets || [];

  return `
    <div class="hand-signal-scene">
      <h2 class="sr-only" id="${headingId}">${escapeHtml(scene.ariaLabel || 'E-stream hand signal scene')}</h2>
      <svg class="hand-signal-scene__svg" viewBox="0 0 ${state.language === 'hy' ? 1180 : 1120} 640" role="img" aria-labelledby="${headingId}" focusable="false">
        <defs>
          <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="100%" stop-color="#edf3f7" />
          </linearGradient>
          <linearGradient id="${signalToServerGradientId}" gradientUnits="userSpaceOnUse" x1="198" y1="282" x2="580" y2="168">
            <stop offset="0%" stop-color="#003366" stop-opacity="0.82" />
            <stop offset="100%" stop-color="#003366" stop-opacity="0.58" />
          </linearGradient>
          <linearGradient id="${branchOneGradientId}" gradientUnits="userSpaceOnUse" x1="780" y1="222" x2="480" y2="370">
            <stop offset="0%" stop-color="#003366" stop-opacity="0.76" />
            <stop offset="54%" stop-color="#315777" stop-opacity="0.72" />
            <stop offset="100%" stop-color="#9a171b" stop-opacity="0.74" />
          </linearGradient>
          <linearGradient id="${branchTwoGradientId}" gradientUnits="userSpaceOnUse" x1="780" y1="222" x2="940" y2="370">
            <stop offset="0%" stop-color="#003366" stop-opacity="0.76" />
            <stop offset="54%" stop-color="#315777" stop-opacity="0.72" />
            <stop offset="100%" stop-color="#9a171b" stop-opacity="0.74" />
          </linearGradient>
          <linearGradient id="${branchThreeGradientId}" gradientUnits="userSpaceOnUse" x1="780" y1="222" x2="710" y2="510">
            <stop offset="0%" stop-color="#003366" stop-opacity="0.76" />
            <stop offset="54%" stop-color="#315777" stop-opacity="0.72" />
            <stop offset="100%" stop-color="#9a171b" stop-opacity="0.74" />
          </linearGradient>
          <filter id="${shadowId}" x="-30%" y="-30%" width="170%" height="170%">
            <feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#102030" flood-opacity="0.14" />
          </filter>
        </defs>

        <text class="hand-signal-scene__title" x="560" y="18" text-anchor="middle">${escapeHtml(scene.title || '')}</text>
        <path id="${pathA}" class="hand-signal-scene__line hand-signal-scene__line--to-server" style="stroke: url(#${signalToServerGradientId});" d="M198 282 C354 214 476 182 580 168" />
        ${renderHandTransferLabels(scene.transferLabels, pathA)}
        <path id="${pathB}" class="hand-signal-scene__line hand-signal-scene__line--branch hand-signal-scene__line--branch-one" style="stroke: url(#${branchOneGradientId});" d="M780 222 C700 286 590 330 480 370" />
        <path id="${pathC}" class="hand-signal-scene__line hand-signal-scene__line--branch hand-signal-scene__line--branch-two" style="stroke: url(#${branchTwoGradientId});" d="M780 222 C852 290 912 328 940 370" />
        <path id="${pathD}" class="hand-signal-scene__line hand-signal-scene__line--branch hand-signal-scene__line--branch-three" style="stroke: url(#${branchThreeGradientId});" d="M780 222 C790 340 728 430 710 510" />

        ${renderHandSignalPacket(pathA, 0)}
        ${renderHandSignalPacket(pathB, 0.5)}
        ${renderHandSignalPacket(pathC, 0.72)}
        ${renderHandSignalPacket(pathD, 0.94)}

        ${renderHandServerNode(server)}
        <text class="hand-signal-scene__alert-label" x="760" y="318">${escapeHtml(scene.alertLabel || '')}</text>
        ${renderHandRecipientNode(targets[0], 275, 370, 'trusted')}
        ${renderHandRecipientNode(targets[1], 760, 370, 'security')}
        ${renderHandRecipientNode(targets[2], 500, 510, 'public')}

        <g class="hand-signal-scene__held">
          <g class="hand-signal-scene__phone" transform="rotate(-7 250 298)">
            <rect class="hand-signal-scene__phone-body" x="176" y="106" width="188" height="372" rx="40" />
            <rect class="hand-signal-scene__phone-screen" x="196" y="138" width="148" height="308" rx="28" fill="url(#${gradientId})" />
            <rect class="hand-signal-scene__camera" x="236" y="156" width="68" height="8" rx="4" />
            <path class="hand-signal-scene__screen-wave hand-signal-scene__screen-wave--one" d="M232 236 C252 218 288 218 308 236" />
            <path class="hand-signal-scene__screen-wave hand-signal-scene__screen-wave--two" d="M216 268 C248 238 292 238 324 268" />
            <text class="hand-signal-scene__live" x="270" y="336" text-anchor="middle">${escapeHtml(scene.statusLabel || 'LIVE')}</text>
            <circle class="hand-signal-scene__record-pulse" cx="270" cy="370" r="28" />
            <circle class="hand-signal-scene__record-dot" cx="270" cy="370" r="12" />
            <g class="hand-signal-scene__grip-lineart">
              <path class="hand-signal-scene__grip-silhouette" d="M220 628 C226 526 244 430 284 320 C304 266 326 226 356 210 L456 158 V356 C456 378 468 386 488 376 C536 352 566 310 602 270 C640 228 704 220 742 252 C780 284 778 328 742 372 C702 420 672 468 638 526 C608 576 562 610 512 632 V640 H220 Z" />
              <path class="hand-signal-scene__grip-line" d="M220 628 C226 526 244 430 284 320 C304 266 326 226 356 210 L456 158" />
              <path class="hand-signal-scene__grip-line" d="M456 158 V356 C456 378 468 386 488 376 C536 352 566 310 602 270 C640 228 704 220 742 252 C780 284 778 328 742 372 C702 420 672 468 638 526 C608 576 562 610 512 632 V640" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  `;
}

function renderHandTransferLabels(labels = {}, pathId) {
  if (!labels.video && !labels.geo) {
    return '';
  }

  return `
    <g class="hand-signal-scene__transfer-labels" aria-hidden="true">
      ${labels.video ? `
        <text class="hand-signal-scene__transfer-label hand-signal-scene__transfer-label--video" dy="-18">
          <textPath href="#${pathId}" startOffset="38%" text-anchor="middle">${escapeHtml(labels.video)}</textPath>
        </text>
      ` : ''}
      ${labels.geo ? `
        <text class="hand-signal-scene__transfer-label hand-signal-scene__transfer-label--geo" dy="22">
          <textPath href="#${pathId}" startOffset="38%" text-anchor="middle">${escapeHtml(labels.geo)}</textPath>
        </text>
      ` : ''}
    </g>
  `;
}

function renderHandServerNode(server = {}) {
  return `
    <g class="hand-signal-scene__server" transform="translate(580 72)">
      <rect class="hand-signal-scene__server-card" width="410" height="150" rx="30" />
      ${server.image ? `
        <clipPath id="handSignalServerArtClip">
          <rect x="14" y="16" width="106" height="106" rx="20" />
        </clipPath>
        <image class="hand-signal-scene__server-art" href="${escapeAttribute(server.image)}" x="-25" y="-22" width="184" height="184" preserveAspectRatio="xMidYMid meet" clip-path="url(#handSignalServerArtClip)" />
      ` : `
        <g class="hand-signal-scene__server-icon" transform="translate(24 31)">
          <rect x="0" y="0" width="70" height="82" rx="14" />
          <path d="M18 22 H52" />
          <path d="M18 41 H52" />
          <path d="M18 60 H42" />
        </g>
      `}
      <text class="hand-signal-scene__server-title" x="122" y="50">${escapeHtml(server.title || '')}</text>
      ${renderSvgTextLines(server.subtitle || [], 122, 80, 'hand-signal-scene__server-subtitle', 22)}
    </g>
  `;
}

function renderHandRecipientNode(target = {}, x, y, modifier) {
  const width = modifier === 'public' ? 420 : 390;

  return `
    <g class="hand-signal-scene__recipient hand-signal-scene__recipient--${modifier}" transform="translate(${x} ${y})">
      <rect class="hand-signal-scene__recipient-card" width="${width}" height="94" rx="27" />
      ${target.image ? `
        <image class="hand-signal-scene__recipient-art" href="${escapeAttribute(target.image)}" x="1" y="5" width="84" height="84" preserveAspectRatio="xMidYMid meet" />
      ` : `
        <circle class="hand-signal-scene__recipient-image" cx="43" cy="46" r="23" />
      `}
      <text class="hand-signal-scene__recipient-title" x="85" y="38" ${state.language === 'hy' && (target.title || '').length > 24 ? `textLength="${width - 110}" lengthAdjust="spacingAndGlyphs"` : ''}>${escapeHtml(target.title || '')}</text>
      ${renderSvgTextLines(target.subtitle || [], 85, 64, 'hand-signal-scene__recipient-subtitle', 19)}
    </g>
  `;
}

function renderSvgTextLines(lines, x, y, className, lineHeight) {
  const textLines = Array.isArray(lines) ? lines : [lines];

  return textLines
    .filter(line => line !== undefined && line !== null && line !== '')
    .map((line, index) => (
      `<text class="${className}" x="${x}" y="${y + index * lineHeight}">${escapeHtml(line)}</text>`
    ))
    .join('');
}

function renderHandSignalPacket(pathId, delay) {
  return `
    <circle class="hand-signal-scene__packet" r="7" style="--packet-delay: ${delay}s">
      <animateMotion dur="2.8s" begin="${delay}s" repeatCount="indefinite" rotate="auto">
        <mpath href="#${pathId}" />
      </animateMotion>
    </circle>
  `;
}

function renderSignalPacket(pathId, delay) {
  return `
    <circle class="signal-scene__packet" r="6" style="--packet-delay: ${delay}s">
      <animateMotion dur="2.9s" begin="${delay}s" repeatCount="indefinite" rotate="auto">
        <mpath href="#${pathId}" />
      </animateMotion>
    </circle>
  `;
}

function renderSceneNode(node = {}, modifier, x, y, delay) {
  const lines = node.lines || [node.title, node.caption].filter(Boolean);
  const lineHeight = 21;
  const startY = -((lines.length - 1) * lineHeight) / 2 + 5;

  return `
    <g class="signal-scene__node signal-scene__node--${modifier}" style="--node-delay: ${delay}s;" transform="translate(${x} ${y})">
      <circle class="signal-scene__node-halo" r="158" />
      <circle class="signal-scene__node-core" r="128" />
      ${renderSvgCenteredLines(lines, 0, startY, 'signal-scene__node-text', lineHeight)}
    </g>
  `;
}

function renderSvgCenteredLines(lines, x, y, className, lineHeight) {
  return (Array.isArray(lines) ? lines : [lines])
    .filter(line => line !== undefined && line !== null && line !== '')
    .map((line, index) => (
      `<text class="${className}" x="${x}" y="${y + index * lineHeight}" text-anchor="middle">${escapeHtml(line)}</text>`
    ))
    .join('');
}

function attachEvents() {
  refs.languageSelect?.addEventListener('change', onLanguageChange);
  refs.screenUp?.addEventListener('click', () => navigateBy(-1));
  refs.screenDown?.addEventListener('click', () => navigateBy(1));
  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  window.addEventListener('touchend', onTouchEnd, { passive: false });
  window.addEventListener('touchcancel', resetTouchState);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('resize', onViewportResize, { passive: true });
  window.addEventListener('pageshow', watchPageZoom);
  window.addEventListener('pagehide', unwatchPageZoom);
  watchPageZoom();
}

function getPageVisualViewport() {
  try {
    return window.top?.visualViewport ?? window.visualViewport;
  } catch {
    return window.visualViewport;
  }
}

function isPageZoomed() {
  return (pageVisualViewport?.scale ?? 1) > 1.01;
}

function syncPageZoom() {
  const zoomed = isPageZoomed();
  document.documentElement.classList.toggle('is-page-zoomed', zoomed);
  if (zoomed) {
    resetTouchState();
  }
}

function watchPageZoom() {
  pageVisualViewport?.addEventListener('resize', syncPageZoom);
  syncPageZoom();
}

function unwatchPageZoom() {
  pageVisualViewport?.removeEventListener('resize', syncPageZoom);
}

function readViewportHeight() {
  return Math.max(1, Math.round(window.innerHeight || document.documentElement.clientHeight || 1));
}

function syncViewportHeight() {
  state.viewportWidth = Math.max(1, Math.round(window.innerWidth || document.documentElement.clientWidth || 1));
  state.viewportHeight = readViewportHeight();
  applyViewportMetrics();
}

function applyViewportMetrics() {
  const sceneReservedHeight = state.viewportWidth <= 460 ? 152 : 148;
  const sceneFitHeight = Math.max(1, state.viewportHeight - sceneReservedHeight);
  const rootStyle = document.documentElement.style;

  rootStyle.setProperty('--viewport-height', `${state.viewportHeight}px`);
  rootStyle.setProperty('--scene-fit-width', `${Math.round(sceneFitHeight * 1.75)}px`);
  rootStyle.setProperty('--signal-scene-fit-width', `${Math.round(sceneFitHeight * 1.5625)}px`);
}

function onViewportResize() {
  window.clearTimeout(state.viewportResizeTimer);
  state.viewportResizeTimer = window.setTimeout(() => {
    const nextWidth = Math.max(1, Math.round(window.innerWidth || document.documentElement.clientWidth || 1));
    const nextHeight = readViewportHeight();

    if (Math.abs(nextWidth - state.viewportWidth) < 2 && Math.abs(nextHeight - state.viewportHeight) < 2) {
      return;
    }

    state.viewportWidth = nextWidth;
    state.viewportHeight = nextHeight;
    applyViewportMetrics();
    updateScreenPosition(false);
  }, 120);
}

function onLanguageChange(event) {
  const nextLanguage = event.target.value;

  if (!isSupportedLanguage(nextLanguage) || nextLanguage === state.language) {
    return;
  }

  state.language = nextLanguage;
  writeStoredLanguage(nextLanguage);
  syncLanguageRoute(nextLanguage);
  render({ suppressCurrentAnimation: true });
}

function onWheel(event) {
  if (event.ctrlKey || isPageZoomed()) {
    return;
  }

  event.preventDefault();

  if (Math.abs(event.deltaY) < 8) {
    return;
  }

  const direction = event.deltaY > 0 ? 1 : -1;

  navigateWithInputLock(direction);
}

function onTouchStart(event) {
  if (isPageZoomed() || event.touches.length !== 1 || isInteractiveTarget(event.target)) {
    resetTouchState();
    return;
  }

  const touch = event.touches[0];

  state.touchActive = true;
  state.touchStartX = touch.clientX;
  state.touchStartY = touch.clientY;
  state.touchLastX = touch.clientX;
  state.touchLastY = touch.clientY;
}

function onTouchMove(event) {
  if (!state.touchActive || isPageZoomed() || event.touches.length !== 1) {
    resetTouchState();
    return;
  }

  const touch = event.touches[0];

  state.touchLastX = touch.clientX;
  state.touchLastY = touch.clientY;
}

function onTouchEnd(event) {
  if (!state.touchActive || isPageZoomed()) {
    resetTouchState();
    return;
  }

  const touch = event.changedTouches?.[0];

  if (touch) {
    state.touchLastX = touch.clientX;
    state.touchLastY = touch.clientY;
  }

  const direction = getSwipeDirection();
  resetTouchState();

  if (!direction) {
    return;
  }

  event.preventDefault();
  navigateWithInputLock(direction);
}

function getSwipeDirection() {
  const deltaX = state.touchStartX - state.touchLastX;
  const deltaY = state.touchStartY - state.touchLastY;
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);

  if (absY < SWIPE_THRESHOLD_PX || absY < absX * SWIPE_AXIS_RATIO) {
    return 0;
  }

  return deltaY > 0 ? 1 : -1;
}

function resetTouchState() {
  state.touchActive = false;
  state.touchStartX = 0;
  state.touchStartY = 0;
  state.touchLastX = 0;
  state.touchLastY = 0;
}

function isInteractiveTarget(target) {
  return target instanceof Element && Boolean(target.closest('button, select, input, textarea, a, .topbar, .screen-nav'));
}

function navigateWithInputLock(direction) {
  if (state.wheelLocked && direction === state.lastWheelDirection) {
    return;
  }

  navigateBy(direction);
  lockWheel(direction);
}

function onKeyDown(event) {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
    return;
  }

  if (IS_EMBEDDED && event.key === 'Escape') {
    event.preventDefault();
    notifyHost('close');
    return;
  }

  if (IS_EMBEDDED && event.key === ' ' && isInteractiveTarget(event.target)) {
    return;
  }

  if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === ' ') {
    event.preventDefault();
    navigateBy(1);
  }

  if (event.key === 'ArrowUp' || event.key === 'PageUp') {
    event.preventDefault();
    navigateBy(-1);
  }
}

function lockWheel(direction) {
  window.clearTimeout(state.wheelTimer);
  state.wheelLocked = true;
  state.lastWheelDirection = direction;
  state.wheelTimer = window.setTimeout(() => {
    state.wheelLocked = false;
  }, 400);
}

function navigateBy(delta) {
  navigateTo(state.currentIndex + delta);
}

function navigateTo(index) {
  const nextIndex = clamp(index, 0, Math.max(state.screenCount - 1, 0));

  if (nextIndex === state.currentIndex) {
    updateNavigationState();
    return;
  }

  clearAnimationSuppression();
  state.currentIndex = nextIndex;
  updateScreenPosition();
}

function clearAnimationSuppression() {
  refs.app?.querySelectorAll('.is-animation-suppressed').forEach(panel => {
    panel.classList.remove('is-animation-suppressed');
  });
}

function updateScreenPosition(animate = true) {
  const track = refs.app?.querySelector('.screen-track');

  if (track instanceof HTMLElement) {
    if (!animate) {
      track.style.transition = 'none';
    }

    track.style.transform = `translate3d(0, -${state.currentIndex * state.viewportHeight}px, 0)`;

    if (!animate) {
      requestAnimationFrame(() => track.style.removeProperty('transition'));
    }
  }

  updateCurrentScreenClass();
  updateNavigationState();
}

function updateCurrentScreenClass() {
  const panels = refs.app?.querySelectorAll('.screen-panel');
  const reduceMotion = prefersReducedMotion();

  panels?.forEach((panel, index) => {
    const isCurrent = index === state.currentIndex;
    const wasCurrent = panel.classList.contains('is-current');

    panel.classList.toggle('is-current', isCurrent);
    panel.toggleAttribute('aria-hidden', !isCurrent);
    if (IS_EMBEDDED) {
      panel.toggleAttribute('inert', !isCurrent);
    }
    syncPanelSvgMotion(panel, isCurrent, !wasCurrent && isCurrent, reduceMotion);
  });
}

function syncPanelSvgMotion(panel, isCurrent, shouldRestart, reduceMotion) {
  panel.querySelectorAll('svg').forEach(svg => {
    if (!hasSvgAnimationControls(svg)) {
      return;
    }

    try {
      if (reduceMotion || !isCurrent) {
        svg.setCurrentTime(0);
        svg.pauseAnimations();
      } else {
        if (shouldRestart) {
          svg.setCurrentTime(0);
        }
        svg.unpauseAnimations();
      }
    } catch {
      // Some browsers expose partial SVG animation APIs; ignore safely.
    }
  });
}

function prefersReducedMotion() {
  return window.matchMedia?.(REDUCED_MOTION_QUERY).matches || false;
}

function hasSvgAnimationControls(svg) {
  return (
    typeof svg.pauseAnimations === 'function' &&
    typeof svg.unpauseAnimations === 'function' &&
    typeof svg.setCurrentTime === 'function'
  );
}

function updateNavigationState() {
  refs.screenUp?.toggleAttribute('disabled', state.currentIndex <= 0);
  refs.screenDown?.toggleAttribute('disabled', state.currentIndex >= state.screenCount - 1);
}

function renderError() {
  if (!refs.app) {
    return;
  }

  refs.app.innerHTML = '<p class="loading">Failed to load page content.</p>';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
