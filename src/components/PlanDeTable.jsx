import React, { useState, useRef, useCallback, useEffect } from "react";

/**
 * PlanDeTable — composant de plan de table pour mariage
 * -------------------------------------------------------
 * - Ajout de tables rondes ou rectangulaires, déplaçables à la souris/tactile
 * - Nombre de chaises réglable par table
 * - Clic sur une chaise -> saisie du nom de l'invité + un commentaire
 * - Aucune dépendance externe : à coller tel quel dans un projet React
 *
 * Utilisation :
 *   import PlanDeTable from "./PlanDeTable";
 *   export default function App() { return <PlanDeTable />; }
 */

const ROUND_SEAT_OPTIONS = [4, 6, 8, 10, 12];
const RECT_SEAT_OPTIONS = [4, 6, 8, 10, 12, 14];

let idCounter = 1;
const nextId = () => `table-${idCounter++}`;

function createRoundTable(x, y) {
  return {
    id: nextId(),
    type: "round",
    name: "Nouvelle table",
    x,
    y,
    seats: 8,
    guests: {}, // seatIndex -> { name, comment }
  };
}

function createRectTable(x, y) {
  return {
    id: nextId(),
    type: "rect",
    name: "Nouvelle table",
    x,
    y,
    seats: 8,
    guests: {},
  };
}

// --- Géométrie des chaises -------------------------------------------------

const CHAIR_SIZE = 30;
const ROUND_DIAMETER = 110;
const ROUND_SEAT_DIST = ROUND_DIAMETER / 2 + 26;
const ROUND_BOX = (ROUND_SEAT_DIST + CHAIR_SIZE / 2) * 2;

function roundSeatPositions(seats) {
  const center = ROUND_BOX / 2;
  const positions = [];
  for (let i = 0; i < seats; i++) {
    const angle = (2 * Math.PI * i) / seats - Math.PI / 2;
    positions.push({
      left: center + ROUND_SEAT_DIST * Math.cos(angle) - CHAIR_SIZE / 2,
      top: center + ROUND_SEAT_DIST * Math.sin(angle) - CHAIR_SIZE / 2,
    });
  }
  return positions;
}

function rectDimensions(seats) {
  const perSide = Math.max(2, Math.ceil(seats / 2));
  const width = Math.max(160, perSide * 46);
  const height = 90;
  return { width, height };
}

const RECT_PAD = 40;

function rectSeatPositions(seats) {
  const { width, height } = rectDimensions(seats);
  const top = Math.ceil(seats / 2);
  const bottom = seats - top;
  const boxW = width + RECT_PAD * 2;
  const boxH = height + RECT_PAD * 2;
  const positions = [];

  const spread = (n, y) => {
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const x = RECT_PAD + 18 + t * (width - 36);
      positions.push({ left: x - CHAIR_SIZE / 2, top: y - CHAIR_SIZE / 2 });
    }
  };
  spread(top, RECT_PAD - 22);
  spread(bottom, RECT_PAD + height + 22);
  return { positions, boxW, boxH, width, height };
}

// --- Composant principal ----------------------------------------------------

export default function PlanDeTable() {
  const [tables, setTables] = useState([
    { ...createRoundTable(120, 100), name: "Table d'honneur" },
  ]);
  const [selectedId, setSelectedId] = useState(null);
  const [editingSeat, setEditingSeat] = useState(null); // { tableId, seatIndex, x, y }
  const [draftName, setDraftName] = useState("");
  const [draftComment, setDraftComment] = useState("");

  const canvasRef = useRef(null);
  const dragRef = useRef(null); // { id, offsetX, offsetY }

  const selectedTable = tables.find((t) => t.id === selectedId) || null;

  // --- Déplacement des tables ---
  const onTablePointerDown = (e, table) => {
    e.stopPropagation();
    setSelectedId(table.id);
    setEditingSeat(null);
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const pointerX = e.clientX - canvasRect.left + canvasRef.current.scrollLeft;
    const pointerY = e.clientY - canvasRect.top + canvasRef.current.scrollTop;
    dragRef.current = {
      id: table.id,
      offsetX: pointerX - table.x,
      offsetY: pointerY - table.y,
    };
  };

  useEffect(() => {
    const onMove = (e) => {
      const drag = dragRef.current;
      if (!drag || !canvasRef.current) return;
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const pointerX = e.clientX - canvasRect.left + canvasRef.current.scrollLeft;
      const pointerY = e.clientY - canvasRect.top + canvasRef.current.scrollTop;
      const x = Math.max(0, pointerX - drag.offsetX);
      const y = Math.max(0, pointerY - drag.offsetY);
      setTables((prev) =>
        prev.map((t) => (t.id === drag.id ? { ...t, x, y } : t))
      );
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  // --- Gestion des tables ---
  const addTable = (type) => {
    const offset = tables.length * 24;
    const t =
      type === "round"
        ? createRoundTable(160 + offset, 160 + offset)
        : createRectTable(160 + offset, 160 + offset);
    setTables((prev) => [...prev, t]);
    setSelectedId(t.id);
  };

  const updateSelected = (patch) => {
    if (!selectedTable) return;
    setTables((prev) =>
      prev.map((t) => (t.id === selectedTable.id ? { ...t, ...patch } : t))
    );
  };

  const changeSeatCount = (seats) => {
    if (!selectedTable) return;
    const guests = {};
    Object.entries(selectedTable.guests).forEach(([idx, g]) => {
      if (Number(idx) < seats) guests[idx] = g;
    });
    updateSelected({ seats, guests });
  };

  const deleteSelected = () => {
    if (!selectedTable) return;
    setTables((prev) => prev.filter((t) => t.id !== selectedTable.id));
    setSelectedId(null);
    setEditingSeat(null);
  };

  // --- Gestion des invités ---
  const openSeatEditor = (e, table, seatIndex, chairLeft, chairTop) => {
    e.stopPropagation();
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = table.x + chairLeft + CHAIR_SIZE / 2;
    const y = table.y + chairTop + CHAIR_SIZE / 2;
    const existing = table.guests[seatIndex] || { name: "", comment: "" };
    setDraftName(existing.name);
    setDraftComment(existing.comment);
    setEditingSeat({
      tableId: table.id,
      seatIndex,
      x: Math.min(x, canvasRef.current.scrollWidth - 260),
      y,
    });
  };

  const saveSeat = () => {
    if (!editingSeat) return;
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== editingSeat.tableId) return t;
        const guests = { ...t.guests };
        if (draftName.trim() === "" && draftComment.trim() === "") {
          delete guests[editingSeat.seatIndex];
        } else {
          guests[editingSeat.seatIndex] = {
            name: draftName.trim(),
            comment: draftComment.trim(),
          };
        }
        return { ...t, guests };
      })
    );
    setEditingSeat(null);
  };

  const clearSeat = () => {
    setDraftName("");
    setDraftComment("");
  };

  // --- Statistiques ---
  const totalSeats = tables.reduce((sum, t) => sum + t.seats, 0);
  const totalGuests = tables.reduce(
    (sum, t) =>
      sum +
      Object.values(t.guests).filter((g) => g.name.trim() !== "").length,
    0
  );

  return (
    <div className="pdt-root">
      <style>{STYLES}</style>

      <header className="pdt-header">
        <div>
          <p className="pdt-eyebrow">Organisation de la réception</p>
          <h1>Plan de table</h1>
          <p className="pdt-subtitle">
            Glissez les tables pour les positionner, cliquez sur une chaise
            pour y placer un invité.
          </p>
        </div>
        <div className="pdt-stats">
          <span className="pdt-stats-number">{totalGuests}</span>
          <span className="pdt-stats-label">/ {totalSeats} places pourvues</span>
        </div>
      </header>

      <div className="pdt-body">
        <aside className="pdt-sidebar">
          <div className="pdt-panel">
            <h2>Ajouter</h2>
            <button className="pdt-btn pdt-btn-primary" onClick={() => addTable("round")}>
              + Table ronde
            </button>
            <button className="pdt-btn pdt-btn-primary" onClick={() => addTable("rect")}>
              + Table rectangulaire
            </button>
          </div>

          {selectedTable ? (
            <div className="pdt-panel">
              <h2>Table sélectionnée</h2>
              <label className="pdt-field">
                <span>Nom</span>
                <input
                  type="text"
                  value={selectedTable.name}
                  onChange={(e) => updateSelected({ name: e.target.value })}
                />
              </label>
              <label className="pdt-field">
                <span>Nombre de chaises</span>
                <select
                  value={selectedTable.seats}
                  onChange={(e) => changeSeatCount(Number(e.target.value))}
                >
                  {(selectedTable.type === "round"
                    ? ROUND_SEAT_OPTIONS
                    : RECT_SEAT_OPTIONS
                  ).map((n) => (
                    <option key={n} value={n}>
                      {n} places
                    </option>
                  ))}
                </select>
              </label>
              <button className="pdt-btn pdt-btn-danger" onClick={deleteSelected}>
                Supprimer cette table
              </button>
            </div>
          ) : (
            <div className="pdt-panel pdt-panel-hint">
              Sélectionnez une table pour la modifier.
            </div>
          )}

          {tables.length > 0 && (
            <div className="pdt-panel">
              <h2>Invités placés</h2>
              <ul className="pdt-guest-list">
                {tables.map((t) =>
                  Object.entries(t.guests)
                    .filter(([, g]) => g.name.trim() !== "")
                    .map(([idx, g]) => (
                      <li key={t.id + idx}>
                        <strong>{g.name}</strong>
                        <span className="pdt-guest-table">{t.name}</span>
                      </li>
                    ))
                )}
                {totalGuests === 0 && <li className="pdt-empty">Aucun invité placé pour l'instant.</li>}
              </ul>
            </div>
          )}
        </aside>

        <div
          className="pdt-canvas"
          ref={canvasRef}
          onPointerDown={() => {
            setSelectedId(null);
            setEditingSeat(null);
          }}
        >
          {tables.map((table) => (
            <TableView
              key={table.id}
              table={table}
              selected={table.id === selectedId}
              onPointerDown={(e) => onTablePointerDown(e, table)}
              onSeatClick={openSeatEditor}
            />
          ))}

          {editingSeat && (
            <div
              className="pdt-seat-editor"
              style={{ left: editingSeat.x, top: editingSeat.y }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <label className="pdt-field">
                <span>Nom de l'invité</span>
                <input
                  autoFocus
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="Ex. Camille Durand"
                />
              </label>
              <label className="pdt-field">
                <span>Commentaire</span>
                <textarea
                  rows={2}
                  value={draftComment}
                  onChange={(e) => setDraftComment(e.target.value)}
                  placeholder="Allergie, régime, enfant, VIP…"
                />
              </label>
              <div className="pdt-seat-editor-actions">
                <button className="pdt-btn pdt-btn-ghost" onClick={clearSeat}>
                  Vider
                </button>
                <button className="pdt-btn pdt-btn-primary" onClick={saveSeat}>
                  Enregistrer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Sous-composant : une table + ses chaises -------------------------------

function TableView({ table, selected, onPointerDown, onSeatClick }) {
  if (table.type === "round") {
    const positions = roundSeatPositions(table.seats);
    return (
      <div
        className="pdt-table-wrap"
        style={{ left: table.x, top: table.y, width: ROUND_BOX, height: ROUND_BOX }}
      >
        <div
          className={`pdt-table pdt-table-round ${selected ? "is-selected" : ""}`}
          style={{
            width: ROUND_DIAMETER,
            height: ROUND_DIAMETER,
            left: ROUND_BOX / 2 - ROUND_DIAMETER / 2,
            top: ROUND_BOX / 2 - ROUND_DIAMETER / 2,
          }}
          onPointerDown={onPointerDown}
        >
          <span>{table.name}</span>
        </div>
        {positions.map((pos, i) => (
          <Chair
            key={i}
            pos={pos}
            guest={table.guests[i]}
            onClick={(e) => onSeatClick(e, table, i, pos.left, pos.top)}
          />
        ))}
      </div>
    );
  }

  const { positions, boxW, boxH, width, height } = rectSeatPositions(table.seats);
  return (
    <div className="pdt-table-wrap" style={{ left: table.x, top: table.y, width: boxW, height: boxH }}>
      <div
        className={`pdt-table pdt-table-rect ${selected ? "is-selected" : ""}`}
        style={{
          width,
          height,
          left: RECT_PAD,
          top: RECT_PAD,
        }}
        onPointerDown={onPointerDown}
      >
        <span>{table.name}</span>
      </div>
      {positions.map((pos, i) => (
        <Chair
          key={i}
          pos={pos}
          guest={table.guests[i]}
          onClick={(e) => onSeatClick(e, table, i, pos.left, pos.top)}
        />
      ))}
    </div>
  );
}

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function Chair({ pos, guest, onClick }) {
  const occupied = guest && guest.name.trim() !== "";
  return (
    <button
      type="button"
      className={`pdt-chair ${occupied ? "is-occupied" : ""}`}
      style={{ left: pos.left, top: pos.top, width: CHAIR_SIZE, height: CHAIR_SIZE }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClick}
      title={occupied ? `${guest.name}${guest.comment ? " — " + guest.comment : ""}` : "Chaise libre"}
    >
      {occupied ? initials(guest.name) : ""}
    </button>
  );
}

// --- Styles ------------------------------------------------------------------

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,600&family=Cormorant+Garamond:ital,wght@0,500;1,500;1,600&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Jost:wght@400;500&display=swap');

.pdt-root {
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
.pdt-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  padding: 30px 36px 20px;
  border-bottom: 1px solid rgba(169, 132, 60, 0.35);
}
.pdt-eyebrow {
  font-family: 'Jost', sans-serif;
  font-size: 11px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--gold-deep);
  margin: 0 0 8px;
}
.pdt-header h1 {
  font-family: 'Playfair Display', serif;
  font-weight: 700;
  font-size: 30px;
  margin: 0 0 6px;
  color: var(--ink);
}
.pdt-subtitle {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  margin: 0;
  font-size: 16px;
  color: var(--ink-soft);
  max-width: 46ch;
}
.pdt-stats {
  text-align: right;
  white-space: nowrap;
}
.pdt-stats-number {
  font-family: 'Playfair Display', serif;
  font-size: 28px;
  color: var(--bordeaux);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.pdt-stats-label {
  font-family: 'Jost', sans-serif;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-soft);
  margin-left: 4px;
}
.pdt-body {
  display: flex;
  flex: 1;
  min-height: 0;
}
.pdt-sidebar {
  width: 280px;
  flex-shrink: 0;
  padding: 22px;
  border-right: 1px solid rgba(169, 132, 60, 0.35);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.pdt-panel {
  background: var(--paper);
  border: 1px solid rgba(169, 132, 60, 0.4);
  padding: 18px;
  box-shadow: 0 4px 14px rgba(42, 36, 32, 0.06);
}
.pdt-panel-hint {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  color: var(--ink-soft);
  font-size: 15px;
}
.pdt-panel h2 {
  font-family: 'Jost', sans-serif;
  font-size: 11px;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  margin: 0 0 14px;
  color: var(--gold-deep);
  font-weight: 500;
}
.pdt-field {
  display: block;
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--ink-soft);
}
.pdt-field span {
  display: block;
  margin-bottom: 5px;
  font-family: 'Jost', sans-serif;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-soft);
}
.pdt-field input,
.pdt-field select,
.pdt-field textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 9px 10px;
  border: 1px solid var(--gold-light);
  background: #fffdf8;
  font-size: 15px;
  font-family: 'EB Garamond', serif;
  color: var(--ink);
}
.pdt-field input:focus,
.pdt-field select:focus,
.pdt-field textarea:focus {
  outline: 1.5px solid var(--bordeaux);
  outline-offset: 1px;
}
.pdt-btn {
  display: block;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--gold);
  background: transparent;
  color: var(--gold-deep);
  font-family: 'Jost', sans-serif;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
  margin-bottom: 9px;
  transition: background 0.2s ease, color 0.2s ease;
}
.pdt-btn:last-child { margin-bottom: 0; }
.pdt-btn:hover {
  background: var(--gold);
  color: var(--paper);
}
.pdt-btn-primary {
  background: var(--bordeaux);
  border-color: var(--bordeaux);
  color: var(--paper);
}
.pdt-btn-primary:hover {
  background: var(--bordeaux-light);
  border-color: var(--bordeaux-light);
  color: var(--paper);
}
.pdt-btn-danger {
  color: var(--bordeaux);
  border-color: var(--bordeaux-light);
}
.pdt-btn-danger:hover {
  background: var(--bordeaux);
  border-color: var(--bordeaux);
  color: var(--paper);
}
.pdt-btn-ghost {
  border-color: rgba(169, 132, 60, 0.4);
  color: var(--ink-soft);
}
.pdt-btn-ghost:hover {
  background: rgba(169, 132, 60, 0.12);
  color: var(--ink);
}
.pdt-guest-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 220px;
  overflow-y: auto;
  font-size: 14px;
  font-family: 'EB Garamond', serif;
}
.pdt-guest-list li {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 0;
  border-bottom: 1px solid rgba(169, 132, 60, 0.25);
}
.pdt-guest-list li:last-child { border-bottom: none; }
.pdt-guest-table {
  font-family: 'Jost', sans-serif;
  color: var(--ink-soft);
  font-size: 10.5px;
  letter-spacing: 0.06em;
  white-space: nowrap;
}
.pdt-empty {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  color: var(--ink-soft);
}
.pdt-canvas {
  position: relative;
  flex: 1;
  overflow: auto;
  background-image: radial-gradient(circle, rgba(169, 132, 60, 0.35) 1px, transparent 1px);
  background-size: 22px 22px;
  background-color: #fdfaf3;
}
.pdt-table-wrap {
  position: absolute;
  touch-action: none;
}
.pdt-table {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 6px;
  box-sizing: border-box;
  background: linear-gradient(180deg, var(--paper) 0%, var(--paper-deep) 100%);
  border: 2px solid var(--gold);
  color: var(--ink);
  font-family: 'Playfair Display', serif;
  font-size: 13px;
  font-weight: 600;
  cursor: grab;
  user-select: none;
  box-shadow: 0 3px 10px rgba(42, 36, 32, 0.12);
}
.pdt-table:active { cursor: grabbing; }
.pdt-table-round { border-radius: 50%; }
.pdt-table-rect { border-radius: 2px; }
.pdt-table.is-selected {
  border-color: var(--bordeaux);
  box-shadow: 0 0 0 3px rgba(107, 30, 43, 0.2);
}
.pdt-chair {
  position: absolute;
  border-radius: 50%;
  border: 1.5px solid var(--gold);
  background: var(--paper);
  color: var(--gold-deep);
  font-family: 'Jost', sans-serif;
  font-size: 11px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  touch-action: none;
}
.pdt-chair:hover {
  background: rgba(169, 132, 60, 0.15);
}
.pdt-chair.is-occupied {
  background: var(--bordeaux);
  color: var(--paper);
  border-color: var(--bordeaux-light);
}
.pdt-seat-editor {
  position: absolute;
  z-index: 20;
  width: 240px;
  background: linear-gradient(180deg, var(--paper) 0%, var(--paper-deep) 100%);
  border: 1px solid var(--gold);
  padding: 16px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(169, 132, 60, 0.15);
}
.pdt-seat-editor-actions {
  display: flex;
  gap: 8px;
}
.pdt-seat-editor-actions .pdt-btn {
  margin-bottom: 0;
}
`;
