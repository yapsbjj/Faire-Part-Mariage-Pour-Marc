import React, { useState, useEffect, useRef } from "react";
import PlanDeTable from './components/PlanDeTable';
import CagnotteMariage from './components/CagnotteMariahe';

/* ============================================================================
 * FAIRE-PART DE MARIAGE — style élégant classique (or antique, encre, ivoire)
 * ============================================================================
 *
 * Sommaire du fichier
 * --------------------
 *   1. Configuration ......... données du mariage à personnaliser
 *   2. Hooks utilitaires ...... compte à rebours
 *   3. Icônes décoratives ..... petits SVG traits fins (style gravure)
 *   4. Composant principal .... assemblage de la page
 *        4.1 État local (photo importée par l'invité·e)
 *        4.2 Styles (voir sommaire détaillé dans le bloc <style>)
 *        4.3 Rendu JSX (logo → photo → noms → repères → RSVP → pied de page)
 *
 * ⚠️ Aucune donnée n'est envoyée à un serveur : ce composant est 100 % front,
 *    sans backend. Le RSVP est volontairement un cadre vide à compléter plus
 *    tard, et la photo importée par le bouton "Ajouter une photo" ne vit que
 *    dans le navigateur (elle n'est ni sauvegardée, ni partagée).
 * ============================================================================ */

// ---------------------------------------------------------------------------
// 1. CONFIGURATION — à personnaliser avant publication
// ---------------------------------------------------------------------------

// MODIFIER : lien vers la photo du couple (image hébergée, import local...).
// Laisser vide ("") pour afficher le cadre à compléter par la suite.
const COUPLE_PHOTO_URL = "";

// MODIFIER : toutes les informations du mariage sont centralisées ici.
const WEDDING = {
  bride: "Marion",
  groom: "Louis",

  dateLabel: "Samedi 12 Septembre 2026",
  dateISO: "2026-09-12T16:30:00", // sert de référence au compte à rebours

  ceremony: {
    place: "Église Saint-Martin",
    address: "12 rue de l'Église, 41250 Chambord",
    time: "16h30",
  },
  reception: {
    place: "Château de Chambord",
    address: "Domaine de Chambord",
    time: "19h00",
  },

  schedule: [
    { time: "16h30", label: "Cérémonie religieuse" },
    { time: "18h00", label: "Vin d'honneur au jardin" },
    { time: "20h00", label: "Dîner" },
    { time: "23h00", label: "Soirée dansante" },
  ],

  rsvpDeadline: "1er juillet 2026",
};

// ---------------------------------------------------------------------------
// 2. HOOKS UTILITAIRES
// ---------------------------------------------------------------------------

/**
 * Calcule le temps restant avant `targetISO` et le rafraîchit chaque seconde.
 * @param {string} targetISO - date cible au format ISO 8601
 * @returns {{jours: number, heures: number, minutes: number, secondes: number}}
 */
function useCountdown(targetISO) {
  const [timeLeft, setTimeLeft] = useState(() => computeTimeLeft(targetISO));

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimeLeft(computeTimeLeft(targetISO));
    }, 1000);
    return () => clearInterval(intervalId);
  }, [targetISO]);

  return timeLeft;
}

/** Différence entre `targetISO` et maintenant, décomposée en unités de temps. */
function computeTimeLeft(targetISO) {
  const diffMs = Math.max(0, new Date(targetISO).getTime() - Date.now());

  return {
    jours: Math.floor(diffMs / (1000 * 60 * 60 * 24)),
    heures: Math.floor((diffMs / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diffMs / (1000 * 60)) % 60),
    secondes: Math.floor((diffMs / 1000) % 60),
  };
}

/** Ajoute un zéro devant les nombres à un chiffre (ex: 5 → "05"). */
function pad(n) {
  return String(n).padStart(2, "0");
}

// ---------------------------------------------------------------------------
// 3. ICÔNES ET ÉLÉMENTS DÉCORATIFS — SVG en traits fins, style gravure
// ---------------------------------------------------------------------------

/** Volute dorée dessinée à l'ouverture, dupliquée aux 4 coins de la carte. */
function CornerFlourish({ corner }) {
  return (
    <svg viewBox="0 0 90 90" className={`corner corner-${corner}`} aria-hidden="true">
      <path
        className="flourish-path"
        d="M4 4 C 4 34, 4 50, 24 60 C 40 68, 55 62, 58 46 C 60 36, 54 30, 46 32 C 40 33.5, 39 40, 45 42"
        fill="none"
      />
      <circle cx="45" cy="42" r="2.2" className="flourish-dot" />
    </svg>
  );
}

/** Petite arche évoquant l'entrée de l'église, utilisée pour "Cérémonie". */
function IconArch() {
  return (
    <svg viewBox="0 0 48 48" className="icon" aria-hidden="true">
      <path d="M10 40 V22 C10 12 16 6 24 6 C32 6 38 12 38 22 V40" fill="none" />
      <line x1="6" y1="40" x2="42" y2="40" />
      <line x1="24" y1="18" x2="24" y2="30" />
      <line x1="19" y1="24" x2="29" y2="24" />
    </svg>
  );
}

/** Coupes de champagne, utilisées pour "Réception". */
function IconGlasses() {
  return (
    <svg viewBox="0 0 48 48" className="icon" aria-hidden="true">
      <path d="M14 8 L24 24 L34 8" fill="none" />
      <line x1="24" y1="24" x2="24" y2="38" />
      <line x1="15" y1="40" x2="33" y2="40" />
      <line x1="10" y1="8" x2="38" y2="8" />
    </svg>
  );
}

/** Cadre photo, affiché tant qu'aucune photo n'a été renseignée. */
function IconFrame() {
  return (
    <svg viewBox="0 0 48 48" className="icon-frame" aria-hidden="true">
      <rect x="6" y="10" width="36" height="28" rx="1" fill="none" />
      <circle cx="24" cy="24" r="7" fill="none" />
      <path d="M6 18 L16 18 L19 14 L29 14 L32 18 L42 18" fill="none" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 4. COMPOSANT PRINCIPAL
// ---------------------------------------------------------------------------

export default function FairePartMariage() {
  // -- 4.1 État local ---------------------------------------------------
  const timeLeft = useCountdown(WEDDING.dateISO);
  const [photoUrl, setPhotoUrl] = useState(COUPLE_PHOTO_URL || null);
  const cardRef = useRef(null);

  /** Prévisualise la photo choisie par l'utilisateur (aperçu local uniquement). */
  function handlePhotoChange(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    setPhotoUrl(URL.createObjectURL(file));
  }

  return (
    <>
    <div className="fp-root">
      {/* -- 4.2 Styles ----------------------------------------------------
          Sommaire du CSS :
            a. Polices & palette (design tokens)
            b. Fond de page
            c. Emplacement logo
            d. Emplacement photo des mariés
            e. Carte + cadre doré + volutes des coins
            f. En-tête (nom des mariés, date, compte à rebours)
            g. Détails cérémonie / réception
            h. Déroulé de la journée
            i. Emplacement RSVP (vide, à compléter)
            j. Pied de page
            k. Accessibilité (mouvement réduit) & responsive
      ------------------------------------------------------------------- */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,600&family=Cormorant+Garamond:ital,wght@0,500;1,500;1,600&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Jost:wght@400;500&display=swap');

        /* --- a. Polices & palette (design tokens) ------------------------ */
        .fp-root {
          --paper: #f8f2e6;
          --paper-deep: #efe4cd;
          --ink: #2a2420;
          --ink-soft: #4a4139;
          --gold: #a9843c;
          --gold-light: #d9bd82;
          --gold-deep: #7d5f28;
          --bordeaux: #6b1e2b;
          --bordeaux-light: #8a3040;

          font-family: 'EB Garamond', serif;
          color: var(--ink);
        }

        /* --- b. Fond de page --------------------------------------------- */
        .fp-root {
          min-height: 100vh;
          width: 100%;
          box-sizing: border-box;
          padding: 48px 16px 72px;
          display: flex;
          justify-content: center;
          background: radial-gradient(ellipse at 50% -10%, #3a332c 0%, #201b17 70%);
        }

        .fp-card {
          position: relative;
          width: 100%;
          max-width: 640px;
          box-sizing: border-box;
          padding: 56px 40px 48px;
          background: linear-gradient(180deg, var(--paper) 0%, var(--paper-deep) 100%);
          box-shadow: 0 30px 70px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(169, 132, 60, 0.15);
          animation: cardIn 0.9s ease both;
        }

        .fp-inner {
          position: relative;
          text-align: center;
        }

        /* Double cadre doré au bord de la carte */
        .fp-frame {
          position: absolute;
          inset: 14px;
          border: 1px solid var(--gold);
          pointer-events: none;
        }
        .fp-frame::after {
          content: "";
          position: absolute;
          inset: 6px;
          border: 1px solid var(--gold-light);
          opacity: 0.6;
        }

        /* Volutes dorées animées, une par coin (cf. CornerFlourish) */
        .corner {
          position: absolute;
          width: 46px;
          height: 46px;
          overflow: visible;
        }
        .corner-tl { top: 10px; left: 10px; }
        .corner-tr { top: 10px; right: 10px; transform: scaleX(-1); }
        .corner-bl { bottom: 10px; left: 10px; transform: scaleY(-1); }
        .corner-br { bottom: 10px; right: 10px; transform: scale(-1, -1); }

        .flourish-path {
          stroke: var(--gold);
          stroke-width: 1.4;
          stroke-linecap: round;
          stroke-dasharray: 140;
          stroke-dashoffset: 140;
          animation: draw 1.6s 0.3s ease forwards;
        }
        .flourish-dot {
          fill: var(--gold);
          opacity: 0;
          animation: dotIn 0.4s 1.8s ease forwards;
        }

        /* --- c. Emplacement logo ------------------------------------------
           Cadre vide en pointillés dorés : à remplacer par un vrai logo. */
        .logo-placeholder {
          width: 92px;
          height: 92px;
          margin: 0 auto 22px;
          border: 1.5px dashed var(--gold);
          background: rgba(169, 132, 60, 0.05);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo-placeholder-label {
          font-family: 'Jost', sans-serif;
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--gold-deep);
          opacity: 0.75;
        }

        /* --- d. Emplacement photo des mariés -------------------------------
           Rectangle pleine largeur avec double liseré doré. Affiche l'image
           importée si présente, sinon un cadre à compléter. */
        .photo-frame {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 3;
          margin: 0 auto 24px;
          overflow: hidden;
          background: linear-gradient(160deg, #efe4cd 0%, #e2d3b2 100%);
          box-shadow:
            0 0 0 1px var(--gold),
            0 0 0 7px var(--paper),
            0 0 0 8px var(--gold-light);
          opacity: 0;
          animation: fadeUp 0.8s 0.35s ease forwards;
        }
        .photo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          filter: sepia(0.18) saturate(1.05) contrast(1.03);
          display: block;
        }
        .photo-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: var(--gold-deep);
        }
        .photo-placeholder .icon-frame {
          width: 46px;
          height: 46px;
          stroke: var(--gold-deep);
          stroke-width: 1.2;
          opacity: 0.85;
        }
        .photo-placeholder p {
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          margin: 0;
          text-align: center;
          opacity: 0.85;
        }
        .photo-upload {
          display: block;
          width: fit-content;
          margin: 0 auto 30px;
          padding: 6px 14px;
          background: transparent;
          border: 1px solid var(--gold);
          color: var(--gold-deep);
          font-family: 'Jost', sans-serif;
          font-size: 9.5px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease;
          opacity: 0;
          animation: fadeUp 0.8s 0.45s ease forwards;
        }
        .photo-upload:hover {
          background: var(--gold);
          color: var(--paper);
        }
        .photo-upload:focus-within {
          outline: 2px solid var(--gold-deep);
          outline-offset: 2px;
        }

        /* --- f. En-tête : noms, date, compte à rebours -------------------- */
        .fp-eyebrow {
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          color: var(--gold-deep);
          margin: 0 0 10px;
          opacity: 0;
          animation: fadeUp 0.7s 0.5s ease forwards;
        }

        .fp-names {
          font-family: 'Playfair Display', serif;
          font-weight: 700;
          font-size: clamp(34px, 7vw, 52px);
          line-height: 1.1;
          margin: 0;
          color: var(--ink);
          opacity: 0;
          animation: fadeUp 0.8s 0.65s ease forwards;
        }
        .fp-names .amp {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          color: var(--gold-deep);
          font-size: 0.6em;
          margin: 0 10px;
        }

        .fp-rule {
          width: 120px;
          height: 14px;
          margin: 20px auto;
          opacity: 0;
          animation: fadeUp 0.7s 0.85s ease forwards;
        }
        .fp-rule svg { width: 100%; height: 100%; }
        .fp-rule path { stroke: var(--gold); stroke-width: 1; fill: none; }
        .fp-rule circle { fill: var(--gold); }

        .fp-date {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: clamp(18px, 3vw, 22px);
          color: var(--ink-soft);
          margin: 0 0 30px;
          opacity: 0;
          animation: fadeUp 0.7s 1s ease forwards;
        }

        .countdown {
          display: flex;
          justify-content: center;
          gap: 18px;
          margin: 0 0 36px;
          opacity: 0;
          animation: fadeUp 0.7s 1.15s ease forwards;
        }
        .cd-unit { min-width: 58px; }
        .cd-num {
          font-family: 'Playfair Display', serif;
          font-size: 26px;
          color: var(--bordeaux);
          display: block;
          font-variant-numeric: tabular-nums;
        }
        .cd-label {
          font-family: 'Jost', sans-serif;
          font-size: 9px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-soft);
        }

        /* Séparateur doré fin, réutilisé entre chaque grande section */
        .fp-hairline {
          height: 1px;
          margin: 8px 0 32px;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
        }

        /* --- g. Détails cérémonie / réception ------------------------------ */
        .fp-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
          margin-bottom: 32px;
          text-align: center;
        }
        .detail-block .icon {
          width: 30px;
          height: 30px;
          stroke: var(--gold-deep);
          stroke-width: 1.4;
          fill: none;
          margin-bottom: 8px;
        }
        .detail-label {
          font-family: 'Jost', sans-serif;
          font-size: 10.5px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--bordeaux);
          margin: 0 0 6px;
        }
        .detail-place {
          font-family: 'Playfair Display', serif;
          font-size: 17px;
          margin: 0 0 4px;
        }
        .detail-sub {
          font-size: 14.5px;
          color: var(--ink-soft);
          margin: 0;
          line-height: 1.4;
        }

        /* --- h. Déroulé de la journée --------------------------------------- */
        .schedule-title {
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: var(--gold-deep);
          margin-bottom: 20px;
        }
        .schedule-list {
          list-style: none;
          padding: 0;
          margin: 0 0 32px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .schedule-list li {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 14px;
          font-size: 15.5px;
        }
        .schedule-time {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          color: var(--bordeaux);
          min-width: 52px;
          text-align: right;
        }
        .schedule-label { color: var(--ink-soft); }

        /* --- i. Emplacement RSVP (vide, à compléter plus tard) -------------- */
        .rsvp-placeholder {
          margin: 0 auto 4px;
          padding: 46px 20px;
          border: 1.5px dashed var(--gold);
          background: rgba(169, 132, 60, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .rsvp-placeholder-label {
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--gold-deep);
          opacity: 0.75;
        }

        /* --- j. Pied de page ------------------------------------------------ */
        .fp-footer {
          margin-top: 40px;
          text-align: center;
        }
        .fp-footer .foot-line {
          width: 60px;
          height: 1px;
          margin: 0 auto 12px;
          background: var(--gold);
        }
        .fp-footer p {
          font-family: 'Jost', sans-serif;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--ink-soft);
          margin: 0;
        }

        /* --- Animations ------------------------------------------------------ */
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes dotIn {
          to { opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* --- k. Accessibilité & responsive ------------------------------------ */
        @media (prefers-reduced-motion: reduce) {
          .photo-frame, .photo-upload, .fp-card, .flourish-path, .flourish-dot,
          .fp-eyebrow, .fp-names, .fp-rule, .fp-date, .countdown {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }

        @media (max-width: 480px) {
          .fp-card { padding: 44px 20px 36px; }
          .fp-details { grid-template-columns: 1fr; }
          .countdown { gap: 10px; }
          .cd-unit { min-width: 48px; }
        }

        /* --- l. Section Plan de table : même fond nocturne que le faire-part,
           en plein écran, pour une transition harmonieuse entre les deux. ---- */
        .pdt-page {
          width: 100%;
          min-height: 100vh;
          min-height: 100dvh;
          box-sizing: border-box;
          display: flex;
          background: radial-gradient(ellipse at 50% -10%, #3a332c 0%, #201b17 70%);
        }
      `}</style>

      {/* -- 4.3 Rendu JSX --------------------------------------------------- */}
      <div className="fp-card" ref={cardRef}>
        <div className="fp-frame" />
        <CornerFlourish corner="tl" />
        <CornerFlourish corner="tr" />
        <CornerFlourish corner="bl" />
        <CornerFlourish corner="br" />

        <div className="fp-inner">

          {/* Logo — emplacement vide à remplacer plus tard */}
          <div className="logo-placeholder">
            <span className="logo-placeholder-label">Logo</span>
          </div>

          {/* Photo des mariés — image importée ou cadre à compléter */}
          <div className="photo-frame">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={`${WEDDING.bride} et ${WEDDING.groom}`}
                className="photo-img"
              />
            ) : (
              <div className="photo-placeholder">
                <IconFrame />
                <p>Photo des mariés</p>
              </div>
            )}
          </div>
          <label className="photo-upload">
            {photoUrl ? "Changer la photo" : "Ajouter une photo"}
            <input type="file" accept="image/*" onChange={handlePhotoChange} hidden />
          </label>

          {/* Noms des mariés */}
          <p className="fp-eyebrow">Le mariage de</p>
          <h1 className="fp-names">
            {WEDDING.bride}
            <span className="amp">&amp;</span>
            {WEDDING.groom}
          </h1>

          <div className="fp-rule">
            <svg viewBox="0 0 120 14">
              <path d="M0 7 H48" />
              <path d="M72 7 H120" />
              <circle cx="60" cy="7" r="3" />
            </svg>
          </div>

          <p className="fp-date">{WEDDING.dateLabel}</p>

          {/* Compte à rebours jusqu'au jour J */}
          <div className="countdown">
            <div className="cd-unit">
              <span className="cd-num">{timeLeft.jours}</span>
              <span className="cd-label">Jours</span>
            </div>
            <div className="cd-unit">
              <span className="cd-num">{pad(timeLeft.heures)}</span>
              <span className="cd-label">Heures</span>
            </div>
            <div className="cd-unit">
              <span className="cd-num">{pad(timeLeft.minutes)}</span>
              <span className="cd-label">Min.</span>
            </div>
            <div className="cd-unit">
              <span className="cd-num">{pad(timeLeft.secondes)}</span>
              <span className="cd-label">Sec.</span>
            </div>
          </div>

          <div className="fp-hairline" />

          {/* Détails cérémonie / réception */}
          <div className="fp-details">
            <div className="detail-block">
              <IconArch />
              <p className="detail-label">Cérémonie</p>
              <p className="detail-place">{WEDDING.ceremony.place}</p>
              <p className="detail-sub">
                {WEDDING.ceremony.time}
                <br />
                {WEDDING.ceremony.address}
              </p>
            </div>
            <div className="detail-block">
              <IconGlasses />
              <p className="detail-label">Réception</p>
              <p className="detail-place">{WEDDING.reception.place}</p>
              <p className="detail-sub">
                {WEDDING.reception.time}
                <br />
                {WEDDING.reception.address}
              </p>
            </div>
          </div>

          <div className="fp-hairline" />

          {/* Déroulé de la journée */}
          <p className="schedule-title">Déroulé de la journée</p>
          <ul className="schedule-list">
            {WEDDING.schedule.map((step) => (
              <li key={step.time}>
                <span className="schedule-time">{step.time}</span>
                <span className="schedule-label">{step.label}</span>
              </li>
            ))}
          </ul>

          <div className="fp-hairline" />

          {/* RSVP — cadre vide, à compléter plus tard */}
          <div className="rsvp-placeholder">
            <section className="rsvp-placeholder-label">
            <CagnotteMariage/>
            </section>
          </div>

          {/* Pied de page */}
          <div className="fp-footer">
            <div className="foot-line" />
            <p>
              {WEDDING.bride} &amp; {WEDDING.groom} · {WEDDING.dateLabel}
            </p>
          </div>

        </div>
      </div>
    </div>

    {/* Plan de table — section indépendante, occupe toute la page */}
    <section className="pdt-page">
      <PlanDeTable />
    </section>
    </>
  );
}
