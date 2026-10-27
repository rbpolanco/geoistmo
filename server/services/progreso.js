import { ahoraISO, diaPanama, sumarDias } from '../db/connection.js';

// Los cuatro niveles los nombra el Avance 2 (sección 2.7); los umbrales de XP son propuesta del equipo.
export const NIVELES = [
  { n: 1, nombre: 'Explorador', desde: 0 },
  { n: 2, nombre: 'Cartógrafo', desde: 200 },
  { n: 3, nombre: 'Analista', desde: 500 },
  { n: 4, nombre: 'Geógrafo', desde: 1000 },
];
export const BONO_MISION = 15;   // Avance 2, 02-13: +15 XP de bono
export const META_PCT = 80;      // Meta del Avance 1/2: ≥ 80 %

// Rangos de calificación del Avance 2 (sección 2.6). Provisionales hasta la decisión D3.
export function banda(pct) {
  if (pct >= 90) return { clave: 'dominado', etiqueta: 'Dominado', mensaje: '¡Excelente! Dominas este tema.' };
  if (pct >= 80) return { clave: 'logrado', etiqueta: 'Logrado', mensaje: 'Muy bien, cumples la meta.' };
  if (pct >= 60) return { clave: 'proceso', etiqueta: 'En proceso', mensaje: 'Vas bien, repasa estos puntos.' };
  return { clave: 'reforzar', etiqueta: 'Por reforzar', mensaje: 'Volvamos a la lección con calma.' };
}

export function crearProgreso(db) {
  return {
    xpTotal: (uid) => db.prepare('SELECT COALESCE(SUM(amount),0) s FROM xp_ledger WHERE user_id=?').get(uid).s,
    xpSemana: (uid, dia = diaPanama()) => db.prepare('SELECT COALESCE(SUM(amount),0) s FROM xp_ledger WHERE user_id=? AND day BETWEEN ? AND ?').get(uid, sumarDias(dia, -6), dia).s,
    xpHoy: (uid, dia = diaPanama()) => db.prepare('SELECT COALESCE(SUM(amount),0) s FROM xp_ledger WHERE user_id=? AND day=?').get(uid, dia).s,
    nivel(xp) {
      const actual = [...NIVELES].reverse().find((n) => xp >= n.desde);
      const sig = NIVELES.find((n) => n.desde > xp);
      return { n: actual.n, nombre: actual.nombre, siguiente: sig ? { nombre: sig.nombre, faltan: sig.desde - xp } : null };
    },
    // Racha: días seguidos con misión completa. Si hoy aún no se completa, cuenta hasta ayer (Avance 2, 2.7).
    racha(uid, hoy = diaPanama()) {
      const dias = new Set(db.prepare('SELECT day FROM daily_missions WHERE user_id=?').all(uid).map((r) => r.day));
      let d = dias.has(hoy) ? hoy : sumarDias(hoy, -1), n = 0;
      while (dias.has(d)) { n++; d = sumarDias(d, -1); }
      return n;
    },
    // Paga solo la diferencia entre lo ya otorgado con esa referencia y el objetivo: nunca duplica XP.
    otorgarXp(uid, objetivo, ref, motivo, dia) {
      const ya = db.prepare('SELECT COALESCE(SUM(amount),0) s FROM xp_ledger WHERE user_id=? AND ref=?').get(uid, ref).s;
      const dif = objetivo - ya;
      if (dif > 0) db.prepare('INSERT INTO xp_ledger(user_id,amount,reason,ref,day,created_at) VALUES (?,?,?,?,?,?)').run(uid, dif, motivo, ref, dia, ahoraISO());
      return Math.max(dif, 0);
    },
    album(uid) {
      return db.prepare(`SELECT b.*, (ub.user_id IS NOT NULL) AS ganada FROM badges b
        LEFT JOIN user_badges ub ON ub.badge_id=b.id AND ub.user_id=? ORDER BY b.position`).all(uid)
        .map((b) => ({ posicion: b.position, ganada: !!b.ganada, nombre: b.ganada ? b.name : 'Por descubrir', lugar: b.ganada ? b.place : '', imagen: b.ganada ? b.image : null, escudo: !!b.is_shield }));
    },
  };
}
