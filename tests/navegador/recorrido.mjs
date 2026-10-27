// Recorrido automático en navegador (OPCIONAL). Requiere Playwright, que NO es una dependencia del proyecto:
//   npm install --no-save playwright   y luego   npx playwright install chromium
// Uso: con GeoIstmo encendido y la base recién creada (npm run seed + npm start):
//   node tests/navegador/recorrido.mjs            (BASE=http://localhost:3000 por defecto)
// Guarda capturas en tests/navegador/capturas/. Termina con código 1 si alguna comprobación falla.
import { createRequire } from 'node:module'; import fs from 'node:fs'; import path from 'node:path';
const require = createRequire(path.join(process.cwd(), 'package.json'));
const { chromium } = require('playwright');
const B = process.env.BASE || 'http://localhost:3000';
const S = path.join(process.cwd(), 'tests/navegador/capturas/'); fs.mkdirSync(S, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errores = [];
page.on('console', (m) => { if (m.type() === 'error' && !/40[0-3]/.test(m.text())) errores.push(m.text()); });
page.on('pageerror', (e) => errores.push('PAGEERROR ' + e.message));
page.on('dialog', (d) => d.accept());
const paso = async (n) => { await page.waitForTimeout(350); await page.screenshot({ path: S + n + '.png' }); };
const ok = (c, m) => { if (!c) { errores.push('FALLO: ' + m); console.log('FALLO', m); } else console.log('ok -', m); };

await page.goto(B + '/ingreso');
await page.click('[data-rellenar]'); await page.click('button[type=submit]'); await page.waitForSelector('.mision');
await paso('11-inicio-arreglado');
// Reto 1: relaciona conceptos (primera pregunta bien, segunda con las parejas rotadas = error)
await page.goto(B + '/estudiante/mision'); await page.waitForSelector('.retos');
await page.click('.reto >> nth=0 >> a'); await page.waitForSelector('.termino'); await paso('06-relaciona');
for (let k = 0; k < 2; k++) {
  const terms = await page.$$eval('.termino', (b) => b.map((x) => x.dataset.term));
  for (let i = 0; i < terms.length; i++) { await page.click(`[data-term="${terms[i]}"]`); await page.click(`[data-def="d${k === 0 ? i + 1 : ((i + 1) % 4) + 1}"]`); }
  await page.click('[data-comprobar]'); await page.waitForSelector('.retro'); await paso(k === 0 ? '08-relaciona-acierto' : '09-relaciona-error');
  ok((await page.textContent('.retro')).includes(k === 0 ? '¡Correcto!' : '0 de 4 parejas'), k === 0 ? 'relacionar: acierto' : 'relacionar: error con parejas correctas');
  await page.click('[data-siguiente]');
}
await page.waitForSelector('.resultado'); ok((await page.textContent('.resultado')).includes('50 %'), 'relacionar: 1 de 2 = 50 %');
// Reto 2: capitales (primera respuesta incorrecta a propósito, resto correctas buscando el texto)
const capitales = { 'Chiriquí': 'David', 'Veraguas': 'Santiago', 'Herrera': 'Chitré', 'Los Santos': 'Las Tablas', 'Coclé': 'Penonomé' };
await page.goto(B + '/estudiante/mision'); await page.waitForSelector('.retos');
await page.click('.reto >> nth=1 >> a'); await page.waitForSelector('.opcion');
let primera = true;
for (let k = 0; k < 5; k++) {
  const enun = await page.textContent('.enunciado');
  const prov = Object.keys(capitales).find((p) => enun.includes(p));
  if (primera) { await page.click(`.opcion:not(:has-text("${capitales[prov]}")) >> nth=0`); primera = false; await page.waitForSelector('.retro'); await paso('12-capital-error'); }
  else { await page.click(`.opcion:has-text("${capitales[prov]}")`); await page.waitForSelector('.retro'); if (k === 1) await paso('13-capital-acierto'); }
  await page.click('[data-siguiente]');
}
await page.waitForSelector('.resultado'); await paso('14-capital-resultado');
ok((await page.textContent('.resultado')).includes('80 %'), 'capitales: 4 de 5 = 80 %');
// Reto 3: V o F con teclado
await page.goto(B + '/estudiante/mision'); await page.waitForSelector('.retos');
await page.click('.reto >> nth=2 >> a'); await page.waitForSelector('.btn-vf');
await paso('15-vf');
const verdad = { 'Canal de Panamá conecta': true, 'Santiago es la capital de la provincia de Chiriquí': false, 'densidad de población se calcula': true, 'natalidad mide cuántas personas mueren': false, 'provincias y comarcas': true, 'objeto fabricado': false };
for (let k = 0; k < 6; k++) {
  const t = await page.textContent('.afirmacion');
  const v = Object.entries(verdad).find(([f]) => t.includes(f))[1];
  await page.keyboard.press(v ? 'ArrowRight' : 'ArrowLeft'); await page.waitForSelector('.retro');
  if (k === 0) await paso('16-vf-acierto');
  await page.keyboard.press('Enter'); await page.waitForTimeout(150);
}
await page.waitForSelector('.celebracion'); await paso('17-mision-completa');
ok((await page.textContent('.celebracion')).includes('Volcán Barú'), 'insignia Volcán Barú desbloqueada');
ok((await page.textContent('.celebracion')).includes('Racha de 5'), 'racha pasa de 4 a 5');
await page.click('a[href="/estudiante"].btn'); await page.waitForSelector('.mision'); await paso('18-inicio-despues');
ok((await page.textContent('.mision')).includes('3/3'), 'inicio muestra 3/3');
// Módulos y tema
await page.click('nav a[href="/estudiante/modulos"]'); await page.waitForSelector('.ruta'); await paso('19-modulos');
await page.click('.modulo.bloqueado >> nth=0'); await page.waitForSelector('.toast'); 
await page.click('a.modulo.en_curso'); await page.waitForSelector('.temas'); await paso('20-temas');
await page.click('a.tema.disponible'); await page.waitForSelector('.leccion'); await paso('21-leccion');
await page.click('[data-leer]'); await page.waitForSelector('.leccion h2:has-text("Autoevaluación")'); await paso('22-autoevaluacion');
await page.click('a:has-text("Empezar autoevaluación")'); await page.waitForSelector('.opcion, .btn-vf');
// responder todo intentando: elegimos la primera opción (puede fallar) solo para probar el flujo
for (let k = 0; k < 4; k++) {
  if (await page.$('.btn-vf')) await page.click('.btn-vf.verdadero'); else await page.click('.opcion >> nth=0');
  await page.waitForSelector('.retro'); await page.click('[data-siguiente]'); await page.waitForTimeout(150);
  if (await page.$('.resultado')) break;
}
await page.waitForSelector('.resultado'); await paso('23-auto-resultado');
await page.click('nav a[href="/estudiante/notas"]'); await page.waitForSelector('table'); await paso('24-notas');
await page.click('nav a[href="/estudiante/insignias"]'); await page.waitForSelector('.album'); await paso('25-insignias');
// Seguridad desde la interfaz: intentar entrar a rutas de otros roles
await page.goto(B + '/admin/usuarios'); await page.waitForSelector('.mision'); ok(page.url().endsWith('/estudiante'), 'estudiante en /admin/usuarios es devuelto a su inicio');
const r = await page.evaluate(async () => (await fetch('/api/admin/usuarios')).status); ok(r === 403, 'API admin responde 403 al estudiante');
// Cerrar sesión
await page.click('[data-accion="salir"]'); await page.waitForSelector('#f-ingreso'); ok(page.url().endsWith('/ingreso'), 'cerrar sesión vuelve al ingreso del estudiante');
await page.goto(B + '/estudiante/notas'); await page.waitForSelector('#f-ingreso'); ok(page.url().endsWith('/ingreso'), 'ruta privada sin sesión redirige al ingreso');
// Registro
await page.goto(B + '/registro'); await page.click('button[type=submit]'); await page.waitForSelector('.error-campo'); await paso('26-registro-validacion');
await page.fill('[name=nombre]', 'Estudiante Prueba'); await page.fill('[name=email]', `prueba${Date.now()}@geoistmo.test`); await page.fill('[name=clave]', 'Clave2026x'); await page.fill('[name=codigo]', 'G3O-12A-2026');
await page.click('button[type=submit]'); await page.waitForSelector('.aviso-ok'); await paso('27-registro-ok');

// ---------------------------------------------------------------- Docente y administrador
await page.context().clearCookies();

// ---------- Docente
await page.goto(B + '/ingreso/docente'); await page.click('[data-rellenar]'); await page.click('button[type=submit]');
await page.waitForSelector('table'); await paso('30-panel-docente');
ok((await page.textContent('.principal')).includes('Sergio Alvarado'), 'panel docente lista estudiantes de 12.º A');
ok(!(await page.textContent('.principal')).includes('Laura Vega'), 'panel docente NO lista estudiantes de otra sección');
await page.click('nav a[href="/docente/modulos"]'); await page.waitForSelector('.control-modulo'); await paso('31-modulos-docente');
await page.click('[data-mod]:nth-child(3) [data-estado="abierto"]'); await page.waitForSelector('.control-modulo.abierto:nth-child(3)');
ok(true, 'docente abre el Módulo 3');
await page.click('[data-mod]:nth-child(4) [data-estado="programado"]'); await page.waitForSelector('#dlg-programar[open]'); await paso('32-programar');
await page.click('#dlg-programar button[value=ok]'); await page.waitForSelector('.control-modulo.programado');
ok(true, 'docente programa el Módulo 4');
await page.click('nav a[href="/docente/resultados"]'); await page.waitForSelector('table'); await paso('33-resultados-docente');
await page.goto(B + '/estudiante'); await page.waitForSelector('table'); ok(page.url().endsWith('/docente'), 'docente en /estudiante vuelve a su panel');
await page.click('[data-accion="salir"]'); await page.waitForSelector('#f-ingreso'); ok(page.url().endsWith('/ingreso/docente'), 'cerrar sesión del docente vuelve a su ingreso (C3)');

// El estudiante ve el Módulo 3 abierto (en preparación) y el 4 programado
await page.goto(B + '/ingreso'); await page.click('[data-rellenar]'); await page.click('button[type=submit]'); await page.waitForSelector('.mision');
await page.goto(B + '/estudiante/modulos'); await page.waitForSelector('.ruta'); await paso('34-modulos-tras-docente');
const txt = await page.textContent('.ruta');
ok(txt.includes('Se abre el'), 'estudiante ve la fecha del módulo programado');
await page.click('a.modulo:has-text("Organización política")'); await page.waitForSelector('.temas'); await paso('35-modulo3-preparacion');
ok((await page.textContent('.temas')).includes('En preparación'), 'Módulo 3 muestra temas «En preparación»');
await page.click('[data-accion="salir"]'); await page.waitForSelector('#f-ingreso');

// ---------- Administrador
await page.goto(B + '/ingreso/admin'); await page.click('[data-rellenar]'); await page.click('button[type=submit]');
await page.waitForSelector('.r-4'); await paso('40-admin-resumen');
ok((await page.textContent('.principal')).includes('Módulo abierto'), 'la actividad reciente registra la acción del docente');
await page.click('nav a[href="/admin/usuarios"]'); await page.waitForSelector('table'); await paso('41-admin-usuarios');
await page.click('[data-nuevo]'); await page.waitForSelector('dialog[open]');
await page.click('dialog [type=submit]'); await page.waitForSelector('dialog .error-campo'); await paso('42-admin-crear-validacion');
await page.fill('dialog [name=nombre]', 'Docente Demo Nuevo'); await page.fill('dialog [name=email]', 'nuevo@geoistmo.test');
await page.selectOption('dialog [name=rol]', 'docente'); await page.fill('dialog [name=clave]', 'Clave2026x');
await page.click('dialog [type=submit]'); await page.waitForSelector('dialog', { state: 'detached' });
ok((await page.textContent('table')).includes('nuevo@geoistmo.test'), 'administrador crea un docente');
await page.click('[data-rol="docente"]'); await page.waitForTimeout(300); ok((await page.$$('tbody tr')).length === 3, 'filtro por rol docente');
await page.fill('[data-buscar]', 'marta'); await page.click('[data-rol=""]'); await page.waitForTimeout(500);
ok((await page.$$('tbody tr')).length === 1, 'búsqueda por nombre');
await page.click('[data-clave]'); await page.click('dialog [type=submit]'); await page.waitForSelector('.clave-temporal'); await paso('43-admin-clave');
await page.click('[data-cerrar2]');
await page.click('nav a[href="/admin/secciones"]'); await page.waitForSelector('table'); await paso('44-admin-secciones');
await page.click('nav a[href="/admin/catalogo"]'); await page.waitForSelector('.catalogo');
await page.click('details[data-mod] >> nth=1 >> summary'); await paso('45-admin-catalogo');
await page.click('details[open] [data-preguntas] >> nth=0'); await page.waitForSelector('dialog[open] .pregunta-admin'); await paso('46-admin-preguntas');
await page.click('dialog[open] [data-nueva-q="seleccion"]'); await page.waitForSelector('dialog[open] [data-op]');
await page.fill('dialog[open] [name=enunciado]', '¿Qué mide la densidad de población?');
await page.fill('dialog[open] [data-op="0"]', 'Habitantes por km²'); await page.fill('dialog[open] [data-op="1"]', 'Nacimientos por año');
await page.fill('dialog[open] [data-op="2"]', 'Muertes por año'); await page.fill('dialog[open] [data-op="3"]', 'Edad promedio');
await page.click('dialog[open] [type=submit]'); await page.waitForSelector('dialog[open] .error-campo'); await paso('47-pregunta-validacion');
await page.check('dialog[open] [name=correcta][value="0"]'); await page.click('dialog[open] [type=submit]');
await page.waitForSelector('dialog[open] .pregunta-admin:has-text("densidad de población")');
ok(true, 'administrador agrega una pregunta al banco');

const fallos = errores.filter((e) => e.startsWith('FALLO') || e.startsWith('PAGEERROR'));
console.log(fallos.length ? `\n${fallos.length} problema(s):\n${fallos.join('\n')}` : '\nRecorrido completo sin fallos.');
await browser.close();
process.exit(fallos.length ? 1 : 0);
