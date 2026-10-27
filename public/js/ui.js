// Utilidades de interfaz: escape de HTML (todo texto dinámico pasa por esc), avisos, iconos y formatos.
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const $ = (sel, raiz = document) => raiz.querySelector(sel);
export const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];

export function toast(texto, tipo = '') {
  const t = document.createElement('div');
  t.className = `toast ${tipo}`; t.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
  t.textContent = texto;
  $('#toasts').append(t);
  setTimeout(() => t.remove(), tipo === 'error' ? 6000 : 3500);
}

export const cargando = (texto = 'Cargando…') => `<div class="cargando" role="status">${esc(texto)}</div>`;
export const avisoError = (e) => `<div class="aviso aviso-error" role="alert">${esc(e?.message || e)}</div>`;

// Muestra los errores de validación que devuelve el servidor junto a cada campo.
export function mostrarErrores(form, err) {
  $$('.error-campo', form).forEach((n) => n.remove());
  $$('.con-error', form).forEach((n) => n.classList.remove('con-error'));
  $$('[aria-invalid]', form).forEach((n) => n.removeAttribute('aria-invalid'));
  const general = $('.mensaje-form', form);
  if (general) general.innerHTML = err ? avisoError(err) : '';
  if (!err?.campos) return;
  let primero = null;
  for (const [campo, msg] of Object.entries(err.campos)) {
    let input = form.elements[campo]; if (!input) continue;
    if (typeof RadioNodeList !== 'undefined' && input instanceof RadioNodeList) input = input[0];
    const caja = input.closest('.campo') || input.parentElement;
    caja.classList.add('con-error');
    const n = document.createElement('span'); n.className = 'error-campo'; n.id = `err-${campo}`; n.textContent = msg;
    caja.append(n);
    const el = input;
    el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', n.id);
    primero ??= el;
  }
  primero?.focus();
}

export async function conBoton(boton, textoEspera, fn) {
  const original = boton.innerHTML;
  boton.disabled = true; boton.setAttribute('aria-busy', 'true'); boton.textContent = textoEspera;
  try { return await fn(); } finally { boton.disabled = false; boton.removeAttribute('aria-busy'); boton.innerHTML = original; }
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const fechaLarga = (d = new Date()) => {
  const f = new Date(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Panama' }).format(d));
  return `${DIAS[f.getDay()]} ${f.getDate()} de ${MESES[f.getMonth()]}`;
};
export const fechaHora = (iso) => (iso ? new Date(iso).toLocaleString('es-PA', { timeZone: 'America/Panama', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');
export const inicial = (n) => esc((n || '?').trim()[0]?.toUpperCase() || '?');
export const colorAvatar = (n) => `c${[...String(n)].reduce((s, c) => s + c.charCodeAt(0), 0) % 6}`;
export const claseNota = (pct) => (pct === null || pct === undefined ? 'nada' : pct >= 90 ? 'dominado' : pct >= 80 ? 'logrado' : pct >= 60 ? 'proceso' : 'reforzar');
export const nota = (pct) => `<span class="nota ${claseNota(pct)}">${pct === null || pct === undefined ? '—' : `${pct} %`}</span>`;

// Iconos de línea propios (los íconos del prototipo vienen rasterizados dentro de los SVG de pantalla completa).
const P = {
  inicio: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  dia: '<path d="M12 3c3 4 6 6 6 10a6 6 0 0 1-12 0c0-4 3-6 6-10Z"/>',
  noticias: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h10M7 13h6"/>',
  modulos: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  mapa: '<path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2Z"/><path d="M9 4v14M15 6v14"/>',
  notas: '<path d="M6 3h9l4 4v14H6Z"/><path d="m9 13 2 2 4-4"/>',
  aula: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  insignia: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z"/><path d="m9 12 2 2 4-4"/>',
  panel: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5Z"/>',
  libro: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Z"/><path d="M4 19V5"/>',
  resultados: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  calificar: '<path d="m5 12 4 4 10-10"/>', debates: '<path d="M4 5h16v11H9l-5 4Z"/>',
  usuarios: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
  secciones: '<path d="M3 21V8l9-5 9 5v13"/><path d="M9 21v-6h6v6"/>',
  catalogo: '<path d="M5 4h14v16H5Z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  escuelas: '<path d="M3 10 12 5l9 5-9 5Z"/><path d="M7 12v5c3 2 7 2 10 0v-5"/>',
  calendario: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  config: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  salir: '<path d="M15 4h4v16h-4"/><path d="M10 8l-4 4 4 4M6 12h10"/>',
  ojo: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  flecha: '<path d="M5 12h14M13 6l6 6-6 6"/>', volver: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  candado: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  rayo: '<path d="M13 2 4 14h7l-1 8 9-12h-7Z"/>', fuego: '<path d="M12 22a7 7 0 0 0 7-7c0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-2 2-5 5-5 8a7 7 0 0 0 7 7Z"/>',
  mas: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>',
};
export const icono = (n, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${P[n] || ''}</svg>`;

// Encabezado común de pantalla: sobretítulo, título y fichas a la derecha.
export const cabecera = ({ sobre = '', titulo, derecha = '' }) => `
  <header class="cabecera"><div>${sobre ? `<p class="sobretitulo">${esc(sobre)}</p>` : ''}<h1>${esc(titulo)}</h1></div>
  ${derecha ? `<div class="chips">${derecha}</div>` : ''}</header>`;
