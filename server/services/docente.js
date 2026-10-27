import { diaPanama, ahoraISO } from '../db/connection.js';
import { noEncontrado, prohibido, invalido } from '../util/errores.js';
import { banda } from './progreso.js';

export function crearDocente(db, progreso) {
  // Un docente solo puede ver y modificar las secciones que tiene asignadas.
  function exigirSeccion(docente, seccionId) {
    const s = db.prepare('SELECT * FROM sections WHERE id=?').get(seccionId);
    if (!s) throw noEncontrado('Esa sección no existe.');
    if (s.teacher_id !== docente.id) throw prohibido('Esa sección no está asignada a tu cuenta.');
    return s;
  }
  const estudiantes = (sid) => db.prepare("SELECT id, name FROM users WHERE role='estudiante' AND active=1 AND section_id=? ORDER BY name").all(sid);

  return {
    secciones: (docente) => db.prepare(`SELECT s.id, s.name AS nombre, s.grade AS grado, s.code AS codigo,
        (SELECT COUNT(*) FROM users u WHERE u.section_id=s.id AND u.role='estudiante' AND u.active=1) AS estudiantes
      FROM sections s WHERE s.teacher_id=? ORDER BY s.name`).all(docente.id),

    panel(docente, seccionId) {
      const sec = exigirSeccion(docente, seccionId);
      const hoy = diaPanama();
      const slots = db.prepare("SELECT id FROM activities WHERE purpose='mision' AND published=1").all().map((a) => a.id);
      const hecho = db.prepare("SELECT 1 FROM attempts WHERE user_id=? AND activity_id=? AND day=? AND status='completado'");
      const filas = estudiantes(sec.id).map((e) => {
        const n = slots.filter((a) => hecho.get(e.id, a, hoy)).length;
        const algo = db.prepare('SELECT 1 FROM attempts WHERE user_id=? AND day=?').get(e.id, hoy);
        return { id: e.id, nombre: e.name, racha: progreso.racha(e.id, hoy), hoy: n, de: slots.length, xpSemana: progreso.xpSemana(e.id, hoy),
          estado: slots.length && n === slots.length ? 'Completó' : algo ? 'En curso' : 'Sin actividad' };
      });
      const activos = filas.filter((f) => f.estado !== 'Sin actividad').length;
      return {
        seccion: { id: sec.id, nombre: sec.name, codigo: sec.code }, fecha: hoy, totalEstudiantes: filas.length,
        porcentajeHoy: filas.length ? Math.round((activos / filas.length) * 100) : 0,
        rachaPromedio: filas.length ? Math.round((filas.reduce((s, f) => s + f.racha, 0) / filas.length) * 10) / 10 : 0,
        // Regla de apoyo propuesta: sin actividad hoy y sin racha vigente.
        paraReforzar: filas.filter((f) => f.estado === 'Sin actividad' && f.racha === 0).map((f) => ({ id: f.id, nombre: f.nombre })),
        estudiantes: filas,
      };
    },

    modulos(docente, seccionId) {
      const sec = exigirSeccion(docente, seccionId);
      return db.prepare(`SELECT m.id, m.number, m.title, COALESCE(sm.status,'cerrado') AS estado, sm.opens_at,
          (SELECT COUNT(*) FROM topics t WHERE t.module_id=m.id) AS temas,
          (SELECT COUNT(*) FROM topics t WHERE t.module_id=m.id AND EXISTS (SELECT 1 FROM lessons l WHERE l.topic_id=t.id)) AS conContenido
        FROM modules m LEFT JOIN section_modules sm ON sm.module_id=m.id AND sm.section_id=? ORDER BY m.number`).all(sec.id)
        .map((m) => ({ id: m.id, numero: m.number, titulo: m.title, estado: m.estado, abreEn: m.opens_at, temas: m.temas, temasConContenido: m.conContenido }));
    },

    // Abrir, cerrar o programar un módulo para una sección (Avance 2: 09-02, 09-03, 09-11).
    fijarModulo(docente, seccionId, moduloId, { estado, abreEn } = {}) {
      const sec = exigirSeccion(docente, seccionId);
      const m = db.prepare('SELECT * FROM modules WHERE id=?').get(moduloId); if (!m) throw noEncontrado('Ese módulo no existe.');
      if (!['abierto', 'cerrado', 'programado'].includes(estado)) throw invalido('Estado no válido.');
      let fecha = null;
      if (estado === 'programado') {
        const d = new Date(abreEn);
        if (!abreEn || Number.isNaN(d.getTime())) throw invalido('Elige la fecha y la hora de apertura.', { abreEn: 'Fecha no válida.' });
        if (d <= new Date()) throw invalido('La fecha de apertura debe ser futura.', { abreEn: 'Elige una fecha futura.' });
        fecha = d.toISOString();
      }
      db.prepare(`INSERT INTO section_modules(section_id,module_id,status,opens_at) VALUES (?,?,?,?)
        ON CONFLICT(section_id,module_id) DO UPDATE SET status=excluded.status, opens_at=excluded.opens_at`).run(sec.id, m.id, estado, fecha);
      db.prepare('INSERT INTO audit_log(user_id,action,detail,created_at) VALUES (?,?,?,?)').run(docente.id, `modulo_${estado}`, `${sec.name} · Módulo ${m.number}`, ahoraISO());
      return { ok: true, estado, abreEn: fecha };
    },

    resultados(docente, seccionId) {
      const sec = exigirSeccion(docente, seccionId);
      const cols = db.prepare(`SELECT a.id, t.title, m.number FROM activities a JOIN topics t ON t.id=a.topic_id JOIN modules m ON m.id=t.module_id
        WHERE a.purpose='autoevaluacion' ORDER BY m.number, t.position`).all();
      const mejor = db.prepare("SELECT MAX(score_pct) m FROM attempts WHERE user_id=? AND activity_id=? AND status='completado'");
      return {
        seccion: sec.name, columnas: cols.map((c) => ({ id: c.id, titulo: c.title, modulo: c.number })),
        estudiantes: estudiantes(sec.id).map((e) => {
          const notas = cols.map((c) => mejor.get(e.id, c.id).m);
          const h = notas.filter((n) => n !== null);
          const prom = h.length ? Math.round(h.reduce((s, n) => s + n, 0) / h.length) : null;
          return { id: e.id, nombre: e.name, notas, promedio: prom, banda: prom === null ? null : banda(prom) };
        }),
      };
    },
  };
}
