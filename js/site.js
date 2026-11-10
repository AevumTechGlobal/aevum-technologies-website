import { renderTeamProfiles } from './team.js';

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.primary-navigation');
const header = document.querySelector('.site-header');
const atmosphere = document.querySelector('.hero-atmosphere');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

renderTeamProfiles(document.querySelector('#team-grid'));

function closeMenu({ restoreFocus = false } = {}) {
  if (!menuButton || !navigation) return;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open navigation menu');
  navigation.classList.remove('is-open');
  if (restoreFocus) menuButton.focus();
}

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Open navigation menu' : 'Close navigation menu');
  navigation?.classList.toggle('is-open', !isOpen);
});

navigation?.addEventListener('click', (event) => {
  if (event.target instanceof HTMLAnchorElement) closeMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    closeMenu({ restoreFocus: true });
  }
});

for (const link of document.querySelectorAll('a[href^="#"]')) {
  link.addEventListener('click', (event) => {
    const target = document.getElementById(link.hash.slice(1));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({
      behavior: reducedMotion.matches ? 'auto' : 'smooth',
      block: 'start',
    });
    closeMenu();
  });
}

let scrollFrame = 0;
let pointerFrame = 0;
let pointerX = 0;
let pointerY = 0;
const cardPointerTargets = new Set();

for (const card of document.querySelectorAll('.service-card')) {
  const onCardPointerMove = (event) => {
    if (event.pointerType === 'touch') return;
    const bounds = card.getBoundingClientRect();
    card.style.setProperty('--spot-x', `${event.clientX - bounds.left}px`);
    card.style.setProperty('--spot-y', `${event.clientY - bounds.top}px`);
  };
  card.addEventListener('pointermove', onCardPointerMove, { passive: true });
  card.addEventListener('pointerleave', () => {
    card.style.removeProperty('--spot-x');
    card.style.removeProperty('--spot-y');
  });
  cardPointerTargets.add(card);
}

const hero = document.querySelector('.hero');
if (hero && atmosphere && !reducedMotion.matches && window.matchMedia('(pointer: fine)').matches) {
  const onHeroPointerMove = (event) => {
    if (pointerFrame) return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    pointerFrame = requestAnimationFrame(() => {
      const bounds = hero.getBoundingClientRect();
      const x = Math.round(((pointerX - bounds.left) / bounds.width) * 100);
      const y = Math.round(((pointerY - bounds.top) / bounds.height) * 100);
      atmosphere.style.setProperty('--light-x', `${x}%`);
      atmosphere.style.setProperty('--light-y', `${y}%`);
      pointerFrame = 0;
    });
  };
  const onHeroPointerLeave = () => {
    atmosphere.style.removeProperty('--light-x');
    atmosphere.style.removeProperty('--light-y');
  };
  hero.addEventListener('pointermove', onHeroPointerMove, { passive: true });
  hero.addEventListener('pointerleave', onHeroPointerLeave);
  window.addEventListener('pagehide', () => {
    hero.removeEventListener('pointermove', onHeroPointerMove);
    hero.removeEventListener('pointerleave', onHeroPointerLeave);
  }, { once: true });
}

window.addEventListener(
  'scroll',
  () => {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(() => {
      header?.classList.toggle('is-scrolled', window.scrollY > 24);
      scrollFrame = 0;
    });
  },
  { passive: true },
);

for (const year of document.querySelectorAll('[data-current-year]')) {
  year.textContent = String(new Date().getFullYear());
}

const revealElements = [...document.querySelectorAll('.reveal-on-scroll')];
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  revealElements.forEach((element) => revealObserver.observe(element));
  reducedMotion.addEventListener('change', (event) => {
    if (!event.matches) return;
    revealObserver.disconnect();
    revealElements.forEach((element) => element.classList.add('is-revealed'));
  });
} else {
  revealElements.forEach((element) => element.classList.add('is-revealed'));
}

document.documentElement.classList.add('js-enhanced');

window.addEventListener('pagehide', () => {
  if (scrollFrame) cancelAnimationFrame(scrollFrame);
  if (pointerFrame) cancelAnimationFrame(pointerFrame);
  for (const card of cardPointerTargets) {
    card.style.removeProperty('--spot-x');
    card.style.removeProperty('--spot-y');
  }
}, { once: true });
