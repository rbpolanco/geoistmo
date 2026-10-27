import { Router } from 'express';
import { COOKIE, opcionesCookie } from '../middleware/auth.js';
import { limiteLogin } from '../middleware/seguridad.js';
import { ErrorHttp } from '../util/errores.js';

export function rutasAuth(auth) {
  const r = Router();
  r.post('/registro', (req, res) => {
    const out = auth.registrar(req.body || {});
    res.status(201).json({ ok: true, mensaje: `Cuenta creada en la sección ${out.seccion}. Ya puedes iniciar sesión.` });
  });
  r.post('/login', (req, res) => {
    const k = limiteLogin.clave(req.ip, req.body?.email);
    const espera = limiteLogin.bloqueado(k);
    if (espera) throw new ErrorHttp(429, `Demasiados intentos fallidos. Espera ${espera} min y vuelve a probar.`);
    let s;
    try { s = auth.iniciarSesion(req.body || {}); } catch (e) { if (e.status === 401) limiteLogin.fallo(k); throw e; }
    limiteLogin.exito(k);
    res.cookie(COOKIE, s.token, opcionesCookie(s.maxAge));
    res.json({ usuario: s.usuario });
  });
  r.post('/logout', (req, res) => {
    auth.cerrarSesion(req.sesionId);
    res.clearCookie(COOKIE, opcionesCookie());
    res.json({ ok: true, rol: req.usuario?.rol || null });
  });
  r.get('/me', (req, res) => (req.usuario ? res.json({ usuario: req.usuario }) : res.status(401).json({ error: 'Sin sesión.' })));
  return r;
}
