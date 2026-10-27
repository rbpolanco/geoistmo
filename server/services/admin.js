import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { config } from '../config.js';
import { ahoraISO, transaccion } from '../db/connection.js';
import { ErrorHttp, noEncontrado, invalido, txt, entero, EMAIL_RE, validarClave, MSG_CLAVE } from '../util/errores.js';

const ROLES = ['estudiante', 'docente', 'administrador'];
const sinErrores = (campos) => { if (Object.keys(campos).length) throw invalido('Revisa los datos marcados.', campos); };

export function crearAdmin(db) {
  const log = (uid, accion, detalle) => db.prepare('INSERT INTO audit_log(user_id,action,detail,created_at) VALUES (?,?,?,?)').run(uid, accion, detalle, ahoraISO());
  const cuenta = (sql, ...p) => db.prepare(sql).get(...p).n;

  function validarUsuario(d, creando) {
    const campos = {};
    const nombre = txt(d.nombre, { min: 3, max: 80 }); if (!nombre) campos.nombre = 'Escribe el nombre (mínimo 3 letras).';
    const email = typeof d.email === 'string' ? d.email.trim().toLowerCase() : ''; if (!EMAIL_RE.test(email)) campos.email = 'Correo no válido.';
    if (!ROLES.includes(d.rol)) campos.rol = 'Elige un rol.';
    if (creando && !validarClave(d.clave)) campos.clave = MSG_CLAVE;
    let seccionId = null;
    if (d.rol === 'estudiante') {
      seccionId = entero(d.seccionId, { min: 1 });
      if (!seccionId || !db.prepare('SELECT 1 FROM sections WHERE id=?').get(seccionId)) campos.seccionId = 'Elige la sección del estudiante.';
    }
    sinErrores(campos);
    return { nombre, email, rol: d.rol, seccionId };
  }

  function validarSeccion(d, idActual = -1) {
    const campos = {};
    const nombre = txt(d.nombre, { min: 2, max: 40 }); if (!nombre) campos.nombre = 'Escribe el nombre de la sección.';
    const codigo = typeof d.codigo === 'string' ? d.codigo.trim().toUpperCase() : '';
    if (!/^[A-Z0-9-]{4,30}$/.test(codigo)) campos.codigo = 'Usa de 4 a 30 letras, números o guiones.';
    else if (db.prepare('SELECT 1 FROM sections WHERE code=? AND id<>?').get(codigo, idActual)) campos.codigo = 'Ese código ya está en uso.';
    let docenteId = null;
    if (d.docenteId !== null && d.docenteId !== undefined && d.docenteId !== '') {
      docenteId = entero(d.docenteId, { min: 1 });
      if (!docenteId || !db.prepare("SELECT 1 FROM users WHERE id=? AND role='docente' AND active=1").get(docenteId)) campos.docenteId = 'Elige un docente activo.';
    }
    sinErrores(campos);
    return { nombre, codigo, docenteId, grado: txt(d.grado, { max: 10 }) || '12.º' };
  }

  return {
    resumen() {
      const suspendidas = cuenta('SELECT COUNT(*) n FROM users WHERE active=0');
      return {
        secciones: cuenta('SELECT COUNT(*) n FROM sections'),
        docentes: cuenta("SELECT COUNT(*) n FROM users WHERE role='docente' AND active=1"),
        estudiantes: cuenta("SELECT COUNT(*) n FROM users WHERE role='estudiante' AND active=1"),
        administradores: cuenta("SELECT COUNT(*) n FROM users WHERE role='administrador' AND active=1"),
        modulos: cuenta('SELECT COUNT(*) n FROM modules'), temas: cuenta('SELECT COUNT(*) n FROM topics'),
        lecciones: cuenta('SELECT COUNT(*) n FROM lessons'), actividades: cuenta('SELECT COUNT(*) n FROM activities'), preguntas: cuenta('SELECT COUNT(*) n FROM questions'),
        atencion: [
          ...db.prepare('SELECT name FROM sections WHERE teacher_id IS NULL').all().map((s) => `La sección ${s.name} no tiene docente asignado.`),
          ...db.prepare("SELECT name FROM users WHERE role='estudiante' AND section_id IS NULL").all().map((u) => `${u.name} no tiene sección.`),
          ...(suspendidas ? [`${suspendidas} cuenta(s) suspendida(s).`] : []),
        ],
        reciente: db.prepare('SELECT a.action, a.detail, a.created_at, u.name FROM audit_log a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.id DESC LIMIT 8').all()
          .map((r) => ({ accion: r.action, detalle: r.detail, fecha: r.created_at, usuario: r.name })),
      };
    },

    usuarios({ rol, buscar } = {}) {
      const w = [], p = [];
      if (ROLES.includes(rol)) { w.push('u.role=?'); p.push(rol); }
      if (typeof buscar === 'string' && buscar.trim()) { const l = `%${buscar.trim().slice(0, 60)}%`; w.push('(u.name LIKE ? OR u.email LIKE ?)'); p.push(l, l); }
      return db.prepare(`SELECT u.id, u.name, u.email, u.role, u.active, u.section_id, u.last_login_at, s.name AS seccion
        FROM users u LEFT JOIN sections s ON s.id=u.section_id ${w.length ? 'WHERE ' + w.join(' AND ') : ''} ORDER BY u.role, u.name`).all(...p)
        .map((u) => ({ id: u.id, nombre: u.name, email: u.email, rol: u.role, activo: !!u.active, seccionId: u.section_id, seccion: u.seccion, ultimoAcceso: u.last_login_at }));
    },

    crearUsuario(admin, d) {
      const v = validarUsuario(d, true);
      if (db.prepare('SELECT 1 FROM users WHERE email=?').get(v.email)) throw new ErrorHttp(409, 'Revisa los datos marcados.', { email: 'Ya existe una cuenta con ese correo.' });
      const r = db.prepare('INSERT INTO users(name,email,password_hash,role,section_id) VALUES (?,?,?,?,?)').run(v.nombre, v.email, bcrypt.hashSync(d.clave, config.bcryptRounds), v.rol, v.seccionId);
      log(admin.id, 'usuario_creado', `${v.email} (${v.rol})`);
      return { id: Number(r.lastInsertRowid) };
    },

    editarUsuario(admin, id, d) {
      const u = db.prepare('SELECT * FROM users WHERE id=?').get(id); if (!u) throw noEncontrado('Ese usuario no existe.');
      const v = validarUsuario({ nombre: d.nombre ?? u.name, email: d.email ?? u.email, rol: d.rol ?? u.role, seccionId: d.seccionId ?? u.section_id }, false);
      const activo = d.activo === undefined ? u.active : d.activo ? 1 : 0;
      if (u.id === admin.id && (v.rol !== 'administrador' || !activo)) throw new ErrorHttp(409, 'No puedes quitarte el rol de administrador ni suspender tu propia cuenta.');
      if (db.prepare('SELECT 1 FROM users WHERE email=? AND id<>?').get(v.email, id)) throw new ErrorHttp(409, 'Revisa los datos marcados.', { email: 'Ya existe una cuenta con ese correo.' });
      transaccion(db, () => {
        db.prepare('UPDATE users SET name=?, email=?, role=?, section_id=?, active=? WHERE id=?').run(v.nombre, v.email, v.rol, v.seccionId, activo, id);
        if (v.rol !== 'docente') db.prepare('UPDATE sections SET teacher_id=NULL WHERE teacher_id=?').run(id);
        if (!activo || v.rol !== u.role) db.prepare('DELETE FROM sessions WHERE user_id=?').run(id); // obliga a volver a entrar
        log(admin.id, 'usuario_editado', `${v.email}: ${v.rol}, ${activo ? 'activo' : 'suspendido'}`);
      });
      return { ok: true };
    },

    // Genera una contraseña temporal que el administrador ve una sola vez.
    restablecerClave(admin, id) {
      const u = db.prepare('SELECT * FROM users WHERE id=?').get(id); if (!u) throw noEncontrado('Ese usuario no existe.');
      const temporal = `Geo-${crypto.randomBytes(4).toString('hex')}-${crypto.randomInt(10, 99)}`;
      db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(bcrypt.hashSync(temporal, config.bcryptRounds), id);
      db.prepare('DELETE FROM sessions WHERE user_id=?').run(id);
      log(admin.id, 'clave_restablecida', u.email);
      return { clave: temporal };
    },

    secciones: () => db.prepare(`SELECT s.id, s.name, s.grade, s.code, s.teacher_id, t.name AS docente,
        (SELECT COUNT(*) FROM users e WHERE e.section_id=s.id AND e.role='estudiante') AS estudiantes
      FROM sections s LEFT JOIN users t ON t.id=s.teacher_id ORDER BY s.name`).all()
      .map((s) => ({ id: s.id, nombre: s.name, grado: s.grade, codigo: s.code, docenteId: s.teacher_id, docente: s.docente, estudiantes: s.estudiantes })),

    crearSeccion(admin, d) {
      const v = validarSeccion(d);
      const sid = Number(db.prepare('INSERT INTO sections(name,grade,code,teacher_id) VALUES (?,?,?,?)').run(v.nombre, v.grado, v.codigo, v.docenteId).lastInsertRowid);
      for (const m of db.prepare('SELECT id FROM modules').all()) db.prepare("INSERT INTO section_modules(section_id,module_id,status) VALUES (?,?,'cerrado')").run(sid, m.id);
      log(admin.id, 'seccion_creada', `${v.nombre} (${v.codigo})`);
      return { id: sid };
    },

    editarSeccion(admin, id, d) {
      const s = db.prepare('SELECT * FROM sections WHERE id=?').get(id); if (!s) throw noEncontrado('Esa sección no existe.');
      const v = validarSeccion({ nombre: d.nombre ?? s.name, codigo: d.codigo ?? s.code, docenteId: d.docenteId === undefined ? s.teacher_id : d.docenteId, grado: d.grado ?? s.grade }, id);
      db.prepare('UPDATE sections SET name=?, grade=?, code=?, teacher_id=? WHERE id=?').run(v.nombre, v.grado, v.codigo, v.docenteId, id);
      log(admin.id, 'seccion_editada', v.nombre);
      return { ok: true };
    },

    // ----- Catálogo curricular (Avance 2, 10-05; RNF-09: mantener contenidos sin tocar el código) -----
    catalogo: () => db.prepare('SELECT * FROM modules ORDER BY number').all().map((m) => ({
      id: m.id, numero: m.number, titulo: m.title, corto: m.short_title, descripcion: m.description,
      temas: db.prepare('SELECT * FROM topics WHERE module_id=? ORDER BY position').all(m.id).map((t) => {
        const a = db.prepare("SELECT * FROM activities WHERE topic_id=? AND purpose='autoevaluacion'").get(t.id);
        return { id: t.id, posicion: t.position, titulo: t.title, resumen: t.summary, minutos: t.minutes,
          lecciones: cuenta('SELECT COUNT(*) n FROM lessons WHERE topic_id=?', t.id),
          actividad: a ? { id: a.id, titulo: a.title, publicada: !!a.published, preguntas: cuenta('SELECT COUNT(*) n FROM questions WHERE activity_id=?', a.id) } : null };
      }),
    })),
    mision: () => db.prepare("SELECT * FROM activities WHERE purpose='mision' ORDER BY mission_slot").all()
      .map((a) => ({ id: a.id, slot: a.mission_slot, titulo: a.title, tipo: a.kind, publicada: !!a.published, preguntas: cuenta('SELECT COUNT(*) n FROM questions WHERE activity_id=?', a.id) })),

    editarModulo(admin, id, d) {
      const m = db.prepare('SELECT * FROM modules WHERE id=?').get(id); if (!m) throw noEncontrado('Ese módulo no existe.');
      const titulo = txt(d.titulo ?? m.title, { min: 3, max: 120 }); if (!titulo) throw invalido('Revisa los datos marcados.', { titulo: 'Escribe un título (3 a 120 caracteres).' });
      const desc = txt(d.descripcion ?? m.description, { min: 0, max: 300 }) ?? '';
      db.prepare('UPDATE modules SET title=?, description=? WHERE id=?').run(titulo, desc, id); log(admin.id, 'modulo_editado', titulo); return { ok: true };
    },
    crearTema(admin, moduloId, d) {
      if (!db.prepare('SELECT 1 FROM modules WHERE id=?').get(moduloId)) throw noEncontrado('Ese módulo no existe.');
      const titulo = txt(d.titulo, { min: 3, max: 120 }); const minutos = d.minutos === undefined || d.minutos === '' ? 6 : entero(d.minutos, { min: 1, max: 60 });
      sinErrores({ ...(titulo ? {} : { titulo: 'Escribe un título (3 a 120 caracteres).' }), ...(minutos ? {} : { minutos: 'Entre 1 y 60 minutos.' }) });
      const pos = db.prepare('SELECT COALESCE(MAX(position),0)+1 p FROM topics WHERE module_id=?').get(moduloId).p;
      const r = db.prepare('INSERT INTO topics(module_id,position,title,summary,minutes) VALUES (?,?,?,?,?)').run(moduloId, pos, titulo, txt(d.resumen, { min: 0, max: 200 }) ?? '', minutos);
      log(admin.id, 'tema_creado', titulo); return { id: Number(r.lastInsertRowid) };
    },
    editarTema(admin, id, d) {
      const t = db.prepare('SELECT * FROM topics WHERE id=?').get(id); if (!t) throw noEncontrado('Ese tema no existe.');
      const titulo = txt(d.titulo ?? t.title, { min: 3, max: 120 }); const minutos = entero(d.minutos ?? t.minutes, { min: 1, max: 60 });
      sinErrores({ ...(titulo ? {} : { titulo: 'Escribe un título (3 a 120 caracteres).' }), ...(minutos ? {} : { minutos: 'Entre 1 y 60 minutos.' }) });
      db.prepare('UPDATE topics SET title=?, summary=?, minutes=? WHERE id=?').run(titulo, txt(d.resumen ?? t.summary, { min: 0, max: 200 }) ?? '', minutos, id);
      log(admin.id, 'tema_editado', titulo); return { ok: true };
    },
    eliminarTema(admin, id) {
      const t = db.prepare('SELECT * FROM topics WHERE id=?').get(id); if (!t) throw noEncontrado('Ese tema no existe.');
      if (cuenta('SELECT COUNT(*) n FROM lessons WHERE topic_id=?', id)) throw new ErrorHttp(409, 'Este tema ya tiene lecciones y resultados. Solo se pueden eliminar temas vacíos.');
      db.prepare('DELETE FROM topics WHERE id=?').run(id); log(admin.id, 'tema_eliminado', t.title); return { ok: true };
    },
    publicarActividad(admin, id, publicada) {
      const a = db.prepare('SELECT * FROM activities WHERE id=?').get(id); if (!a) throw noEncontrado('Esa actividad no existe.');
      if (typeof publicada !== 'boolean') throw invalido('Indica si la actividad se publica o se oculta.');
      db.prepare('UPDATE activities SET published=? WHERE id=?').run(publicada ? 1 : 0, id); log(admin.id, publicada ? 'actividad_publicada' : 'actividad_oculta', a.title); return { ok: true };
    },
    preguntas(actividadId) {
      const a = db.prepare('SELECT * FROM activities WHERE id=?').get(actividadId); if (!a) throw noEncontrado('Esa actividad no existe.');
      return { actividad: { id: a.id, titulo: a.title, tipo: a.kind, publicada: !!a.published },
        preguntas: db.prepare('SELECT * FROM questions WHERE activity_id=? ORDER BY position').all(a.id)
          .map((q) => ({ id: q.id, posicion: q.position, tipo: 'value' in JSON.parse(q.answer_json) ? 'vf' : JSON.parse(q.answer_json).map ? 'relacionar' : 'seleccion', enunciado: q.prompt, datos: JSON.parse(q.data_json), respuesta: JSON.parse(q.answer_json), explicacion: q.explanation })) };
    },
    guardarPregunta(admin, actividadId, d, preguntaId) {
      const a = db.prepare('SELECT * FROM activities WHERE id=?').get(actividadId); if (!a) throw noEncontrado('Esa actividad no existe.');
      if (a.kind === 'relacionar') throw new ErrorHttp(409, 'Las preguntas de «Relaciona conceptos» todavía se editan solo en el archivo de contenido (pendiente para el Avance 4).');
      const campos = {};
      const enunciado = txt(d.enunciado, { min: 5, max: 300 }); if (!enunciado) campos.enunciado = 'Escribe el enunciado (5 a 300 caracteres).';
      const explicacion = txt(d.explicacion, { min: 0, max: 400 }) ?? '';
      let data, answer;
      // En autoevaluaciones (tipo «seleccion») se puede añadir una pregunta de verdadero o falso con tipo: 'vf'.
      if (a.kind === 'vf' || d.tipo === 'vf') {
        if (typeof d.verdadero !== 'boolean') campos.verdadero = 'Indica si la afirmación es verdadera o falsa.';
        data = {}; answer = { value: d.verdadero };
      } else {
        const ops = Array.isArray(d.opciones) ? d.opciones.map((o) => txt(o, { max: 120 })) : [];
        if (ops.length !== 4 || ops.some((o) => !o)) campos.opciones = 'Escribe las 4 opciones.';
        else if (new Set(ops.map((o) => o.toLowerCase())).size !== 4) campos.opciones = 'Las 4 opciones deben ser distintas.';
        const c = entero(d.correcta, { min: 0, max: 3 }); if (c === null) campos.correcta = 'Marca la opción correcta.';
        data = { opciones: ops.map((t, i) => ({ id: 'abcd'[i], text: t })) }; answer = { id: 'abcd'[c ?? 0] };
      }
      sinErrores(campos);
      if (preguntaId) {
        if (!db.prepare('SELECT 1 FROM questions WHERE id=? AND activity_id=?').get(preguntaId, a.id)) throw noEncontrado('Esa pregunta no existe.');
        db.prepare('UPDATE questions SET prompt=?, data_json=?, answer_json=?, explanation=? WHERE id=?').run(enunciado, JSON.stringify(data), JSON.stringify(answer), explicacion, preguntaId);
        log(admin.id, 'pregunta_editada', a.title); return { id: preguntaId };
      }
      const pos = db.prepare('SELECT COALESCE(MAX(position),0)+1 p FROM questions WHERE activity_id=?').get(a.id).p;
      const r = db.prepare('INSERT INTO questions(activity_id,position,prompt,data_json,answer_json,explanation) VALUES (?,?,?,?,?,?)').run(a.id, pos, enunciado, JSON.stringify(data), JSON.stringify(answer), explicacion);
      log(admin.id, 'pregunta_creada', a.title); return { id: Number(r.lastInsertRowid) };
    },
    eliminarPregunta(admin, actividadId, preguntaId) {
      if (!db.prepare('SELECT 1 FROM questions WHERE id=? AND activity_id=?').get(preguntaId, actividadId)) throw noEncontrado('Esa pregunta no existe.');
      if (cuenta('SELECT COUNT(*) n FROM questions WHERE activity_id=?', actividadId) <= 1) throw new ErrorHttp(409, 'Una actividad necesita al menos una pregunta. Ocúltala si no quieres que se use.');
      db.prepare('DELETE FROM questions WHERE id=?').run(preguntaId); log(admin.id, 'pregunta_eliminada', `actividad ${actividadId}`); return { ok: true };
    },
  };
}
