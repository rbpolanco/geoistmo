export class ErrorHttp extends Error {
  constructor(status, mensaje, campos) { super(mensaje); this.status = status; this.campos = campos; }
}
export const noEncontrado = (m = 'No se encontró lo que buscas.') => new ErrorHttp(404, m);
export const prohibido = (m = 'No tienes permiso para hacer esto.') => new ErrorHttp(403, m);
export const invalido = (mensaje, campos) => new ErrorHttp(400, mensaje, campos);

export const txt = (v, { min = 1, max = 200 } = {}) => {
  if (typeof v !== 'string') return null;
  const s = v.trim().replace(/\s+/g, ' ');
  return s.length >= min && s.length <= max ? s : null;
};
export const entero = (v, { min = -Infinity, max = Infinity } = {}) => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
};
export const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;
export const validarClave = (c) => typeof c === 'string' && c.length >= 8 && c.length <= 72 && /[A-Za-z]/.test(c) && /\d/.test(c);
export const MSG_CLAVE = 'La contraseña debe tener al menos 8 caracteres, con letras y números.';
