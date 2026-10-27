// Actividades interactivas. La corrección, las vidas, el combo, el XP y la misión diaria se resuelven
// AQUÍ, en el servidor. El navegador nunca recibe la respuesta correcta antes de contestar.
import { ahoraISO, diaPanama, transaccion } from '../db/connection.js';
import { BONO_MISION, banda } from './progreso.js';
import { ErrorHttp, noEncontrado, invalido } from '../util/errores.js';

const barajar = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function crearActividades(db, progreso, contenido) {
  const q = {
    act: db.prepare('SELECT * FROM activities WHERE id=?'),
    preguntas: db.prepare('SELECT * FROM questions WHERE activity_id=? ORDER BY position'),
    pregunta: db.prepare('SELECT * FROM questions WHERE id=? AND activity_id=?'),
    intento: db.prepare('SELECT * FROM attempts WHERE id=?'),
    ya: db.prepare('SELECT 1 FROM attempt_answers WHERE attempt_id=? AND question_id=?'),
    slots: db.prepare("SELECT * FROM activities WHERE purpose='mision' AND published=1 ORDER BY mission_slot"),
    hechoHoy: db.prepare("SELECT MAX(score_pct) m FROM attempts WHERE user_id=? AND activity_id=? AND day=? AND status='completado'"),
    misionDia: db.prepare('SELECT * FROM daily_missions WHERE user_id=? AND day=?'),
  };

  // El tipo se decide por pregunta: una autoevaluación puede mezclar selección y verdadero o falso.
  const tipoDe = (p) => { const a = JSON.parse(p.answer_json); return a.map ? 'relacionar' : 'value' in a ? 'vf' : 'seleccion'; };

  function publica(p) {
    const d = JSON.parse(p.data_json);
    const base = { id: p.id, posicion: p.position, tipo: tipoDe(p), enunciado: p.prompt, ...(d.imagen ? { imagen: d.imagen } : {}) };
    if (d.opciones) base.opciones = barajar(d.opciones);
    if (d.terminos) { base.terminos = d.terminos; base.definiciones = barajar(d.definiciones); }
    return base;
  }

  function calificar(p, respuesta) {
    const ans = JSON.parse(p.answer_json);
    const tipo = tipoDe(p);
    if (tipo === 'seleccion') {
      const ids = JSON.parse(p.data_json).opciones.map((o) => o.id);
      if (typeof respuesta !== 'string' || !ids.includes(respuesta)) throw invalido('Elige una de las opciones.');
      return { score: respuesta === ans.id ? 1 : 0, correcta: ans };
    }
    if (tipo === 'vf') {
      if (typeof respuesta !== 'boolean') throw invalido('Responde verdadero o falso.');
      return { score: respuesta === ans.value ? 1 : 0, correcta: ans };
    }
    // relacionar: { terminoId: definicionId } con todas las parejas y sin repetir definiciones
    const claves = Object.keys(ans.map);
    if (!respuesta || typeof respuesta !== 'object' || Array.isArray(respuesta)) throw invalido('Une todos los términos con una definición.');
    const usadas = Object.values(respuesta);
    if (Object.keys(respuesta).length !== claves.length || claves.some((k) => typeof respuesta[k] !== 'string') || new Set(usadas).size !== usadas.length)
      throw invalido('Une todos los términos, cada uno con una definición distinta.');
    const bien = claves.filter((k) => respuesta[k] === ans.map[k]).length;
    return { score: bien / claves.length, correcta: ans, bien, de: claves.length };
  }

  function misionHoy(uid) {
    const hoy = diaPanama();
    const retos = q.slots.all().map((a) => {
      const m = q.hechoHoy.get(uid, a.id, hoy).m;
      return { slot: a.mission_slot, actividadId: a.id, titulo: a.title, tipo: a.kind, xp: a.xp, completado: m !== null, mejor: m };
    });
    const dm = q.misionDia.get(uid, hoy);
    const insignia = dm?.badge_id ? db.prepare('SELECT * FROM badges WHERE id=?').get(dm.badge_id) : null;
    const proxima = db.prepare('SELECT * FROM badges WHERE id NOT IN (SELECT badge_id FROM user_badges WHERE user_id=?) ORDER BY position LIMIT 1').get(uid);
    return {
      dia: hoy, retos, completos: retos.filter((r) => r.completado).length, total: retos.length, completa: !!dm,
      xpEnJuego: retos.reduce((s, r) => s + r.xp, 0) + BONO_MISION, bono: BONO_MISION, racha: progreso.racha(uid), xpHoy: progreso.xpHoy(uid, hoy),
      insignia: insignia ? { nombre: insignia.name, lugar: insignia.place, imagen: insignia.image, escudo: !!insignia.is_shield } : null,
      quedanInsignias: !!proxima,
    };
  }

  function cerrarMision(uid, dia) {
    if (q.misionDia.get(uid, dia)) return null;
    const retos = q.slots.all();
    if (!retos.length || !retos.every((a) => q.hechoHoy.get(uid, a.id, dia).m !== null)) return null;
    const ins = db.prepare('SELECT * FROM badges WHERE id NOT IN (SELECT badge_id FROM user_badges WHERE user_id=?) ORDER BY position LIMIT 1').get(uid);
    db.prepare('INSERT INTO daily_missions(user_id,day,completed_at,bonus_xp,badge_id) VALUES (?,?,?,?,?)').run(uid, dia, ahoraISO(), BONO_MISION, ins?.id ?? null);
    progreso.otorgarXp(uid, BONO_MISION, `bono:${dia}`, 'Bono de la misión del día', dia);
    if (ins) db.prepare('INSERT INTO user_badges(user_id,badge_id,earned_at) VALUES (?,?,?)').run(uid, ins.id, ahoraISO());
    return { completa: true, bono: BONO_MISION, racha: progreso.racha(uid, dia), xpHoy: progreso.xpHoy(uid, dia),
      insignia: ins ? { nombre: ins.name, lugar: ins.place, imagen: ins.image, escudo: !!ins.is_shield, posicion: ins.position } : null };
  }

  function finalizar(it, act, estado) {
    const pct = Math.round((it.points / it.total) * 100);
    db.prepare('UPDATE attempts SET status=?, score_pct=?, finished_at=? WHERE id=?').run(estado, pct, ahoraISO(), it.id);
    let xp = 0, mision = null;
    if (estado === 'completado') {
      const ref = act.purpose === 'mision' ? `mision:${act.id}:${it.day}` : `act:${act.id}`;
      xp = progreso.otorgarXp(it.user_id, Math.round((act.xp * pct) / 100), ref, act.title, it.day);
      db.prepare('UPDATE attempts SET xp_awarded=? WHERE id=?').run(xp, it.id);
      if (act.purpose === 'mision') mision = cerrarMision(it.user_id, it.day);
    }
    return { pct, xp, mision };
  }

  return {
    misionHoy,

    iniciar(user, actividadId) {
      const act = q.act.get(actividadId);
      if (!act || !act.published) throw noEncontrado('Esa actividad no está disponible.');
      if (act.purpose === 'autoevaluacion') {
        const { info } = contenido.exigirAccesoTema(user, act.topic_id);
        if (info.leidas < info.lecciones) throw new ErrorHttp(409, 'Lee todas las lecciones del tema para abrir la autoevaluación.');
      }
      const preguntas = q.preguntas.all(act.id);
      if (!preguntas.length) throw new ErrorHttp(409, 'Esta actividad todavía no tiene preguntas.');
      return transaccion(db, () => {
        db.prepare("DELETE FROM attempts WHERE user_id=? AND activity_id=? AND status='en_curso'").run(user.id, act.id);
        const r = db.prepare('INSERT INTO attempts(user_id,activity_id,lives_left,total,day,started_at) VALUES (?,?,?,?,?,?)').run(user.id, act.id, act.lives, preguntas.length, diaPanama(), ahoraISO());
        return {
          intento: { id: Number(r.lastInsertRowid), vidas: act.lives, total: preguntas.length },
          actividad: { id: act.id, titulo: act.title, tipo: act.kind, instrucciones: act.instructions, xp: act.xp, proposito: act.purpose, temaId: act.topic_id, slot: act.mission_slot },
          preguntas: preguntas.map(publica),
        };
      });
    },

    responder(user, intentoId, { preguntaId, respuesta } = {}) {
      const it = q.intento.get(intentoId);
      if (!it || it.user_id !== user.id) throw noEncontrado('Ese intento no existe.');
      if (it.status !== 'en_curso') throw new ErrorHttp(409, 'Este intento ya terminó. Empieza uno nuevo.');
      const act = q.act.get(it.activity_id);
      const p = q.pregunta.get(Number(preguntaId), act.id);
      if (!p) throw invalido('Esa pregunta no pertenece a esta actividad.');
      if (q.ya.get(it.id, p.id)) throw new ErrorHttp(409, 'Ya respondiste esta pregunta.');
      const g = calificar(p, respuesta);
      return transaccion(db, () => {
        const acierta = g.score === 1;
        const n = { ...it, lives_left: acierta ? it.lives_left : it.lives_left - 1, combo: acierta ? it.combo + 1 : 0, answered: it.answered + 1, points: it.points + g.score };
        n.best_combo = Math.max(it.best_combo, n.combo);
        db.prepare('INSERT INTO attempt_answers(attempt_id,question_id,response_json,score,is_correct) VALUES (?,?,?,?,?)').run(it.id, p.id, JSON.stringify(respuesta), g.score, acierta ? 1 : 0);
        db.prepare('UPDATE attempts SET lives_left=?, combo=?, best_combo=?, answered=?, points=? WHERE id=?').run(n.lives_left, n.combo, n.best_combo, n.answered, n.points, it.id);
        const estado = n.lives_left <= 0 ? 'sin_vidas' : n.answered >= it.total ? 'completado' : 'en_curso';
        const fin = estado === 'en_curso' ? null : finalizar(n, act, estado);
        return {
          correcta: acierta, puntaje: g.score, ...(g.de ? { pares: { bien: g.bien, de: g.de } } : {}),
          respuestaCorrecta: g.correcta, explicacion: p.explanation,
          vidas: n.lives_left, combo: n.combo, estado, finalizado: estado !== 'en_curso',
          ...(fin ? { resumen: { porcentaje: fin.pct, banda: banda(fin.pct), xp: fin.xp, mision: fin.mision, mejorCombo: n.best_combo, aciertos: Math.round(n.points * 10) / 10, total: it.total } } : {}),
        };
      });
    },

    // «Mis notas»: mejor intento por actividad y promedio simple de las autoevaluaciones.
    notas(uid) {
      const filas = db.prepare(`SELECT a.id, a.title, a.purpose, t.title AS tema, m.number AS modulo,
          MAX(at.score_pct) AS mejor, COUNT(at.id) AS intentos, MAX(at.finished_at) AS ultimo
        FROM attempts at JOIN activities a ON a.id=at.activity_id
        LEFT JOIN topics t ON t.id=a.topic_id LEFT JOIN modules m ON m.id=t.module_id
        WHERE at.user_id=? AND at.status='completado' GROUP BY a.id ORDER BY ultimo DESC`).all(uid);
      const auto = filas.filter((f) => f.purpose === 'autoevaluacion');
      const prom = auto.length ? Math.round((auto.reduce((s, f) => s + f.mejor, 0) / auto.length) * 10) / 10 : null;
      return {
        promedio: prom, banda: prom === null ? null : banda(prom),
        formula: 'Promedio simple de tu mejor intento en cada autoevaluación. La ponderación Tareas 40 % · Quices 30 % · Participación 30 % del prototipo se aplicará cuando existan tareas y debates (Avance 4).',
        actividades: filas.map((f) => ({ id: f.id, titulo: f.purpose === 'mision' ? `Misión: ${f.title}` : f.tema, tipo: f.purpose === 'mision' ? 'Misión del día' : 'Autoevaluación', modulo: f.modulo, mejor: f.mejor, intentos: f.intentos, ultimo: f.ultimo, banda: banda(f.mejor) })),
      };
    },
  };
}
