import { Router } from 'express';
import { entero, invalido } from '../util/errores.js';

const id = (v) => { const n = entero(v, { min: 1 }); if (!n) throw invalido('Identificador no válido.'); return n; };

export function rutasEstudiante({ progreso, contenido, actividades, db }) {
  const r = Router();
  r.get('/inicio', (req, res) => {
    const u = req.usuario; const xp = progreso.xpTotal(u.id);
    const modulos = contenido.modulos(u);
    res.json({
      nombre: u.nombre.split(' ')[0], seccion: u.seccionId ? db.prepare('SELECT name FROM sections WHERE id=?').get(u.seccionId)?.name : null,
      xp, xpSemana: progreso.xpSemana(u.id), nivel: progreso.nivel(xp), racha: progreso.racha(u.id),
      mision: actividades.misionHoy(u.id), continuar: contenido.continuar(u), album: progreso.album(u.id),
      modulosAbiertos: modulos.filter((m) => m.estado !== 'bloqueado').length, totalModulos: modulos.length,
    });
  });
  r.get('/mision', (req, res) => res.json(actividades.misionHoy(req.usuario.id)));
  r.get('/modulos', (req, res) => { const m = contenido.modulos(req.usuario); res.json({ modulos: m, abiertos: m.filter((x) => x.estado !== 'bloqueado').length, total: m.length }); });
  r.get('/modulos/:id', (req, res) => res.json(contenido.modulo(req.usuario, id(req.params.id))));
  r.get('/temas/:id', (req, res) => res.json(contenido.tema(req.usuario, id(req.params.id))));
  r.post('/lecciones/:id/leida', (req, res) => res.json(contenido.marcarLeida(req.usuario, id(req.params.id))));
  r.post('/actividades/:id/intentos', (req, res) => res.status(201).json(actividades.iniciar(req.usuario, id(req.params.id))));
  r.post('/intentos/:id/respuestas', (req, res) => res.json(actividades.responder(req.usuario, id(req.params.id), req.body || {})));
  r.get('/notas', (req, res) => res.json(actividades.notas(req.usuario.id)));
  r.get('/perfil', (req, res) => { const xp = progreso.xpTotal(req.usuario.id); res.json({ nombre: req.usuario.nombre, email: req.usuario.email, xp, nivel: progreso.nivel(xp), racha: progreso.racha(req.usuario.id), album: progreso.album(req.usuario.id) }); });
  return r;
}
