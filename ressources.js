// ═══════════════════════════════════════════════════════════════
//  AJOUTER UN ÉPISODE = ajouter un bloc dans EPISODES (rien d'autre).
//  - youtubeId : l'identifiant de la vidéo (la fin du lien youtu.be/XXXX).
//                Vide → la carte affiche « Bientôt disponible ».
//  - pdfUrl    : le nom du PDF privé (ex. 'episode-1'), donné après l'e-mail.
//                Vide → le PDF est annoncé « bientôt disponible ».
//  - bilanUrl  : le bilan proposé en bas de la carte.
// ═══════════════════════════════════════════════════════════════
const EPISODES = [
  {
    numero: 1,
    titre: '5 signes que ton corps te parle',
    resume: 'Fatigue, sommeil, ventre, humeur… ton corps envoie des messages bien avant que ça casse. On apprend à les lire.',
    youtubeId: 'JVe0MNc1iZo',
    pdfUrl: 'episode-1',
    pdfTitre: 'Le questionnaire de fatigue de Pichot et l\'exercice « Si ton corps te parlait »',
    bilanUrl: 'https://ton-bilan-sante.vercel.app/',
  },
];

// Les prénoms + e-mails arrivent dans l'onglet « Bilans » de la Google Sheet.
// Vide = formulaire prêt mais non branché : rien n'est envoyé et le PDF n'est pas donné.
const FORM_ENDPOINT = 'https://ton-bilan-sante.vercel.app/api/log-ressource';

(function () {
  const root = document.getElementById('episodes');
  if (!root) return;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function videoBlock(ep) {
    if (ep.youtubeId) {
      return `<div class="video-wrapper"><iframe src="https://www.youtube-nocookie.com/embed/${esc(ep.youtubeId)}" title="${esc(ep.titre)}" frameborder="0" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
    }
    return `<div class="soon"><span class="soon__badge">Bientôt disponible</span><p>La vidéo sort très bientôt sur YouTube.</p></div>`;
  }

  function pdfBlock(ep) {
    return `
      <div class="pdf">
        <h4 class="pdf__title">${esc(ep.pdfTitre)}</h4>
        <p class="pdf__text">Laisse ton prénom et ton e-mail, je t'envoie le PDF.</p>
        <form class="pdf__form" data-pdf="${esc(ep.pdfUrl)}" novalidate>
          <input type="text" name="prenom" placeholder="Ton prénom" autocomplete="given-name" required />
          <input type="email" name="email" placeholder="Ton e-mail" autocomplete="email" required />
          <label class="pdf__text" style="display:flex;gap:8px;align-items:flex-start;font-size:.85rem"><input type="checkbox" name="conseils" style="width:auto;margin-top:3px" /> Je veux aussi recevoir des conseils et des nouvelles de Rijal Fit par e-mail (facultatif).</label>
          <button type="submit" class="btn btn--primary">Recevoir le PDF</button>
          <p class="pdf__text" style="font-size:.78rem">Ton prénom et ton e-mail sont enregistrés par Rijal Fit pour te donner ce PDF. Tu peux demander leur suppression à tout moment.</p>
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
      const reponse = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prenom, email, ressource: form.dataset.pdf, conseils: form.conseils.checked }),
      });
      if (!reponse.ok) throw new Error('Enregistrement refusé');
      const { url } = await reponse.json();
      msg.innerHTML = url
        ? `Merci ${esc(prenom)} ! <a href="${esc(url)}" target="_blank" rel="noopener">Télécharge ton PDF ici</a>.`
        : `Merci ${esc(prenom)} ! Je t'envoie le PDF par e-mail sous 24 h.`;
    } catch (err) {
      msg.textContent = 'Un souci est survenu. Réessaie dans un instant.';
    }
  });
})();
