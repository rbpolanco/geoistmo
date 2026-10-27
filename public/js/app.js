// GeoIstmo · aplicación de una sola página: enrutador, sesión y menú diferenciado por rol.
// La interfaz oculta lo que no corresponde a cada rol, pero quien decide es el servidor (403/401).
import { api, configurarApi } from './api.js';
import { esc, $, icono, toast, cargando, avisoError, inicial, colorAvatar } from './ui.js';
import * as acceso from './views/acceso.js';
import * as est from './views/estudiante.js';
import * as act from './views/actividad.js';
import * as doc from './views/docente.js';
import * as adm from './views/admin.js';

const ROL_INICIO = { estudiante: '/estudiante', docente: '/docente', administrador: '/admin' };
const ROL_INGRESO = { estudiante: '/ingreso', docente: '/ingreso/docente', administrador: '/ingreso/admin' };
const ROL_NOMBRE = { estudiante: 'Estudiante', docente: 'Docente', administrador: 'Administrador' };

// Menús del Avance 2 (sección 4.1). Los elementos «A4» todavía no existen y se muestran como pendientes, sin enlace.
const MENUS = {
  estudiante: [
    { ruta: '/estudiante', texto: 'Inicio', icono: 'inicio' },
    { ruta: '/estudiante/mision', texto: 'Actividad del día', icono: 'dia' },
    { texto: 'Noticias', icono: 'noticias', pendiente: true },
    { ruta: '/estudiante/modulos', texto: 'Módulos', icono: 'modulos' },
    { texto: 'Mapa', icono: 'mapa', pendiente: true },
    { ruta: '/estudiante/notas', texto: 'Mis notas', icono: 'notas' },
    { texto: 'Aula', icono: 'aula', pendiente: true },
    { ruta: '/estudiante/insignias', texto: 'Mis insignias', icono: 'insignia' },
  ],
  docente: [
    { ruta: '/docente', texto: 'Panel', icono: 'panel' },
    { ruta: '/docente/modulos', texto: 'Módulos y temas', icono: 'libro' },
    { ruta: '/docente/resultados', texto: 'Resultados', icono: 'resultados' },
    { texto: 'Aula', icono: 'aula', pendiente: true },
    { texto: 'Calificar', icono: 'calificar', pendiente: true },
    { texto: 'Debates', icono: 'debates', pendiente: true },
  ],
  administrador: [
    { ruta: '/admin', texto: 'Resumen', icono: 'panel' },
    { texto: 'Escuelas', icono: 'escuelas', pendiente: true },
    { ruta: '/admin/secciones', texto: 'Cursos y secciones', icono: 'secciones' },
    { ruta: '/admin/usuarios', texto: 'Usuarios', icono: 'usuarios' },
    { ruta: '/admin/catalogo', texto: 'Catálogo curricular', icono: 'catalogo' },
    { texto: 'Calendario', icono: 'calendario', pendiente: true },
    { texto: 'Reportes', icono: 'resultados', pendiente: true },
    { texto: 'Configuración', icono: 'config', pendiente: true },
  ],
};

// Tabla de rutas: patrón → rol requerido, opción del menú activa y vista.
const RUTAS = [
  { p: /^\/ingreso$/, publica: true, vista: (c) => acceso.ingreso(c, 'estudiante') },
  { p: /^\/ingreso\/docente$/, publica: true, vista: (c) => acceso.ingreso(c, 'docente') },
  { p: /^\/ingreso\/admin$/, publica: true, vista: (c) => acceso.ingreso(c, 'administrador') },
  { p: /^\/registro$/, publica: true, vista: (c) => acceso.registro(c) },
  { p: /^\/estudiante$/, rol: 'estudiante', menu: '/estudiante', vista: est.inicio },
  { p: /^\/estudiante\/mision$/, rol: 'estudiante', menu: '/estudiante/mision', vista: est.mision },
  { p: /^\/estudiante\/modulos$/, rol: 'estudiante', menu: '/estudiante/modulos', vista: est.modulos },
  { p: /^\/estudiante\/modulos\/(\d+)$/, rol: 'estudiante', menu: '/estudiante/modulos', vista: est.modulo },
  { p: /^\/estudiante\/temas\/(\d+)$/, rol: 'estudiante', menu: '/estudiante/modulos', vista: est.tema },
  { p: /^\/estudiante\/actividad\/(\d+)$/, rol: 'estudiante', menu: null, vista: act.jugar },
  { p: /^\/estudiante\/notas$/, rol: 'estudiante', menu: '/estudiante/notas', vista: est.notas },
  { p: /^\/estudiante\/insignias$/, rol: 'estudiante', menu: '/estudiante/insignias', vista: est.insignias },
  { p: /^\/docente$/, rol: 'docente', menu: '/docente', vista: doc.panel },
  { p: /^\/docente\/modulos$/, rol: 'docente', menu: '/docente/modulos', vista: doc.modulos },
  { p: /^\/docente\/resultados$/, rol: 'docente', menu: '/docente/resultados', vista: doc.resultados },
  { p: /^\/admin$/, rol: 'administrador', menu: '/admin', vista: adm.resumen },
  { p: /^\/admin\/usuarios$/, rol: 'administrador', menu: '/admin/usuarios', vista: adm.usuarios },
  { p: /^\/admin\/secciones$/, rol: 'administrador', menu: '/admin/secciones', vista: adm.secciones },
  { p: /^\/admin\/catalogo$/, rol: 'administrador', menu: '/admin/catalogo', vista: adm.catalogo },
];

const estado = { usuario: null, rolMaquetado: null, salidaPendiente: null, limpiezas: [] };
const limpiar = () => { estado.limpiezas.splice(0).forEach((f) => { try { f(); } catch { /* nada */ } }); };
const raiz = () => $('#raiz');

export function navegar(ruta, { reemplazar = false } = {}) {
  if (estado.salidaPendiente && !estado.salidaPendiente()) return;
  estado.salidaPendiente = null;
  history[reemplazar ? 'replaceState' : 'pushState']({}, '', ruta);
  resolver();
}

// Una vista puede pedir confirmación antes de abandonarla (p. ej., un reto a medias).
export const confirmarSalida = (fn) => { estado.salidaPendiente = fn; };

function maquetar(usuario) {
  const menu = MENUS[usuario.rol].map((m) => m.pendiente
    ? `<li><span class="pendiente" title="Se implementa en el Avance 4">${icono(m.icono)}${esc(m.texto)}<small>A4</small></span></li>`
    : `<li><a href="${m.ruta}" data-ruta="${m.ruta}">${icono(m.icono)}${esc(m.texto)}</a></li>`).join('');
  raiz().innerHTML = `
    <div class="app">
      <aside class="menu" aria-label="Menú principal">
        <a class="logo" href="${ROL_INICIO[usuario.rol]}"><img src="/assets/img/logo-oscuro.png" alt="GeoIstmo, inicio" width="190" height="51"></a>
        <nav><ul>${menu}</ul></nav>
        <div class="menu-pie">
          <div class="quien"><span class="avatar ${colorAvatar(usuario.nombre)}" aria-hidden="true">${inicial(usuario.nombre)}</span>
            <div><b>${esc(usuario.nombre)}</b><span>${ROL_NOMBRE[usuario.rol]}</span></div></div>
          <button type="button" class="btn-salir" data-accion="salir">${icono('salir')}Cerrar sesión</button>
        </div>
      </aside>
      <main id="contenido" class="principal" tabindex="-1"></main>
    </div>`;
  estado.rolMaquetado = usuario.rol;
}

function marcarMenu(rutaMenu) {
  document.querySelectorAll('.menu nav a').forEach((a) => {
    if (a.dataset.ruta === rutaMenu) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}

async function cerrarSesion() {
  const rol = estado.usuario?.rol;
  try { await api.post('/auth/logout'); } catch { /* aunque falle, se limpia la interfaz */ }
  estado.usuario = null; estado.rolMaquetado = null; estado.salidaPendiente = null;
  // Cambio C3 del Avance 2: «Cerrar sesión» vuelve al ingreso del mismo rol.
  history.replaceState({}, '', ROL_INGRESO[rol] || '/ingreso');
  resolver();
  toast('Cerraste sesión. ¡Hasta pronto!', 'ok');
}

async function resolver() {
  limpiar();
  const ruta = location.pathname.replace(/\/+$/, '') || '/';
  const def = RUTAS.find((r) => r.p.test(ruta));
  const params = def ? ruta.match(def.p).slice(1) : [];

  if (ruta === '/' || !def) {
    if (ruta !== '/' && def === undefined && estado.usuario) toast('Esa página no existe. Te llevamos a tu inicio.');
    return navegar(estado.usuario ? ROL_INICIO[estado.usuario.rol] : '/ingreso', { reemplazar: true });
  }
  if (def.publica) {
    if (estado.usuario) return navegar(ROL_INICIO[estado.usuario.rol], { reemplazar: true });
    estado.rolMaquetado = null;
    document.title = 'GeoIstmo · Ingreso';
    const caja = document.createElement('div');
    raiz().replaceChildren(caja);
    return def.vista(contexto(caja, params));
  }
  if (!estado.usuario) {
    sessionStorage.setItem('geoistmo:volver', ruta);
    return navegar(ROL_INGRESO[def.rol], { reemplazar: true });
  }
  if (def.rol !== estado.usuario.rol) {
    toast('Esa sección no corresponde a tu rol.', 'error');
    return navegar(ROL_INICIO[estado.usuario.rol], { reemplazar: true });
  }
  if (estado.rolMaquetado !== estado.usuario.rol) maquetar(estado.usuario);
  marcarMenu(def.menu);
  const main = $('#contenido');
  // Cada vista recibe un contenedor nuevo: sus escuchadores desaparecen con él al cambiar de pantalla.
  const vista = document.createElement('div');
  vista.innerHTML = cargando();
  main.replaceChildren(vista);
  window.scrollTo(0, 0);
  try {
    await def.vista(contexto(vista, params));
    main.focus({ preventScroll: true });
  } catch (e) {
    if (e.status === 401) return;
    vista.innerHTML = `${avisoError(e)}<a class="btn btn-borde" href="${ROL_INICIO[estado.usuario.rol]}">${icono('volver')} Volver al inicio</a>`;
  }
}

function contexto(el, params) {
  return { el, params, usuario: estado.usuario, navegar, confirmarSalida,
    alSalir: (fn) => estado.limpiezas.push(fn),
    titulo: (t) => { document.title = `${t} · GeoIstmo`; },
    alEntrar: (usuario) => {
      estado.usuario = usuario;
      const volver = sessionStorage.getItem('geoistmo:volver'); sessionStorage.removeItem('geoistmo:volver');
      navegar(volver && volver.startsWith(ROL_INICIO[usuario.rol]) ? volver : ROL_INICIO[usuario.rol], { reemplazar: true });
    } };
}

// Enlaces internos sin recargar la página y acciones con data-accion (la CSP no permite onclick en línea).
document.addEventListener('click', (ev) => {
  const salir = ev.target.closest('[data-accion="salir"]');
  if (salir) { ev.preventDefault(); if (!estado.salidaPendiente || estado.salidaPendiente()) { estado.salidaPendiente = null; cerrarSesion(); } return; }
  const a = ev.target.closest('a[href^="/"]');
  if (a && !a.target && !ev.ctrlKey && !ev.metaKey && !ev.shiftKey && !a.hasAttribute('download')) { ev.preventDefault(); navegar(a.getAttribute('href')); }
});
window.addEventListener('popstate', () => { estado.salidaPendiente = null; resolver(); });

configurarApi({
  sesionPerdida: () => {
    const rol = estado.usuario?.rol;
    estado.usuario = null; estado.rolMaquetado = null; estado.salidaPendiente = null;
    toast('Tu sesión terminó. Inicia sesión de nuevo.', 'error');
    sessionStorage.setItem('geoistmo:volver', location.pathname);
    history.replaceState({}, '', ROL_INGRESO[rol] || '/ingreso'); resolver();
  },
});

(async () => {
  try { estado.usuario = (await api.get('/auth/me')).usuario; } catch { estado.usuario = null; }
  resolver();
})();
