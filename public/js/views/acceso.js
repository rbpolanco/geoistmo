// Ingreso con pestañas por rol (00-01, 00-07, 00-09) y creación de cuenta de estudiante (00-04 a 00-06).
import { api } from '../api.js';
import { esc, $, icono, mostrarErrores, conBoton, toast } from '../ui.js';

const TEXTOS = {
  estudiante: { titulo: 'Hola de nuevo', sub: 'Entra a tu cuenta para continuar.', demo: 'sergio@geoistmo.test', clave: 'Estudiante2026!' },
  docente: { titulo: 'Panel del docente', sub: 'Entra para acompañar a tu sección.', demo: 'docente@geoistmo.test', clave: 'Docente2026!' },
  administrador: { titulo: 'Administración', sub: 'Gestiona usuarios, secciones y contenidos.', demo: 'admin@geoistmo.test', clave: 'Admin2026!' },
};
const RUTA = { estudiante: '/ingreso', docente: '/ingreso/docente', administrador: '/ingreso/admin' };

const arte = () => `
  <div class="acceso-arte">
    <img src="/assets/img/panel-ingreso.png" alt="Logotipo de GeoIstmo: silueta de Panamá sobre un libro abierto, rodeada de íconos escolares y geográficos." width="460" height="581">
    <p class="lema">«Explora, comprende y aprende»</p>
  </div>`;

const campoClave = (nombre, etiqueta, auto) => `
  <label class="campo"><span>${etiqueta}</span>
    <div class="input-icono">
      <input class="input" type="password" name="${nombre}" autocomplete="${auto}" required maxlength="72">
      <button type="button" data-ver-clave aria-label="Mostrar contraseña" aria-pressed="false">${icono('ojo')}</button>
    </div>
  </label>`;

function activarVerClave(raiz) {
  raiz.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ver-clave]'); if (!b) return;
    const input = b.parentElement.querySelector('input');
    const ver = input.type === 'password';
    input.type = ver ? 'text' : 'password';
    b.setAttribute('aria-pressed', String(ver)); b.setAttribute('aria-label', ver ? 'Ocultar contraseña' : 'Mostrar contraseña');
  });
}

export function ingreso(ctx, rol) {
  const t = TEXTOS[rol];
  ctx.el.innerHTML = `
    <div class="acceso">
      ${arte()}
      <div class="acceso-form">
        <div class="tarjeta-acceso">
          <nav class="pestanas" aria-label="Elige cómo entras">
            ${Object.entries(RUTA).map(([r, ruta]) => `<a href="${ruta}" ${r === rol ? 'aria-current="page"' : ''}>${r === 'administrador' ? 'Administrador' : r[0].toUpperCase() + r.slice(1)}</a>`).join('')}
          </nav>
          <h1>${t.titulo}</h1>
          <p class="sub">${t.sub}</p>
          <form id="f-ingreso" novalidate>
            <div class="mensaje-form" aria-live="assertive"></div>
            <label class="campo"><span>Correo electrónico</span>
              <input class="input" type="email" name="email" autocomplete="username" required maxlength="120" placeholder="nombre@correo.com"></label>
            ${campoClave('clave', 'Contraseña', 'current-password')}
            <div class="fila-entre">
              <label class="check"><input type="checkbox" name="recordar"> Mantener sesión iniciada</label>
            </div>
            <button class="btn btn-ok btn-bloque btn-grande" type="submit">Entrar ${icono('flecha')}</button>
          </form>
          ${rol === 'estudiante' ? '<p class="pie-acceso">¿Primera vez en GeoIstmo? <a href="/registro">Crear cuenta</a></p>' : '<p class="pie-acceso">Las cuentas de docente y administrador las crea la administración.</p>'}
          <p class="pie-acceso ayuda">¿Olvidaste tu contraseña? Pide a la administración que la restablezca.</p>
          <div class="demo"><b>Versión alfa · cuenta de demostración:</b><br><code>${t.demo}</code> · <code>${t.clave}</code>
            <button type="button" class="enlace" data-rellenar>Usar esta cuenta</button></div>
        </div>
      </div>
    </div>`;
  const f = $('#f-ingreso', ctx.el);
  activarVerClave(ctx.el);
  $('[data-rellenar]', ctx.el).addEventListener('click', () => { f.email.value = t.demo; f.clave.value = t.clave; f.email.focus(); });
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const datos = { email: f.email.value.trim(), clave: f.clave.value, rol, recordar: f.recordar.checked };
    const campos = {};
    if (!datos.email) campos.email = 'Escribe tu correo.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(datos.email)) campos.email = 'Ese correo no parece válido.';
    if (!datos.clave) campos.clave = 'Escribe tu contraseña.';
    if (Object.keys(campos).length) return mostrarErrores(f, { message: 'Revisa los datos marcados.', campos });
    await conBoton(f.querySelector('[type=submit]'), 'Entrando…', async () => {
      try {
        const r = await api.post('/auth/login', datos);
        mostrarErrores(f, null);
        toast(`¡Bienvenido, ${r.usuario.nombre.split(' ')[0]}!`, 'ok');
        ctx.alEntrar(r.usuario);
      } catch (err) { mostrarErrores(f, err); f.clave.value = ''; }
    });
  });
  f.email.focus();
}

export function registro(ctx) {
  ctx.el.innerHTML = `
    <div class="acceso">
      ${arte()}
      <div class="acceso-form">
        <div class="tarjeta-acceso" id="caja-registro">
          <h1>Crea tu cuenta</h1>
          <p class="sub">Usa el código que te dio tu docente.</p>
          <form id="f-registro" novalidate>
            <div class="mensaje-form" aria-live="assertive"></div>
            <label class="campo"><span>Nombre completo</span><input class="input" name="nombre" autocomplete="name" required maxlength="80"></label>
            <label class="campo"><span>Correo electrónico</span><input class="input" type="email" name="email" autocomplete="email" required maxlength="120"></label>
            ${campoClave('clave', 'Contraseña', 'new-password')}
            <p class="ayuda">Mínimo 8 caracteres, con letras y números.</p>
            <label class="campo"><span>Código de tu docente</span><input class="input" name="codigo" required maxlength="30" placeholder="Ej.: G3O-12A-2026" autocapitalize="characters"></label>
            <button class="btn btn-ok btn-bloque btn-grande" type="submit">Crear cuenta</button>
          </form>
          <p class="pie-acceso">¿Ya tienes cuenta? <a href="/ingreso">Iniciar sesión</a></p>
          <div class="demo">Códigos de demostración: <code>G3O-12A-2026</code> (12.º A) · <code>G3O-12B-2026</code> (12.º B)</div>
        </div>
      </div>
    </div>`;
  const f = $('#f-registro', ctx.el);
  activarVerClave(ctx.el);
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = { nombre: f.nombre.value.trim(), email: f.email.value.trim(), clave: f.clave.value, codigo: f.codigo.value.trim() };
    const campos = {};
    if (d.nombre.length < 3) campos.nombre = 'Escribe tu nombre completo (mínimo 3 letras).';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) campos.email = 'Escribe un correo válido.';
    if (d.clave.length < 8 || !/[A-Za-z]/.test(d.clave) || !/\d/.test(d.clave)) campos.clave = 'Mínimo 8 caracteres, con letras y números.';
    if (!d.codigo) campos.codigo = 'Escribe el código que te dio tu docente.';
    if (Object.keys(campos).length) return mostrarErrores(f, { message: 'Revisa los datos marcados.', campos });
    await conBoton(f.querySelector('[type=submit]'), 'Creando cuenta…', async () => {
      try {
        const r = await api.post('/auth/registro', d);
        // Estado «Cuenta creada» (00-06)
        $('#caja-registro', ctx.el).innerHTML = `
          <img src="/assets/img/mascota.png" alt="" width="200" height="161" style="margin:0 auto 12px">
          <h1>¡Cuenta creada!</h1>
          <div class="aviso aviso-ok" role="status">${esc(r.mensaje)}</div>
          <a class="btn btn-ok btn-bloque btn-grande" href="/ingreso">Iniciar sesión ${icono('flecha')}</a>`;
      } catch (err) { mostrarErrores(f, err); }
    });
  });
  f.nombre.focus();
}
