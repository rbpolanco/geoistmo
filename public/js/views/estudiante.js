// Vistas del estudiante: Inicio (01-04), Actividad del día (02-01), Módulos (04-01), Temas (04-03),
// Tema con lecciones y autoevaluación (04-05 adaptado), Mis notas (07-03) y álbum de insignias (07-04).
import { api } from '../api.js';
import { esc, $, $$, icono, cabecera, fechaLarga, nota, toast, conBoton, avisoError } from '../ui.js';

const ESTADO_MODULO = { completado: ['ok', 'Completado'], en_curso: ['curso', 'En curso'], abierto: ['info', 'Disponible'], bloqueado: ['bloq', 'Bloqueado'] };
const ESTADO_TEMA = { completado: ['ok', 'Completado'], en_curso: ['curso', 'En curso'], disponible: ['info', 'Disponible'], bloqueado: ['bloq', 'Bloqueado'], en_preparacion: ['gris', 'En preparación'] };
const TIPO_RETO = { relacionar: 'Relaciona', seleccion: 'Capitales', vf: 'V o F' };
const etiqueta = ([c, t]) => `<span class="estado ${c}">${c === 'bloq' ? '🔒 ' : c === 'ok' ? '✓ ' : ''}${t}</span>`;

function chipsEstudiante(d) {
  return `<a class="chip chip-nivel" href="/estudiante/insignias" title="${esc(d.nivel.nombre)} · ${d.xp} XP">${icono('rayo', 'width="16" height="16"')} Nv. ${d.nivel.n}</a>
    <span class="chip">${d.xp} XP</span>
    <span class="chip chip-racha" title="Días seguidos con la misión completa">${icono('fuego', 'width="16" height="16"')} ${d.racha} ${d.racha === 1 ? 'día' : 'días'}</span>`;
}

function insigniaHTML(b) {
  if (!b.ganada) return `<figure><div class="insignia" aria-label="Insignia por descubrir">?</div><figcaption>Por descubrir</figcaption></figure>`;
  return `<figure><div class="insignia ganada ${b.escudo ? 'escudo' : ''}"><img src="${esc(b.imagen)}" alt="Insignia ${esc(b.nombre)}" loading="lazy"></div><figcaption>${esc(b.nombre)}</figcaption></figure>`;
}

function semana(racha, hecha) {
  const letras = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  const hoy = new Date(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Panama' }).format(new Date())).getDay();
  const orden = [1, 2, 3, 4, 5, 6, 0];
  const pos = orden.indexOf(hoy);
  return orden.map((d, i) => {
    const atras = pos - i; // 0 = hoy
    const cls = atras === 0 ? (hecha ? 'si' : 'hoy') : atras > 0 && atras <= (hecha ? racha - 1 : racha) ? 'si' : '';
    return `<span class="${cls}" title="${atras === 0 ? 'Hoy' : ''}">${letras[d]}</span>`;
  }).join('');
}

export async function inicio(ctx) {
  const d = await api.get('/estudiante/inicio');
  ctx.titulo('Inicio');
  const m = d.mision;
  const ganadas = d.album.filter((b) => b.ganada).length;
  ctx.el.innerHTML = `
    ${cabecera({ sobre: `${fechaLarga()} · ${d.seccion || 'sin sección'}`, titulo: `Hola, ${d.nombre}`, derecha: chipsEstudiante(d) })}
    <div class="rejilla r-inicio">
      <div class="rejilla">
        <section class="tarjeta tarjeta-oscura mision" aria-labelledby="t-mision">
          <p class="etiqueta" id="t-mision">Misión de hoy</p>
          <div class="mision-cuerpo">
            <div><div class="cifra-xl">${m.completos}/${m.total}</div><p class="texto-2" style="margin-top:8px">retos completados</p></div>
            <div class="pasos-mision">
              ${m.retos.map((r) => `<div class="paso ${r.completado ? 'hecho' : ''}"><i>${r.completado ? '✓' : r.slot}</i>${TIPO_RETO[r.tipo]}</div>`).join('')}
              <div class="paso premio ${m.completa ? 'hecho' : ''}"><i>${m.completa ? '★' : '?'}</i>Insignia del día</div>
            </div>
          </div>
          <div class="fila fila-sep">
            <div class="fila">
              ${m.completa
                ? `<a class="btn btn-borde" style="color:#fff;border-color:#59625D" href="/estudiante/mision">Ver la misión</a><span class="texto-2">¡Misión completa! +${m.xpHoy} XP hoy</span>`
                : `<a class="btn btn-dia btn-grande" href="/estudiante/mision">${m.completos ? 'Continuar misión' : 'Empezar misión'} ${icono('flecha')}</a><span style="color:var(--lima);font-weight:700">+${m.xpEnJuego} XP en juego</span>`}
            </div>
            <div class="fila"><span class="texto-2">${icono('fuego', 'width="16" height="16"')} Racha de ${d.racha} ${d.racha === 1 ? 'día' : 'días'}</span><div class="semana" aria-label="Días de esta semana con misión completa">${semana(d.racha, m.completa)}</div></div>
          </div>
        </section>
        <section class="tarjeta" aria-labelledby="t-album">
          <div class="fila fila-sep"><h2 id="t-album">Tu álbum de Panamá</h2><a class="enlace" href="/estudiante/insignias">Ver álbum</a></div>
          <p class="texto-2">${ganadas} de ${d.album.length} insignias de lugar. Cada misión completa desbloquea un lugar nuevo.</p>
          <div class="album">${d.album.slice(0, 4).map(insigniaHTML).join('')}</div>
        </section>
      </div>
      <div class="rejilla">
        ${d.continuar ? `
        <section class="tarjeta" aria-labelledby="t-cont">
          <div class="continua">
            <div class="anillo" style="--p:${Math.round((d.continuar.temasCompletados / d.continuar.totalTemas) * 100)}"><b>${d.continuar.temasCompletados}/${d.continuar.totalTemas}</b></div>
            <div><p class="sobretitulo">Continúa · Módulo ${d.continuar.moduloNumero}</p><h3 id="t-cont">${esc(d.continuar.tema.titulo)}</h3>
              <p class="texto-2" style="margin:4px 0 0">Tema ${d.continuar.tema.posicion} · unos ${d.continuar.tema.minutos} minutos</p></div>
            <a class="btn btn-dia" href="/estudiante/temas/${d.continuar.tema.id}" aria-label="Continuar con el tema ${esc(d.continuar.tema.titulo)}">${icono('flecha')}</a>
          </div>
        </section>` : `<section class="tarjeta"><h2>¡Al día!</h2><p class="texto-2">No tienes temas pendientes en los módulos abiertos. Tu docente abrirá los siguientes.</p></section>`}
        <section class="tarjeta tarjeta-arena" aria-labelledby="t-ruta">
          <p class="etiqueta">Tu ruta del curso</p>
          <h2 id="t-ruta" style="margin-top:6px">${d.modulosAbiertos} de ${d.totalModulos} módulos abiertos</h2>
          <p class="texto-2">Los módulos se abren cuando tu docente los activa.</p>
          <a class="btn btn-oscuro" href="/estudiante/modulos">Ver módulos ${icono('flecha')}</a>
        </section>
        <section class="tarjeta" aria-labelledby="t-nivel">
          <p class="etiqueta">Tu nivel</p>
          <h2 id="t-nivel" style="margin-top:6px">${esc(d.nivel.nombre)}</h2>
          <p class="texto-2">${d.nivel.siguiente ? `Te faltan ${d.nivel.siguiente.faltan} XP para ser ${esc(d.nivel.siguiente.nombre)}.` : 'Alcanzaste el nivel más alto.'} Esta semana: ${d.xpSemana} XP.</p>
        </section>
      </div>
    </div>
    <p class="nota-alfa">Versión alfa: noticias del día, liga de la sección, mapa interactivo, pasaporte y avisos se implementan en el Avance 4.</p>`;
}

export async function mision(ctx) {
  const [m, d] = await Promise.all([api.get('/estudiante/mision'), api.get('/estudiante/inicio')]);
  ctx.titulo('Actividad del día');
  const insignia = m.insignia;
  ctx.el.innerHTML = `
    ${cabecera({ sobre: `Misión de hoy · ${fechaLarga()}`, titulo: `Actividad ${m.completos} de ${m.total}`, derecha: chipsEstudiante(d) })}
    ${m.completa ? `
      <section class="celebracion" aria-labelledby="t-cel">
        <img src="/assets/img/banner-celebracion.png" alt="">
        <div class="cuerpo">
          ${insignia ? `<img class="insignia-grande ${insignia.escudo ? '' : 'foto'}" src="${esc(insignia.imagen)}" alt="Insignia ${esc(insignia.nombre)}">` : ''}
          <p class="etiqueta">Misión completa</p>
          <h2 id="t-cel">${insignia ? `Insignia desbloqueada: ${esc(insignia.nombre)}` : '¡Completaste el álbum!'}</h2>
          <p class="texto-2">${insignia ? `${esc(insignia.lugar)} · se guardó en tu álbum de Panamá.` : 'Ya ganaste todas las insignias disponibles.'}</p>
          <div class="premios"><span>+${m.xpHoy} XP hoy</span><span class="amarillo">${icono('fuego', 'width="16" height="16"')} Racha de ${m.racha} ${m.racha === 1 ? 'día' : 'días'}</span></div>
          <div class="fila"><a class="btn btn-dia" href="/estudiante">Continuar ${icono('flecha')}</a><a class="btn btn-borde" style="color:#fff;border-color:#6E8F7C" href="/estudiante/insignias">Ver mi álbum</a></div>
        </div>
      </section><div class="espacio"></div>` : `<p class="texto-2">Completa los tres retos para ganar +${m.bono} XP de bono, sumar un día a tu racha y desbloquear un lugar de Panamá.</p>`}
    <div class="retos">
      ${m.retos.map((r) => `
        <article class="reto ${r.completado ? 'hecho' : ''}">
          <div class="fila fila-sep"><span class="n">${r.completado ? '✓' : r.slot}</span>${r.completado ? `<span class="estado ok">✓ Hecho · ${r.mejor} %</span>` : '<span class="estado info">Pendiente</span>'}</div>
          <h3>${esc(r.titulo)}</h3>
          <p class="texto-2" style="margin:0">${{ relacionar: 'Une cada término de población con su definición.', seleccion: 'Elige la capital de cada provincia.', vf: 'Decide si cada afirmación es verdadera o falsa.' }[r.tipo]}</p>
          <p class="ayuda" style="margin:0">Hasta +${r.xp} XP · 3 vidas</p>
          <a class="btn ${r.completado ? 'btn-borde' : 'btn-dia'}" href="/estudiante/actividad/${r.actividadId}">${r.completado ? 'Jugar de nuevo' : 'Jugar'} ${icono('flecha')}</a>
        </article>`).join('')}
    </div>
    <p class="nota-alfa">Repetir un reto sirve para practicar: el XP de la misión se cuenta una sola vez por día y siempre se conserva el mejor resultado.</p>`;
}

export async function modulos(ctx) {
  const d = await api.get('/estudiante/modulos');
  ctx.titulo('Módulos');
  const actual = d.modulos.find((m) => m.actual);
  ctx.el.innerHTML = `
    ${cabecera({ sobre: `Tu ruta del curso · ${d.abiertos} de ${d.total} abiertos`, titulo: 'Módulos' })}
    ${actual ? `<section class="tarjeta tarjeta-oscura" style="margin-bottom:22px"><div class="fila fila-sep">
      <div class="fila"><div class="anillo" style="--p:${Math.round((actual.temasCompletados / actual.totalTemas) * 100)}"><b style="background:var(--tinta);color:#fff">${Math.round((actual.temasCompletados / actual.totalTemas) * 100)} %</b></div>
      <div><p class="etiqueta">Estás en el Módulo ${actual.numero}</p><h2 style="margin:4px 0 0">${esc(actual.corto)}</h2></div></div>
      <a class="btn btn-dia" href="/estudiante/modulos/${actual.id}">Continuar ${icono('flecha')}</a></div></section>` : ''}
    <div class="ruta">
      ${d.modulos.map((m) => {
        const pct = m.totalTemas ? Math.round((m.temasCompletados / m.totalTemas) * 100) : 0;
        const cuerpo = `
          <div class="fila fila-sep"><span class="num">${m.estado === 'completado' ? '✓' : m.estado === 'bloqueado' ? icono('candado', 'width="20" height="20"') : m.numero}</span>${etiqueta(ESTADO_MODULO[m.estado])}</div>
          <p class="etiqueta" style="margin:0">Módulo ${m.numero}</p>
          <h3>${esc(m.titulo)}</h3>
          ${m.estado === 'bloqueado'
            ? `<p class="ayuda" style="margin-top:auto">${m.programado ? `Se abre el ${new Date(m.programado).toLocaleString('es-PA', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}` : 'Esperando al docente'}</p>`
            : `<div style="margin-top:auto"><div class="barra" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Avance del módulo"><i style="width:${pct}%"></i></div><p class="ayuda" style="margin:6px 0 0">${m.temasCompletados} de ${m.totalTemas} temas</p></div>`}`;
        return m.estado === 'bloqueado'
          ? `<button type="button" class="modulo bloqueado" data-bloqueado="${m.numero}" style="text-align:left;font:inherit;cursor:pointer">${cuerpo}</button>`
          : `<a class="modulo ${m.estado}" href="/estudiante/modulos/${m.id}">${cuerpo}</a>`;
      }).join('')}
    </div>
    <p class="nota-alfa">Los módulos se abren cuando tu docente los activa. Toca uno bloqueado para ver qué falta.</p>`;
  $$('[data-bloqueado]', ctx.el).forEach((b) => b.addEventListener('click', () => toast(`El Módulo ${b.dataset.bloqueado} está esperando al docente. Se abrirá cuando lo active.`)));
}

export async function modulo(ctx) {
  const d = await api.get(`/estudiante/modulos/${ctx.params[0]}`);
  ctx.titulo(`Módulo ${d.numero}`);
  ctx.el.innerHTML = `
    <a class="enlace" href="/estudiante/modulos">${icono('volver', 'width="16" height="16"')} Todos los módulos</a>
    <div class="espacio"></div>
    ${cabecera({ sobre: `Módulo ${d.numero} · ${d.temas.length} temas`, titulo: d.titulo })}
    ${d.abierto ? '' : `<div class="aviso aviso-ambar" role="status">${esc(d.mensaje)}</div>`}
    <p class="texto-2">${esc(d.descripcion)}</p>
    <ol class="temas" style="list-style:none;padding:0;margin:0">
      ${d.temas.map((t) => {
        const accesible = ['completado', 'en_curso', 'disponible'].includes(t.estado);
        const cuerpo = `
          <span class="num">${t.estado === 'completado' ? '✓' : t.estado === 'bloqueado' ? icono('candado', 'width="18" height="18"') : t.posicion}</span>
          <div><h3 style="font-size:17px">Tema ${t.posicion}: ${esc(t.titulo)}</h3>
            <p class="ayuda" style="margin:2px 0 0">${t.motivo ? esc(t.motivo) : `${esc(t.resumen)} · ${t.lecciones} ${t.lecciones === 1 ? 'lección' : 'lecciones'} · unos ${t.minutos} min`}${t.mejor !== null && t.mejor !== undefined ? ` · Mejor resultado: ${t.mejor} %` : ''}</p></div>
          ${etiqueta(ESTADO_TEMA[t.estado])}`;
        return `<li>${accesible ? `<a class="tema ${t.estado}" href="/estudiante/temas/${t.id}">${cuerpo}</a>` : `<div class="tema ${t.estado}">${cuerpo}</div>`}</li>`;
      }).join('')}
    </ol>
    <p class="nota-alfa">Para completar un tema: lee sus lecciones y obtén 80 % o más en la autoevaluación. Así se abre el siguiente.</p>`;
}

function bloquesHTML(bloques) {
  return bloques.map((b) => {
    if (b.t === 'p') return `<p>${esc(b.x)}</p>`;
    if (b.t === 'ul') return `<ul>${b.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
    if (b.t === 'destacado') return `<p class="destacado">${esc(b.x)}</p>`;
    if (b.t === 'img') return `<figure><img src="${esc(b.src)}" alt="${esc(b.alt)}" loading="lazy">${b.pie ? `<figcaption>${esc(b.pie)}</figcaption>` : ''}</figure>`;
    return '';
  }).join('');
}

export async function tema(ctx) {
  let d = await api.get(`/estudiante/temas/${ctx.params[0]}`);
  ctx.titulo(d.titulo);
  let paso = Math.max(0, d.lecciones.findIndex((l) => !l.leida));
  if (d.lecciones.every((l) => l.leida)) paso = d.lecciones.length; // directo a la autoevaluación

  const pintar = () => {
    const ae = d.autoevaluacion;
    const enAuto = paso >= d.lecciones.length;
    const l = d.lecciones[paso];
    ctx.el.innerHTML = `
      <a class="enlace" href="/estudiante/modulos/${d.moduloId}">${icono('volver', 'width="16" height="16"')} Módulo ${d.moduloNumero}</a>
      <div class="espacio"></div>
      ${cabecera({ sobre: `Módulo ${d.moduloNumero} · ${d.moduloTitulo}`, titulo: d.titulo })}
      <nav class="pasos-tema" aria-label="Pasos del tema">
        ${d.lecciones.map((x, i) => `<button type="button" data-paso="${i}" class="${x.leida ? 'leida' : ''}" ${i === paso ? 'aria-current="step"' : ''}>${i + 1}. ${esc(x.titulo)}</button>`).join('')}
        <button type="button" data-paso="${d.lecciones.length}" ${enAuto ? 'aria-current="step"' : ''} class="${ae.mejor !== null && ae.mejor >= ae.meta ? 'leida' : ''}">${d.lecciones.length + 1}. Autoevaluación</button>
      </nav>
      <section class="tarjeta">
        ${enAuto ? `
          <div class="leccion">
            <h2>Autoevaluación del tema</h2>
            <p>${esc(ae.instrucciones)} Son ${ae.preguntas} preguntas y tienes ${ae.vidas} vidas. La meta es ${ae.meta} %.</p>
            ${ae.mejor !== null ? `<div class="aviso ${ae.mejor >= ae.meta ? 'aviso-ok' : 'aviso-ambar'}">Tu mejor resultado: ${ae.mejor} % · ${esc(ae.banda.etiqueta)}. ${esc(ae.banda.mensaje)}</div>` : ''}
            ${ae.disponible
              ? `<a class="btn btn-dia btn-grande" href="/estudiante/actividad/${ae.id}">${ae.mejor === null ? 'Empezar autoevaluación' : 'Intentar de nuevo'} ${icono('flecha')}</a>`
              : `<div class="aviso aviso-info">${esc(ae.motivoNoDisponible)}</div><button type="button" class="btn btn-borde" data-paso="${d.lecciones.findIndex((x) => !x.leida)}">Ir a la lección pendiente</button>`}
          </div>` : `
          <article class="leccion">
            <p class="etiqueta">Lección ${paso + 1} de ${d.lecciones.length}</p>
            <h2>${esc(l.titulo)}</h2>
            ${bloquesHTML(l.bloques)}
          </article>
          <div class="fila fila-sep" style="margin-top:18px">
            <button type="button" class="btn btn-borde" data-paso="${paso - 1}" ${paso === 0 ? 'disabled' : ''}>${icono('volver')} Anterior</button>
            <button type="button" class="btn btn-ok" data-leer="${l.id}">${l.leida ? 'Siguiente' : 'Entendido, continuar'} ${icono('flecha')}</button>
          </div>`}
      </section>`;
  };
  pintar();

  ctx.el.addEventListener('click', async (e) => {
    const p = e.target.closest('[data-paso]');
    if (p && !p.disabled) { paso = Number(p.dataset.paso); pintar(); ctx.el.querySelector('.tarjeta')?.scrollIntoView({ block: 'nearest' }); return; }
    const leer = e.target.closest('[data-leer]');
    if (leer) {
      await conBoton(leer, 'Guardando…', async () => {
        try {
          await api.post(`/estudiante/lecciones/${leer.dataset.leer}/leida`);
          d = await api.get(`/estudiante/temas/${ctx.params[0]}`);
          paso += 1; pintar();
          window.scrollTo({ top: 0 });
        } catch (err) { toast(err.message, 'error'); }
      });
    }
  });
}

export async function notas(ctx) {
  const d = await api.get('/estudiante/notas');
  ctx.titulo('Mis notas');
  const auto = d.actividades.filter((a) => a.tipo === 'Autoevaluación');
  const mis = d.actividades.filter((a) => a.tipo !== 'Autoevaluación');
  const tabla = (filas, vacio) => filas.length ? `
    <div class="tabla-envoltura"><table>
      <thead><tr><th>Actividad</th><th>Módulo</th><th class="num">Mejor resultado</th><th>Nivel</th><th class="num">Intentos</th></tr></thead>
      <tbody>${filas.map((a) => `<tr><td><b>${esc(a.titulo)}</b></td><td>${a.modulo ? `Módulo ${a.modulo}` : '—'}</td><td class="num">${nota(a.mejor)}</td><td>${esc(a.banda.etiqueta)}</td><td class="num">${a.intentos}</td></tr>`).join('')}</tbody>
    </table></div>` : `<div class="vacio">${vacio}</div>`;
  ctx.el.innerHTML = `
    ${cabecera({ sobre: 'Tu progreso', titulo: 'Mis notas' })}
    <div class="rejilla r-3">
      <section class="tarjeta tarjeta-verde"><p class="etiqueta">Promedio de autoevaluaciones</p>
        <div class="cifra" style="margin:10px 0">${d.promedio === null ? '—' : `${d.promedio} %`}</div>
        <p class="texto-2" style="margin:0">${d.banda ? esc(`${d.banda.etiqueta} · ${d.banda.mensaje}`) : 'Todavía no tienes autoevaluaciones.'}</p></section>
      <section class="tarjeta"><p class="etiqueta">Autoevaluaciones</p><div class="cifra verde" style="margin:10px 0">${auto.length}</div><p class="texto-2" style="margin:0">temas evaluados</p></section>
      <section class="tarjeta"><p class="etiqueta">Retos de misión</p><div class="cifra verde" style="margin:10px 0">${mis.length}</div><p class="texto-2" style="margin:0">tipos de reto jugados</p></section>
    </div>
    <div class="espacio"></div>
    <details class="tarjeta" style="padding:14px 20px"><summary style="cursor:pointer;font-weight:700">¿Cómo se calcula?</summary><p class="texto-2" style="margin:10px 0 0">${esc(d.formula)}</p></details>
    <div class="espacio"></div>
    <h2 style="font-size:22px;margin-bottom:12px">Autoevaluaciones por tema</h2>
    ${tabla(auto, 'Aún no has hecho autoevaluaciones. <a href="/estudiante/modulos">Ve a tus módulos</a>.')}
    <div class="espacio"></div>
    <h2 style="font-size:22px;margin-bottom:12px">Retos de la misión del día</h2>
    ${tabla(mis, 'Aún no has jugado la misión del día. <a href="/estudiante/mision">Empieza ahora</a>.')}`;
}

export async function insignias(ctx) {
  const d = await api.get('/estudiante/perfil');
  ctx.titulo('Mis insignias');
  const g = d.album.filter((b) => b.ganada).length;
  ctx.el.innerHTML = `
    ${cabecera({ sobre: 'Perfil', titulo: 'Mis insignias', derecha: `<span class="chip chip-nivel">${icono('rayo', 'width="16" height="16"')} Nv. ${d.nivel.n} · ${esc(d.nivel.nombre)}</span><span class="chip chip-racha">${icono('fuego', 'width="16" height="16"')} ${d.racha} días</span>` })}
    <div class="rejilla r-inicio">
      <section class="tarjeta"><h2>Álbum de Panamá · ${g} de ${d.album.length}</h2>
        <p class="texto-2">Cada misión del día completa desbloquea un lugar de Panamá.</p>
        <div class="album">${d.album.map(insigniaHTML).join('')}</div></section>
      <section class="tarjeta"><h2>${esc(d.nombre)}</h2><p class="texto-2">${esc(d.email)}</p>
        <div class="barra-simple"><span>XP total</span><b>${d.xp} XP</b></div>
        <div class="barra-simple"><span>Nivel</span><b>${esc(d.nivel.nombre)}</b></div>
        <p class="ayuda">${d.nivel.siguiente ? `Faltan ${d.nivel.siguiente.faltan} XP para ${esc(d.nivel.siguiente.nombre)}.` : 'Nivel máximo alcanzado.'}</p>
        <p class="ayuda">Niveles: Explorador (0) · Cartógrafo (200) · Analista (500) · Geógrafo (1000 XP).</p></section>
    </div>
    <p class="nota-alfa">Las fotografías de las insignias provienen del prototipo; está pendiente registrar su autor y licencia (Avance 2, sección 2.8).</p>`;
}
