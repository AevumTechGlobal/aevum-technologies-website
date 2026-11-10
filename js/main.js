import './site.js';

const slideButtons = [...document.querySelectorAll('.slide-control')];
const firstHeadline = document.querySelector('.headline-light');
const secondHeadline = document.querySelector('.headline-gold');
const heroDescription = document.querySelector('#hero-description');
const heroCopy = document.querySelector('.hero-copy');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const presentations = [
  {
    first: 'Useful digital solutions',
    second: 'for practical progress',
    description:
      'Software, security and technology support shaped around practical business needs.',
  },
  {
    first: 'A more thoughtful approach',
    second: 'to digital security',
    description:
      'Explore practical ways to improve digital safety and make informed security decisions.',
  },
  {
    first: 'Intelligent technology',
    second: 'for real-world needs',
    description:
      'Consider software, cloud, AI and data approaches that fit your objectives and context.',
  },
];

let activeSlide = 0;
let slideTransition = 0;

for (const button of slideButtons) {
  button.addEventListener('click', () => {
    const nextSlide = Number(button.dataset.slide);
    if (!Number.isInteger(nextSlide) || !presentations[nextSlide] || nextSlide === activeSlide) return;
    activeSlide = nextSlide;

    for (const control of slideButtons) {
      const selected = control === button;
      control.classList.toggle('is-active', selected);
      control.setAttribute('aria-pressed', String(selected));
    }

    const presentation = presentations[nextSlide];
    window.clearTimeout(slideTransition);
    heroCopy?.classList.add('is-changing');
    slideTransition = window.setTimeout(() => {
      if (firstHeadline) firstHeadline.textContent = presentation.first;
      if (secondHeadline) secondHeadline.textContent = presentation.second;
      if (heroDescription) heroDescription.textContent = presentation.description;
      heroCopy?.classList.remove('is-changing');
    }, reducedMotion.matches ? 0 : 150);
  });
}

const stage = document.querySelector('#globe-stage');
if (stage instanceof HTMLElement) {
  const loadEarthScene = () => {
    import('./scene3d.js')
      .then(({ createEarthScene }) =>
        createEarthScene({
          canvas: document.querySelector('#earth-canvas'),
          fallback: document.querySelector('#globe-fallback'),
          stage,
          reducedMotion,
        }),
      )
      .catch((error) => {
        console.error('Unable to load the Aevum Earth scene.', error);
        const canvas = document.querySelector('#earth-canvas');
        const fallback = document.querySelector('#globe-fallback');
        if (canvas instanceof HTMLCanvasElement) canvas.hidden = true;
        if (fallback instanceof HTMLElement) fallback.hidden = false;
      });
  };
  window.requestAnimationFrame(() => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(loadEarthScene, { timeout: 1200 });
    else window.setTimeout(loadEarthScene, 200);
  });
}

const particlesCanvas = document.querySelector('#hero-particles');
if (particlesCanvas instanceof HTMLCanvasElement && !reducedMotion.matches) {
  const context = particlesCanvas.getContext('2d');
  if (context) {
    let particles = [];
    let width = 0;
    let height = 0;
    let animationFrame = 0;
    let lastFrameTime = 0;
    let isVisible = true;

    const resizeParticles = () => {
      const bounds = particlesCanvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = bounds.width;
      height = bounds.height;
      particlesCanvas.width = Math.max(1, Math.round(width * pixelRatio));
      particlesCanvas.height = Math.max(1, Math.round(height * pixelRatio));
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      const count = Math.min(42, Math.max(14, Math.floor((width * height) / 28000)));
      let seed = 9137;
      const random = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
      };
      particles = Array.from({ length: count }, () => ({
        x: random() * width,
        y: random() * height,
        radius: 0.4 + random() * 1.05,
        opacity: 0.12 + random() * 0.32,
        speed: 0.08 + random() * 0.22,
        phase: random() * Math.PI * 2,
      }));
    };

    const drawParticles = (time) => {
      animationFrame = 0;
      if (!isVisible || document.hidden) return;
      if (time - lastFrameTime < 40) {
        animationFrame = requestAnimationFrame(drawParticles);
        return;
      }
      lastFrameTime = time;
      context.clearRect(0, 0, width, height);
      for (const particle of particles) {
        particle.y -= particle.speed;
        if (particle.y < -3) particle.y = height + 3;
        const shimmer = 0.72 + Math.sin(time / 1600 + particle.phase) * 0.28;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(240, 198, 106, ${particle.opacity * shimmer})`;
        context.fill();
      }
      animationFrame = requestAnimationFrame(drawParticles);
    };

    const particleObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible && !document.hidden && !animationFrame) {
        animationFrame = requestAnimationFrame(drawParticles);
      } else if (!isVisible && animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
    });
    particleObserver.observe(particlesCanvas);
    const particleResizeObserver = new ResizeObserver(resizeParticles);
    particleResizeObserver.observe(particlesCanvas);
    resizeParticles();
    animationFrame = requestAnimationFrame(drawParticles);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (animationFrame) cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      } else if (isVisible && !animationFrame) {
        animationFrame = requestAnimationFrame(drawParticles);
      }
    });
    window.addEventListener('pagehide', () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      particleResizeObserver.disconnect();
      particleObserver.disconnect();
    }, { once: true });
  }
}