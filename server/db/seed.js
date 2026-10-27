// Carga el contenido educativo y los datos de demostración (reproducibles y sin personas reales).
import bcrypt from 'bcryptjs';
import { crearEsquema, transaccion, ahoraISO, diaPanama, sumarDias } from './connection.js';
import { MODULOS, MISION, INSIGNIAS } from './seed-content.js';
import { config } from '../config.js';

// Usuarios FICTICIOS de demostración (dominio .test reservado: nunca es un correo real).
export const CREDENCIALES_DEMO = {
  administrador: [{ email: 'admin@geoistmo.test', clave: 'Admin2026!', nombre: 'Administración GeoIstmo' }],
  docente: [
    { email: 'docente@geoistmo.test', clave: 'Docente2026!', nombre: 'Profesora Ruiz (demo)' },
    { email: 'docente2@geoistmo.test', clave: 'Docente2026!', nombre: 'Profesor Gómez (demo)' },
  ],
  estudiante: [
    { email: 'sergio@geoistmo.test', clave: 'Estudiante2026!', nombre: 'Sergio Alvarado' },
    { email: 'marta@geoistmo.test', clave: 'Estudiante2026!', nombre: 'Marta Ruiz' },
    { email: 'luis@geoistmo.test', clave: 'Estudiante2026!', nombre: 'Luis Gómez' },
    { email: 'ana@geoistmo.test', clave: 'Estudiante2026!', nombre: 'Ana Pérez' },
    { email: 'sofia@geoistmo.test', clave: 'Estudiante2026!', nombre: 'Sofía Vega' },
    { email: 'carlos@geoistmo.test', clave: 'Estudiante2026!', nombre: 'Carlos Díaz' },
    { email: 'laura@geoistmo.test', clave: 'Estudiante2026!', nombre: 'Laura Vega' },
  ],
};

export function sembrar(db) {
  crearEsquema(db);
  const cache = new Map();
  const hash = (c) => { if (!cache.has(c)) cache.set(c, bcrypt.hashSync(c, config.bcryptRounds)); return cache.get(c); };
  const ahora = ahoraISO();
  const hoy = diaPanama();

  transaccion(db, () => {
    const insMod = db.prepare('INSERT INTO modules(number,title,short_title,description) VALUES (?,?,?,?)');
    const insTema = db.prepare('INSERT INTO topics(module_id,position,title,summary,minutes) VALUES (?,?,?,?,?)');
    const insLec = db.prepare('INSERT INTO lessons(topic_id,position,title,content_json) VALUES (?,?,?,?)');
    const insAct = db.prepare('INSERT INTO activities(kind,purpose,title,instructions,topic_id,mission_slot,xp,lives) VALUES (?,?,?,?,?,?,?,?)');
    const insPreg = db.prepare('INSERT INTO questions(activity_id,position,prompt,data_json,answer_json,explanation) VALUES (?,?,?,?,?,?)');
    const guardar = (aid, lista) => lista.forEach((q, i) => insPreg.run(aid, i + 1, q.prompt, JSON.stringify(q.data), JSON.stringify(q.answer), q.explanation));

    for (const m of MODULOS) {
      const mid = Number(insMod.run(m.n, m.titulo, m.corto, m.desc).lastInsertRowid);
      m.temas.forEach((t, i) => {
        const tid = Number(insTema.run(mid, i + 1, t.titulo, t.resumen || '', t.min).lastInsertRowid);
        (t.lecciones || []).forEach((l, j) => insLec.run(tid, j + 1, l.titulo, JSON.stringify(l.bloques)));
        if (t.quiz) {
          const aid = Number(insAct.run('seleccion', 'autoevaluacion', `Autoevaluación: ${t.titulo}`, 'Responde las preguntas del tema. Cuenta tu mejor intento.', tid, null, 10, 3).lastInsertRowid);
          guardar(aid, t.quiz);
        }
      });
    }
    for (const r of MISION) guardar(Number(insAct.run(r.kind, 'mision', r.titulo, r.instr, null, r.slot, r.xp, 3).lastInsertRowid), r.preguntas);
    const insIns = db.prepare('INSERT INTO badges(position,name,place,image,is_shield) VALUES (?,?,?,?,?)');
    INSIGNIAS.forEach((b) => insIns.run(b.pos, b.nombre, b.lugar, b.imagen, b.escudo));

    const insSec = db.prepare('INSERT INTO sections(name,grade,code) VALUES (?,?,?)');
    const secA = Number(insSec.run('12.º A', '12.º', 'G3O-12A-2026').lastInsertRowid);
    const secB = Number(insSec.run('12.º B', '12.º', 'G3O-12B-2026').lastInsertRowid);
    const insUser = db.prepare('INSERT INTO users(name,email,password_hash,role,section_id) VALUES (?,?,?,?,?)');
    const u = {};
    for (const [rol, lista] of Object.entries(CREDENCIALES_DEMO)) for (const c of lista) {
      const sec = rol === 'estudiante' ? (c.email === 'laura@geoistmo.test' ? secB : secA) : null;
      u[c.email] = Number(insUser.run(c.nombre, c.email, hash(c.clave), rol, sec).lastInsertRowid);
    }
    db.prepare('UPDATE sections SET teacher_id=? WHERE id=?').run(u['docente@geoistmo.test'], secA);
    db.prepare('UPDATE sections SET teacher_id=? WHERE id=?').run(u['docente2@geoistmo.test'], secB);

    // El docente de 12.º A tiene abiertos los módulos 1 y 2 («2 de 7 abiertos», prototipo 04-01).
    const insSM = db.prepare('INSERT INTO section_modules(section_id,module_id,status) VALUES (?,?,?)');
    for (const m of db.prepare('SELECT id, number FROM modules').all()) {
      insSM.run(secA, m.id, m.number <= 2 ? 'abierto' : 'cerrado');
      insSM.run(secB, m.id, m.number <= 1 ? 'abierto' : 'cerrado');
    }

    // ----- Progreso de demostración para que los paneles muestren datos -----
    const temaId = (mn, tp) => db.prepare('SELECT t.id FROM topics t JOIN modules m ON m.id=t.module_id WHERE m.number=? AND t.position=?').get(mn, tp).id;
    const insAtt = db.prepare(`INSERT INTO attempts(user_id,activity_id,status,lives_left,total,answered,points,score_pct,xp_awarded,day,started_at,finished_at)
      VALUES (?,?,'completado',3,?,?,?,?,?,?,?,?)`);
    const insLP = db.prepare('INSERT OR IGNORE INTO lesson_progress(user_id,lesson_id,completed_at) VALUES (?,?,?)');
    const insXp = db.prepare('INSERT INTO xp_ledger(user_id,amount,reason,ref,day,created_at) VALUES (?,?,?,?,?,?)');
    const hecho = (email, mn, tp, pct) => {
      const tid = temaId(mn, tp); const uid = u[email]; const dia = sumarDias(hoy, -1);
      const aid = db.prepare("SELECT id FROM activities WHERE topic_id=? AND purpose='autoevaluacion'").get(tid).id;
      for (const l of db.prepare('SELECT id FROM lessons WHERE topic_id=?').all(tid)) insLP.run(uid, l.id, ahora);
      const total = db.prepare('SELECT COUNT(*) n FROM questions WHERE activity_id=?').get(aid).n;
      const xp = Math.round((10 * pct) / 100);
      insAtt.run(uid, aid, total, total, (total * pct) / 100, pct, xp, dia, ahora, ahora);
      insXp.run(uid, xp, 'Autoevaluación', `act:${aid}`, dia, ahora);
    };
    const racha = (email, dias, xpSemana) => {
      const uid = u[email];
      for (let i = 1; i <= dias; i++) {
        const badge = i <= 4 ? 5 - i : null; // insignias 1 a 4 ya ganadas; la 5 (Volcán Barú) es la de hoy
        db.prepare('INSERT INTO daily_missions(user_id,day,completed_at,bonus_xp,badge_id) VALUES (?,?,?,?,?)').run(uid, sumarDias(hoy, -i), ahora, 15, badge);
        if (badge) db.prepare('INSERT OR IGNORE INTO user_badges(user_id,badge_id,earned_at) VALUES (?,?,?)').run(uid, badge, ahora);
      }
      insXp.run(uid, xpSemana, 'XP acumulado de la semana (demo)', 'demo:semana', sumarDias(hoy, -1), ahora);
    };
    for (const [mn, tp, pct] of [[1, 1, 100], [1, 2, 90], [1, 3, 85], [2, 1, 90], [2, 2, 80]]) hecho('sergio@geoistmo.test', mn, tp, pct);
    racha('sergio@geoistmo.test', 4, 280);
    for (const [mn, tp, pct] of [[1, 1, 100], [1, 2, 100], [1, 3, 90]]) hecho('marta@geoistmo.test', mn, tp, pct);
    racha('marta@geoistmo.test', 9, 520);
    hecho('luis@geoistmo.test', 1, 1, 75); racha('luis@geoistmo.test', 3, 380);
    hecho('ana@geoistmo.test', 1, 1, 100); racha('ana@geoistmo.test', 5, 330);
    racha('sofia@geoistmo.test', 6, 295);
    // Carlos y Laura quedan sin actividad (sirven para probar «Para reforzar» y el inicio desde cero).
  });
}
