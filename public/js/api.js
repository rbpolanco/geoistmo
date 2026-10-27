// Cliente de la API. Envía la cabecera anti-CSRF y convierte las respuestas de error en excepciones legibles.
export class ErrorApi extends Error {
  constructor(status, mensaje, campos) { super(mensaje); this.status = status; this.campos = campos || null; }
}

let alPerderSesion = () => {};
export const configurarApi = ({ sesionPerdida }) => { alPerderSesion = sesionPerdida; };

async function pedir(metodo, ruta, cuerpo) {
  let r;
  try {
    r = await fetch('/api' + ruta, {
      method: metodo, credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-GeoIstmo': '1' },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
  } catch {
    throw new ErrorApi(0, 'No hay conexión con el servidor. Revisa que GeoIstmo siga encendido.');
  }
  let datos = null;
  try { datos = await r.json(); } catch { /* respuesta sin JSON */ }
  if (!r.ok) {
    const err = new ErrorApi(r.status, datos?.error || 'Ocurrió un error inesperado.', datos?.campos);
    if (r.status === 401 && !ruta.startsWith('/auth/')) alPerderSesion(err);
    throw err;
  }
  return datos;
}

export const api = {
  get: (r) => pedir('GET', r),
  post: (r, b = {}) => pedir('POST', r, b),
  put: (r, b = {}) => pedir('PUT', r, b),
  patch: (r, b = {}) => pedir('PATCH', r, b),
  delete: (r) => pedir('DELETE', r),
};
