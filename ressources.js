// ═══════════════════════════════════════════════════════════════
//  AJOUTER UN ÉPISODE = ajouter un bloc dans EPISODES (rien d'autre).
//  - youtubeId : l'identifiant de la vidéo (la fin du lien youtu.be/XXXX).
//                Vide → la carte affiche « Bientôt disponible ».
//  - pdfUrl    : le lien du PDF (ex. 'pdf/episode-1.pdf').
//                Vide → le PDF est annoncé « bientôt disponible ».
//  - bilanUrl  : le bilan proposé en bas de la carte.
// ═══════════════════════════════════════════════════════════════
const EPISODES = [
  {
    numero: 1,
    titre: '5 signes que ton corps te parle',
    resume: 'Fatigue, sommeil, ventre, humeur… ton corps envoie des messages bien avant que ça casse. On apprend à les lire.',
    youtubeId: '',
    pdfUrl: '',
    pdfTitre: 'Le PDF de l\'épisode 1',
    bilanUrl: 'https://ton-bilan-sante.vercel.app/',
  },
];

// Pour recevoir les prénoms + e-mails dans une Google Sheet : colle ici l'adresse
// du point d'entrée (même principe que api/log-lead.js des bilans). Vide = formulaire
// prêt mais non branché : rien n'est envoyé et le PDF n'est pas donné.
const FORM_ENDPOINT = '';

(function () {
  const root = document.getElementById('episodes');
  if (!root) return;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function videoBlock(ep) {
    if (ep.youtubeId) {
      return `<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/${esc(ep.youtubeId)}" title="${esc(ep.titre)}" frameborder="0" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
    }
    return `<div class="soon"><span class="soon__badge">Bientôt disponible</span><p>La vidéo sort très bientôt sur YouTube.</p></div>`;
  }

  function pdfBlock(ep) {
    return `
      <div class="pdf">
        <h4 class="pdf__title">${esc(ep.pdfTitre)}</h4>
        <p class="pdf__text">Laisse ton prénom et ton e-mail, je te l'envoie.</p>
        <form class="pdf__form" data-pdf="${esc(ep.pdfUrl)}" novalidate>
          <input type="text" name="prenom" placeholder="Ton prénom" autocomplete="given-name" required />
          <input type="email" name="email" placeholder="Ton e-mail" autocomplete="email" required />
          <button type="submit" class="btn btn--primary">Recevoir le PDF</button>
          <p class="pdf__msg" role="status" aria-live="polite"></p>
        </form>
      </div>`;
  }

  root.innerHTML = EPISODES.map((ep) => `
    <article class="episode reveal">
      <p class="episode__num">Épisode ${esc(ep.numero)}</p>
      <h2 class="episode__title">${esc(ep.titre)}</h2>
      <p class="episode__resume">${esc(ep.resume)}</p>
      <div class="episode__grid">
        ${videoBlock(ep)}
        ${pdfBlock(ep)}
      </div>
      <p class="episode__bilan"><a class="btn btn--ghost-dark" href="${esc(ep.bilanUrl)}">Faire mon bilan offert →</a></p>
    </article>`).join('');

  // Re-déclenche l'apparition au défilement pour les cartes ajoutées
  root.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));

  // Recherche : numéro d'épisode ou mot du titre / du résumé
  const champ = document.getElementById('recherche-champ');
  const vide = document.getElementById('recherche-vide');
  const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const cards = [...root.querySelectorAll('.episode')];
  function filtrer() {
    const q = norm(champ.value).trim().replace(/^(episode|ep)\s*/, '');
    let n = 0;
    cards.forEach((card, i) => {
      const ep = EPISODES[i];
      const texte = norm(`${ep.numero} episode ${ep.numero} ${ep.titre} ${ep.resume}`);
      const ok = !q || String(ep.numero) === q || texte.includes(q);
      card.hidden = !ok;
      if (ok) n++;
    });
    vide.hidden = n > 0;
  }
  if (champ) {
    champ.addEventListener('input', filtrer);
    if (location.hash === '#recherche') setTimeout(() => champ.focus(), 300);
    window.addEventListener('hashchange', () => { if (location.hash === '#recherche') champ.focus(); });
  }

  root.addEventListener('submit', async (e) => {
    const form = e.target.closest('.pdf__form');
    if (!form) return;
    e.preventDefault();
    const msg = form.querySelector('.pdf__msg');
    const prenom = form.prenom.value.trim();
    const email = form.email.value.trim();
    if (!prenom || !/^\S+@\S+\.\S+$/.test(email)) {
      msg.textContent = 'Indique ton prénom et un e-mail valide.';
      return;
    }
    if (!FORM_ENDPOINT || !form.dataset.pdf) {
      msg.textContent = 'Le PDF arrive très bientôt. Reviens d\'ici quelques jours.';
      return;
    }
    try {
      await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'ressource', prenom, email, ressource: form.dataset.pdf }),
      });
      msg.innerHTML = `Merci ${esc(prenom)} ! <a href="${esc(form.dataset.pdf)}" target="_blank" rel="noopener">Ouvre ton PDF ici</a>.`;
    } catch (err) {
      msg.textContent = 'Un souci est survenu. Réessaie dans un instant.';
    }
  });
})();
