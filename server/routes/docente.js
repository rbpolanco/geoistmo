import { Router } from 'express';
import { entero, invalido } from '../util/errores.js';

const id = (v) => { const n = entero(v, { min: 1 }); if (!n) throw invalido('Identificador no válido.'); return n; };

export function rutasDocente({ docente }) {
  const r = Router();
  r.get('/secciones', (req, res) => res.json({ secciones: docente.secciones(req.usuario) }));
  r.get('/secciones/:sid/panel', (req, res) => res.json(docente.panel(req.usuario, id(req.params.sid))));
  r.get('/secciones/:sid/modulos', (req, res) => res.json({ modulos: docente.modulos(req.usuario, id(req.params.sid)) }));
  r.put('/secciones/:sid/modulos/:mid', (req, res) => res.json(docente.fijarModulo(req.usuario, id(req.params.sid), id(req.params.mid), req.body || {})));
  r.get('/secciones/:sid/resultados', (req, res) => res.json(docente.resultados(req.usuario, id(req.params.sid))));
  return r;
}
