"use client";

import { useState } from "react";
import styles from "./DateRangePicker.module.css";

// Calendario a doppio mese per la selezione dell'intervallo di date,
// sostituisce i due <input type="date"> separati con un'esperienza in stile
// "Scegli le date": primo click imposta l'arrivo, secondo click (su un
// giorno successivo) imposta la partenza. Un click su un giorno precedente
// all'arrivo già scelto ricomincia la selezione da capo.

const WEEK_DAYS = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"];

function toISODate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function todayISO() {
  const now = new Date();
  return toISODate(now.getFullYear(), now.getMonth(), now.getDate());
}

function addMonths(base: Date, n: number) {
  return new Date(base.getFullYear(), base.getMonth() + n, 1);
}

function buildMonthCells(monthStart: Date): (string | null)[] {
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // getDay(): 0=domenica..6=sabato -> convertiamo a settimana lun..dom (0=lun)
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;

  const cells: (string | null)[] = Array(firstWeekday).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(toISODate(year, month, d));
  }
  return cells;
}

function MonthGrid({
  monthStart,
  checkIn,
  checkOut,
  today,
  onPick,
}: {
  monthStart: Date;
  checkIn: string;
  checkOut: string;
  today: string;
  onPick: (date: string) => void;
}) {
  const cells = buildMonthCells(monthStart);

  return (
    <div className={styles.month}>
      <div className={styles.weekRow}>
        {WEEK_DAYS.map((w) => (
          <span key={w} className={styles.weekDay}>
            {w}
          </span>
        ))}
      </div>
      <div className={styles.daysGrid}>
        {cells.map((date, i) => {
          if (!date) return <span key={i} className={`${styles.dayCell} ${styles.dayCellEmpty}`} />;

          const isPast = date < today;
          const isEdge = date === checkIn || date === checkOut;
          const isInRange = Boolean(checkIn && checkOut && date > checkIn && date < checkOut);
          const isToday = date === today;

          return (
            <button
              key={date}
              type="button"
              disabled={isPast}
              className={`${styles.dayCell} ${isInRange ? styles.dayInRange : ""} ${
                isEdge ? styles.dayEdge : ""
              } ${isToday ? styles.dayToday : ""}`}
              onClick={() => onPick(date)}
            >
              {Number(date.slice(-2))}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DateRangePicker({
  checkIn,
  checkOut,
  onChange,
  onClose,
}: {
  checkIn: string;
  checkOut: string;
  onChange: (checkIn: string, checkOut: string) => void;
  onClose: () => void;
}) {
  const [leftMonth, setLeftMonth] = useState(() => {
    const base = checkIn ? new Date(checkIn) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const today = todayISO();

  function handlePick(date: string) {
    if (!checkIn || (checkIn && checkOut)) {
      onChange(date, "");
    } else if (date > checkIn) {
      onChange(checkIn, date);
    } else {
      onChange(date, "");
    }
  }

  return (
    <div className={styles.popup}>
      <div className={styles.months}>
        {[leftMonth, addMonths(leftMonth, 1)].map((m, idx) => (
          <div key={idx} style={{ flex: 1 }}>
            <div className={styles.monthHead}>
              <button
                type="button"
                className={`${styles.monthNavBtn} ${idx === 1 ? styles.monthNavBtnHidden : ""}`}
                onClick={() => setLeftMonth((prev) => addMonths(prev, -1))}
                aria-label="Mese precedente"
              >
                ‹
              </button>
              <span className={styles.monthTitle}>
                {m.toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
              </span>
              <button
                type="button"
                className={`${styles.monthNavBtn} ${idx === 0 ? styles.monthNavBtnHidden : ""}`}
                onClick={() => setLeftMonth((prev) => addMonths(prev, 1))}
                aria-label="Mese successivo"
              >
                ›
              </button>
            </div>
            <MonthGrid
              monthStart={m}
              checkIn={checkIn}
              checkOut={checkOut}
              today={today}
              onPick={handlePick}
            />
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <button type="button" className={styles.clearBtn} onClick={() => onChange("", "")}>
          Cancella date
        </button>
        <button type="button" className={styles.closeBtn} onClick={onClose}>
          Chiudi
        </button>
      </div>
    </div>
  );
}
