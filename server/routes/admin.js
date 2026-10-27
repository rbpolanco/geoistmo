import { Router } from 'express';
import { entero, invalido } from '../util/errores.js';

const id = (v) => { const n = entero(v, { min: 1 }); if (!n) throw invalido('Identificador no válido.'); return n; };

export function rutasAdmin({ admin }) {
  const r = Router();
  const yo = (req) => req.usuario;
  r.get('/resumen', (_req, res) => res.json(admin.resumen()));
  r.get('/usuarios', (req, res) => res.json({ usuarios: admin.usuarios({ rol: req.query.rol, buscar: req.query.q }) }));
  r.post('/usuarios', (req, res) => res.status(201).json(admin.crearUsuario(yo(req), req.body || {})));
  r.patch('/usuarios/:id', (req, res) => res.json(admin.editarUsuario(yo(req), id(req.params.id), req.body || {})));
  r.post('/usuarios/:id/restablecer-clave', (req, res) => res.json(admin.restablecerClave(yo(req), id(req.params.id))));
  r.get('/secciones', (_req, res) => res.json({ secciones: admin.secciones() }));
  r.post('/secciones', (req, res) => res.status(201).json(admin.crearSeccion(yo(req), req.body || {})));
  r.patch('/secciones/:id', (req, res) => res.json(admin.editarSeccion(yo(req), id(req.params.id), req.body || {})));
  r.get('/catalogo', (_req, res) => res.json({ modulos: admin.catalogo(), mision: admin.mision() }));
  r.patch('/modulos/:id', (req, res) => res.json(admin.editarModulo(yo(req), id(req.params.id), req.body || {})));
  r.post('/modulos/:id/temas', (req, res) => res.status(201).json(admin.crearTema(yo(req), id(req.params.id), req.body || {})));
  r.patch('/temas/:id', (req, res) => res.json(admin.editarTema(yo(req), id(req.params.id), req.body || {})));
  r.delete('/temas/:id', (req, res) => res.json(admin.eliminarTema(yo(req), id(req.params.id))));
  r.patch('/actividades/:id', (req, res) => res.json(admin.publicarActividad(yo(req), id(req.params.id), req.body?.publicada)));
  r.get('/actividades/:id/preguntas', (req, res) => res.json(admin.preguntas(id(req.params.id))));
  r.post('/actividades/:id/preguntas', (req, res) => res.status(201).json(admin.guardarPregunta(yo(req), id(req.params.id), req.body || {})));
  r.put('/actividades/:id/preguntas/:pid', (req, res) => res.json(admin.guardarPregunta(yo(req), id(req.params.id), req.body || {}, id(req.params.pid))));
  r.delete('/actividades/:id/preguntas/:pid', (req, res) => res.json(admin.eliminarPregunta(yo(req), id(req.params.id), id(req.params.pid))));
  return r;
}
