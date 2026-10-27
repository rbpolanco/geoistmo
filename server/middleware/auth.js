import crypto from 'node:crypto';
import { config } from '../config.js';
import { ErrorHttp } from '../util/errores.js';

export const COOKIE = 'geoistmo_sid';
export const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');

export function leerCookie(req, nombre) {
  for (const par of (req.headers.cookie || '').split(';')) {
    const i = par.indexOf('=');
    if (i > 0 && par.slice(0, i).trim() === nombre) { try { return decodeURIComponent(par.slice(i + 1).trim()); } catch { return null; } }
  }
  return null;
}
export const opcionesCookie = (maxAge) => ({ httpOnly: true, sameSite: 'lax', secure: config.cookieSegura, path: '/', ...(maxAge ? { maxAge } : {}) });

// Carga el usuario de la sesión: el token solo vive en la cookie; la BD guarda su SHA-256.
export function cargarSesion(db) {
  const q = db.prepare(`SELECT s.id AS sid, s.expires_at, u.id, u.name, u.email, u.role, u.active, u.section_id
    FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=?`);
  return (req, _res, next) => {
    req.usuario = null;
    const token = leerCookie(req, COOKIE);
    if (token) {
      const f = q.get(hashToken(token));
      if (f && f.active && new Date(f.expires_at) > new Date()) {
        req.usuario = { id: f.id, nombre: f.name, email: f.email, rol: f.role, seccionId: f.section_id };
        req.sesionId = f.sid;
      } else if (f) db.prepare('DELETE FROM sessions WHERE id=?').run(f.sid);
    }
    next();
  };
}

// Control de acceso por rol en el SERVIDOR: ocultar botones en la interfaz no lo sustituye.
export const requerirRol = (...roles) => (req, _res, next) => {
  if (!req.usuario) return next(new ErrorHttp(401, 'Tu sesión terminó. Inicia sesión de nuevo.'));
  if (!roles.includes(req.usuario.rol)) return next(new ErrorHttp(403, 'Tu rol no tiene acceso a esta función.'));
  next();
};
