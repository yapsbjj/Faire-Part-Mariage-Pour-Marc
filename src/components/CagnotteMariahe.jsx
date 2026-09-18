import React, { useState, useMemo } from "react";

/**
 * CagnotteMariage — cagnotte en ligne pour les mariés
 * -----------------------------------------------------
 * - Objectif et titre de la cagnotte personnalisables
 * - Montants suggérés ou montant libre
 * - Message des contributeurs affiché dans un "livre d'or"
 * - Barre de progression + statistiques
 *
 * IMPORTANT : ce composant est une interface pure, sans paiement réel.
 * Les contributions ne font qu'alimenter l'état local React (rien n'est
 * transmis à une banque). Pour encaisser de vrais dons, il faut brancher
 * un prestataire (Stripe Checkout, Lydia, Leetchi, PayPal…) au moment du
 * clic sur "Contribuer" — voir le commentaire dans handleSubmit ci-dessous.
 *
 * Utilisation :
 *   import CagnotteMariage from "./CagnotteMariage";
 *   export default function App() { return <CagnotteMariage />; }
 */

const QUICK_AMOUNTS = [20, 50, 100, 150];

const currency = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function relativeDate(date) {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

let idCounter = 1;

export default function CagnotteMariage() {
  const [title, setTitle] = useState("Notre lune de miel");
  const [goal, setGoal] = useState(3000);
  const [contributions, setContributions] = useState([
    {
      id: idCounter++,
      name: "Camille & Antoine",
      amount: 100,
      message: "Merci d'avance pour ce beau voyage, on vous embrasse fort !",
      date: new Date(Date.now() - 1000 * 60 * 60 * 26),
    },
    {
      id: idCounter++,
      name: "Famille Petit",
      amount: 50,
      message: "Tous nos vœux de bonheur aux mariés.",
      date: new Date(Date.now() - 1000 * 60 * 60 * 3),
    },
  ]);

  const [selectedQuick, setSelectedQuick] = useState(50);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");

  const [editingGoal, setEditingGoal] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);

  const total = useMemo(
    () => contributions.reduce((sum, c) => sum + c.amount, 0),
    [contributions]
  );
  const percent = goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : 0;
  const amountToGive = useCustom ? Number(customAmount) || 0 : selectedQuick;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Merci d'indiquer votre nom.");
      return;
    }
    if (!amountToGive || amountToGive <= 0) {
      setError("Merci de choisir un montant valide.");
      return;
    }

    // --- Intégration paiement réel ---------------------------------------
    // Ici, à la place de l'ajout direct dans l'état local, on appellerait
    // un prestataire de paiement, par ex. :
    //   const session = await fetch("/api/create-checkout-session", {
    //     method: "POST",
    //     body: JSON.stringify({ amount: amountToGive, name, message }),
    //   });
    //   window.location.href = session.url; // redirection vers Stripe Checkout
    // La contribution ne serait ajoutée à la liste qu'après confirmation
    // du paiement (webhook côté serveur), pas directement côté client.
    // -----------------------------------------------------------------------

    setContributions((prev) => [
      {
        id: idCounter++,
        name: name.trim(),
        amount: amountToGive,
        message: message.trim(),
        date: new Date(),
      },
      ...prev,
    ]);
    setConfirmation(`Merci infiniment, ${name.trim()} ! Votre don de ${currency.format(amountToGive)} a été enregistré.`);
    setName("");
    setMessage("");
    setCustomAmount("");
    setUseCustom(false);
    setSelectedQuick(50);
    window.setTimeout(() => setConfirmation(""), 5000);
  };

  return (
    <div className="cag-root">
      <style>{STYLES}</style>

      <header className="cag-header">
        <div>
          <p className="cag-eyebrow">Un geste pour notre nouvelle vie</p>
          {editingTitle ? (
            <input
              autoFocus
              className="cag-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
            />
          ) : (
            <h1 onClick={() => setEditingTitle(true)} title="Cliquer pour modifier">
              {title}
            </h1>
          )}
          <p className="cag-subtitle">
            Votre présence est le plus beau des cadeaux — si vous souhaitez
            néanmoins nous aider à démarrer notre nouvelle vie, voici notre cagnotte.
          </p>
        </div>
        <div className="cag-stats">
          <span className="cag-stats-number">{currency.format(total)}</span>
          <span className="cag-stats-label">
            collectés {editingGoal ? (
              <input
                autoFocus
                type="number"
                min="0"
                className="cag-goal-input"
                value={goal}
                onChange={(e) => setGoal(Math.max(0, Number(e.target.value) || 0))}
                onBlur={() => setEditingGoal(false)}
                onKeyDown={(e) => e.key === "Enter" && setEditingGoal(false)}
              />
            ) : (
              <span className="cag-goal-value" onClick={() => setEditingGoal(true)} title="Cliquer pour modifier l'objectif">
                sur {currency.format(goal)}
              </span>
            )}
          </span>
        </div>
      </header>

      <div className="cag-body">
        <main className="cag-main">
          <section className="cag-progress-card">
            <div className="cag-progress-bar">
              <div className="cag-progress-fill" style={{ width: `${percent}%` }} />
            </div>
            <div className="cag-progress-row">
              <span className="cag-progress-percent">{percent}%</span>
              <span className="cag-progress-detail">
                {contributions.length} contributeur{contributions.length > 1 ? "s" : ""}
              </span>
            </div>
          </section>

          <section className="cag-form-card">
            <h2>Faire un don</h2>
            <div className="cag-quick-amounts">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  type="button"
                  key={amt}
                  className={`cag-chip ${!useCustom && selectedQuick === amt ? "is-active" : ""}`}
                  onClick={() => {
                    setUseCustom(false);
                    setSelectedQuick(amt);
                  }}
                >
                  {amt} €
                </button>
              ))}
              <button
                type="button"
                className={`cag-chip ${useCustom ? "is-active" : ""}`}
                onClick={() => setUseCustom(true)}
              >
                Autre montant
              </button>
            </div>

            {useCustom && (
              <label className="cag-field">
                <span>Montant (€)</span>
                <input
                  type="number"
                  min="1"
                  autoFocus
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Ex. 75"
                />
              </label>
            )}

            <form onSubmit={handleSubmit}>
              <label className="cag-field">
                <span>Votre nom</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex. Julie Martin"
                />
              </label>
              <label className="cag-field">
                <span>Un petit mot (facultatif)</span>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tous nos vœux de bonheur…"
                />
              </label>

              {error && <p className="cag-error">{error}</p>}

              <button type="submit" className="cag-btn cag-btn-primary">
                Contribuer {amountToGive > 0 ? `— ${currency.format(amountToGive)}` : ""}
              </button>
            </form>

            {confirmation && <p className="cag-confirmation">{confirmation}</p>}
          </section>
        </main>

        <aside className="cag-sidebar">
          <h2 className="cag-sidebar-title">Livre d'or</h2>
          <ul className="cag-wall">
            {contributions.length === 0 && (
              <li className="cag-empty">Soyez le premier à contribuer !</li>
            )}
            {contributions.map((c) => (
              <li key={c.id} className="cag-wall-item">
                <div className="cag-wall-row">
                  <span className="cag-wall-name">{c.name}</span>
                  <span className="cag-wall-amount">{currency.format(c.amount)}</span>
                </div>
                {c.message && <p className="cag-wall-message">« {c.message} »</p>}
                <span className="cag-wall-date">{relativeDate(c.date)}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,600&family=Cormorant+Garamond:ital,wght@0,500;1,500;1,600&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Jost:wght@400;500&display=swap');

.cag-root {
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
  background: linear-gradient(180deg, var(--paper) 0%, var(--paper-deep) 100%);
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  box-sizing: border-box;
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(169, 132, 60, 0.15);
  display: flex;
  flex-direction: column;
}

.cag-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 18px;
  padding: 30px 36px 20px;
  border-bottom: 1px solid rgba(169, 132, 60, 0.35);
}
.cag-eyebrow {
  font-family: 'Jost', sans-serif;
  font-size: 11px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--gold-deep);
  margin: 0 0 8px;
}
.cag-header h1 {
  font-family: 'Playfair Display', serif;
  font-weight: 700;
  font-size: 30px;
  margin: 0 0 6px;
  color: var(--ink);
  cursor: text;
}
.cag-title-input {
  font-family: 'Playfair Display', serif;
  font-weight: 700;
  font-size: 30px;
  margin: 0 0 6px;
  color: var(--ink);
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--gold);
  padding: 0 0 2px;
  width: 100%;
  max-width: 420px;
}
.cag-title-input:focus { outline: none; border-color: var(--bordeaux); }
.cag-subtitle {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  margin: 0;
  font-size: 16px;
  color: var(--ink-soft);
  max-width: 50ch;
}
.cag-stats {
  text-align: right;
  white-space: nowrap;
}
.cag-stats-number {
  font-family: 'Playfair Display', serif;
  font-size: 28px;
  color: var(--bordeaux);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  display: block;
}
.cag-stats-label {
  font-family: 'Jost', sans-serif;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-soft);
}
.cag-goal-value {
  cursor: pointer;
  border-bottom: 1px dotted var(--gold-deep);
}
.cag-goal-input {
  width: 90px;
  font-family: 'Jost', sans-serif;
  font-size: 11px;
  border: none;
  border-bottom: 1px solid var(--gold);
  background: transparent;
  color: var(--ink-soft);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.cag-goal-input:focus { outline: none; border-color: var(--bordeaux); }

.cag-body {
  display: flex;
  flex: 1;
  min-height: 0;
}

.cag-main {
  flex: 1;
  overflow-y: auto;
  padding: 30px 36px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.cag-progress-card,
.cag-form-card {
  background: var(--paper);
  border: 1px solid rgba(169, 132, 60, 0.4);
  padding: 22px 24px;
  box-shadow: 0 4px 14px rgba(42, 36, 32, 0.06);
  max-width: 560px;
}

.cag-progress-bar {
  height: 10px;
  background: rgba(169, 132, 60, 0.15);
  border: 1px solid rgba(169, 132, 60, 0.4);
  overflow: hidden;
}
.cag-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--gold) 0%, var(--bordeaux) 100%);
  transition: width 0.5s ease;
}
.cag-progress-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-top: 10px;
}
.cag-progress-percent {
  font-family: 'Playfair Display', serif;
  font-size: 20px;
  color: var(--ink);
}
.cag-progress-detail {
  font-family: 'Jost', sans-serif;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-soft);
}

.cag-form-card h2 {
  font-family: 'Jost', sans-serif;
  font-size: 11px;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  margin: 0 0 16px;
  color: var(--gold-deep);
  font-weight: 500;
}

.cag-quick-amounts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
.cag-chip {
  font-family: 'Jost', sans-serif;
  font-size: 12px;
  letter-spacing: 0.06em;
  padding: 8px 14px;
  border: 1px solid var(--gold);
  background: transparent;
  color: var(--gold-deep);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}
.cag-chip:hover { background: rgba(169, 132, 60, 0.12); }
.cag-chip.is-active {
  background: var(--bordeaux);
  border-color: var(--bordeaux);
  color: var(--paper);
}

.cag-field {
  display: block;
  margin-bottom: 14px;
  font-size: 13px;
  color: var(--ink-soft);
}
.cag-field span {
  display: block;
  margin-bottom: 5px;
  font-family: 'Jost', sans-serif;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-soft);
}
.cag-field input,
.cag-field textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 9px 10px;
  border: 1px solid var(--gold-light);
  background: #fffdf8;
  font-size: 15px;
  font-family: 'EB Garamond', serif;
  color: var(--ink);
}
.cag-field input:focus,
.cag-field textarea:focus {
  outline: 1.5px solid var(--bordeaux);
  outline-offset: 1px;
}

.cag-btn {
  display: inline-block;
  padding: 11px 22px;
  border: 1px solid var(--gold);
  background: transparent;
  color: var(--gold-deep);
  font-family: 'Jost', sans-serif;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}
.cag-btn-primary {
  background: var(--bordeaux);
  border-color: var(--bordeaux);
  color: var(--paper);
  width: 100%;
}
.cag-btn-primary:hover {
  background: var(--bordeaux-light);
  border-color: var(--bordeaux-light);
}

.cag-error {
  font-family: 'Jost', sans-serif;
  font-size: 12px;
  color: var(--bordeaux);
  margin: 0 0 12px;
}
.cag-confirmation {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 15px;
  color: var(--gold-deep);
  margin: 14px 0 0;
}

.cag-sidebar {
  width: 300px;
  flex-shrink: 0;
  border-left: 1px solid rgba(169, 132, 60, 0.35);
  padding: 26px 22px;
  overflow-y: auto;
}
.cag-sidebar-title {
  font-family: 'Jost', sans-serif;
  font-size: 11px;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  margin: 0 0 16px;
  color: var(--gold-deep);
  font-weight: 500;
}
.cag-wall {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.cag-wall-item {
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(169, 132, 60, 0.25);
}
.cag-wall-item:last-child { border-bottom: none; }
.cag-wall-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}
.cag-wall-name {
  font-family: 'Playfair Display', serif;
  font-size: 15px;
  color: var(--ink);
}
.cag-wall-amount {
  font-family: 'Jost', sans-serif;
  font-size: 12px;
  color: var(--bordeaux);
  white-space: nowrap;
}
.cag-wall-message {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 14.5px;
  color: var(--ink-soft);
  margin: 6px 0 4px;
  line-height: 1.4;
}
.cag-wall-date {
  font-family: 'Jost', sans-serif;
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #9c9182;
}
.cag-empty {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  color: var(--ink-soft);
}

@media (max-width: 760px) {
  .cag-body { flex-direction: column; }
  .cag-sidebar {
    width: auto;
    border-left: none;
    border-top: 1px solid rgba(169, 132, 60, 0.35);
  }
}
`;
