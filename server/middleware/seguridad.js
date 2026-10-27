import { ErrorHttp } from '../util/errores.js';
import { config } from '../config.js';

// Cabeceras de seguridad y política de contenido estricta: solo recursos del propio servidor.
export function cabeceras(_req, res, next) {
  res.set({
    'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self'; style-src-attr 'unsafe-inline'; script-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  });
  next();
}

// Defensa CSRF: toda petición que modifica datos debe traer la cabecera propia del cliente y,
// si el navegador envía Origin, debe coincidir con el host. La cookie además es SameSite=Lax.
export function protegerCsrf(req, _res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get('x-geoistmo') !== '1') return next(new ErrorHttp(403, 'Petición no válida.'));
  const origen = req.get('origin');
  if (origen) {
    let host = ''; try { host = new URL(origen).host; } catch { /* origen inválido */ }
    // Detrás de un proxy (p. ej., GitHub Codespaces) el host público llega en X-Forwarded-Host.
    // Es seguro aceptarlo: un sitio ajeno no puede enviar la cabecera X-GeoIstmo sin permiso CORS.
    const permitidos = [req.get('host'), ...String(req.get('x-forwarded-host') || '').split(',').map((h) => h.trim())].filter(Boolean);
    if (!permitidos.includes(host)) return next(new ErrorHttp(403, 'Petición no válida.'));
  }
  next();
}

// Limitador de intentos de inicio de sesión (en memoria; suficiente para una versión alfa local).
const intentos = new Map();
const ventana = () => config.loginVentanaMin * 60_000;
export const limiteLogin = {
  clave: (ip, email) => `${ip}|${String(email || '').toLowerCase()}`,
  bloqueado(k) {
    const r = intentos.get(k); if (!r) return 0;
    if (Date.now() - r.primero > ventana()) { intentos.delete(k); return 0; }
    return r.n >= config.loginMaxIntentos ? Math.ceil((ventana() - (Date.now() - r.primero)) / 60_000) : 0;
  },
  fallo(k) { const r = intentos.get(k); if (!r || Date.now() - r.primero > ventana()) intentos.set(k, { n: 1, primero: Date.now() }); else r.n++; },
  exito(k) { intentos.delete(k); },
  reiniciar() { intentos.clear(); },
};
