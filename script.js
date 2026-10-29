(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Titre du hero : les mots arrivent un par un ──
  document.querySelectorAll('[data-split]').forEach((el) => {
    let i = 0;
    const out = document.createDocumentFragment();
    el.childNodes.forEach((node) => {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { out.appendChild(document.createTextNode(' ')); return; }
          const span = document.createElement('span');
          span.className = 'w';
          span.style.setProperty('--i', i++);
          span.textContent = part;
          out.appendChild(span);
        });
      } else {
        out.appendChild(node.cloneNode(true));
      }
    });
    el.textContent = '';
    el.appendChild(out);
  });

  // ── Apparition au défilement ──
  const targets = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reduce) {
    targets.forEach((el) => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    targets.forEach((el) => io.observe(el));
  }

  // ── Défilement : barre de progression, parallaxe, bouton flottant ──
  const bar = document.getElementById('scroll-progress');
  const floatCta = document.getElementById('float-cta');
  const hero = document.getElementById('top');
  const finalCta = document.querySelector('.cta-final');
  const parallax = [...document.querySelectorAll('[data-parallax]')];
  const ring = document.querySelector('.hero__ring');
  const track = document.getElementById('marquee-track');
  let ticking = false;

  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';

    if (!reduce) {
      parallax.forEach((el) => {
        const k = parseFloat(el.dataset.parallax) || 0;
        if (y < window.innerHeight * 1.4) el.style.setProperty('--py', (y * k).toFixed(1) + 'px');
      });
    }

    // Cercle doré et bandeau : ils ne bougent que lorsque tu fais défiler
    if (!reduce) {
      if (ring) ring.style.setProperty('--rot', (y * 0.35).toFixed(1) + 'deg');
      if (track) {
        const half = track.scrollWidth / 2;
        if (half > 0) track.style.setProperty('--mx', (-((y * 0.7) % half)).toFixed(1) + 'px');
      }
    }

    if (floatCta && hero && finalCta) {
      const pastHero = y > hero.offsetHeight * 0.7;
      const rect = finalCta.getBoundingClientRect();
      const atEnd = rect.top < window.innerHeight * 0.85;
      floatCta.classList.toggle('is-on', pastHero && !atEnd);
    }
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  // ── Cartes : légère inclinaison + reflet doré qui suit la souris ──
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('[data-tilt]').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.transition = 'transform .12s, box-shadow .3s, border-color .3s';
        card.style.transform = `rotateX(${((0.5 - py) * 7).toFixed(2)}deg) rotateY(${((px - 0.5) * 9).toFixed(2)}deg) translateY(-4px)`;
        card.style.setProperty('--mx', (px * 100) + '%');
        card.style.setProperty('--my', (py * 100) + '%');
      });
      card.addEventListener('pointerleave', () => {
        card.style.transition = '';
        card.style.transform = '';
      });
    });
  }
})();
