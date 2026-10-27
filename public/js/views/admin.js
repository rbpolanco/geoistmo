// Vistas del administrador: Resumen (10-01), Cursos y secciones (10-03), Usuarios (10-04, 10-09, 10-10)
// y Catálogo curricular (10-05) para gestionar módulos, temas, actividades y preguntas sin tocar el código.
import { api } from '../api.js';
import { esc, $, $$, icono, cabecera, toast, mostrarErrores, conBoton, fechaHora, inicial, colorAvatar } from '../ui.js';

const ROLES = { estudiante: 'Estudiante', docente: 'Docente', administrador: 'Administrador' };
const ACCIONES = { usuario_creado: 'Usuario creado', usuario_editado: 'Usuario editado', clave_restablecida: 'Contraseña restablecida', seccion_creada: 'Sección creada', seccion_editada: 'Sección editada',
  modulo_abierto: 'Módulo abierto', modulo_cerrado: 'Módulo cerrado', modulo_programado: 'Módulo programado', modulo_editado: 'Módulo editado', tema_creado: 'Tema creado', tema_editado: 'Tema editado', tema_eliminado: 'Tema eliminado',
  actividad_publicada: 'Actividad publicada', actividad_oculta: 'Actividad oculta', pregunta_creada: 'Pregunta creada', pregunta_editada: 'Pregunta editada', pregunta_eliminada: 'Pregunta eliminada' };

// Ventana modal reutilizable con formulario. `alGuardar` recibe el formulario; si lanza un error se muestra en él.
function modal(ctx, { titulo, cuerpo, boton = 'Guardar', alGuardar }) {
  const dlg = document.createElement('dialog');
  dlg.innerHTML = `<form class="cuerpo-modal" novalidate><h2>${esc(titulo)}</h2><div class="mensaje-form" aria-live="assertive"></div>${cuerpo}
    <div class="acciones-modal"><button type="button" class="btn btn-borde" data-cerrar>Cancelar</button>${boton ? `<button type="submit" class="btn btn-ok">${esc(boton)}</button>` : ''}</div></form>`;
  ctx.el.append(dlg);
  const f = dlg.querySelector('form');
  dlg.addEventListener('close', () => dlg.remove());
  dlg.querySelector('[data-cerrar]').addEventListener('click', () => dlg.close());
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    await conBoton(f.querySelector('[type=submit]'), 'Guardando…', async () => {
      try { const seguir = await alGuardar(f, dlg); if (seguir !== false) dlg.close(); } catch (err) { mostrarErrores(f, err); }
    });
  });
  dlg.showModal();
  f.querySelector('input, select, textarea')?.focus();
  return { dlg, f };
}
const campo = (nombre, etiqueta, valor = '', extra = '') => `<label class="campo"><span>${etiqueta}</span><input class="input" name="${nombre}" value="${esc(valor)}" ${extra}></label>`;

export async function resumen(ctx) {
  const d = await api.get('/admin/resumen');
  ctx.titulo('Panel de administración');
  ctx.el.innerHTML = `
    ${cabecera({ sobre: 'Administración', titulo: 'Panel de administración' })}
    <div class="rejilla r-4">
      ${[['Secciones', d.secciones], ['Docentes', d.docentes], ['Estudiantes', d.estudiantes], ['Administradores', d.administradores]]
        .map(([t, n]) => `<section class="tarjeta"><p class="etiqueta">${t}</p><div class="cifra verde" style="margin:10px 0 0">${n}</div></section>`).join('')}
    </div>
    <div class="espacio"></div>
    <div class="fila">
      <button type="button" class="btn btn-dia" data-nuevo-usuario>${icono('mas')} Usuario</button>
      <a class="btn btn-borde" href="/admin/secciones">${icono('mas')} Curso o sección</a>
      <a class="btn btn-borde" href="/admin/catalogo">${icono('catalogo')} Catálogo curricular</a>
    </div>
    <div class="espacio"></div>
    <div class="rejilla r-2">
      <section class="tarjeta"><h2>Requiere tu atención</h2>
        ${d.atencion.length ? `<ul style="margin:0;padding-left:1.2em">${d.atencion.map((a) => `<li style="margin-bottom:6px">${esc(a)}</li>`).join('')}</ul>` : '<div class="aviso aviso-ok" style="margin:0">Todo en orden: no hay pendientes.</div>'}
        <h2 style="margin-top:22px">Contenido del sistema</h2>
        <div class="barra-simple"><span>Módulos</span><span></span><b>${d.modulos}</b></div>
        <div class="barra-simple"><span>Temas</span><span></span><b>${d.temas}</b></div>
        <div class="barra-simple"><span>Lecciones</span><span></span><b>${d.lecciones}</b></div>
        <div class="barra-simple"><span>Actividades</span><span></span><b>${d.actividades}</b></div>
        <div class="barra-simple"><span>Preguntas</span><span></span><b>${d.preguntas}</b></div>
      </section>
      <section class="tarjeta"><h2>Actividad reciente</h2>
        ${d.reciente.length ? `<ul style="list-style:none;margin:0;padding:0;display:grid;gap:10px">${d.reciente.map((r) => `<li class="fila" style="align-items:flex-start;flex-wrap:nowrap"><span class="estado gris">${esc(fechaHora(r.fecha))}</span><span><b>${esc(ACCIONES[r.accion] || r.accion)}</b> · ${esc(r.detalle)}<br><span class="ayuda">${esc(r.usuario || 'Sistema')}</span></span></li>`).join('')}</ul>`
          : '<div class="vacio">Aún no hay cambios registrados. Aquí aparecerán las acciones de docentes y administradores.</div>'}
      </section>
    </div>
    <p class="nota-alfa">Pendiente para el Avance 4: escuelas, calendario, reportes, configuración, importar CSV y publicar avisos.</p>`;
  $('[data-nuevo-usuario]', ctx.el).addEventListener('click', async () => formularioUsuario(ctx, null, (await api.get('/admin/secciones')).secciones, () => ctx.navegar('/admin/usuarios')));
}

function formularioUsuario(ctx, u, secciones, alTerminar) {
  const opcSec = secciones.map((s) => `<option value="${s.id}" ${u?.seccionId === s.id ? 'selected' : ''}>${esc(s.nombre)}</option>`).join('');
  const { f } = modal(ctx, {
    titulo: u ? 'Editar usuario' : 'Crear usuario', boton: u ? 'Guardar cambios' : 'Crear usuario',
    cuerpo: `
      ${campo('nombre', 'Nombre completo', u?.nombre, 'maxlength="80" required')}
      ${campo('email', 'Correo electrónico', u?.email, 'type="email" maxlength="120" required')}
      <label class="campo"><span>Rol</span><select class="input" name="rol">${Object.entries(ROLES).map(([k, v]) => `<option value="${k}" ${(u?.rol || 'estudiante') === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label class="campo" data-solo-est><span>Sección</span><select class="input" name="seccionId"><option value="">Elige una sección</option>${opcSec}</select></label>
      ${u ? '' : `${campo('clave', 'Contraseña inicial', '', 'type="text" autocomplete="off" maxlength="72"')}<p class="ayuda">Mínimo 8 caracteres, con letras y números. Comunícala a la persona por un medio seguro.</p>`}
      ${u ? `<label class="interruptor"><input type="checkbox" name="activo" ${u.activo ? 'checked' : ''}> Cuenta activa</label>` : ''}`,
    alGuardar: async (form) => {
      const d = { nombre: form.nombre.value, email: form.email.value, rol: form.rol.value, seccionId: form.rol.value === 'estudiante' ? Number(form.seccionId.value) || null : null };
      if (u) { d.activo = form.activo.checked; await api.patch(`/admin/usuarios/${u.id}`, d); toast('Cambios guardados.', 'ok'); }
      else { d.clave = form.clave.value; await api.post('/admin/usuarios', d); toast(`Usuario creado: ${d.email}`, 'ok'); }
      alTerminar();
    },
  });
  const sync = () => { f.querySelector('[data-solo-est]').classList.toggle('oculto', f.rol.value !== 'estudiante'); };
  f.rol.addEventListener('change', sync); sync();
}

export async function usuarios(ctx) {
  ctx.titulo('Usuarios');
  const estado = { rol: '', q: '' };
  const { secciones } = await api.get('/admin/secciones');
  ctx.el.innerHTML = `
    ${cabecera({ sobre: 'Estudiantes, docentes y administradores', titulo: 'Usuarios', derecha: `<button type="button" class="btn btn-ok" data-nuevo>${icono('mas')} Crear usuario</button>` })}
    <div class="filtros" role="group" aria-label="Filtrar por rol">
      <button type="button" data-rol="" aria-pressed="true">Todos</button>
      ${Object.entries(ROLES).map(([k, v]) => `<button type="button" data-rol="${k}" aria-pressed="false">${v}s</button>`).join('')}
      <input class="input" type="search" placeholder="Buscar por nombre o correo" aria-label="Buscar por nombre o correo" data-buscar maxlength="60">
    </div>
    <div id="lista"></div>`;
  const lista = $('#lista', ctx.el);
  let todos = [];
  const cargar = async () => {
    const qs = new URLSearchParams(); if (estado.rol) qs.set('rol', estado.rol); if (estado.q) qs.set('q', estado.q);
    todos = (await api.get(`/admin/usuarios?${qs}`)).usuarios;
    lista.innerHTML = todos.length ? `<div class="tabla-envoltura"><table>
      <thead><tr><th>Nombre</th><th>Rol</th><th>Sección</th><th>Último acceso</th><th>Estado</th><th>Acciones</th></tr></thead>
      <tbody>${todos.map((u) => `<tr>
        <td><span class="nombre-celda"><span class="avatar ${colorAvatar(u.nombre)}" aria-hidden="true">${inicial(u.nombre)}</span><span>${esc(u.nombre)}<br><span class="ayuda" style="font-weight:400">${esc(u.email)}</span></span></span></td>
        <td><span class="estado gris">${ROLES[u.rol]}</span></td><td>${esc(u.seccion || '—')}</td><td>${u.ultimoAcceso ? esc(fechaHora(u.ultimoAcceso)) : 'Sin ingresar'}</td>
        <td><span class="estado ${u.activo ? 'ok' : 'error'}">${u.activo ? 'Activo' : 'Suspendido'}</span></td>
        <td><div class="fila" style="gap:6px;flex-wrap:nowrap"><button type="button" class="btn btn-borde btn-s" data-editar="${u.id}">Editar</button><button type="button" class="btn btn-borde btn-s" data-clave="${u.id}">Restablecer clave</button></div></td></tr>`).join('')}</tbody></table></div>
      <p class="ayuda" style="margin-top:10px">${todos.length} usuario(s).</p>`
      : '<div class="tarjeta vacio">No hay usuarios con ese filtro.</div>';
  };
  await cargar();
  $$('[data-rol]', ctx.el).forEach((b) => b.addEventListener('click', () => { estado.rol = b.dataset.rol; $$('[data-rol]', ctx.el).forEach((x) => x.setAttribute('aria-pressed', String(x === b))); cargar(); }));
  let t; $('[data-buscar]', ctx.el).addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => { estado.q = e.target.value.trim(); cargar(); }, 250); });
  $('[data-nuevo]', ctx.el).addEventListener('click', () => formularioUsuario(ctx, null, secciones, cargar));
  lista.addEventListener('click', async (e) => {
    const ed = e.target.closest('[data-editar]');
    if (ed) return formularioUsuario(ctx, todos.find((u) => u.id === Number(ed.dataset.editar)), secciones, cargar);
    const cl = e.target.closest('[data-clave]');
    if (cl) {
      const u = todos.find((x) => x.id === Number(cl.dataset.clave));
      modal(ctx, { titulo: 'Restablecer contraseña', boton: 'Generar contraseña temporal',
        cuerpo: `<p>Se generará una contraseña temporal para <b>${esc(u.nombre)}</b> y se cerrarán sus sesiones abiertas.</p>`,
        alGuardar: async (form) => {
          const r = await api.post(`/admin/usuarios/${u.id}/restablecer-clave`);
          form.innerHTML = `<h2>Contraseña temporal</h2><div class="aviso aviso-ok">Contraseña restablecida. Se muestra <b>una sola vez</b>: cópiala y entrégala a la persona.</div>
            <p class="clave-temporal">${esc(r.clave)}</p><div class="acciones-modal"><button type="button" class="btn btn-ok" data-cerrar2>Listo</button></div>`;
          form.querySelector('[data-cerrar2]').addEventListener('click', () => form.closest('dialog').close());
          return false;
        } });
    }
  });
}

export async function secciones(ctx) {
  ctx.titulo('Cursos y secciones');
  const [{ secciones: lista }, { usuarios: docentes }] = await Promise.all([api.get('/admin/secciones'), api.get('/admin/usuarios?rol=docente')]);
  ctx.el.innerHTML = `
    ${cabecera({ sobre: 'Geografía Humana, Económica y Política · 12.º', titulo: 'Cursos y secciones', derecha: `<button type="button" class="btn btn-ok" data-nueva>${icono('mas')} Nueva sección</button>` })}
    <div class="tabla-envoltura"><table>
      <thead><tr><th>Sección</th><th>Código de registro</th><th>Docente</th><th class="num">Estudiantes</th><th>Acciones</th></tr></thead>
      <tbody>${lista.map((s) => `<tr><td><b>${esc(s.nombre)}</b><br><span class="ayuda">Grado ${esc(s.grado)}</span></td><td><code>${esc(s.codigo)}</code></td>
        <td>${s.docente ? esc(s.docente) : '<span class="estado curso">Sin docente</span>'}</td><td class="num">${s.estudiantes}</td>
        <td><button type="button" class="btn btn-borde btn-s" data-editar="${s.id}">Editar</button></td></tr>`).join('')}</tbody></table></div>
    <p class="nota-alfa">Al crear una sección, todos sus módulos empiezan cerrados; el docente asignado decide cuándo abrirlos.</p>`;
  const form = (s) => modal(ctx, {
    titulo: s ? 'Editar sección' : 'Nueva sección', boton: s ? 'Guardar cambios' : 'Crear sección',
    cuerpo: `${campo('nombre', 'Nombre', s?.nombre ?? '12.º ', 'maxlength="40"')}${campo('codigo', 'Código de registro (lo usan los estudiantes)', s?.codigo ?? '', 'maxlength="30" placeholder="Ej.: G3O-12C-2026"')}
      <label class="campo"><span>Docente</span><select class="input" name="docenteId"><option value="">Sin asignar</option>${docentes.filter((d) => d.activo).map((d) => `<option value="${d.id}" ${s?.docenteId === d.id ? 'selected' : ''}>${esc(d.nombre)}</option>`).join('')}</select></label>`,
    alGuardar: async (f) => {
      const d = { nombre: f.nombre.value, codigo: f.codigo.value, docenteId: f.docenteId.value ? Number(f.docenteId.value) : null };
      if (s) await api.patch(`/admin/secciones/${s.id}`, d); else await api.post('/admin/secciones', d);
      toast(s ? 'Sección actualizada.' : 'Sección creada.', 'ok'); secciones(ctx);
    } });
  $('[data-nueva]', ctx.el).addEventListener('click', () => form(null));
  $$('[data-editar]', ctx.el).forEach((b) => b.addEventListener('click', () => form(lista.find((s) => s.id === Number(b.dataset.editar)))));
}

export async function catalogo(ctx) {
  ctx.titulo('Catálogo curricular');
  const abiertos = new Set($$('details[open]', ctx.el).map((d) => d.dataset.mod));
  const { modulos, mision } = await api.get('/admin/catalogo');
  ctx.el.innerHTML = `
    ${cabecera({ sobre: 'Grado 12.º · Geografía Humana, Económica y Política', titulo: 'Catálogo curricular' })}
    <div class="aviso aviso-info">Aquí se mantienen los contenidos sin tocar el código. Los textos de las lecciones están pendientes de revisión por el experto en contenido.</div>
    <section class="tarjeta" style="margin-bottom:18px"><h2>Misión del día</h2>
      <div class="rejilla r-3">${mision.map((a) => `<div class="fila-tema" style="border:0;grid-template-columns:34px 1fr"><span class="estado info">${a.slot}</span><div><b>${esc(a.titulo)}</b><br><span class="ayuda">${a.preguntas} preguntas · ${a.publicada ? 'publicada' : 'oculta'}</span><br>
        <button type="button" class="enlace" data-preguntas="${a.id}">Ver preguntas</button></div></div>`).join('')}</div></section>
    <div class="catalogo">
      ${modulos.map((m) => `
        <details data-mod="${m.id}" ${abiertos.has(String(m.id)) ? 'open' : ''}>
          <summary><span class="estado gris">Módulo ${m.numero}</span> ${esc(m.titulo)} <span class="ayuda" style="margin-left:auto;font-family:var(--f-texto)">${m.temas.length} temas</span></summary>
          <div class="contenido-modulo">
            <p class="texto-2">${esc(m.descripcion)}</p>
            <div class="fila" style="margin-bottom:8px"><button type="button" class="btn btn-borde btn-s" data-editar-mod="${m.id}">Editar módulo</button><button type="button" class="btn btn-borde btn-s" data-nuevo-tema="${m.id}">${icono('mas', 'width="14" height="14"')} Agregar tema</button></div>
            ${m.temas.map((t) => `
              <div class="fila-tema">
                <span class="estado gris">${t.posicion}</span>
                <div><b>${esc(t.titulo)}</b><br><span class="ayuda">${t.lecciones} lecciones · ${t.minutos} min · ${t.actividad ? `${t.actividad.preguntas} preguntas` : 'sin autoevaluación'}${t.lecciones ? '' : ' · en preparación'}</span></div>
                <div class="fila" style="gap:6px">
                  ${t.actividad ? `<label class="interruptor" title="Si se oculta, los estudiantes no pueden hacer la autoevaluación"><input type="checkbox" data-publicar="${t.actividad.id}" ${t.actividad.publicada ? 'checked' : ''}> Publicada</label>
                    <button type="button" class="btn btn-borde btn-s" data-preguntas="${t.actividad.id}">Preguntas</button>` : ''}
                  <button type="button" class="btn btn-borde btn-s" data-editar-tema="${t.id}">Editar</button>
                  ${t.lecciones ? '' : `<button type="button" class="btn btn-peligro btn-s" data-borrar-tema="${t.id}">Eliminar</button>`}
                </div>
              </div>`).join('')}
          </div>
        </details>`).join('')}
    </div>
    <p class="nota-alfa">Pendiente para el Avance 4: editor de lecciones con imágenes, edición de «Relaciona conceptos» y jerarquía completa grado → asignatura → unidad.</p>`;

  const buscarTema = (id) => modulos.flatMap((m) => m.temas).find((t) => t.id === id);
  const temaForm = (moduloId, t) => modal(ctx, {
    titulo: t ? 'Editar tema' : 'Agregar tema', boton: t ? 'Guardar' : 'Agregar',
    cuerpo: `${campo('titulo', 'Título', t?.titulo, 'maxlength="120"')}${campo('resumen', 'Resumen breve', t?.resumen, 'maxlength="200"')}${campo('minutos', 'Duración (minutos)', t?.minutos ?? 6, 'type="number" min="1" max="60"')}
      ${t ? '' : '<p class="ayuda">El tema nuevo aparecerá «en preparación» para los estudiantes hasta que tenga lecciones y autoevaluación.</p>'}`,
    alGuardar: async (f) => {
      const d = { titulo: f.titulo.value, resumen: f.resumen.value, minutos: Number(f.minutos.value) };
      if (t) await api.patch(`/admin/temas/${t.id}`, d); else await api.post(`/admin/modulos/${moduloId}/temas`, d);
      toast('Tema guardado.', 'ok'); catalogo(ctx);
    } });

  ctx.el.onclick = async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.editarMod) {
      const m = modulos.find((x) => x.id === Number(b.dataset.editarMod));
      modal(ctx, { titulo: `Editar Módulo ${m.numero}`, cuerpo: `${campo('titulo', 'Título', m.titulo, 'maxlength="120"')}<label class="campo"><span>Descripción</span><textarea class="input" name="descripcion" maxlength="300">${esc(m.descripcion)}</textarea></label>`,
        alGuardar: async (f) => { await api.patch(`/admin/modulos/${m.id}`, { titulo: f.titulo.value, descripcion: f.descripcion.value }); toast('Módulo actualizado.', 'ok'); catalogo(ctx); } });
    } else if (b.dataset.nuevoTema) temaForm(Number(b.dataset.nuevoTema), null);
    else if (b.dataset.editarTema) temaForm(null, buscarTema(Number(b.dataset.editarTema)));
    else if (b.dataset.borrarTema) {
      const t = buscarTema(Number(b.dataset.borrarTema));
      modal(ctx, { titulo: 'Eliminar tema', boton: 'Eliminar', cuerpo: `<p>¿Eliminar el tema «${esc(t.titulo)}»? Esta acción no se puede deshacer.</p>`,
        alGuardar: async () => { await api.delete(`/admin/temas/${t.id}`); toast('Tema eliminado.', 'ok'); catalogo(ctx); } });
    } else if (b.dataset.preguntas) preguntas(ctx, Number(b.dataset.preguntas));
  };
  ctx.el.onchange = async (e) => {
    const c = e.target.closest('[data-publicar]'); if (!c) return;
    try { await api.patch(`/admin/actividades/${c.dataset.publicar}`, { publicada: c.checked }); toast(c.checked ? 'Autoevaluación publicada.' : 'Autoevaluación oculta para los estudiantes.', 'ok'); }
    catch (err) { c.checked = !c.checked; toast(err.message, 'error'); }
  };
}

async function preguntas(ctx, actividadId) {
  const d = await api.get(`/admin/actividades/${actividadId}/preguntas`);
  const editable = d.actividad.tipo !== 'relacionar';
  const describir = (q) => q.tipo === 'vf' ? `<p class="ayuda" style="margin:6px 0 0">Respuesta: <b>${q.respuesta.value ? 'Verdadero' : 'Falso'}</b></p>`
    : q.tipo === 'relacionar' ? `<ol>${q.datos.terminos.map((t) => `<li>${esc(t.text)} = ${esc(q.datos.definiciones.find((x) => x.id === q.respuesta.map[t.id]).text)}</li>`).join('')}</ol>`
      : `<ol type="A">${q.datos.opciones.map((o) => `<li class="${o.id === q.respuesta.id ? 'ok' : ''}">${esc(o.text)}${o.id === q.respuesta.id ? ' ✓' : ''}</li>`).join('')}</ol>`;
  const { dlg } = modal(ctx, {
    titulo: d.actividad.titulo, boton: null,
    cuerpo: `${editable ? '' : '<div class="aviso aviso-info">Las parejas de «Relaciona conceptos» se editan en el archivo de contenido en esta versión alfa.</div>'}
      <div class="lista-preguntas">${d.preguntas.map((q) => `<div class="pregunta-admin"><div class="fila fila-sep"><b>${q.posicion}. ${esc(q.enunciado)}</b>
        ${editable ? `<span class="fila" style="gap:6px"><button type="button" class="btn btn-borde btn-s" data-editar-q="${q.id}">Editar</button><button type="button" class="btn btn-peligro btn-s" data-borrar-q="${q.id}">Eliminar</button></span>` : ''}</div>
        ${describir(q)}${q.explicacion ? `<p class="ayuda" style="margin:6px 0 0">Explicación: ${esc(q.explicacion)}</p>` : ''}</div>`).join('')}</div>
      ${editable ? `<div class="fila" style="margin-top:14px"><button type="button" class="btn btn-ok btn-s" data-nueva-q="seleccion">${icono('mas', 'width="14" height="14"')} Pregunta de selección</button>${d.actividad.tipo !== 'seleccion' || true ? `<button type="button" class="btn btn-borde btn-s" data-nueva-q="vf">${icono('mas', 'width="14" height="14"')} Verdadero o falso</button>` : ''}</div>` : ''}`,
  });
  const reabrir = () => { dlg.close(); preguntas(ctx, actividadId); };
  dlg.addEventListener('click', (e) => {
    const nueva = e.target.closest('[data-nueva-q]'); const ed = e.target.closest('[data-editar-q]'); const br = e.target.closest('[data-borrar-q]');
    if (nueva || ed) {
      const q = ed ? d.preguntas.find((x) => x.id === Number(ed.dataset.editarQ)) : null;
      const tipo = q ? q.tipo : (d.actividad.tipo === 'vf' ? 'vf' : nueva.dataset.nuevaQ);
      dlg.close();
      modal(ctx, { titulo: q ? 'Editar pregunta' : 'Nueva pregunta',
        cuerpo: `<label class="campo"><span>Enunciado</span><textarea class="input" name="enunciado" maxlength="300">${esc(q?.enunciado)}</textarea></label>
          ${tipo === 'vf' ? `<fieldset class="campo" style="border:0;padding:0"><span>Respuesta correcta</span><div class="fila"><label class="check"><input type="radio" name="verdadero" value="true" ${q?.respuesta.value === true ? 'checked' : ''}> Verdadero</label><label class="check"><input type="radio" name="verdadero" value="false" ${q?.respuesta.value === false ? 'checked' : ''}> Falso</label></div></fieldset>`
            : `<fieldset class="campo" style="border:0;padding:0"><span>Opciones (marca la correcta)</span><input type="hidden" name="opciones">${[0, 1, 2, 3].map((k) => `<div class="fila" style="flex-wrap:nowrap"><input type="radio" name="correcta" value="${k}" aria-label="Opción ${'ABCD'[k]} es la correcta" ${q?.respuesta.id === 'abcd'[k] ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--verde)"><input class="input" data-op="${k}" placeholder="Opción ${'ABCD'[k]}" maxlength="120" value="${esc(q?.datos.opciones?.[k]?.text)}"></div>`).join('')}</fieldset>`}
          <label class="campo"><span>Explicación (se muestra después de responder)</span><textarea class="input" name="explicacion" maxlength="400">${esc(q?.explicacion)}</textarea></label>`,
        alGuardar: async (f) => {
          const body = { enunciado: f.enunciado.value, explicacion: f.explicacion.value, tipo };
          if (tipo === 'vf') { const v = f.querySelector('[name=verdadero]:checked'); body.verdadero = v ? v.value === 'true' : null; }
          else { body.opciones = $$('[data-op]', f).map((i) => i.value); const c = f.querySelector('[name=correcta]:checked'); body.correcta = c ? Number(c.value) : null; }
          if (q) await api.put(`/admin/actividades/${actividadId}/preguntas/${q.id}`, body); else await api.post(`/admin/actividades/${actividadId}/preguntas`, body);
          toast('Pregunta guardada.', 'ok'); setTimeout(() => preguntas(ctx, actividadId));
        } });
    } else if (br) {
      api.delete(`/admin/actividades/${actividadId}/preguntas/${br.dataset.borrarQ}`).then(() => { toast('Pregunta eliminada.', 'ok'); reabrir(); }).catch((err) => toast(err.message, 'error'));
    }
  });
}
