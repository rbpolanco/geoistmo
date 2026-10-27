// Motor de contenidos: módulos → temas → lecciones → autoevaluación,
// con bloqueo por docente (módulo abierto/programado/cerrado) y por secuencia (tema anterior aprobado).
import { ahoraISO } from '../db/connection.js';
import { META_PCT, banda } from './progreso.js';
import { ErrorHttp, noEncontrado } from '../util/errores.js';

export function crearContenido(db) {
  const q = {
    modulos: db.prepare('SELECT * FROM modules ORDER BY number'),
    modulo: db.prepare('SELECT * FROM modules WHERE id=?'),
    temas: db.prepare('SELECT * FROM topics WHERE module_id=? ORDER BY position'),
    tema: db.prepare('SELECT t.*, m.number AS mod_number, m.title AS mod_title FROM topics t JOIN modules m ON m.id=t.module_id WHERE t.id=?'),
    lecciones: db.prepare('SELECT * FROM lessons WHERE topic_id=? ORDER BY position'),
    nLecciones: db.prepare('SELECT COUNT(*) n FROM lessons WHERE topic_id=?'),
    nLeidas: db.prepare('SELECT COUNT(*) n FROM lesson_progress lp JOIN lessons l ON l.id=lp.lesson_id WHERE lp.user_id=? AND l.topic_id=?'),
    autoev: db.prepare("SELECT * FROM activities WHERE topic_id=? AND purpose='autoevaluacion' AND published=1"),
    nPreg: db.prepare('SELECT COUNT(*) n FROM questions WHERE activity_id=?'),
    mejor: db.prepare("SELECT MAX(score_pct) m FROM attempts WHERE user_id=? AND activity_id=? AND status='completado'"),
    estadoMod: db.prepare('SELECT status, opens_at FROM section_modules WHERE section_id=? AND module_id=?'),
    leccion: db.prepare('SELECT * FROM lessons WHERE id=?'),
  };

  const svc = {
    moduloAbierto(seccionId, moduloId) {
      const r = seccionId ? q.estadoMod.get(seccionId, moduloId) : null;
      if (!r) return false;
      return r.status === 'abierto' || (r.status === 'programado' && !!r.opens_at && new Date(r.opens_at) <= new Date());
    },

    estadoTema(uid, t) {
      const nL = q.nLecciones.get(t.id).n;
      const ae = q.autoev.get(t.id);
      const tieneContenido = nL > 0 && !!ae && q.nPreg.get(ae.id).n > 0;
      const leidas = q.nLeidas.get(uid, t.id).n;
      const mejor = ae ? q.mejor.get(uid, ae.id).m : null;
      return { lecciones: nL, leidas, mejor, tieneContenido, completado: tieneContenido && leidas >= nL && mejor !== null && mejor >= META_PCT };
    },

    temasDeModulo(user, moduloId) {
      const abierto = svc.moduloAbierto(user.seccionId, moduloId);
      let anteriorCompleto = true;
      return q.temas.all(moduloId).map((t) => {
        const e = svc.estadoTema(user.id, t);
        let estado, motivo = '';
        if (!abierto) { estado = 'bloqueado'; motivo = 'Esperando al docente'; }
        else if (!e.tieneContenido) { estado = 'en_preparacion'; motivo = 'Contenido en preparación'; }
        else if (e.completado) estado = 'completado';
        else if (!anteriorCompleto) { estado = 'bloqueado'; motivo = 'Completa el tema anterior'; }
        else estado = e.leidas > 0 || e.mejor !== null ? 'en_curso' : 'disponible';
        anteriorCompleto = anteriorCompleto && (e.completado || !e.tieneContenido);
        return { id: t.id, posicion: t.position, titulo: t.title, resumen: t.summary, minutos: t.minutes, estado, motivo, lecciones: e.lecciones, leidas: e.leidas, mejor: e.mejor };
      });
    },

    modulos(user) {
      let actualAsignado = false;
      return q.modulos.all().map((m) => {
        const abierto = svc.moduloAbierto(user.seccionId, m.id);
        const temas = svc.temasDeModulo(user, m.id);
        const hechos = temas.filter((t) => t.estado === 'completado').length;
        let estado = 'bloqueado';
        if (abierto) estado = temas.length && hechos === temas.length ? 'completado' : (hechos > 0 || temas.some((t) => t.estado === 'en_curso') ? 'en_curso' : 'abierto');
        const actual = abierto && estado !== 'completado' && !actualAsignado; if (actual) actualAsignado = true;
        const r = q.estadoMod.get(user.seccionId ?? -1, m.id);
        return { id: m.id, numero: m.number, titulo: m.title, corto: m.short_title, descripcion: m.description, estado, actual,
          totalTemas: temas.length, temasCompletados: hechos, programado: !abierto && r?.status === 'programado' ? r.opens_at : null };
      });
    },

    modulo(user, moduloId) {
      const m = q.modulo.get(moduloId); if (!m) throw noEncontrado('Ese módulo no existe.');
      const abierto = svc.moduloAbierto(user.seccionId, m.id);
      return { id: m.id, numero: m.number, titulo: m.title, descripcion: m.description, abierto,
        mensaje: abierto ? '' : 'Los módulos se abren cuando tu docente los activa. Cuando se abra, podrás empezar aquí.',
        temas: svc.temasDeModulo(user, m.id) };
    },

    // Comprobación en el SERVIDOR: cambiar la URL no abre un tema bloqueado.
    exigirAccesoTema(user, temaId) {
      const t = q.tema.get(temaId); if (!t) throw noEncontrado('Ese tema no existe.');
      const info = svc.temasDeModulo(user, t.module_id).find((x) => x.id === t.id);
      if (info.estado === 'bloqueado') throw new ErrorHttp(403, info.motivo === 'Esperando al docente' ? 'Este módulo todavía no está abierto. Tu docente lo activará.' : 'Completa primero el tema anterior para abrir este.');
      if (info.estado === 'en_preparacion') throw new ErrorHttp(409, 'El contenido de este tema todavía está en preparación.');
      return { tema: t, info };
    },

    tema(user, temaId) {
      const { tema, info } = svc.exigirAccesoTema(user, temaId);
      const leidas = new Set(db.prepare('SELECT lesson_id FROM lesson_progress WHERE user_id=?').all(user.id).map((r) => r.lesson_id));
      const lecciones = q.lecciones.all(tema.id).map((l) => ({ id: l.id, posicion: l.position, titulo: l.title, bloques: JSON.parse(l.content_json), leida: leidas.has(l.id) }));
      const ae = q.autoev.get(tema.id);
      const todas = lecciones.every((l) => l.leida);
      return {
        id: tema.id, titulo: tema.title, resumen: tema.summary, minutos: tema.minutes, moduloId: tema.module_id, moduloNumero: tema.mod_number, moduloTitulo: tema.mod_title,
        estado: info.estado, lecciones,
        autoevaluacion: { id: ae.id, titulo: ae.title, instrucciones: ae.instructions, preguntas: q.nPreg.get(ae.id).n, vidas: ae.lives, mejor: info.mejor,
          banda: info.mejor === null ? null : banda(info.mejor), meta: META_PCT, disponible: todas,
          motivoNoDisponible: todas ? '' : 'Lee todas las lecciones para abrir la autoevaluación.' },
      };
    },

    marcarLeida(user, leccionId) {
      const l = q.leccion.get(leccionId); if (!l) throw noEncontrado('Esa lección no existe.');
      svc.exigirAccesoTema(user, l.topic_id);
      db.prepare('INSERT OR IGNORE INTO lesson_progress(user_id,lesson_id,completed_at) VALUES (?,?,?)').run(user.id, leccionId, ahoraISO());
      return { ok: true };
    },

    // Primer tema que el estudiante puede continuar (tarjeta «Continúa», 01-04).
    continuar(user) {
      for (const m of q.modulos.all()) {
        if (!svc.moduloAbierto(user.seccionId, m.id)) continue;
        const temas = svc.temasDeModulo(user, m.id);
        const t = temas.find((x) => ['en_curso', 'disponible'].includes(x.estado));
        if (t) return { moduloId: m.id, moduloNumero: m.number, moduloTitulo: m.short_title, tema: t, totalTemas: temas.length, temasCompletados: temas.filter((x) => x.estado === 'completado').length };
      }
      return null;
    },
  };
  return svc;
}
