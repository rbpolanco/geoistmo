// Vistas del docente: Panel (09-01), Módulos y temas con apertura/programación (09-02, 09-03, 09-11)
// y Resultados de la sección por tema (alcance A3 de «Calificar»: consulta de resultados de autoevaluaciones).
import { api } from '../api.js';
import { esc, $, $$, icono, cabecera, fechaLarga, nota, toast, inicial, colorAvatar, conBoton } from '../ui.js';

// El docente puede tener varias secciones; la elegida se recuerda en esta pestaña.
async function elegirSeccion(ctx) {
  const { secciones } = await api.get('/docente/secciones');
  if (!secciones.length) return { secciones, actual: null };
  const guardada = Number(sessionStorage.getItem('geoistmo:seccion'));
  const actual = secciones.find((s) => s.id === guardada) || secciones[0];
  return { secciones, actual };
}
const selectorSeccion = (secciones, actual) => secciones.length > 1
  ? `<label class="chip" style="gap:8px">Sección <select data-seccion style="border:0;background:transparent;font:inherit;cursor:pointer">${secciones.map((s) => `<option value="${s.id}" ${s.id === actual.id ? 'selected' : ''}>${esc(s.nombre)}</option>`).join('')}</select></label>`
  : `<span class="chip chip-nivel">${esc(actual.nombre)} · ${actual.estudiantes} estudiantes</span>`;
function escucharSeccion(ctx, vista) {
  $('[data-seccion]', ctx.el)?.addEventListener('change', (e) => { sessionStorage.setItem('geoistmo:seccion', e.target.value); vista(ctx); });
}
const sinSecciones = (ctx, titulo) => { ctx.el.innerHTML = `${cabecera({ titulo })}<div class="tarjeta vacio"><img src="/assets/img/mascota.png" alt="">Todavía no tienes secciones asignadas. Pide a la administración que te asigne una.</div>`; };

export async function panel(ctx) {
  const { secciones, actual } = await elegirSeccion(ctx);
  ctx.titulo('Panel del docente');
  if (!actual) return sinSecciones(ctx, 'Panel del docente');
  const d = await api.get(`/docente/secciones/${actual.id}/panel`);
  const ref = d.paraReforzar;
  ctx.el.innerHTML = `
    ${cabecera({ sobre: `Geografía · ${fechaLarga()}`, titulo: 'Panel del docente', derecha: selectorSeccion(secciones, actual) })}
    <div class="rejilla r-3">
      <section class="tarjeta tarjeta-verde"><p class="etiqueta">Hoy en tu clase</p><div class="cifra-xl" style="color:var(--amarillo);margin:10px 0">${d.porcentajeHoy} %</div><p style="margin:0;font-weight:700">de la clase ya jugó hoy</p></section>
      <section class="tarjeta"><p class="etiqueta" style="color:var(--verde)">Racha promedio</p><div class="cifra ambar" style="margin:14px 0">${d.rachaPromedio}</div><p class="texto-2" style="margin:0">días seguidos</p></section>
      <section class="tarjeta"><p class="etiqueta" style="color:var(--rojo-texto)">Para reforzar</p><div class="cifra rojo" style="margin:14px 0">${ref.length}</div>
        <p class="texto-2" style="margin:0">${ref.length ? esc(ref.slice(0, 3).map((r) => r.nombre).join(', ')) + (ref.length > 3 ? '…' : '') + ' · sin actividad ni racha' : 'Todos tienen actividad reciente.'}</p></section>
    </div>
    <div class="espacio"></div>
    <div class="rejilla r-inicio">
      <section class="tarjeta"><h2>Actividad diaria y racha</h2>
        ${d.estudiantes.length ? `<div class="tabla-envoltura"><table>
          <thead><tr><th>Estudiante</th><th class="num">Racha</th><th>Hoy</th><th>XP semana</th><th>Estado</th></tr></thead>
          <tbody>${d.estudiantes.map((e) => `<tr>
            <td><span class="nombre-celda"><span class="avatar ${colorAvatar(e.nombre)}" aria-hidden="true">${inicial(e.nombre)}</span>${esc(e.nombre)}</span></td>
            <td class="num">${icono('fuego', 'width="14" height="14" style="color:#E08A00;vertical-align:-2px"')} ${e.racha}</td>
            <td><span class="puntos" aria-label="${e.hoy} de ${e.de} retos hoy">${Array.from({ length: e.de }, (_, k) => `<i class="${k < e.hoy ? 'si' : ''}"></i>`).join('')}</span></td>
            <td>${e.xpSemana} XP</td>
            <td><span class="estado ${e.estado === 'Completó' ? 'ok' : e.estado === 'En curso' ? 'curso' : 'error'}">${esc(e.estado)}</span></td></tr>`).join('')}</tbody></table></div>`
          : '<div class="vacio">Tu sección todavía no tiene estudiantes. Comparte el código para que se registren.</div>'}
      </section>
      <div class="rejilla">
        <section class="tarjeta"><p class="etiqueta">Atajos</p><div class="rejilla" style="gap:10px;margin-top:12px">
          <a class="tarjeta" style="padding:14px;box-shadow:none;text-decoration:none;color:inherit;display:flex;gap:12px;align-items:center" href="/docente/modulos"><span class="avatar" style="background:var(--amarillo)">${icono('libro', 'width="18" height="18"')}</span><span><b>Abrir o programar módulos</b><br><span class="ayuda">Decide qué ve tu sección</span></span></a>
          <a class="tarjeta" style="padding:14px;box-shadow:none;text-decoration:none;color:inherit;display:flex;gap:12px;align-items:center" href="/docente/resultados"><span class="avatar" style="background:var(--amarillo)">${icono('resultados', 'width="18" height="18"')}</span><span><b>Ver resultados por tema</b><br><span class="ayuda">Mejor intento de cada estudiante</span></span></a>
        </div></section>
        <section class="tarjeta tarjeta-arena"><p class="etiqueta">Código de registro</p>
          <p class="cifra" style="font-size:30px;margin:10px 0;letter-spacing:.04em">${esc(d.seccion.codigo)}</p>
          <p class="texto-2" style="margin:0">Compártelo con tus estudiantes para que creen su cuenta en ${esc(d.seccion.nombre)}.</p></section>
      </div>
    </div>
    <p class="nota-alfa">Pendiente para el Avance 4: publicar misiones y tareas en el Aula, calificar entregas, moderar debates y avisos.</p>`;
  escucharSeccion(ctx, panel);
}

const ESTADO_TXT = { abierto: ['ok', 'Abierto'], programado: ['curso', 'Programado'], cerrado: ['bloq', 'Cerrado'] };

export async function modulos(ctx) {
  const { secciones, actual } = await elegirSeccion(ctx);
  ctx.titulo('Módulos y temas');
  if (!actual) return sinSecciones(ctx, 'Módulos y temas');
  const { modulos: lista } = await api.get(`/docente/secciones/${actual.id}/modulos`);
  const abiertos = lista.filter((m) => m.estado === 'abierto').length;
  ctx.el.innerHTML = `
    ${cabecera({ sobre: `${abiertos} de ${lista.length} abiertos para ${actual.nombre}`, titulo: 'Módulos y temas', derecha: selectorSeccion(secciones, actual) })}
    <div class="aviso aviso-info">Los estudiantes solo pueden entrar a los módulos abiertos. Un módulo programado se abre solo en la fecha indicada.</div>
    <div class="rejilla" style="gap:12px">
      ${lista.map((m) => `
        <div class="control-modulo ${m.estado}" data-mod="${m.id}">
          <span class="num">${m.numero}</span>
          <div><h3 style="font-size:17px">${esc(m.titulo)}</h3>
            <p class="ayuda" style="margin:2px 0 0">${m.temas} temas · ${m.temasConContenido ? `${m.temasConContenido} con contenido en esta versión` : 'contenido en preparación'}
            ${m.estado === 'programado' ? ` · se abre el ${new Date(m.abreEn).toLocaleString('es-PA', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}` : ''}</p></div>
          <div class="fila">
            <span class="estado ${ESTADO_TXT[m.estado][0]}">${ESTADO_TXT[m.estado][1]}</span>
            <div class="segmentado" role="group" aria-label="Estado del módulo ${m.numero}">
              <button type="button" data-estado="abierto" aria-pressed="${m.estado === 'abierto'}">Abrir</button>
              <button type="button" data-estado="programado" aria-pressed="${m.estado === 'programado'}">Programar</button>
              <button type="button" data-estado="cerrado" aria-pressed="${m.estado === 'cerrado'}">Cerrar</button>
            </div>
          </div>
        </div>`).join('')}
    </div>
    <dialog id="dlg-programar"><form method="dialog" class="cuerpo-modal" novalidate>
      <h2>Programar apertura</h2>
      <div class="mensaje-form"></div>
      <label class="campo"><span>Fecha y hora de apertura (hora de Panamá)</span><input class="input" type="datetime-local" name="abreEn" required></label>
      <div class="acciones-modal"><button class="btn btn-borde" value="cancelar" formnovalidate>Cancelar</button><button class="btn btn-ok" value="ok">Programar</button></div>
    </form></dialog>`;
  escucharSeccion(ctx, modulos);

  const dlg = $('#dlg-programar', ctx.el);
  const guardar = async (mid, cuerpo, boton) => conBoton(boton, '…', async () => {
    try { await api.put(`/docente/secciones/${actual.id}/modulos/${mid}`, cuerpo); toast(cuerpo.estado === 'abierto' ? 'Módulo abierto: tus estudiantes ya pueden entrar.' : cuerpo.estado === 'cerrado' ? 'Módulo cerrado.' : 'Apertura programada.', 'ok'); modulos(ctx); }
    catch (e) { toast(e.message, 'error'); }
  });
  $$('[data-estado]', ctx.el).forEach((b) => b.addEventListener('click', () => {
    const mid = b.closest('[data-mod]').dataset.mod;
    if (b.dataset.estado !== 'programado') return guardar(mid, { estado: b.dataset.estado }, b);
    const f = dlg.querySelector('form');
    const manana = new Date(Date.now() + 86_400_000); manana.setMinutes(0, 0, 0);
    f.abreEn.value = new Date(manana.getTime() - manana.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    f.querySelector('.mensaje-form').innerHTML = '';
    dlg.showModal();
    dlg.onclose = () => {
      if (dlg.returnValue !== 'ok') return;
      const fecha = new Date(f.abreEn.value);
      if (!f.abreEn.value || Number.isNaN(fecha.getTime()) || fecha <= new Date()) { toast('Elige una fecha y hora futuras.', 'error'); return; }
      guardar(mid, { estado: 'programado', abreEn: fecha.toISOString() }, b);
    };
  }));
}

export async function resultados(ctx) {
  const { secciones, actual } = await elegirSeccion(ctx);
  ctx.titulo('Resultados');
  if (!actual) return sinSecciones(ctx, 'Resultados');
  const d = await api.get(`/docente/secciones/${actual.id}/resultados`);
  const conNotas = d.estudiantes.filter((e) => e.promedio !== null);
  const promGrupo = conNotas.length ? Math.round(conNotas.reduce((s, e) => s + e.promedio, 0) / conNotas.length) : null;
  const meta = conNotas.filter((e) => e.promedio >= 80).length;
  ctx.el.innerHTML = `
    ${cabecera({ sobre: `Autoevaluaciones · ${d.seccion}`, titulo: 'Resultados', derecha: selectorSeccion(secciones, actual) })}
    <div class="rejilla r-3">
      <section class="tarjeta"><p class="etiqueta">Promedio del grupo</p><div class="cifra verde" style="margin:12px 0">${promGrupo === null ? '—' : `${promGrupo} %`}</div><p class="texto-2" style="margin:0">de quienes ya tienen resultados</p></section>
      <section class="tarjeta"><p class="etiqueta">Cumplen la meta (≥ 80 %)</p><div class="cifra verde" style="margin:12px 0">${meta} de ${d.estudiantes.length}</div><p class="texto-2" style="margin:0">estudiantes</p></section>
      <section class="tarjeta"><p class="etiqueta">Sin resultados</p><div class="cifra rojo" style="margin:12px 0">${d.estudiantes.length - conNotas.length}</div><p class="texto-2" style="margin:0">aún no hacen autoevaluaciones</p></section>
    </div>
    <div class="espacio"></div>
    <div class="tabla-envoltura"><table>
      <thead><tr><th>Estudiante</th>${d.columnas.map((c) => `<th class="num" title="${esc(c.titulo)}">M${c.modulo} · ${esc(c.titulo.split(' ').slice(0, 2).join(' '))}</th>`).join('')}<th class="num">Promedio</th><th>Nivel</th></tr></thead>
      <tbody>${d.estudiantes.map((e) => `<tr><td><span class="nombre-celda"><span class="avatar ${colorAvatar(e.nombre)}" aria-hidden="true">${inicial(e.nombre)}</span>${esc(e.nombre)}</span></td>
        ${e.notas.map((n) => `<td class="num">${nota(n)}</td>`).join('')}<td class="num">${nota(e.promedio)}</td><td>${e.banda ? esc(e.banda.etiqueta) : '<span class="texto-2">—</span>'}</td></tr>`).join('')}</tbody>
    </table></div>
    <p class="nota-alfa">Se muestra el mejor intento de cada estudiante. Rangos: Dominado 90–100 · Logrado 80–89 · En proceso 60–79 · Por reforzar 0–59 (provisionales hasta la decisión D3 del Avance 2).</p>`;
  escucharSeccion(ctx, resultados);
}
