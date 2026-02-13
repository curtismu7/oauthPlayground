// Shared app behavior:
// - Loads companies.json
// - Applies CSS variables + logo + titles
// - Populates dropdown automatically
// - Supports modal login (for portal pages that use loginMode=modal)

async function loadCompanies() {
  const res = await fetch('../shared/companies.json');
  if (!res.ok) throw new Error('Could not load companies.json');
  return await res.json();
}

function applyCompanyTheme(company) {
  const r = document.documentElement.style;
  const p = company.palette || {};
  r.setProperty('--brand-primary', p.primary || '#1b2dbf');
  r.setProperty('--brand-primary-dark', p.primaryDark || p.primary || '#12208a');
  r.setProperty('--brand-secondary', p.secondary || '#111827');
  r.setProperty('--brand-accent', p.accent || '#f59e0b');
  r.setProperty('--page-bg', p.bg || '#f5f6f8');
  r.setProperty('--surface', p.surface || '#ffffff');
  r.setProperty('--muted', p.muted || '#6b7280');
  r.setProperty('--border', p.border || '#d1d5db');

  document.title = `${company.name} | Portal (Mock)`;

  // Logo injection
  const logoTargets = document.querySelectorAll('[data-logo]');
  logoTargets.forEach(el => { el.innerHTML = company.logoSvg || `<strong>${company.name}</strong>`; });

  // Headline injection
  const heroTitle = document.querySelector('[data-hero-title]');
  const heroSub = document.querySelector('[data-hero-sub]');
  if (heroTitle) heroTitle.textContent = (company.hero && company.hero.title) || 'Welcome';
  if (heroSub) heroSub.textContent = (company.hero && company.hero.subtitle) || '';

  // Login copy injection
  const loginTitle = document.querySelector('[data-login-title]');
  if (loginTitle) loginTitle.textContent = company.hero?.title?.includes('Log in') ? company.hero.title : 'Log in';
}

function getCompanyIdFromLocation() {
  const url = new URL(window.location.href);
  return url.searchParams.get('company') || document.documentElement.getAttribute('data-company') || 'pingidentity';
}

function setCompanyIdInLocation(companyId) {
  const url = new URL(window.location.href);
  url.searchParams.set('company', companyId);
  window.location.href = url.toString();
}

function wireModalLogin(company) {
  const scrim = document.querySelector('.scrim');
  const modal = document.querySelector('.modal');
  const openBtn = document.querySelector('[data-open-login]');
  const closeBtn = document.querySelector('[data-close-login]');

  if (!scrim || !modal || !openBtn || !closeBtn) return;

  function open() {
    scrim.style.display = 'block';
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden','false');
  }
  function close() {
    scrim.style.display = 'none';
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden','true');
  }

  openBtn.addEventListener('click', (e) => { e.preventDefault(); open(); });
  closeBtn.addEventListener('click', (e) => { e.preventDefault(); close(); });
  scrim.addEventListener('click', close);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  // show only when company wants modal
  const wantsModal = (company.loginMode || 'page') === 'modal';
  scrim.style.display = 'none';
  modal.style.display = 'none';
  openBtn.style.display = 'inline-flex';
  if (!wantsModal) openBtn.style.display = 'none';
}

function wireCompanyDropdown(companies, currentId) {
  const sel = document.querySelector('[data-company-select]');
  if (!sel) return;
  sel.innerHTML = '';
  companies.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    if (c.id === currentId) opt.selected = true;
    sel.appendChild(opt);
  });
  sel.addEventListener('change', () => setCompanyIdInLocation(sel.value));
}

document.addEventListener('DOMContentLoaded', async () => {
  try{
    const companies = await loadCompanies();
    const companyId = getCompanyIdFromLocation();
    const company = companies.find(c => c.id === companyId) || companies[0];

    applyCompanyTheme(company);
    wireCompanyDropdown(companies, company.id);
    wireModalLogin(company);

    // Expose for debugging
    window.__companies = companies;
    window.__company = company;
  }catch(err){
    console.error(err);
  }
});
