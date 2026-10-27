// Reproductor de actividades (02-02 a 02-12): relacionar conceptos, selección múltiple y verdadero o falso.
// El navegador NO conoce la respuesta: envía la elección y el servidor devuelve si es correcta, la explicación,
// las vidas, el combo y, al final, el porcentaje, el XP y el estado de la misión del día.
import { api } from '../api.js';
import { esc, $, $$, icono, toast, avisoError } from '../ui.js';

const LETRAS = ['A', 'B', 'C', 'D'];

export async function jugar(ctx) {
  const datos = await api.post(`/estudiante/actividades/${ctx.params[0]}/intentos`);
  const { intento, actividad, preguntas } = datos;
  ctx.titulo(actividad.titulo);
  const volverA = actividad.proposito === 'mision' ? '/estudiante/mision' : `/estudiante/temas/${actividad.temaId}`;
  const s = { i: 0, vidas: intento.vidas, combo: 0, marcas: [], respondida: false, enviando: false, terminado: false, pares: {}, elegido: null };

  ctx.confirmarSalida(() => s.terminado || s.marcas.length === 0 || window.confirm('Si sales ahora, perderás el avance de este reto. ¿Quieres salir?'));

  const barra = () => `
    <div class="juego-barra">
      <a class="btn btn-borde btn-s" href="${volverA}">${icono('x', 'width="16" height="16"')} Salir</a>
      <div class="progreso-reto" role="progressbar" aria-label="Preguntas" aria-valuemin="0" aria-valuemax="${preguntas.length}" aria-valuenow="${s.marcas.length}">
        ${preguntas.map((_, k) => `<i class="${s.marcas[k] === true ? 'bien' : s.marcas[k] === false ? 'mal' : k === s.i ? 'actual' : ''}"></i>`).join('')}
      </div>
      <span class="vidas" aria-label="${s.vidas} de ${intento.vidas} vidas">${Array.from({ length: intento.vidas }, (_, k) => `<span class="${k < s.vidas ? '' : 'perdida'}">♥</span>`).join('')}</span>
      ${s.combo >= 2 ? `<span class="combo">${icono('rayo', 'width="14" height="14"')} ×${s.combo} combo</span>` : ''}
    </div>`;

  function pintar() {
    const p = preguntas[s.i];
    let cuerpo = '';
    if (p.tipo === 'seleccion') {
      cuerpo = `
        <h2 class="enunciado" id="enun">${esc(p.enunciado)}</h2>
        ${p.imagen ? `<img src="${esc(p.imagen)}" alt="" style="max-width:560px;border-radius:14px;margin-bottom:18px">` : ''}
        <div class="opciones" role="group" aria-labelledby="enun">
          ${p.opciones.map((o, k) => `<button type="button" class="opcion" data-op="${esc(o.id)}"><kbd>${LETRAS[k]}</kbd>${esc(o.text)}</button>`).join('')}
        </div>
        <p class="ayuda" style="margin-top:14px">Atajo: teclas A, B, C, D o 1 a 4.</p>`;
    } else if (p.tipo === 'vf') {
      cuerpo = `
        <div class="carta">
          <p class="etiqueta">Afirmación ${s.i + 1} de ${preguntas.length}</p>
          ${p.imagen ? `<div class="imagen-carta"><img src="${esc(p.imagen)}" alt="Imagen de apoyo para la afirmación"></div>` : ''}
          <p class="afirmacion" id="enun">${esc(p.enunciado)}</p>
          <div class="botones-vf" role="group" aria-labelledby="enun">
            <button type="button" class="btn-vf falso" data-vf="false"><kbd>←</kbd> Falso</button>
            <button type="button" class="btn-vf verdadero" data-vf="true">Verdadero <kbd>→</kbd></button>
          </div>
        </div>`;
    } else {
      const parDe = (defId) => Object.entries(s.pares).find(([, d]) => d === defId)?.[0];
      const numPar = (tId) => p.terminos.findIndex((t) => t.id === tId) + 1;
      cuerpo = `
        <h2 class="enunciado">${esc(p.enunciado)}</h2>
        <div class="relacion">
          <ul aria-label="Términos">${p.terminos.map((t) => `<li><button type="button" class="termino ${s.elegido === t.id ? 'elegido' : ''}" draggable="true" data-term="${t.id}" aria-pressed="${s.elegido === t.id}">
            ${esc(t.text)}${s.pares[t.id] ? `<span class="par p${numPar(t.id)}">${numPar(t.id)}</span>` : ''}</button></li>`).join('')}</ul>
          <ul aria-label="Definiciones">${p.definiciones.map((d) => { const t = parDe(d.id); return `<li><button type="button" class="definicion" data-def="${d.id}">
            ${t ? `<span class="par p${numPar(t)}">${numPar(t)}</span>` : '<span class="par" style="background:#E3EBE1"></span>'}${esc(d.text)}</button></li>`; }).join('')}</ul>
        </div>
        <div class="instruccion">
          <div><b>Arrastra un término hasta su definición</b>, o toca el término y luego la definición. Toca un término unido para soltarlo.
            <div class="ayuda">Si aciertas todas las parejas, subes el combo.</div></div>
          <button type="button" class="btn btn-ok" data-comprobar ${Object.keys(s.pares).length === p.terminos.length ? '' : 'disabled'}>Comprobar</button>
        </div>`;
    }
    ctx.el.innerHTML = `
      <div class="juego">
        <p class="sobretitulo">${esc(actividad.proposito === 'mision' ? `Reto ${actividad.slot} de 3` : 'Autoevaluación')} · Pregunta ${s.i + 1} de ${preguntas.length}</p>
        <h1 style="font-size:34px;margin-bottom:18px">${esc(actividad.titulo)}</h1>
        ${barra()}
        <div id="zona">${cuerpo}</div>
        <div id="retro" aria-live="polite"></div>
      </div>`;
    if (p.tipo === 'relacion' || p.tipo === 'relacionar') activarArrastre();
    ctx.el.querySelector('.opcion, .btn-vf, .termino')?.focus({ preventScroll: true });
  }

  function activarArrastre() {
    $$('.termino', ctx.el).forEach((t) => t.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', t.dataset.term); e.dataTransfer.effectAllowed = 'link'; }));
    $$('.definicion', ctx.el).forEach((d) => {
      d.addEventListener('dragover', (e) => { if (s.respondida) return; e.preventDefault(); d.classList.add('sobre'); });
      d.addEventListener('dragleave', () => d.classList.remove('sobre'));
      d.addEventListener('drop', (e) => { e.preventDefault(); d.classList.remove('sobre'); if (!s.respondida) unir(e.dataTransfer.getData('text/plain'), d.dataset.def); });
    });
  }

  function unir(termId, defId) {
    if (!termId || !defId) return;
    for (const [t, d] of Object.entries(s.pares)) if (d === defId) delete s.pares[t]; // una definición, un término
    s.pares[termId] = defId; s.elegido = null; pintar();
  }

  async function responder(respuesta, boton) {
    if (s.respondida || s.enviando) return;
    s.enviando = true;
    const p = preguntas[s.i];
    let r;
    try { r = await api.post(`/estudiante/intentos/${intento.id}/respuestas`, { preguntaId: p.id, respuesta }); }
    catch (e) { s.enviando = false; toast(e.message, 'error'); if (e.status === 409) ctx.navegar(volverA); return; }
    s.enviando = false; s.respondida = true;
    s.vidas = r.vidas; s.combo = r.combo; s.marcas[s.i] = r.correcta;
    $$('.opcion, .btn-vf, .termino, .definicion', ctx.el).forEach((b) => { b.disabled = true; b.draggable = false; });
    ctx.el.querySelector('[data-comprobar]')?.setAttribute('disabled', '');

    let correctaTexto = '';
    if (p.tipo === 'seleccion') {
      const ok = p.opciones.find((o) => o.id === r.respuestaCorrecta.id);
      $(`.opcion[data-op="${r.respuestaCorrecta.id}"]`, ctx.el)?.classList.add('correcta');
      if (!r.correcta) boton?.classList.add('incorrecta');
      correctaTexto = ok.text;
    } else if (p.tipo === 'vf') {
      $(`.btn-vf[data-vf="${r.respuestaCorrecta.value}"]`, ctx.el).classList.add('correcta');
      if (!r.correcta) boton?.classList.add('incorrecta');
      correctaTexto = r.respuestaCorrecta.value ? 'Es verdadero' : 'Es falso';
    } else {
      for (const [t, d] of Object.entries(s.pares)) $(`.definicion[data-def="${d}"]`, ctx.el).classList.add(r.respuestaCorrecta.map[t] === d ? 'correcta' : 'incorrecta');
      correctaTexto = p.terminos.map((t) => `${t.text} = ${p.definiciones.find((d) => d.id === r.respuestaCorrecta.map[t.id]).text}`).join(' · ');
    }
    // Barra superior actualizada (vidas, combo, progreso)
    ctx.el.querySelector('.juego-barra').outerHTML = barra();

    const ultima = r.finalizado;
    const titulo = r.correcta ? `¡Correcto!${p.tipo === 'seleccion' ? ` ${correctaTexto}` : ''}`
      : p.tipo === 'relacionar' ? `${r.pares.bien} de ${r.pares.de} parejas correctas` : p.tipo === 'seleccion' ? `Casi. La respuesta es ${correctaTexto}` : `Casi. ${correctaTexto}`;
    $('#retro', ctx.el).innerHTML = `
      <div class="retro ${r.correcta ? 'bien' : 'mal'}" role="status">
        <span class="icono" aria-hidden="true">${r.correcta ? '✓' : '✕'}</span>
        <div><h3>${esc(titulo)}</h3><p>${esc(r.explicacion)}${!r.correcta && p.tipo === 'relacionar' ? `<br><b>Parejas correctas:</b> ${esc(correctaTexto)}` : ''}
          ${r.correcta && r.combo >= 2 ? ` Combo ×${r.combo}.` : ''}${!r.correcta ? `<br><b>Te quedan ${r.vidas} ${r.vidas === 1 ? 'vida' : 'vidas'}.</b>` : ''}</p></div>
        <button type="button" class="btn btn-dia" data-siguiente>${ultima ? 'Ver resultado' : 'Siguiente pregunta'} ${icono('flecha')}</button>
      </div>`;
    $('[data-siguiente]', ctx.el).focus();
    if (ultima) { s.terminado = true; s.resumen = r.resumen; s.estadoFinal = r.estado; }
  }

  function resultado() {
    const r = s.resumen;
    const m = r.mision;
    if (m?.completa) { toast(`¡Misión completa! ${m.insignia ? `Insignia: ${m.insignia.nombre}` : ''}`, 'ok'); return ctx.navegar('/estudiante/mision'); }
    const sinVidas = s.estadoFinal === 'sin_vidas';
    ctx.el.innerHTML = `
      <div class="juego">
        <section class="tarjeta resultado">
          ${sinVidas ? `<p class="etiqueta">Te quedaste sin vidas</p><h1 style="font-size:36px;margin:10px 0">Vuelve a intentarlo con calma</h1>
              <p class="texto-2">Respondiste ${s.marcas.length} de ${preguntas.length} preguntas. Este intento no suma XP, pero puedes repetirlo cuando quieras.</p>`
            : `<p class="etiqueta">${esc(actividad.titulo)}</p>
              <div class="cifra-xl" style="margin:12px 0">${r.porcentaje} %</div>
              <h2 style="font-size:26px">${esc(r.banda.etiqueta)} · ${esc(r.banda.mensaje)}</h2>
              <div class="premios" style="margin:18px 0"><span class="amarillo">+${r.xp} XP</span><span style="background:var(--fondo)">${r.aciertos} de ${r.total} aciertos</span><span style="background:var(--fondo)">Mejor combo ×${r.mejorCombo}</span></div>
              ${r.xp === 0 && r.porcentaje > 0 ? '<p class="ayuda">No sumaste XP nuevo porque ya habías ganado este XP con un resultado igual o mejor.</p>' : ''}
              ${actividad.proposito === 'autoevaluacion' && r.porcentaje < 80 ? '<div class="aviso aviso-ambar" style="text-align:left">La meta es 80 %. Repasa las lecciones del tema y vuelve a intentarlo: se guarda tu mejor resultado.</div>' : ''}
              ${actividad.proposito === 'autoevaluacion' && r.porcentaje >= 80 ? '<div class="aviso aviso-ok" style="text-align:left">¡Tema completado! Ya puedes continuar con el siguiente.</div>' : ''}`}
          <div class="fila" style="justify-content:center;margin-top:20px">
            <a class="btn btn-dia btn-grande" href="${volverA}">${actividad.proposito === 'mision' ? 'Volver a la misión' : 'Volver al tema'} ${icono('flecha')}</a>
            <button type="button" class="btn btn-borde btn-grande" data-reintentar>Intentar de nuevo</button>
          </div>
        </section>
      </div>`;
    $('[data-reintentar]', ctx.el).addEventListener('click', () => ctx.navegar(location.pathname, { reemplazar: true }));
  }

  ctx.el.addEventListener('click', (e) => {
    const t = e.target.closest('[data-term]');
    if (t && !t.disabled) { const id = t.dataset.term; if (s.pares[id]) { delete s.pares[id]; s.elegido = null; } else s.elegido = s.elegido === id ? null : id; return pintar(); }
    const d = e.target.closest('[data-def]');
    if (d && !d.disabled) { if (s.elegido) unir(s.elegido, d.dataset.def); else toast('Primero toca un término de la izquierda.'); return; }
    const op = e.target.closest('[data-op]'); if (op && !op.disabled) return responder(op.dataset.op, op);
    const vf = e.target.closest('[data-vf]'); if (vf && !vf.disabled) return responder(vf.dataset.vf === 'true', vf);
    if (e.target.closest('[data-comprobar]')) return responder({ ...s.pares });
    if (e.target.closest('[data-siguiente]')) {
      if (s.terminado) return resultado();
      s.i += 1; s.respondida = false; s.pares = {}; s.elegido = null; pintar();
    }
  });

  const teclas = (e) => {
    if (e.target.matches('input, textarea, select') || e.ctrlKey || e.metaKey || e.altKey) return;
    const p = preguntas[s.i]; if (!p || s.terminado && !$('[data-siguiente]', ctx.el)) return;
    if (s.respondida && e.key === 'Enter' && document.activeElement?.dataset.siguiente === undefined) { e.preventDefault(); $('[data-siguiente]', ctx.el)?.click(); return; }
    if (s.respondida) return;
    if (p.tipo === 'vf' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); $(`.btn-vf[data-vf="${e.key === 'ArrowRight'}"]`, ctx.el).click(); }
    if (p.tipo === 'seleccion') {
      const k = 'abcd1234'.indexOf(e.key.toLowerCase());
      if (k >= 0) { e.preventDefault(); $$('.opcion', ctx.el)[k % 4]?.click(); }
    }
  };
  document.addEventListener('keydown', teclas);
  ctx.alSalir(() => document.removeEventListener('keydown', teclas));

  try { pintar(); } catch (e) { ctx.el.innerHTML = avisoError(e); }
}
