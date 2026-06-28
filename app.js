/* ============================================================
   ESTATEAI — APPLICATION
   ============================================================ */

const state = {
  theme: 'light',
  user: null, // { name, email }
  predictions: [...SAMPLE_HISTORY],
  comparisonIds: [],
  currentResult: null,
  dashboardFilter: { search: '', sortKey: 'timestamp', sortDir: 'desc', page: 1, pageSize: 8 },
  profileTab: 'saved',
  reportRecordId: null,
  benefitTab: 'buyers',
};

/* ============ ROUTER ============ */
const routes = {
  home: renderHome,
  about: renderAbout,
  features: renderFeatures,
  predict: renderPredict,
  dashboard: renderDashboard,
  insights: renderInsights,
  compare: renderCompare,
  reports: renderReports,
  profile: renderProfile,
  login: renderLogin,
  signup: renderSignup,
  'forgot-password': renderForgotPassword,
  contact: renderContact,
  privacy: renderLegal.bind(null, 'privacy'),
  terms: renderLegal.bind(null, 'terms'),
};

function parseHash() {
  const hash = window.location.hash.replace('#/', '') || 'home';
  return hash.split('?')[0];
}

function navigate(route) {
  window.location.hash = '#/' + route;
}

function router() {
  const route = parseHash();
  const renderFn = routes[route] || renderNotFound;
  const app = document.getElementById('app');
  app.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'view';
  app.appendChild(wrapper);
  renderFn(wrapper);

  document.querySelectorAll('[data-route]').forEach(a => {
    a.classList.toggle('is-active', a.dataset.route === route);
  });

  document.getElementById('navLinks').classList.remove('is-open');
  document.getElementById('navToggle').classList.remove('is-open');
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });

  initScrollReveal();
  bindCommonInteractions(wrapper);
}

window.addEventListener('hashchange', router);

/* ============ TOASTS ============ */
function showToast(message, type = 'info', title = null) {
  const stack = document.getElementById('toastStack');
  const toast = document.createElement('div');
  toast.className = 'toast toast--' + type;
  const icons = {
    success: '<path d="M20 6L9 17l-5-5"/>',
    error: '<path d="M12 8v4M12 16h.01M12 2a10 10 0 100 20 10 10 0 000-20z"/>',
    info: '<path d="M12 16v-4M12 8h.01M12 2a10 10 0 100 20 10 10 0 000-20z"/>',
  };
  toast.innerHTML = `
    <svg viewBox="0 0 24 24" class="toast-icon">${icons[type] || icons.info}</svg>
    <div>${title ? `<strong>${title}</strong>` : ''}${message}</div>
  `;
  stack.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('is-leaving');
    setTimeout(() => toast.remove(), 260);
  }, 3600);
}

/* ============ MODAL ============ */
function openModal({ title, body, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, danger = false }) {
  const existing = document.getElementById('globalModal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'globalModal';
  overlay.innerHTML = `
    <div class="modal-box">
      <h3>${title}</h3>
      <p>${body}</p>
      <div class="modal-actions">
        <button class="btn btn-outline btn-sm" id="modalCancel">${cancelText}</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'} btn-sm" id="modalConfirm">${confirmText}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('is-open'));

  function close() {
    overlay.classList.remove('is-open');
    setTimeout(() => overlay.remove(), 250);
  }
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  overlay.querySelector('#modalCancel').addEventListener('click', close);
  overlay.querySelector('#modalConfirm').addEventListener('click', () => { onConfirm && onConfirm(); close(); });
}

/* ============ THEME ============ */
function applyTheme(theme) {
  state.theme = theme;
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
  refreshAllChartThemes();
}

document.getElementById('themeToggle').addEventListener('click', () => {
  applyTheme(state.theme === 'light' ? 'dark' : 'light');
});

/* ============ NAV: scroll / mobile toggle ============ */
const navEl = document.getElementById('mainNav');
window.addEventListener('scroll', () => {
  navEl.classList.toggle('is-scrolled', window.scrollY > 20);
  const backToTop = document.getElementById('backToTop');
}, { passive: true });

const navToggleBtn = document.getElementById('navToggle');
navToggleBtn.addEventListener('click', () => {
  const links = document.getElementById('navLinks');
  const isOpen = links.classList.toggle('is-open');
  navToggleBtn.classList.toggle('is-open', isOpen);
  navToggleBtn.setAttribute('aria-expanded', isOpen);
});

document.getElementById('backToTop').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ============ AUTH UI SYNC ============ */
function syncAuthUI() {
  const loginBtn = document.getElementById('navLoginBtn');
  const signupBtn = document.getElementById('navSignupBtn');
  const avatar = document.getElementById('navAvatar');
  if (state.user) {
    loginBtn.hidden = true;
    signupBtn.hidden = true;
    avatar.hidden = false;
    avatar.textContent = state.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  } else {
    loginBtn.hidden = false;
    signupBtn.hidden = false;
    avatar.hidden = true;
  }
}

/* ============ SCROLL REVEAL (per-view) ============ */
function initScrollReveal() {
  const targets = document.querySelectorAll('.reveal');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('is-visible'), (i % 8) * 50);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  targets.forEach(el => obs.observe(el));
}

/* ============ RIPPLE EFFECT ============ */
function bindRipple(container) {
  container.querySelectorAll('.btn').forEach(btn => {
    if (btn.dataset.rippleBound) return;
    btn.dataset.rippleBound = '1';
    btn.addEventListener('click', function (e) {
      const rect = this.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    });
  });
}

function bindCommonInteractions(container) {
  bindRipple(container);
}

/* ============ COUNTER ANIMATION ============ */
function animateCounter(el, target, opts = {}) {
  const { decimals = 0, suffix = '', duration = 1300, prefix = '' } = opts;
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = target * eased;
    el.textContent = prefix + (decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString('en-IN')) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function observeCounters(container) {
  const counters = container.querySelectorAll('[data-count]');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        animateCounter(el, parseFloat(el.dataset.count), {
          decimals: parseInt(el.dataset.decimals || '0'),
          suffix: el.dataset.suffix || '',
          prefix: el.dataset.prefix || '',
        });
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.4 });
  counters.forEach(c => obs.observe(c));
}

/* ============ FORMAT HELPERS ============ */
function formatLakh(value) {
  return '₹' + value.toFixed(1) + 'L';
}
function formatRupeeFull(lakhs) {
  return '₹' + Math.round(lakhs * 100000).toLocaleString('en-IN');
}
function timeAgo(daysAgo) {
  if (daysAgo === 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  return daysAgo + ' days ago';
}

/* ============================================================
   PREDICTION ENGINE
   Simulated weighted-regression model over 18 input features.
   ============================================================ */

const FEATURE_LABELS = {
  bedrooms: 'Bedrooms', bathrooms: 'Bathrooms', area: 'Property Area', floors: 'Floors',
  age: 'Property Age', garage: 'Garage Capacity', crimeRate: 'Crime Rate', propertyTax: 'Property Tax',
  distance: 'Distance to Jobs', highwayAccess: 'Highway Access', areaIncome: 'Area Income',
  schoolsRating: 'Nearby Schools', hospitalsRating: 'Nearby Hospitals', transportRating: 'Public Transport',
};

function runPrediction(inputs) {
  const base = 30; // base price in lakhs

  const contributions = {
    area: (inputs.area - 1200) * 0.018,
    bedrooms: (inputs.bedrooms - 3) * 5.5,
    bathrooms: (inputs.bathrooms - 2) * 2.8,
    floors: (inputs.floors - 1) * 1.6,
    garage: (inputs.garage - 1) * 2.2,
    areaIncome: (inputs.areaIncome - 10) * 1.9,
    highwayAccess: (inputs.highwayAccess - 5) * 1.1,
    schoolsRating: (inputs.schoolsRating - 3) * 1.4,
    hospitalsRating: (inputs.hospitalsRating - 3) * 0.9,
    transportRating: (inputs.transportRating - 3) * 0.8,
    distance: -(inputs.distance - 5) * 0.85,
    crimeRate: -(inputs.crimeRate - 5) * 0.6,
    age: -(inputs.age - 8) * 0.22,
    propertyTax: -(inputs.propertyTax - 280) * 0.012,
  };

  const conditionAdj = { Excellent: 6, Good: 2, Fair: -3, 'Needs Renovation': -9 }[inputs.condition] || 0;
  const typeAdj = { Villa: 14, Penthouse: 18, 'Independent House': 6, Apartment: 0, Studio: -8 }[inputs.propertyType] || 0;

  let price = base + Object.values(contributions).reduce((a, b) => a + b, 0) + conditionAdj + typeAdj;
  price = Math.max(price, 6);

  // Confidence: based on how far inputs sit from "training data" center
  const distanceFromCenter =
    Math.abs(inputs.area - 1200) / 2500 +
    Math.abs(inputs.bedrooms - 3) / 5 +
    Math.abs(inputs.age - 8) / 30 +
    Math.abs(inputs.crimeRate - 5) / 20 +
    Math.abs(inputs.distance - 5) / 18 +
    Math.abs(inputs.areaIncome - 10) / 35;

  let confidence = 96 - distanceFromCenter * 22;
  confidence = Math.min(Math.max(Math.round(confidence), 60), 97);

  const range = { low: Math.round(price * 0.91 * 10) / 10, high: Math.round(price * 1.09 * 10) / 10 };

  let investment = 'medium';
  if (inputs.areaIncome > 14 && inputs.crimeRate < 5 && inputs.highwayAccess > 6) investment = 'high';
  if (inputs.crimeRate > 18 || inputs.age > 40) investment = 'low';

  const absContrib = Object.fromEntries(Object.entries(contributions).map(([k, v]) => [k, Math.abs(v)]));
  const totalAbs = Object.values(absContrib).reduce((a, b) => a + b, 0) || 1;
  const importance = Object.entries(absContrib)
    .map(([k, v]) => [k, (v / totalAbs) * 100])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const sortedContrib = Object.entries(contributions).sort((a, b) => b[1] - a[1]);
  const topPositive = sortedContrib.filter(([, v]) => v > 0).slice(0, 2).map(([k]) => FEATURE_LABELS[k]);
  const topNegative = sortedContrib.filter(([, v]) => v < 0).slice(-1).map(([k]) => FEATURE_LABELS[k]);

  return { price, confidence, range, investment, importance, topPositive, topNegative, inputs };
}


/* ============================================================
   VIEW: HOME
   ============================================================ */
function renderHome(root) {
  root.innerHTML = `
    <section class="hero">
      <div class="hero-skyline" aria-hidden="true">
        <svg viewBox="0 0 1440 500" preserveAspectRatio="xMidYMax slice">
          <rect x="60" y="260" width="90" height="240" class="skyline-bldg"/>
          <rect x="170" y="190" width="70" height="310" class="skyline-bldg--alt"/>
          <rect x="260" y="230" width="100" height="270" class="skyline-bldg"/>
          <rect x="1190" y="210" width="80" height="290" class="skyline-bldg--alt"/>
          <rect x="1290" y="260" width="90" height="240" class="skyline-bldg"/>
          <rect x="1100" y="290" width="70" height="210" class="skyline-bldg"/>
          <circle cx="200" cy="160" r="3" class="hero-grid-dot"/>
          <circle cx="1240" cy="180" r="3" class="hero-grid-dot"/>
          <circle cx="330" cy="200" r="3" class="hero-grid-dot"/>
        </svg>
      </div>

      <div class="hero-inner">
        <div class="hero-eyebrow"><span class="pulse-dot"></span> AI MODEL LIVE — TRAINED ON 50,000+ LISTINGS</div>
        <h1 class="hero-title">Predict Property Prices<br><span class="hero-title-accent">with AI</span></h1>
        <p class="hero-subtitle">Estimate house prices instantly using intelligent machine learning models based on property characteristics and market data.</p>
        <div class="hero-actions">
          <a href="#/predict" class="btn btn-primary">
            <span>Predict Price</span>
            <svg viewBox="0 0 24 24" class="btn-icon"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </a>
          <a href="#/features" class="btn btn-outline">Explore Platform</a>
        </div>

        <div class="hero-stats">
          <div class="hero-stat"><div class="hero-stat-value" data-count="95" data-suffix="%">0</div><div class="hero-stat-label">Prediction Accuracy</div></div>
          <div class="hero-stat"><div class="hero-stat-value" data-count="48200" data-suffix="+">0</div><div class="hero-stat-label">Total Predictions</div></div>
          <div class="hero-stat"><div class="hero-stat-value" data-count="12600" data-suffix="+">0</div><div class="hero-stat-label">Registered Properties</div></div>
          <div class="hero-stat"><div class="hero-stat-value" data-count="3400" data-suffix="+">0</div><div class="hero-stat-label">Active Users</div></div>
        </div>
      </div>
    </section>

    <section class="ticker-section">
      <div class="ticker-label"><span class="pulse-dot"></span> LIVE VALUATIONS</div>
      <div class="ticker-track" id="tickerTrack"></div>
    </section>

    <section class="section">
      <div class="section-inner">
        <div class="section-head center">
          <div class="eyebrow">Why EstateAI</div>
          <h2>Built for every side of the transaction</h2>
          <p class="section-lead">Whether you're buying, selling, investing, or lending — get a number you can trust.</p>
        </div>
        <div class="features-grid" id="homeFeatureGrid"></div>
      </div>
    </section>

    <section class="section section--alt">
      <div class="section-inner">
        <div class="section-head center">
          <div class="eyebrow">How it works</div>
          <h2>From property details to predicted price</h2>
        </div>
        <div class="features-grid" id="homeStepsGrid"></div>
      </div>
    </section>
  `;

  buildTicker(root.querySelector('#tickerTrack'));
  observeCounters(root);

  const homeFeatures = [
    { icon: '<path d="M13 2L3 14h7l-1 8 11-13h-7l1-7z"/>', title: 'AI Price Prediction', desc: 'Get an instant, data-backed valuation for any property.' },
    { icon: '<path d="M3 3v18h18M7 14l4-4 4 4 5-6"/>', title: 'Intelligent Analytics', desc: 'Track trends and performance across every prediction.' },
    { icon: '<path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>', title: 'Market Insights', desc: 'See which locations are growing fastest right now.' },
    { icon: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>', title: 'Real-Time Calculations', desc: 'Results update the moment you change an input.' },
  ];
  root.querySelector('#homeFeatureGrid').innerHTML = homeFeatures.map(f => `
    <div class="feature-card reveal">
      <div class="feature-icon-wrap"><svg viewBox="0 0 24 24">${f.icon}</svg></div>
      <h4>${f.title}</h4><p>${f.desc}</p>
    </div>
  `).join('');

  const steps = [
    { icon: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>', title: '1. Enter Details', desc: 'Tell us about bedrooms, area, location, and condition.' },
    { icon: '<circle cx="12" cy="12" r="3"/><path d="M12 2a10 10 0 100 20 10 10 0 000-20z"/>', title: '2. AI Analyzes', desc: 'The model compares your inputs against historical sales.' },
    { icon: '<path d="M12 2v20M2 12h20"/>', title: '3. Get Your Estimate', desc: 'See a price range, confidence score, and explanation.' },
    { icon: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>', title: '4. Save or Export', desc: 'Download a report or save it to your dashboard.' },
  ];
  root.querySelector('#homeStepsGrid').innerHTML = steps.map(s => `
    <div class="feature-card reveal">
      <div class="feature-icon-wrap"><svg viewBox="0 0 24 24">${s.icon}</svg></div>
      <h4>${s.title}</h4><p>${s.desc}</p>
    </div>
  `).join('');
}

function buildTicker(track) {
  const rand = seededRandom(7);
  const sampleProps = SAMPLE_HISTORY.slice(0, 10);
  const cardsHtml = sampleProps.map(p => {
    const delta = (rand() * 8 - 2).toFixed(1);
    const isUp = parseFloat(delta) >= 0;
    return `
      <div class="ticker-card">
        <div class="ticker-card-icon"><svg viewBox="0 0 24 24"><path d="M3 21V11L12 4L21 11V21H14V15H10V21H3Z"/></svg></div>
        <div>
          <div class="ticker-card-name">${p.locality}, ${p.city}</div>
          <div class="ticker-card-price">${formatLakh(p.price)}</div>
        </div>
        <span class="ticker-card-delta ${isUp ? 'up' : 'down'}">${isUp ? '▲' : '▼'} ${Math.abs(delta)}%</span>
      </div>
    `;
  }).join('');
  // duplicate for seamless loop
  track.innerHTML = cardsHtml + cardsHtml;
}


/* ============================================================
   VIEW: ABOUT
   ============================================================ */
const BENEFITS = {
  buyers: { title: 'Home Buyers', desc: 'Know whether an asking price is fair before you make an offer, with a number grounded in comparable sales.' },
  sellers: { title: 'Home Sellers', desc: 'List at a price that attracts serious buyers quickly, backed by data rather than a guess.' },
  agencies: { title: 'Real Estate Agencies', desc: 'Price entire portfolios consistently across cities and teams in seconds.' },
  investors: { title: 'Property Investors', desc: 'Spot undervalued properties and high-growth localities before the market catches on.' },
  banks: { title: 'Financial Institutions', desc: 'Evaluate collateral value for loans with a defensible, repeatable methodology.' },
};

function renderAbout(root) {
  root.innerHTML = `
    <section class="section" style="padding-top:56px;">
      <div class="section-inner">
        <div class="section-head center">
          <div class="eyebrow">About EstateAI</div>
          <h2>Property valuation, rebuilt on data</h2>
          <p class="section-lead">EstateAI analyzes dozens of housing characteristics — size, location, condition, and neighborhood signals — to estimate a property's fair market value in seconds.</p>
        </div>

        <div class="about-grid">
          <div class="about-visual reveal">
            <svg viewBox="0 0 24 24"><path d="M3 21V11L12 4L21 11V21H14V15H10V21H3Z"/><circle cx="17.5" cy="8" r="2.4"/></svg>
          </div>
          <div class="about-copy reveal">
            <h3>How the model works</h3>
            <p>Every property is converted into a set of numerical features — bedrooms, area, age, crime rate, school ratings, and more. A trained regression model weighs each feature against patterns learned from thousands of past transactions, then outputs a price estimate along with a confidence score.</p>
            <p>The more a property's features resemble the data the model was trained on, the higher its confidence score — just like a human appraiser who is more certain about a familiar neighborhood than an unusual one.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section section--alt">
      <div class="section-inner">
        <div class="section-head center">
          <div class="eyebrow">Who it's for</div>
          <h2>Built for every stakeholder</h2>
        </div>
        <div class="benefit-tabs" id="benefitTabs"></div>
        <div class="benefit-panel" id="benefitPanel"></div>
      </div>
    </section>
  `;

  const tabsEl = root.querySelector('#benefitTabs');
  const panelEl = root.querySelector('#benefitPanel');

  function renderBenefitTabs() {
    tabsEl.innerHTML = Object.entries(BENEFITS).map(([key, b]) => `
      <button class="benefit-tab ${state.benefitTab === key ? 'is-active' : ''}" data-key="${key}">${b.title}</button>
    `).join('');
    const active = BENEFITS[state.benefitTab];
    panelEl.innerHTML = `<h4>${active.title}</h4><p>${active.desc}</p>`;

    tabsEl.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        state.benefitTab = btn.dataset.key;
        renderBenefitTabs();
      });
    });
  }
  renderBenefitTabs();
}

/* ============================================================
   VIEW: FEATURES
   ============================================================ */
const FEATURES_LIST = [
  { icon: '<path d="M13 2L3 14h7l-1 8 11-13h-7l1-7z"/>', title: 'AI Price Prediction', desc: 'Instant valuations from 18+ property and location signals.' },
  { icon: '<path d="M3 3v18h18M7 14l4-4 4 4 5-6"/>', title: 'Intelligent Analytics', desc: 'A live dashboard tracking every prediction you make.' },
  { icon: '<path d="M9 21H3v-6M21 3l-7 7M3 21l7-7M21 9V3h-6"/>', title: 'Property Comparison', desc: 'Compare properties side-by-side with auto-highlighted winners.' },
  { icon: '<path d="M12 8v4l3 3M12 2a10 10 0 100 20 10 10 0 000-20z"/>', title: 'Prediction History', desc: 'Every estimate is saved and searchable later.' },
  { icon: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>', title: 'Market Insights', desc: 'Track price trends and demand across top localities.' },
  { icon: '<path d="M4 19h16M4 15h10M4 11h16M4 7h7"/>', title: 'Interactive Dashboard', desc: 'Filter, search, and sort your prediction history.' },
  { icon: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>', title: 'Real-Time Calculations', desc: 'No page reloads — results update as you adjust inputs.' },
  { icon: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>', title: 'Download Reports', desc: 'Export any prediction as a CSV or printable PDF preview.' },
  { icon: '<path d="M20 21a8 8 0 10-16 0M12 11a4 4 0 100-8 4 4 0 000 8z"/>', title: 'Personalized Recommendations', desc: "Get notes on what would raise a property's value." },
  { icon: '<path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>', title: 'AI Assistant', desc: 'Ask questions about your results anytime, in plain language.' },
];

function renderFeatures(root) {
  root.innerHTML = `
    <section class="section" style="padding-top:56px;">
      <div class="section-inner">
        <div class="section-head center">
          <div class="eyebrow">Platform Features</div>
          <h2>Everything you need to value a property</h2>
        </div>
        <div class="features-grid" id="featuresGridFull"></div>
      </div>
    </section>
  `;
  root.querySelector('#featuresGridFull').innerHTML = FEATURES_LIST.map(f => `
    <div class="feature-card reveal">
      <div class="feature-icon-wrap"><svg viewBox="0 0 24 24">${f.icon}</svg></div>
      <h4>${f.title}</h4><p>${f.desc}</p>
    </div>
  `).join('');
}


/* ============================================================
   VIEW: PREDICT
   ============================================================ */
function renderPredict(root) {
  root.innerHTML = `
    <section class="section predict-hero">
      <div class="section-inner">
        <div class="eyebrow" style="justify-content:center;display:flex;">Price Prediction</div>
        <h2 style="margin-bottom:8px;">Get an instant AI valuation</h2>
        <p class="section-lead" style="margin:0 auto;">Fill in the property details below — every field affects the estimate.</p>
      </div>
    </section>

    <section class="section" style="padding-top:0;">
      <div class="section-inner">
        <div class="predict-layout">
          <div class="predict-form-card glass">
            <div class="predict-form-head">
              <h3>Property Details</h3>
              <button class="btn btn-text btn-sm" id="loadSampleBtn">
                <svg viewBox="0 0 24 24" class="btn-icon" style="width:15px;height:15px;"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                Load Sample Data
              </button>
            </div>

            <form id="predictForm" novalidate>
              <div class="form-grid">
                <div class="form-field" data-field="bedrooms">
                  <label>Bedrooms <span class="required-mark">*</span></label>
                  <input type="number" id="f_bedrooms" min="1" max="10" required>
                  <span class="field-error">Enter a number between 1 and 10.</span>
                </div>
                <div class="form-field" data-field="bathrooms">
                  <label>Bathrooms <span class="required-mark">*</span></label>
                  <input type="number" id="f_bathrooms" min="1" max="8" required>
                  <span class="field-error">Enter a number between 1 and 8.</span>
                </div>
                <div class="form-field" data-field="area">
                  <label>Property Area (sq.ft) <span class="required-mark">*</span></label>
                  <input type="number" id="f_area" min="200" max="10000" required>
                  <span class="field-error">Enter an area between 200 and 10,000 sq.ft.</span>
                </div>
                <div class="form-field" data-field="floors">
                  <label>Number of Floors <span class="required-mark">*</span></label>
                  <input type="number" id="f_floors" min="1" max="5" required>
                  <span class="field-error">Enter a number between 1 and 5.</span>
                </div>
                <div class="form-field" data-field="age">
                  <label>Property Age (years) <span class="required-mark">*</span></label>
                  <input type="number" id="f_age" min="0" max="100" required>
                  <span class="field-error">Enter an age between 0 and 100.</span>
                </div>
                <div class="form-field" data-field="garage">
                  <label>Garage Capacity</label>
                  <input type="number" id="f_garage" min="0" max="6">
                  <span class="field-error">Enter a number between 0 and 6.</span>
                </div>

                <div class="form-divider"></div>

                <div class="form-field" data-field="crimeRate">
                  <label>Crime Rate (per 1,000) <span class="range-out" id="out_crimeRate"></span></label>
                  <div class="range-field"><input type="range" id="f_crimeRate" min="0" max="40" step="0.5"></div>
                </div>
                <div class="form-field" data-field="propertyTax">
                  <label>Property Tax Rate <span class="range-out" id="out_propertyTax"></span></label>
                  <div class="range-field"><input type="range" id="f_propertyTax" min="50" max="800" step="10"></div>
                </div>
                <div class="form-field" data-field="distance">
                  <label>Distance to Employment (km) <span class="range-out" id="out_distance"></span></label>
                  <div class="range-field"><input type="range" id="f_distance" min="0.5" max="25" step="0.5"></div>
                </div>
                <div class="form-field" data-field="highwayAccess">
                  <label>Highway Accessibility (1–10) <span class="range-out" id="out_highwayAccess"></span></label>
                  <div class="range-field"><input type="range" id="f_highwayAccess" min="1" max="10" step="1"></div>
                </div>
                <div class="form-field full" data-field="areaIncome">
                  <label>Average Area Income (₹ lakh/yr) <span class="range-out" id="out_areaIncome"></span></label>
                  <div class="range-field"><input type="range" id="f_areaIncome" min="2" max="45" step="0.5"></div>
                </div>

                <div class="form-divider"></div>

                <div class="form-field" data-field="schoolsRating">
                  <label>Nearby Schools Rating</label>
                  <div class="rating-stars" data-rating-field="schoolsRating"></div>
                </div>
                <div class="form-field" data-field="hospitalsRating">
                  <label>Nearby Hospitals Rating</label>
                  <div class="rating-stars" data-rating-field="hospitalsRating"></div>
                </div>
                <div class="form-field" data-field="transportRating">
                  <label>Public Transport Rating</label>
                  <div class="rating-stars" data-rating-field="transportRating"></div>
                </div>
                <div class="form-field" data-field="condition">
                  <label>Property Condition</label>
                  <select id="f_condition">
                    <option>Excellent</option><option>Good</option><option>Fair</option><option>Needs Renovation</option>
                  </select>
                </div>

                <div class="form-divider"></div>

                <div class="form-field" data-field="propertyType">
                  <label>Property Type</label>
                  <select id="f_propertyType">
                    <option>Apartment</option><option>Independent House</option><option>Villa</option><option>Studio</option><option>Penthouse</option>
                  </select>
                </div>
                <div class="form-field" data-field="city">
                  <label>City <span class="required-mark">*</span></label>
                  <select id="f_city"></select>
                </div>
                <div class="form-field" data-field="locality">
                  <label>Locality</label>
                  <select id="f_locality"></select>
                </div>
                <div class="form-field" data-field="zip">
                  <label>Zip Code</label>
                  <input type="text" id="f_zip" maxlength="6" placeholder="e.g. 500032">
                  <span class="field-error">Enter a valid 6-digit zip code.</span>
                </div>
              </div>

              <div class="form-actions">
                <button type="submit" class="btn btn-primary" id="predictSubmitBtn">
                  <span>Predict Price</span>
                  <svg viewBox="0 0 24 24" class="btn-icon"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </button>
                <button type="reset" class="btn btn-outline" id="predictResetBtn">Reset</button>
              </div>
            </form>
          </div>

          <div class="predict-result" id="predictResultWrap">
            <div class="result-empty" id="resultEmptyState">
              <svg viewBox="0 0 24 24"><path d="M13 2L3 14h7l-1 8 11-13h-7l1-7z"/></svg>
              <p>Fill in the property details and click <strong>Predict Price</strong> to see an AI valuation here.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  initPredictForm(root);
}

function initPredictForm(root) {
  const citySelect = root.querySelector('#f_city');
  citySelect.innerHTML = CITIES.map(c => `<option value="${c}">${c}</option>`).join('');

  function refreshLocalities(city) {
    const localitySelect = root.querySelector('#f_locality');
    const list = LOCALITIES[city] || [];
    localitySelect.innerHTML = list.map(l => `<option value="${l}">${l}</option>`).join('');
  }

  citySelect.addEventListener('change', () => refreshLocalities(citySelect.value));

  // Range field live output
  const rangeFields = ['crimeRate', 'propertyTax', 'distance', 'highwayAccess', 'areaIncome'];
  function syncRangeOut(key) {
    const input = root.querySelector('#f_' + key);
    const out = root.querySelector('#out_' + key);
    out.textContent = parseFloat(input.value).toString();
  }
  rangeFields.forEach(key => {
    root.querySelector('#f_' + key).addEventListener('input', () => syncRangeOut(key));
  });

  // Star ratings
  function buildStars(field, value) {
    const wrap = root.querySelector(`[data-rating-field="${field}"]`);
    wrap.dataset.value = value;
    wrap.innerHTML = [1,2,3,4,5].map(n => `
      <button type="button" data-n="${n}" class="${n <= value ? 'is-active' : ''}" aria-label="${n} star">
        <svg viewBox="0 0 24 24" fill="${n <= value ? 'currentColor' : 'none'}"><path d="M12 2l3.1 6.6 7.2.9-5.3 5 1.4 7.1L12 18l-6.4 3.6 1.4-7.1-5.3-5 7.2-.9z"/></svg>
      </button>
    `).join('');
    wrap.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => buildStars(field, parseInt(btn.dataset.n)));
    });
  }

  function fillForm(data) {
    root.querySelector('#f_bedrooms').value = data.bedrooms;
    root.querySelector('#f_bathrooms').value = data.bathrooms;
    root.querySelector('#f_area').value = data.area;
    root.querySelector('#f_floors').value = data.floors;
    root.querySelector('#f_age').value = data.age;
    root.querySelector('#f_garage').value = data.garage;
    root.querySelector('#f_crimeRate').value = data.crimeRate;
    root.querySelector('#f_propertyTax').value = data.propertyTax;
    root.querySelector('#f_distance').value = data.distance;
    root.querySelector('#f_highwayAccess').value = data.highwayAccess;
    root.querySelector('#f_areaIncome').value = data.areaIncome;
    rangeFields.forEach(syncRangeOut);
    buildStars('schoolsRating', data.schoolsRating);
    buildStars('hospitalsRating', data.hospitalsRating);
    buildStars('transportRating', data.transportRating);
    root.querySelector('#f_condition').value = data.condition;
    root.querySelector('#f_propertyType').value = data.propertyType;
    root.querySelector('#f_city').value = data.city;
    refreshLocalities(data.city);
    root.querySelector('#f_locality').value = data.locality;
    root.querySelector('#f_zip').value = data.zip;
  }

  fillForm(SAMPLE_PROPERTY_FORM);

  root.querySelector('#loadSampleBtn').addEventListener('click', () => {
    const rand = seededRandom(Date.now() % 1000);
    const city = CITIES[Math.floor(rand() * CITIES.length)];
    const localities = LOCALITIES[city];
    fillForm({
      bedrooms: 2 + Math.floor(rand() * 4),
      bathrooms: 1 + Math.floor(rand() * 3),
      area: Math.round(800 + rand() * 2200),
      floors: 1 + Math.floor(rand() * 3),
      age: Math.floor(rand() * 25),
      garage: Math.floor(rand() * 3),
      crimeRate: Math.round(rand() * 20),
      propertyTax: Math.round(150 + rand() * 400),
      distance: Math.round((1 + rand() * 12) * 2) / 2,
      highwayAccess: 1 + Math.floor(rand() * 9),
      areaIncome: Math.round((4 + rand() * 24) * 2) / 2,
      schoolsRating: 1 + Math.floor(rand() * 5),
      hospitalsRating: 1 + Math.floor(rand() * 5),
      transportRating: 1 + Math.floor(rand() * 5),
      condition: CONDITIONS[Math.floor(rand() * CONDITIONS.length)],
      propertyType: PROPERTY_TYPES[Math.floor(rand() * PROPERTY_TYPES.length)],
      city, locality: localities[Math.floor(rand() * localities.length)],
      zip: String(100000 + Math.floor(rand() * 800000)).slice(0, 6),
    });
    showToast('Sample property data loaded.', 'info');
  });

  const form = root.querySelector('#predictForm');

  function validateField(fieldEl, input, min, max, label) {
    const val = parseFloat(input.value);
    const valid = input.value !== '' && !isNaN(val) && val >= min && val <= max;
    fieldEl.classList.toggle('has-error', !valid);
    return valid;
  }

  function validateForm() {
    let valid = true;
    const checks = [
      ['bedrooms', 1, 10], ['bathrooms', 1, 8], ['area', 200, 10000],
      ['floors', 1, 5], ['age', 0, 100],
    ];
    checks.forEach(([key, min, max]) => {
      const fieldEl = root.querySelector(`[data-field="${key}"]`);
      const input = root.querySelector('#f_' + key);
      if (!validateField(fieldEl, input, min, max)) valid = false;
    });
    // zip
    const zipField = root.querySelector('[data-field="zip"]');
    const zipInput = root.querySelector('#f_zip');
    const zipValid = /^\d{6}$/.test(zipInput.value.trim());
    zipField.classList.toggle('has-error', !zipValid);
    if (!zipValid) valid = false;

    return valid;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('Please fix the highlighted fields before continuing.', 'error', 'Check your inputs');
      return;
    }

    const submitBtn = root.querySelector('#predictSubmitBtn');
    submitBtn.classList.add('is-loading');
    submitBtn.querySelector('span').textContent = 'Analyzing…';

    const inputs = {
      bedrooms: parseFloat(root.querySelector('#f_bedrooms').value),
      bathrooms: parseFloat(root.querySelector('#f_bathrooms').value),
      area: parseFloat(root.querySelector('#f_area').value),
      floors: parseFloat(root.querySelector('#f_floors').value),
      age: parseFloat(root.querySelector('#f_age').value),
      garage: parseFloat(root.querySelector('#f_garage').value || 0),
      crimeRate: parseFloat(root.querySelector('#f_crimeRate').value),
      propertyTax: parseFloat(root.querySelector('#f_propertyTax').value),
      distance: parseFloat(root.querySelector('#f_distance').value),
      highwayAccess: parseFloat(root.querySelector('#f_highwayAccess').value),
      areaIncome: parseFloat(root.querySelector('#f_areaIncome').value),
      schoolsRating: parseInt(root.querySelector('[data-rating-field="schoolsRating"]').dataset.value),
      hospitalsRating: parseInt(root.querySelector('[data-rating-field="hospitalsRating"]').dataset.value),
      transportRating: parseInt(root.querySelector('[data-rating-field="transportRating"]').dataset.value),
      condition: root.querySelector('#f_condition').value,
      propertyType: root.querySelector('#f_propertyType').value,
      city: root.querySelector('#f_city').value,
      locality: root.querySelector('#f_locality').value,
      zip: root.querySelector('#f_zip').value,
    };

    setTimeout(() => {
      const result = runPrediction(inputs);
      state.currentResult = result;
      renderPredictionResult(root, result);

      // Save to history + bump dashboard stats
      const record = {
        id: 'PR' + Math.floor(1000 + Math.random() * 9000),
        city: inputs.city, locality: inputs.locality, propertyType: inputs.propertyType,
        area: inputs.area, bedrooms: inputs.bedrooms, bathrooms: inputs.bathrooms, age: inputs.age,
        price: result.price, confidence: result.confidence, daysAgo: 0, timestamp: Date.now(),
      };
      state.predictions.unshift(record);

      submitBtn.classList.remove('is-loading');
      submitBtn.querySelector('span').textContent = 'Predict Price';
      showToast('Prediction saved to your dashboard.', 'success', 'Estimate ready');
    }, 700);
  });

  form.addEventListener('reset', () => {
    setTimeout(() => {
      fillForm(SAMPLE_PROPERTY_FORM);
      root.querySelectorAll('.form-field').forEach(f => f.classList.remove('has-error'));
      if (!root.querySelector('#resultEmptyState')) resetResultPanel(root);
    }, 0);
  });
}

function resetResultPanel(root) {
  const wrap = root.querySelector('#predictResultWrap');
  wrap.innerHTML = `
    <div class="result-empty" id="resultEmptyState">
      <svg viewBox="0 0 24 24"><path d="M13 2L3 14h7l-1 8 11-13h-7l1-7z"/></svg>
      <p>Fill in the property details and click <strong>Predict Price</strong> to see an AI valuation here.</p>
    </div>
  `;
}

function renderPredictionResult(root, result) {
  const wrap = root.querySelector('#predictResultWrap');
  const investLabel = { high: 'High Potential', medium: 'Moderate Potential', low: 'Limited Potential' }[result.investment];

  let explainText = '';
  if (result.topPositive.length) explainText += `Driven up mainly by <strong>${result.topPositive.join(' and ')}</strong>. `;
  if (result.topNegative.length) explainText += `Held back by <strong>${result.topNegative[0]}</strong>.`;

  wrap.innerHTML = `
    <div class="result-card glass">
      <div class="result-badge"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg> Prediction Complete</div>
      <div class="result-label">Estimated Property Price</div>
      <div class="result-price">${formatRupeeFull(result.price)}</div>
      <div class="result-range">Predicted range: <strong>${formatLakh(result.range.low)} – ${formatLakh(result.range.high)}</strong></div>

      <div class="result-meta-row">
        <div class="result-meta-card">
          <div class="meta-label">Investment Rating</div>
          <span class="investment-pill ${result.investment}">${investLabel}</span>
        </div>
        <div class="result-meta-card">
          <div class="meta-label">Market Value Indicator</div>
          <div class="meta-value">${result.price > 60 ? 'Premium' : result.price > 30 ? 'Mid-Market' : 'Affordable'}</div>
        </div>
      </div>

      <div class="confidence-row">
        <div class="confidence-ring-wrap">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" class="confidence-ring-track"/>
            <circle cx="50" cy="50" r="40" class="confidence-ring-fill" id="confRing"/>
          </svg>
          <div class="confidence-ring-text"><span id="confRingVal">0</span><small>CONFIDENCE</small></div>
        </div>
        <div class="result-explain">${explainText}</div>
      </div>

      <h4 class="importance-title">Feature Importance</h4>
      <div class="importance-bars" id="importanceBarsPredict"></div>

      <div class="result-footer-actions">
        <a href="#/dashboard" class="btn btn-secondary btn-sm">View in Dashboard</a>
        <a href="#/reports" class="btn btn-outline btn-sm" id="goToReportBtn">Generate Report</a>
        <a href="#/compare" class="btn btn-outline btn-sm">Add to Comparison</a>
      </div>
    </div>
  `;

  // animate confidence ring
  const ring = wrap.querySelector('#confRing');
  const ringVal = wrap.querySelector('#confRingVal');
  const dashTotal = 251;
  requestAnimationFrame(() => {
    ring.style.strokeDashoffset = dashTotal * (1 - result.confidence / 100);
  });
  animateCounter(ringVal, result.confidence, { duration: 1100 });

  // importance bars
  const bars = wrap.querySelector('#importanceBarsPredict');
  bars.innerHTML = result.importance.map(([key, val]) => `
    <div class="importance-row">
      <span class="imp-label">${FEATURE_LABELS[key]}</span>
      <span class="imp-track"><span class="imp-fill" data-w="${val.toFixed(1)}"></span></span>
      <span class="imp-val">${val.toFixed(1)}%</span>
    </div>
  `).join('');
  requestAnimationFrame(() => {
    bars.querySelectorAll('.imp-fill').forEach(bar => { bar.style.width = bar.dataset.w + '%'; });
  });

  state.reportRecordId = state.predictions[0] ? state.predictions[0].id : null;
  bindRipple(wrap);
}


/* ============================================================
   VIEW: DASHBOARD
   ============================================================ */
function renderDashboard(root) {
  root.innerHTML = `
    <section class="section" style="padding-top:48px;">
      <div class="section-inner">
        <div class="dashboard-toolbar">
          <h2>Your Dashboard</h2>
          <div class="toolbar-actions">
            <button class="btn btn-outline btn-sm" id="refreshDashBtn">
              <svg viewBox="0 0 24 24" class="btn-icon" style="width:15px;height:15px;"><path d="M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0114.5-4.5L23 9M20.5 15a9 9 0 01-14.5 4.5L1 15"/></svg>
              Refresh
            </button>
            <a href="#/reports" class="btn btn-primary btn-sm">
              <svg viewBox="0 0 24 24" class="btn-icon" style="width:15px;height:15px;"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              Export Report
            </a>
          </div>
        </div>

        <div class="dash-stats" id="dashStats"></div>

        <div class="dash-charts-grid">
          <div class="chart-card">
            <div class="chart-card-head"><h4>Predicted Price Trend</h4></div>
            <canvas id="dashTrendChart" height="230"></canvas>
          </div>
          <div class="chart-card">
            <div class="chart-card-head"><h4>By Property Type</h4></div>
            <canvas id="dashPieChart" height="230"></canvas>
          </div>
        </div>
        <div class="dash-charts-grid-2">
          <div class="chart-card">
            <div class="chart-card-head"><h4>Predictions by City</h4></div>
            <canvas id="dashBarChart" height="220"></canvas>
          </div>
          <div class="chart-card">
            <div class="chart-card-head"><h4>Confidence Score Distribution</h4></div>
            <canvas id="dashAreaChart" height="220"></canvas>
          </div>
        </div>

        <div class="table-card">
          <div class="table-card-head">
            <h4 style="font-size:15px;">Recent Predictions</h4>
            <div class="table-search">
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
              <input type="text" id="dashSearchInput" placeholder="Search city, locality, or ID...">
            </div>
          </div>
          <div style="overflow-x:auto;">
            <table class="data-table" id="dashTable">
              <thead>
                <tr>
                  <th data-sort="id">ID <span class="sort-arrow">↕</span></th>
                  <th data-sort="city">Location <span class="sort-arrow">↕</span></th>
                  <th data-sort="propertyType">Type <span class="sort-arrow">↕</span></th>
                  <th data-sort="area">Area <span class="sort-arrow">↕</span></th>
                  <th data-sort="price">Price <span class="sort-arrow">↕</span></th>
                  <th data-sort="confidence">Confidence <span class="sort-arrow">↕</span></th>
                  <th data-sort="timestamp">Date <span class="sort-arrow">↕</span></th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="dashTableBody"></tbody>
            </table>
          </div>
          <div class="table-pagination" id="dashPagination"></div>
        </div>
      </div>
    </section>
  `;

  renderDashStats(root);
  buildDashCharts();
  bindDashTable(root);

  root.querySelector('#refreshDashBtn').addEventListener('click', (e) => {
    const btn = e.currentTarget;
    btn.querySelector('svg').style.transition = 'transform 0.5s';
    btn.querySelector('svg').style.transform = 'rotate(360deg)';
    setTimeout(() => { btn.querySelector('svg').style.transform = 'rotate(0deg)'; }, 500);
    renderDashStats(root);
    buildDashCharts();
    bindDashTable(root);
    showToast('Dashboard refreshed.', 'success');
  });
}

function renderDashStats(root) {
  const preds = state.predictions;
  const total = preds.length;
  const avg = total ? preds.reduce((a, p) => a + p.price, 0) / total : 0;
  const highest = total ? Math.max(...preds.map(p => p.price)) : 0;
  const lowest = total ? Math.min(...preds.map(p => p.price)) : 0;

  const cards = [
    { icon: '<path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>', cls: 'c-blue', value: total, suffix: '', label: 'Total Predictions' },
    { icon: '<path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>', cls: 'c-emerald', value: avg, suffix: 'L', prefix: '₹', decimals: 1, label: 'Average Price' },
    { icon: '<path d="M23 6l-9.5 9.5-5-5L1 18"/>', cls: 'c-orange', value: highest, suffix: 'L', prefix: '₹', decimals: 1, label: 'Highest Prediction' },
    { icon: '<path d="M1 6l9.5 9.5 5-5L23 18"/>', cls: 'c-blue', value: lowest, suffix: 'L', prefix: '₹', decimals: 1, label: 'Lowest Prediction' },
  ];

  const statsEl = root.querySelector('#dashStats');
  statsEl.innerHTML = cards.map(c => `
    <div class="dash-stat-card ${c.cls}">
      <div class="stat-icon"><svg viewBox="0 0 24 24">${c.icon}</svg></div>
      <span class="stat-value" data-count="${c.value}" data-suffix="${c.suffix || ''}" data-prefix="${c.prefix || ''}" data-decimals="${c.decimals || 0}">0</span>
      <div class="stat-label">${c.label}</div>
    </div>
  `).join('');
  observeCounters(statsEl);
}

let dashChartInstances = [];
function buildDashCharts() {
  dashChartInstances.forEach(c => c.destroy());
  dashChartInstances = [];

  if (typeof Chart === 'undefined') {
    document.querySelectorAll('#dashTrendChart, #dashPieChart, #dashBarChart, #dashAreaChart').forEach(canvas => {
      const card = canvas.closest('.chart-card');
      if (card) card.innerHTML = '<p style="color:var(--slate);font-size:13px;text-align:center;padding:40px 0;">Chart library unavailable — showing data table only.</p>';
    });
    return;
  }

  const blue = getCssVar('--blue'), emerald = getCssVar('--emerald'), orange = getCssVar('--orange'),
        slate = getCssVar('--slate'), line = getCssVar('--line-soft'), ink = getCssVar('--ink');

  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.color = slate;

  const trendCtx = document.getElementById('dashTrendChart');
  if (trendCtx) {
    dashChartInstances.push(new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: MARKET_TRENDS.labels,
        datasets: [{ label: 'Avg. Price (₹L)', data: MARKET_TRENDS.avgPrice, borderColor: blue, backgroundColor: hexToRgba(blue, 0.1), fill: true, tension: 0.4, pointRadius: 3 }]
      },
      options: { plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: line } } } }
    }));
  }

  const typeCounts = {};
  state.predictions.forEach(p => { typeCounts[p.propertyType || 'Other'] = (typeCounts[p.propertyType || 'Other'] || 0) + 1; });
  const pieCtx = document.getElementById('dashPieChart');
  if (pieCtx) {
    dashChartInstances.push(new Chart(pieCtx, {
      type: 'doughnut',
      data: { labels: Object.keys(typeCounts), datasets: [{ data: Object.values(typeCounts), backgroundColor: [blue, emerald, orange, '#93C5FD', '#6EE7B7'], borderWidth: 0 }] },
      options: { plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10.5 } } } }, cutout: '60%' }
    }));
  }

  const cityCounts = {};
  state.predictions.forEach(p => { cityCounts[p.city] = (cityCounts[p.city] || 0) + 1; });
  const barCtx = document.getElementById('dashBarChart');
  if (barCtx) {
    dashChartInstances.push(new Chart(barCtx, {
      type: 'bar',
      data: { labels: Object.keys(cityCounts), datasets: [{ data: Object.values(cityCounts), backgroundColor: emerald, borderRadius: 6, maxBarThickness: 34 }] },
      options: { plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { font: { size: 10 } } }, y: { grid: { color: line } } } }
    }));
  }

  const confBuckets = [0, 0, 0, 0]; // <70, 70-80, 80-90, 90+
  state.predictions.forEach(p => {
    if (p.confidence < 70) confBuckets[0]++;
    else if (p.confidence < 80) confBuckets[1]++;
    else if (p.confidence < 90) confBuckets[2]++;
    else confBuckets[3]++;
  });
  const areaCtx = document.getElementById('dashAreaChart');
  if (areaCtx) {
    dashChartInstances.push(new Chart(areaCtx, {
      type: 'line',
      data: {
        labels: ['<70%', '70-80%', '80-90%', '90%+'],
        datasets: [{ label: 'Predictions', data: confBuckets, borderColor: orange, backgroundColor: hexToRgba(orange, 0.15), fill: true, tension: 0.35, pointRadius: 4 }]
      },
      options: { plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: line }, beginAtZero: true } } }
    }));
  }
}

function getCssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
function refreshAllChartThemes() {
  if (window.Chart) {
    if (document.getElementById('dashTrendChart')) buildDashCharts();
  }
}

function bindDashTable(root) {
  const searchInput = root.querySelector('#dashSearchInput');
  searchInput.value = state.dashboardFilter.search;
  searchInput.addEventListener('input', () => {
    state.dashboardFilter.search = searchInput.value;
    state.dashboardFilter.page = 1;
    renderDashTableBody(root);
  });

  root.querySelectorAll('#dashTable th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (state.dashboardFilter.sortKey === key) {
        state.dashboardFilter.sortDir = state.dashboardFilter.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        state.dashboardFilter.sortKey = key;
        state.dashboardFilter.sortDir = 'desc';
      }
      renderDashTableBody(root);
    });
  });

  renderDashTableBody(root);
}

function renderDashTableBody(root) {
  const { search, sortKey, sortDir, page, pageSize } = state.dashboardFilter;
  let rows = state.predictions.filter(p => {
    const q = search.toLowerCase();
    return !q || p.city.toLowerCase().includes(q) || p.locality.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
  });

  rows.sort((a, b) => {
    let av = a[sortKey], bv = b[sortKey];
    if (typeof av === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase(); }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  root.querySelectorAll('#dashTable th[data-sort]').forEach(th => {
    th.classList.toggle('is-sorted', th.dataset.sort === sortKey);
    th.querySelector('.sort-arrow').textContent = th.dataset.sort === sortKey ? (sortDir === 'asc' ? '↑' : '↓') : '↕';
  });

  const tbody = root.querySelector('#dashTableBody');
  if (!pageRows.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="table-empty">No predictions match your search.</td></tr>`;
  } else {
    tbody.innerHTML = pageRows.map(p => `
      <tr>
        <td>${p.id}</td>
        <td>${p.locality}, ${p.city}</td>
        <td>${p.propertyType || '—'}</td>
        <td>${p.area.toLocaleString('en-IN')} sq.ft</td>
        <td class="price-cell">${formatLakh(p.price)}</td>
        <td>${p.confidence}%</td>
        <td>${timeAgo(p.daysAgo)}</td>
        <td>
          <div class="table-row-actions">
            <button data-action="compare" data-id="${p.id}" aria-label="Add to compare" title="Add to compare"><svg viewBox="0 0 24 24"><path d="M9 21H3v-6M21 3l-7 7M3 21l7-7M21 9V3h-6"/></svg></button>
            <button data-action="report" data-id="${p.id}" aria-label="Generate report" title="Generate report"><svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg></button>
            <button data-action="delete" data-id="${p.id}" aria-label="Remove" title="Remove"><svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6"/></svg></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  const pag = root.querySelector('#dashPagination');
  pag.innerHTML = `
    <span>Showing ${pageRows.length ? (currentPage - 1) * pageSize + 1 : 0}–${(currentPage - 1) * pageSize + pageRows.length} of ${rows.length}</span>
    <div style="display:flex;gap:6px;">
      <button class="btn btn-outline btn-sm" id="pagPrev" ${currentPage <= 1 ? 'disabled' : ''}>Prev</button>
      <button class="btn btn-outline btn-sm" id="pagNext" ${currentPage >= totalPages ? 'disabled' : ''}>Next</button>
    </div>
  `;
  pag.querySelector('#pagPrev').addEventListener('click', () => { state.dashboardFilter.page = Math.max(1, currentPage - 1); renderDashTableBody(root); });
  pag.querySelector('#pagNext').addEventListener('click', () => { state.dashboardFilter.page = Math.min(totalPages, currentPage + 1); renderDashTableBody(root); });
  bindRipple(pag);

  tbody.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const record = state.predictions.find(p => p.id === id);
      if (!record) return;
      if (action === 'compare') {
        if (!state.comparisonIds.includes(id)) {
          if (state.comparisonIds.length >= 4) { showToast('You can compare up to 4 properties at a time.', 'error'); return; }
          state.comparisonIds.push(id);
          showToast(`${id} added to comparison.`, 'success');
        } else {
          showToast(`${id} is already in your comparison.`, 'info');
        }
      } else if (action === 'report') {
        state.reportRecordId = id;
        navigate('reports');
      } else if (action === 'delete') {
        openModal({
          title: 'Remove this prediction?',
          body: `This will remove ${id} from your saved predictions. This can't be undone.`,
          confirmText: 'Remove', danger: true,
          onConfirm: () => {
            state.predictions = state.predictions.filter(p => p.id !== id);
            renderDashStats(root);
            buildDashCharts();
            renderDashTableBody(root);
            showToast('Prediction removed.', 'success');
          }
        });
      }
    });
  });
}


/* ============================================================
   VIEW: COMPARE
   ============================================================ */
function renderCompare(root) {
  root.innerHTML = `
    <section class="section" style="padding-top:48px;">
      <div class="section-inner">
        <div class="compare-toolbar">
          <div>
            <h2 style="font-size:24px;margin-bottom:6px;">Compare Properties</h2>
            <p style="color:var(--ink-soft);font-size:14px;">Compare up to 4 saved predictions side-by-side.</p>
          </div>
          <button class="btn btn-outline btn-sm" id="clearCompareBtn">Clear All</button>
        </div>
        <div id="compareContent"></div>
      </div>
    </section>
  `;
  renderCompareContent(root);
  root.querySelector('#clearCompareBtn').addEventListener('click', () => {
    state.comparisonIds = [];
    renderCompareContent(root);
    showToast('Comparison cleared.', 'info');
  });
}

function renderCompareContent(root) {
  const container = root.querySelector('#compareContent');
  const items = state.comparisonIds.map(id => state.predictions.find(p => p.id === id)).filter(Boolean);

  if (!items.length) {
    container.innerHTML = `
      <div class="compare-empty">
        <svg viewBox="0 0 24 24"><path d="M9 21H3v-6M21 3l-7 7M3 21l7-7M21 9V3h-6"/></svg>
        <p>No properties added yet. Go to your <a href="#/dashboard" style="color:var(--blue);font-weight:600;">Dashboard</a> and click the compare icon on any prediction.</p>
        <div class="compare-add-select">
          <select id="quickAddSelect"><option value="">Quick add a saved prediction…</option>${state.predictions.slice(0, 20).map(p => `<option value="${p.id}">${p.id} — ${p.locality}, ${p.city}</option>`).join('')}</select>
          <button class="btn btn-primary btn-sm" id="quickAddBtn">Add</button>
        </div>
      </div>
    `;
    container.querySelector('#quickAddBtn').addEventListener('click', () => {
      const id = container.querySelector('#quickAddSelect').value;
      if (!id) return;
      state.comparisonIds.push(id);
      renderCompareContent(root);
    });
    return;
  }

  const metrics = [
    { key: 'price', label: 'Estimated Price', fmt: v => formatLakh(v), higherBetter: true },
    { key: 'area', label: 'Area (sq.ft)', fmt: v => v.toLocaleString('en-IN'), higherBetter: true },
    { key: 'bedrooms', label: 'Bedrooms', fmt: v => v, higherBetter: true },
    { key: 'bathrooms', label: 'Bathrooms', fmt: v => v, higherBetter: true },
    { key: 'age', label: 'Property Age (yrs)', fmt: v => v, higherBetter: false },
    { key: 'confidence', label: 'Location Score', fmt: v => v + '%', higherBetter: true },
  ];

  function bestId(metric) {
    let best = items[0];
    items.forEach(it => {
      if (metric.higherBetter ? it[metric.key] > best[metric.key] : it[metric.key] < best[metric.key]) best = it;
    });
    return best.id;
  }

  // Investment score: synthesize from confidence + age inversely
  items.forEach(it => { it._investScore = Math.round(it.confidence - it.age * 0.4); });
  const investBest = items.reduce((a, b) => (b._investScore > a._investScore ? b : a), items[0]).id;

  container.innerHTML = `
    <div class="compare-table-wrap">
      <table class="compare-table">
        <thead>
          <tr>
            <th>Property</th>
            ${items.map(it => `<th>${it.id} <button class="compare-remove" data-id="${it.id}" aria-label="Remove">✕</button></th>`).join('')}
          </tr>
        </thead>
        <tbody>
          <tr><td class="row-label">Location</td>${items.map(it => `<td>${it.locality}, ${it.city}</td>`).join('')}</tr>
          <tr><td class="row-label">Type</td>${items.map(it => `<td>${it.propertyType || '—'}</td>`).join('')}</tr>
          ${metrics.map(m => {
            const best = bestId(m);
            return `<tr><td class="row-label">${m.label}</td>${items.map(it => `<td class="${it.id === best ? 'best-cell' : ''}">${m.fmt(it[m.key])}${it.id === best ? '<span class="best-badge">★ Best</span>' : ''}</td>`).join('')}</tr>`;
          }).join('')}
          <tr><td class="row-label">Investment Score</td>${items.map(it => `<td class="${it.id === investBest ? 'best-cell' : ''}">${it._investScore}${it.id === investBest ? '<span class="best-badge">★ Best</span>' : ''}</td>`).join('')}</tr>
        </tbody>
      </table>
    </div>
    ${items.length < 4 ? `
      <div class="compare-add-select">
        <select id="quickAddSelect"><option value="">Add another property…</option>${state.predictions.filter(p => !state.comparisonIds.includes(p.id)).slice(0, 20).map(p => `<option value="${p.id}">${p.id} — ${p.locality}, ${p.city}</option>`).join('')}</select>
        <button class="btn btn-primary btn-sm" id="quickAddBtn">Add</button>
      </div>
    ` : ''}
  `;

  container.querySelectorAll('.compare-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      state.comparisonIds = state.comparisonIds.filter(id => id !== btn.dataset.id);
      renderCompareContent(root);
    });
  });
  const quickAddBtn = container.querySelector('#quickAddBtn');
  if (quickAddBtn) {
    quickAddBtn.addEventListener('click', () => {
      const id = container.querySelector('#quickAddSelect').value;
      if (!id) return;
      state.comparisonIds.push(id);
      renderCompareContent(root);
    });
  }
  bindRipple(container);
}

/* ============================================================
   VIEW: INSIGHTS
   ============================================================ */
function renderInsights(root) {
  const avgMarket = MARKET_TRENDS.avgPrice[MARKET_TRENDS.avgPrice.length - 1];
  const yearGrowth = (((avgMarket - MARKET_TRENDS.avgPrice[0]) / MARKET_TRENDS.avgPrice[0]) * 100).toFixed(1);

  root.innerHTML = `
    <section class="section" style="padding-top:48px;">
      <div class="section-inner">
        <div class="section-head">
          <div class="eyebrow">Market Insights</div>
          <h2>Where the market is moving</h2>
        </div>

        <div class="insight-stats">
          <div class="insight-stat-card"><span class="stat-value">₹${avgMarket}L</span><span class="stat-label">Average Market Price</span></div>
          <div class="insight-stat-card"><span class="stat-value">+${yearGrowth}%</span><span class="stat-label">12-Month Price Growth</span></div>
          <div class="insight-stat-card"><span class="stat-value">${POPULAR_LOCATIONS.length}</span><span class="stat-label">Hot Localities Tracked</span></div>
        </div>

        <div class="dash-charts-grid" style="margin-bottom:40px;">
          <div class="chart-card">
            <div class="chart-card-head"><h4>Price Trend (12 months)</h4></div>
            <canvas id="insightTrendChart" height="230"></canvas>
          </div>
          <div class="chart-card">
            <div class="chart-card-head"><h4>Demand by Property Type</h4></div>
            <canvas id="insightDemandChart" height="230"></canvas>
          </div>
        </div>

        <div class="section-head"><h2 style="font-size:22px;">Popular Locations</h2></div>
        <div class="locations-list" id="locationsList"></div>
      </div>
    </section>
  `;

  root.querySelector('#locationsList').innerHTML = POPULAR_LOCATIONS.map(loc => `
    <div class="location-row reveal">
      <span class="location-name">${loc.name}</span>
      <div class="location-meta">
        <span class="location-price">${formatLakh(loc.avgPrice)} avg.</span>
        <span class="location-growth"><svg viewBox="0 0 24 24"><path d="M23 6l-9.5 9.5-5-5L1 18"/></svg> +${loc.growth}%</span>
      </div>
    </div>
  `).join('');
  initScrollReveal();

  if (typeof Chart === 'undefined') {
    document.querySelectorAll('#insightTrendChart, #insightDemandChart').forEach(canvas => {
      const card = canvas.closest('.chart-card');
      if (card) card.innerHTML = '<p style="color:var(--slate);font-size:13px;text-align:center;padding:40px 0;">Chart library unavailable right now.</p>';
    });
    return;
  }

  const blue = getCssVar('--blue'), emerald = getCssVar('--emerald'), orange = getCssVar('--orange'), line = getCssVar('--line-soft');
  new Chart(document.getElementById('insightTrendChart'), {
    type: 'line',
    data: { labels: MARKET_TRENDS.labels, datasets: [{ label: 'Avg Price (₹L)', data: MARKET_TRENDS.avgPrice, borderColor: emerald, backgroundColor: hexToRgba(emerald, 0.12), fill: true, tension: 0.4 }] },
    options: { plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: line } } } }
  });

  const demandData = { 'Apartment': 38, 'Villa': 22, 'Independent House': 24, 'Penthouse': 9, 'Studio': 7 };
  new Chart(document.getElementById('insightDemandChart'), {
    type: 'bar',
    data: { labels: Object.keys(demandData), datasets: [{ data: Object.values(demandData), backgroundColor: [blue, emerald, orange, '#93C5FD', '#6EE7B7'], borderRadius: 6 }] },
    options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { grid: { color: line } }, y: { grid: { display: false } } } }
  });
}


/* ============================================================
   VIEW: REPORTS
   ============================================================ */
function renderReports(root) {
  root.innerHTML = `
    <section class="section" style="padding-top:48px;">
      <div class="section-inner">
        <div class="section-head center">
          <div class="eyebrow">Reports</div>
          <h2>Generate a property report</h2>
          <p class="section-lead">Pick a saved prediction to preview, then export it as a CSV file or print-ready PDF view.</p>
        </div>

        <div style="max-width:640px;margin:0 auto 28px;">
          <select id="reportRecordSelect" style="width:100%;padding:12px 16px;border-radius:var(--radius-sm);border:1.5px solid var(--line);font-size:14px;background:var(--white);"></select>
        </div>

        <div id="reportPreviewWrap"></div>
      </div>
    </section>
  `;

  const select = root.querySelector('#reportRecordSelect');
  select.innerHTML = `<option value="">Select a saved prediction…</option>` + state.predictions.map(p => `<option value="${p.id}">${p.id} — ${p.locality}, ${p.city} (${formatLakh(p.price)})</option>`).join('');

  if (state.reportRecordId && state.predictions.some(p => p.id === state.reportRecordId)) {
    select.value = state.reportRecordId;
    renderReportPreview(root, state.reportRecordId);
  } else {
    renderReportEmpty(root);
  }

  select.addEventListener('change', () => {
    state.reportRecordId = select.value;
    if (select.value) renderReportPreview(root, select.value);
    else renderReportEmpty(root);
  });
}

function renderReportEmpty(root) {
  root.querySelector('#reportPreviewWrap').innerHTML = `
    <div class="report-empty">
      <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
      <p>Select a prediction above to preview its report.</p>
    </div>
  `;
}

function renderReportPreview(root, id) {
  const record = state.predictions.find(p => p.id === id);
  if (!record) return;
  const wrap = root.querySelector('#reportPreviewWrap');

  wrap.innerHTML = `
    <div class="report-preview" id="reportPreviewCard">
      <div class="report-header">
        <div>
          <h3>EstateAI Valuation Report</h3>
          <span class="report-id">Reference: ${record.id} · Generated ${new Date().toLocaleDateString('en-IN')}</span>
        </div>
        <div class="nav-brand-mark" style="width:30px;height:30px;color:var(--blue);"><svg viewBox="0 0 24 24"><path d="M3 21V11L12 4L21 11V21H14V15H10V21H3Z"/></svg></div>
      </div>
      <div class="report-grid">
        <div class="report-row"><span>Location</span><span>${record.locality}, ${record.city}</span></div>
        <div class="report-row"><span>Property Type</span><span>${record.propertyType || '—'}</span></div>
        <div class="report-row"><span>Area</span><span>${record.area.toLocaleString('en-IN')} sq.ft</span></div>
        <div class="report-row"><span>Bedrooms / Bathrooms</span><span>${record.bedrooms} / ${record.bathrooms}</span></div>
        <div class="report-row"><span>Property Age</span><span>${record.age} yrs</span></div>
        <div class="report-row"><span>Confidence Score</span><span>${record.confidence}%</span></div>
      </div>
      <div class="report-row" style="font-size:16px;border-bottom:none;padding-top:14px;border-top:2px solid var(--ink);">
        <span style="font-weight:700;color:var(--ink);">Estimated Price</span>
        <span style="font-size:20px;color:var(--blue);">${formatRupeeFull(record.price)}</span>
      </div>
      <div class="report-actions">
        <button class="btn btn-primary btn-sm" id="downloadCsvBtn">
          <svg viewBox="0 0 24 24" class="btn-icon" style="width:15px;height:15px;"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          Export CSV
        </button>
        <button class="btn btn-outline btn-sm" id="downloadPdfBtn">
          <svg viewBox="0 0 24 24" class="btn-icon" style="width:15px;height:15px;"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
          Download PDF
        </button>
        <button class="btn btn-outline btn-sm" id="printReportBtn">
          <svg viewBox="0 0 24 24" class="btn-icon" style="width:15px;height:15px;"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"/></svg>
          Print
        </button>
      </div>
    </div>
  `;

  wrap.querySelector('#downloadCsvBtn').addEventListener('click', () => exportRecordAsCsv(record));
  wrap.querySelector('#downloadPdfBtn').addEventListener('click', () => {
    showToast('PDF generation is simulated in this prototype — use Print for a real file.', 'info', 'Heads up');
  });
  wrap.querySelector('#printReportBtn').addEventListener('click', () => {
    window.print();
  });
  bindRipple(wrap);
}

function exportRecordAsCsv(record) {
  const headers = ['ID', 'City', 'Locality', 'Property Type', 'Area (sqft)', 'Bedrooms', 'Bathrooms', 'Age (yrs)', 'Estimated Price (Lakh)', 'Confidence (%)'];
  const row = [record.id, record.city, record.locality, record.propertyType || '', record.area, record.bedrooms, record.bathrooms, record.age, record.price.toFixed(1), record.confidence];
  const csv = headers.join(',') + '\n' + row.map(v => `"${v}"`).join(',');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `EstateAI-Report-${record.id}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('CSV file downloaded.', 'success');
}


/* ============================================================
   VIEW: PROFILE
   ============================================================ */
function renderProfile(root) {
  if (!state.user) {
    root.innerHTML = `
      <div class="auth-wrap">
        <div class="auth-card" style="text-align:center;">
          <h2 style="font-size:20px;margin-bottom:10px;">Log in to view your profile</h2>
          <p style="color:var(--ink-soft);font-size:14px;margin-bottom:22px;">Create a free account or log in to see saved predictions and activity.</p>
          <a href="#/login" class="btn btn-primary btn-block">Log In</a>
        </div>
      </div>
    `;
    return;
  }

  root.innerHTML = `
    <section class="section" style="padding-top:48px;">
      <div class="section-inner">
        <div class="profile-layout">
          <div class="profile-card">
            <div class="profile-avatar-lg">${state.user.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}</div>
            <h3>${state.user.name}</h3>
            <p>${state.user.email}</p>
            <nav class="profile-nav" id="profileNav">
              <button data-tab="saved"><svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg> Saved Predictions</button>
              <button data-tab="edit"><svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 113 3L12 15l-4 1 1-4z"/></svg> Edit Profile</button>
              <button data-tab="password"><svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> Change Password</button>
              <button data-tab="theme"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg> Theme</button>
              <button data-tab="activity"><svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> Activity</button>
            </nav>
            <button class="btn btn-outline btn-block btn-sm" id="logoutBtn" style="margin-top:18px;">Log Out</button>
          </div>
          <div class="profile-panel" id="profilePanel"></div>
        </div>
      </div>
    </section>
  `;

  function setTab(tab) {
    state.profileTab = tab;
    root.querySelectorAll('#profileNav button').forEach(b => b.classList.toggle('is-active', b.dataset.tab === tab));
    renderProfilePanel(root, tab);
  }
  root.querySelectorAll('#profileNav button').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));
  setTab(state.profileTab);

  root.querySelector('#logoutBtn').addEventListener('click', () => {
    openModal({
      title: 'Log out?',
      body: 'You can log back in anytime with the same demo credentials.',
      confirmText: 'Log Out',
      onConfirm: () => {
        state.user = null;
        syncAuthUI();
        navigate('home');
        showToast('You have been logged out.', 'info');
      }
    });
  });
}

function renderProfilePanel(root, tab) {
  const panel = root.querySelector('#profilePanel');
  if (tab === 'saved') {
    const saved = state.predictions.slice(0, 8);
    panel.innerHTML = `
      <h3>Saved Predictions</h3>
      ${saved.length ? `
        <div style="overflow-x:auto;">
        <table class="data-table">
          <thead><tr><th>ID</th><th>Location</th><th>Price</th><th>Confidence</th><th>Date</th></tr></thead>
          <tbody>${saved.map(p => `<tr><td>${p.id}</td><td>${p.locality}, ${p.city}</td><td class="price-cell">${formatLakh(p.price)}</td><td>${p.confidence}%</td><td>${timeAgo(p.daysAgo)}</td></tr>`).join('')}</tbody>
        </table>
        </div>
      ` : `<p style="color:var(--ink-soft);">No saved predictions yet.</p>`}
    `;
  } else if (tab === 'edit') {
    panel.innerHTML = `
      <h3>Edit Profile</h3>
      <form id="editProfileForm">
        <div class="profile-form-grid">
          <div class="form-field"><label>Full Name</label><input type="text" id="editName" value="${state.user.name}"></div>
          <div class="form-field"><label>Email</label><input type="email" id="editEmail" value="${state.user.email}"></div>
        </div>
        <button type="submit" class="btn btn-primary btn-sm">Save Changes</button>
      </form>
    `;
    panel.querySelector('#editProfileForm').addEventListener('submit', (e) => {
      e.preventDefault();
      state.user.name = panel.querySelector('#editName').value || state.user.name;
      state.user.email = panel.querySelector('#editEmail').value || state.user.email;
      syncAuthUI();
      renderProfile(root);
      showToast('Profile updated.', 'success');
    });
  } else if (tab === 'password') {
    panel.innerHTML = `
      <h3>Change Password</h3>
      <form id="changePasswordForm">
        <div class="form-field" style="margin-bottom:16px;"><label>Current Password</label><input type="password" required></div>
        <div class="form-field" style="margin-bottom:8px;"><label>New Password</label><input type="password" id="newPassInput" required></div>
        <div class="password-strength" style="margin-bottom:16px;"><span id="passStrengthBar"></span></div>
        <button type="submit" class="btn btn-primary btn-sm">Update Password</button>
      </form>
    `;
    const strengthBar = panel.querySelector('#passStrengthBar');
    panel.querySelector('#newPassInput').addEventListener('input', (e) => {
      const v = e.target.value;
      let pct = Math.min(100, v.length * 12);
      let color = pct < 40 ? 'var(--danger)' : pct < 75 ? 'var(--orange)' : 'var(--emerald)';
      strengthBar.style.width = pct + '%';
      strengthBar.style.background = color;
    });
    panel.querySelector('#changePasswordForm').addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Password updated.', 'success');
      panel.querySelector('#changePasswordForm').reset();
      strengthBar.style.width = '0%';
    });
  } else if (tab === 'theme') {
    panel.innerHTML = `
      <h3>Theme &amp; Preferences</h3>
      <div class="theme-switch-row">
        <div><h5>Dark Mode</h5><p>Switch between light and dark interface themes.</p></div>
        <button class="toggle-switch ${state.theme === 'dark' ? 'is-on' : ''}" id="profileThemeToggle"></button>
      </div>
      <div class="theme-switch-row">
        <div><h5>Email Notifications</h5><p>Get notified when a saved prediction's market context changes.</p></div>
        <button class="toggle-switch is-on" id="notifToggle"></button>
      </div>
    `;
    panel.querySelector('#profileThemeToggle').addEventListener('click', (e) => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme);
      e.currentTarget.classList.toggle('is-on', newTheme === 'dark');
    });
    panel.querySelector('#notifToggle').addEventListener('click', (e) => e.currentTarget.classList.toggle('is-on'));
  } else if (tab === 'activity') {
    const activities = state.predictions.slice(0, 6).map(p => ({
      icon: '<path d="M13 2L3 14h7l-1 8 11-13h-7l1-7z"/>',
      text: `Predicted price for ${p.locality}, ${p.city}`,
      time: timeAgo(p.daysAgo),
    }));
    panel.innerHTML = `
      <h3>Activity History</h3>
      <div class="activity-list">
        ${activities.map(a => `
          <div class="activity-row">
            <div class="activity-icon"><svg viewBox="0 0 24 24">${a.icon}</svg></div>
            <span class="activity-text">${a.text}</span>
            <span class="activity-time">${a.time}</span>
          </div>
        `).join('')}
      </div>
    `;
  }
  bindRipple(panel);
}

/* ============================================================
   AUTH VIEWS — LOGIN / SIGNUP / FORGOT PASSWORD
   ============================================================ */
function renderLogin(root) {
  root.innerHTML = `
    <div class="auth-wrap">
      <div class="auth-card">
        <div class="auth-head"><h2>Welcome back</h2><p>Log in to access your dashboard and saved predictions.</p></div>
        <form class="auth-form" id="loginForm">
          <div class="form-field"><label>Email</label><input type="email" id="loginEmail" placeholder="you@example.com" required></div>
          <div class="form-field"><label>Password</label><input type="password" id="loginPassword" placeholder="••••••••" required></div>
          <div class="auth-meta-row">
            <label class="auth-checkbox"><input type="checkbox"> Remember me</label>
            <a href="#/forgot-password">Forgot password?</a>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Log In</button>
        </form>
        <p class="auth-footer-text">Don't have an account? <a href="#/signup">Sign up</a></p>
      </div>
    </div>
  `;
  root.querySelector('#loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = root.querySelector('#loginEmail').value.trim();
    state.user = { name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Demo User', email };
    syncAuthUI();
    showToast('Logged in successfully.', 'success', 'Welcome back');
    navigate('dashboard');
  });
}

function renderSignup(root) {
  root.innerHTML = `
    <div class="auth-wrap">
      <div class="auth-card">
        <div class="auth-head"><h2>Create your account</h2><p>Start predicting property prices in seconds.</p></div>
        <form class="auth-form" id="signupForm">
          <div class="form-field"><label>Full Name</label><input type="text" id="signupName" placeholder="Jordan Diaz" required></div>
          <div class="form-field"><label>Email</label><input type="email" id="signupEmail" placeholder="you@example.com" required></div>
          <div class="form-field">
            <label>Password</label>
            <input type="password" id="signupPassword" placeholder="At least 8 characters" required minlength="8">
            <div class="password-strength"><span id="signupStrengthBar"></span></div>
          </div>
          <label class="auth-checkbox"><input type="checkbox" required> I agree to the <a href="#/terms" style="color:var(--blue);">Terms</a> and <a href="#/privacy" style="color:var(--blue);">Privacy Policy</a></label>
          <button type="submit" class="btn btn-primary btn-block">Create Account</button>
        </form>
        <p class="auth-footer-text">Already have an account? <a href="#/login">Log in</a></p>
      </div>
    </div>
  `;
  const bar = root.querySelector('#signupStrengthBar');
  root.querySelector('#signupPassword').addEventListener('input', (e) => {
    const pct = Math.min(100, e.target.value.length * 11);
    bar.style.width = pct + '%';
    bar.style.background = pct < 40 ? 'var(--danger)' : pct < 75 ? 'var(--orange)' : 'var(--emerald)';
  });
  root.querySelector('#signupForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = root.querySelector('#signupName').value.trim();
    const email = root.querySelector('#signupEmail').value.trim();
    state.user = { name: name || 'Demo User', email };
    syncAuthUI();
    showToast('Account created. Welcome to EstateAI!', 'success');
    navigate('dashboard');
  });
}

function renderForgotPassword(root) {
  root.innerHTML = `
    <div class="auth-wrap">
      <div class="auth-card">
        <div class="auth-head"><h2>Reset your password</h2><p>Enter your email and we'll simulate sending a reset link.</p></div>
        <form class="auth-form" id="forgotForm">
          <div class="form-field"><label>Email</label><input type="email" placeholder="you@example.com" required></div>
          <button type="submit" class="btn btn-primary btn-block">Send Reset Link</button>
        </form>
        <p class="auth-footer-text">Remembered it? <a href="#/login">Back to log in</a></p>
      </div>
    </div>
  `;
  root.querySelector('#forgotForm').addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('If that email exists, a reset link has been sent.', 'success');
    e.target.reset();
  });
}


/* ============================================================
   VIEW: CONTACT
   ============================================================ */
function renderContact(root) {
  root.innerHTML = `
    <section class="section" style="padding-top:48px;">
      <div class="section-inner">
        <div class="section-head center">
          <div class="eyebrow">Contact</div>
          <h2>Get in touch</h2>
          <p class="section-lead">Questions about a prediction, partnerships, or feedback — we'd love to hear from you.</p>
        </div>

        <div class="contact-grid">
          <div>
            <div class="contact-info-card">
              <div class="contact-info-row">
                <div class="ci-icon"><svg viewBox="0 0 24 24"><path d="M4 4h16v16H4V4zM4 4l8 8 8-8"/></svg></div>
                <div><h5>Email</h5><p>support@estateai.com</p></div>
              </div>
              <div class="contact-info-row">
                <div class="ci-icon"><svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.68 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.32 1.85.55 2.81.68A2 2 0 0122 16.92z"/></svg></div>
                <div><h5>Phone</h5><p>+91 90000 00000</p></div>
              </div>
              <div class="contact-info-row">
                <div class="ci-icon"><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
                <div><h5>Office</h5><p>Gachibowli, Hyderabad, Telangana, India</p></div>
              </div>
            </div>
            <div class="map-embed">
              <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>Hyderabad, Telangana, India</span>
            </div>
          </div>

          <div class="contact-form-card">
            <h3 style="font-size:17px;margin-bottom:18px;">Send us a message</h3>
            <form id="contactForm" novalidate>
              <div class="contact-form-grid">
                <div class="form-field" data-field="cName"><label>Name <span class="required-mark">*</span></label><input type="text" id="cName" required><span class="field-error">Please enter your name.</span></div>
                <div class="form-field" data-field="cEmail"><label>Email <span class="required-mark">*</span></label><input type="email" id="cEmail" required><span class="field-error">Please enter a valid email.</span></div>
              </div>
              <div class="form-field" data-field="cSubject" style="margin-bottom:16px;"><label>Subject</label><input type="text" id="cSubject"></div>
              <div class="form-field" data-field="cMessage" style="margin-bottom:18px;"><label>Message <span class="required-mark">*</span></label><textarea id="cMessage" rows="4" required style="padding:11px 13px;border-radius:var(--radius-sm);border:1.5px solid var(--line);resize:vertical;font-size:14px;"></textarea><span class="field-error">Please enter a message.</span></div>
              <button type="submit" class="btn btn-primary btn-block">Send Message</button>
            </form>
          </div>
        </div>
      </div>
    </section>
  `;

  root.querySelector('#contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = root.querySelector('#cName');
    const email = root.querySelector('#cEmail');
    const message = root.querySelector('#cMessage');
    let valid = true;
    [
      [name, /.+/, 'cName'],
      [email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'cEmail'],
      [message, /.+/, 'cMessage'],
    ].forEach(([input, pattern, field]) => {
      const ok = pattern.test(input.value.trim());
      root.querySelector(`[data-field="${field}"]`).classList.toggle('has-error', !ok);
      if (!ok) valid = false;
    });
    if (!valid) { showToast('Please fill in all required fields correctly.', 'error'); return; }
    showToast("Message sent — we'll get back to you soon.", 'success', 'Thank you!');
    e.target.reset();
  });
}

/* ============================================================
   VIEW: LEGAL (Privacy / Terms)
   ============================================================ */
function renderLegal(type, root) {
  const content = type === 'privacy' ? {
    title: 'Privacy Policy',
    body: `
      <h3>What we collect</h3>
      <p>This is a demonstration prototype. No real personal data is transmitted to a server — account details and predictions exist only in your current browser session.</p>
      <h3>How predictions are generated</h3>
      <p>All price estimates are produced by a simulated model running entirely in your browser, using the property details you provide.</p>
      <h3>Contact</h3>
      <p>For questions about this prototype, reach out via the Contact page.</p>
    `
  } : {
    title: 'Terms & Conditions',
    body: `
      <h3>Demonstration purposes only</h3>
      <p>EstateAI is a prototype built for academic, hackathon, and portfolio demonstration purposes. Price estimates are illustrative and should not be used for real financial decisions.</p>
      <h3>No warranty</h3>
      <p>This software is provided as-is, without warranty of any kind, express or implied.</p>
    `
  };
  root.innerHTML = `
    <section class="section" style="padding-top:48px;">
      <div class="section-inner legal-content">
        <div class="eyebrow">Legal</div>
        <h2>${content.title}</h2>
        ${content.body}
      </div>
    </section>
  `;
}

/* ============================================================
   404
   ============================================================ */
function renderNotFound(root) {
  root.innerHTML = `
    <div class="auth-wrap">
      <div style="text-align:center;">
        <h2 style="font-size:32px;margin-bottom:12px;">Page not found</h2>
        <p style="color:var(--ink-soft);margin-bottom:22px;">That page doesn't exist. Let's get you back on track.</p>
        <a href="#/home" class="btn btn-primary">Go Home</a>
      </div>
    </div>
  `;
}


/* ============================================================
   AI ASSISTANT (CHATBOT)
   ============================================================ */
const chatbotEl = document.getElementById('chatbot');
const chatbotToggleBtn = document.getElementById('chatbotToggle');
const chatbotPanelEl = document.getElementById('chatbotPanel');
const chatbotMessagesEl = document.getElementById('chatbotMessages');
const chatbotTypingEl = document.getElementById('chatbotTyping');
const chatbotFormEl = document.getElementById('chatbotForm');
const chatbotInputEl = document.getElementById('chatbotInput');
const chatbotBadgeEl = document.getElementById('chatbotBadge');

chatbotToggleBtn.addEventListener('click', () => {
  chatbotEl.classList.toggle('is-open');
  if (chatbotEl.classList.contains('is-open')) chatbotBadgeEl.style.display = 'none';
});
document.getElementById('chatbotMinimize').addEventListener('click', () => chatbotEl.classList.remove('is-open'));

const CHAT_RESPONSES = {
  how: "The model converts a property into 18 numerical features — bedrooms, area, location signals, ratings, and more — then runs them through a weighted regression formula trained on historical sales patterns to produce a price estimate.",
  factors: "The biggest factors are usually property area, bedrooms, area income, and property age. Location signals like crime rate, distance to employment hubs, and highway access also shift the price meaningfully.",
  improve: "Based on the model's weights: renovating to 'Excellent' condition, improving highway or transport access, and reducing property age (through upgrades) tend to raise the estimate the most. Adding bedrooms or area also helps if structurally feasible.",
  confidence: "The confidence score reflects how closely your inputs resemble the data the model was trained on. Typical properties — average area, moderate age, common locations — score higher. Unusual combinations score lower because the model is extrapolating more.",
  invest: "Looking at current growth data, localities like Hinjewadi (Pune), Gachibowli (Hyderabad), and New Town (Kolkata) show strong year-over-year price growth. Check the Market Insights page for the full breakdown.",
  default: "I can help with how predictions work, what affects price, how to raise a property's value, what the confidence score means, or good investment locations. Try one of the suggestions below!",
};

function detectChatIntent(text) {
  const t = text.toLowerCase();
  if (t.includes('how') && (t.includes('calculat') || t.includes('work') || t.includes('predict'))) return 'how';
  if (t.includes('factor') || t.includes('affect')) return 'factors';
  if (t.includes('improve') || t.includes('increase') || t.includes('raise') || t.includes('value')) return 'improve';
  if (t.includes('confidence')) return 'confidence';
  if (t.includes('invest') || t.includes('location') || t.includes('where')) return 'invest';
  return 'default';
}

function addChatMessage(text, who) {
  const div = document.createElement('div');
  div.className = 'chat-msg chat-msg--' + who;
  div.textContent = text;
  chatbotMessagesEl.appendChild(div);
  chatbotMessagesEl.scrollTop = chatbotMessagesEl.scrollHeight;
}

function chatBotReply(key) {
  chatbotTypingEl.hidden = false;
  chatbotMessagesEl.scrollTop = chatbotMessagesEl.scrollHeight;
  setTimeout(() => {
    chatbotTypingEl.hidden = true;
    addChatMessage(CHAT_RESPONSES[key] || CHAT_RESPONSES.default, 'bot');
  }, 700);
}

document.getElementById('chatbotSuggestions').querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', () => {
    addChatMessage(btn.textContent, 'user');
    chatBotReply(btn.dataset.q);
  });
});

chatbotFormEl.addEventListener('submit', (e) => {
  e.preventDefault();
  const val = chatbotInputEl.value.trim();
  if (!val) return;
  addChatMessage(val, 'user');
  chatbotInputEl.value = '';
  chatBotReply(detectChatIntent(val));
});

/* ============================================================
   NEWSLETTER (footer)
   ============================================================ */
document.getElementById('newsletterForm').addEventListener('submit', (e) => {
  e.preventDefault();
  showToast('Subscribed! Watch your inbox for market updates.', 'success');
  e.target.reset();
});

/* ============================================================
   APP BOOTSTRAP
   ============================================================ */
const appLoaderEl = document.getElementById('appLoader');
function hideAppLoader() {
  appLoaderEl.classList.add('is-hidden');
}
window.addEventListener('load', () => setTimeout(hideAppLoader, 500));
setTimeout(hideAppLoader, 1600); // fallback

if (!window.location.hash) {
  window.location.hash = '#/home';
}
router();
