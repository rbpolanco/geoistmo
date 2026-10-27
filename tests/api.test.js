// Pruebas funcionales de la API de GeoIstmo (node:test, sin dependencias extra).
// Cada prueba usa una base SQLite NUEVA en memoria con los datos de demostración.
import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

process.env.BCRYPT_ROUNDS = '4';
const { abrirDb } = await import('../server/db/connection.js');
const { sembrar } = await import('../server/db/seed.js');
const { crearApp } = await import('../server/app.js');
const { limiteLogin } = await import('../server/middleware/seguridad.js');

let db, servidor, base;
const CLAVE = { admin: 'Admin2026!', docente: 'Docente2026!', est: 'Estudiante2026!' };

function cliente() {
  let cookie = '';
  const llamar = async (metodo, ruta, cuerpo, extra = {}) => {
    const r = await fetch(base + ruta, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', ...(extra.sinCsrf ? {} : { 'X-GeoIstmo': '1' }), ...(cookie ? { Cookie: cookie } : {}) },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
    const sc = r.headers.get('set-cookie');
    if (sc) cookie = /Expires=Thu, 01 Jan 1970/.test(sc) || sc.startsWith('geoistmo_sid=;') ? '' : sc.split(';')[0];
    let json = null; try { json = await r.json(); } catch { /* sin cuerpo */ }
    return { status: r.status, json };
  };
  return {
    get: (r) => llamar('GET', r), post: (r, b = {}) => llamar('POST', r, b), put: (r, b = {}) => llamar('PUT', r, b),
    patch: (r, b = {}) => llamar('PATCH', r, b), delete: (r) => llamar('DELETE', r), raw: llamar,
    login: (email, clave, rol) => llamar('POST', '/api/auth/login', { email, clave, rol }),
  };
}
const como = async (email, clave, rol) => { const c = cliente(); const r = await c.login(email, clave, rol); assert.equal(r.status, 200, `login ${email}`); return c; };
const estudiante = (email = 'sergio@geoistmo.test') => como(email, CLAVE.est, 'estudiante');
const docente = (email = 'docente@geoistmo.test') => como(email, CLAVE.docente, 'docente');
const admin = () => como('admin@geoistmo.test', CLAVE.admin, 'administrador');

const idDe = (sql, ...p) => db.prepare(sql).get(...p).id;
const quiz = (mn, tp) => idDe("SELECT a.id FROM activities a JOIN topics t ON t.id=a.topic_id JOIN modules m ON m.id=t.module_id WHERE m.number=? AND t.position=? AND a.purpose='autoevaluacion'", mn, tp);
const tema = (mn, tp) => idDe('SELECT t.id FROM topics t JOIN modules m ON m.id=t.module_id WHERE m.number=? AND t.position=?', mn, tp);
const mision = (slot) => idDe('SELECT id FROM activities WHERE mission_slot=?', slot);
const secA = () => idDe("SELECT id FROM sections WHERE name='12.º A'");

// Responde una actividad completa; la respuesta correcta se lee de la BD de pruebas.
async function resolver(c, actId, { fallos = 0 } = {}) {
  const ini = await c.post(`/api/estudiante/actividades/${actId}/intentos`);
  assert.equal(ini.status, 201, JSON.stringify(ini.json));
  let ultimo, f = fallos;
  for (const p of ini.json.preguntas) {
    const ans = JSON.parse(db.prepare('SELECT answer_json j FROM questions WHERE id=?').get(p.id).j);
    const tipo = p.tipo;
    let resp = tipo === 'seleccion' ? ans.id : tipo === 'vf' ? ans.value : ans.map;
    if (f > 0) {
      f--;
      resp = tipo === 'seleccion' ? ['a', 'b', 'c', 'd'].find((x) => x !== ans.id)
        : tipo === 'vf' ? !ans.value
          : Object.fromEntries(Object.keys(ans.map).map((k, i, a) => [k, ans.map[a[(i + 1) % a.length]]]));
    }
    ultimo = await c.post(`/api/estudiante/intentos/${ini.json.intento.id}/respuestas`, { preguntaId: p.id, respuesta: resp });
    assert.equal(ultimo.status, 200, JSON.stringify(ultimo.json));
    if (ultimo.json.finalizado) break;
  }
  return { ini: ini.json, fin: ultimo.json };
}

beforeEach(() => {
  limiteLogin.reiniciar();
  servidor?.close(); db?.close();
  db = abrirDb(':memory:'); sembrar(db);
  servidor = crearApp(db).listen(0); base = `http://127.0.0.1:${servidor.address().port}`;
});
after(() => { servidor?.close(); db?.close(); });

// ================================================================ Autenticación
test('A01 · login correcto de los tres roles con cookie HttpOnly y SameSite', async () => {
  for (const [e, c, r] of [['sergio@geoistmo.test', CLAVE.est, 'estudiante'], ['docente@geoistmo.test', CLAVE.docente, 'docente'], ['admin@geoistmo.test', CLAVE.admin, 'administrador']]) {
    const raw = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-GeoIstmo': '1' }, body: JSON.stringify({ email: e, clave: c, rol: r }) });
    assert.equal(raw.status, 200);
    assert.match(raw.headers.get('set-cookie'), /HttpOnly/); assert.match(raw.headers.get('set-cookie'), /SameSite=Lax/);
    assert.equal((await raw.json()).usuario.rol, r);
  }
});

test('A02 · login rechaza clave errónea, rol equivocado y cuenta inexistente con el mismo mensaje', async () => {
  const c = cliente();
  const a = await c.login('sergio@geoistmo.test', 'Incorrecta1', 'estudiante');
  const b = await c.login('sergio@geoistmo.test', CLAVE.est, 'docente');
  const d = await c.login('nadie@geoistmo.test', CLAVE.est, 'estudiante');
  for (const r of [a, b, d]) assert.equal(r.status, 401);
  assert.equal(a.json.error, b.json.error); assert.equal(a.json.error, d.json.error);
});

test('A03 · login valida campos vacíos y bloquea tras 5 intentos fallidos', async () => {
  const c = cliente();
  const vacio = await c.login('', '', 'estudiante');
  assert.equal(vacio.status, 400); assert.ok(vacio.json.campos.email && vacio.json.campos.clave);
  assert.equal((await c.login('sergio@geoistmo.test', 'x', 'superusuario')).status, 400);
  for (let i = 0; i < 5; i++) await c.login('ana@geoistmo.test', 'mala' + i, 'estudiante');
  assert.equal((await c.login('ana@geoistmo.test', CLAVE.est, 'estudiante')).status, 429);
});

test('A04 · las contraseñas se guardan con hash bcrypt, nunca en texto plano', () => {
  for (const u of db.prepare('SELECT password_hash h FROM users').all()) { assert.match(u.h, /^\$2[aby]\$/); assert.ok(!Object.values(CLAVE).includes(u.h)); }
});

test('A05 · registro de estudiante con código de sección y luego inicio de sesión', async () => {
  const c = cliente();
  const r = await c.post('/api/auth/registro', { nombre: 'Nueva Estudiante', email: 'Nueva@Geoistmo.test', clave: 'Clave2026x', codigo: 'g3o-12a-2026' });
  assert.equal(r.status, 201);
  assert.equal((await c.login('nueva@geoistmo.test', 'Clave2026x', 'estudiante')).status, 200);
  const u = db.prepare("SELECT role, section_id FROM users WHERE email='nueva@geoistmo.test'").get();
  assert.equal(u.role, 'estudiante'); assert.equal(u.section_id, secA());
});

test('A06 · registro rechaza datos inválidos, código inexistente y correo repetido', async () => {
  const c = cliente();
  const mal = await c.post('/api/auth/registro', { nombre: 'A', email: 'no-es-correo', clave: '123', codigo: '' });
  assert.equal(mal.status, 400); assert.ok(mal.json.campos.nombre && mal.json.campos.email && mal.json.campos.clave && mal.json.campos.codigo);
  assert.ok((await c.post('/api/auth/registro', { nombre: 'Prueba Uno', email: 'p1@geoistmo.test', clave: 'Clave2026x', codigo: 'NOEXISTE' })).json.campos.codigo);
  assert.equal((await c.post('/api/auth/registro', { nombre: 'Prueba Uno', email: 'sergio@geoistmo.test', clave: 'Clave2026x', codigo: 'G3O-12A-2026' })).status, 409);
});

test('A07 · el registro público no permite crear docentes ni administradores', async () => {
  await cliente().post('/api/auth/registro', { nombre: 'Intruso Rol', email: 'intruso@geoistmo.test', clave: 'Clave2026x', codigo: 'G3O-12A-2026', rol: 'administrador' });
  assert.equal(db.prepare("SELECT role FROM users WHERE email='intruso@geoistmo.test'").get().role, 'estudiante');
});

test('A08 · cerrar sesión invalida la sesión y las rutas privadas responden 401', async () => {
  const c = await estudiante();
  assert.equal((await c.get('/api/estudiante/inicio')).status, 200);
  assert.equal((await c.post('/api/auth/logout')).json.rol, 'estudiante');
  assert.equal((await c.get('/api/estudiante/inicio')).status, 401);
  assert.equal((await c.get('/api/auth/me')).status, 401);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM sessions').get().n, 0);
});

test('A09 · una cuenta suspendida pierde la sesión y no puede volver a entrar', async () => {
  const a = await admin(); const s = await estudiante('ana@geoistmo.test');
  const id = idDe("SELECT id FROM users WHERE email='ana@geoistmo.test'");
  assert.equal((await a.patch(`/api/admin/usuarios/${id}`, { activo: false })).status, 200);
  assert.equal((await s.get('/api/estudiante/inicio')).status, 401);
  assert.equal((await cliente().login('ana@geoistmo.test', CLAVE.est, 'estudiante')).status, 401);
});

test('A10 · peticiones que modifican datos sin la cabecera anti-CSRF se rechazan', async () => {
  const r = await cliente().raw('POST', '/api/auth/login', { email: 'sergio@geoistmo.test', clave: CLAVE.est, rol: 'estudiante' }, { sinCsrf: true });
  assert.equal(r.status, 403);
});

// ================================================================ Permisos (validados en el servidor)
test('P01 · cada rol solo entra a su grupo de rutas (403) y sin sesión se recibe 401', async () => {
  const e = await estudiante(), d = await docente(), a = await admin(), anon = cliente();
  for (const ruta of ['/api/estudiante/inicio', '/api/docente/secciones', '/api/admin/resumen']) assert.equal((await anon.get(ruta)).status, 401, ruta);
  assert.equal((await e.get('/api/docente/secciones')).status, 403);
  assert.equal((await e.get('/api/admin/usuarios')).status, 403);
  assert.equal((await e.post('/api/admin/usuarios', { nombre: 'X X X', email: 'x@x.co', rol: 'administrador', clave: 'Clave2026x' })).status, 403);
  assert.equal((await d.get('/api/estudiante/inicio')).status, 403);
  assert.equal((await d.get('/api/admin/resumen')).status, 403);
  assert.equal((await a.get('/api/estudiante/inicio')).status, 403);
  assert.equal((await a.get('/api/docente/secciones')).status, 403);
});

test('P02 · un docente no puede ver ni modificar la sección de otro docente', async () => {
  const d2 = await docente('docente2@geoistmo.test');
  const m3 = idDe('SELECT id FROM modules WHERE number=3');
  assert.equal((await d2.get(`/api/docente/secciones/${secA()}/panel`)).status, 403);
  assert.equal((await d2.get(`/api/docente/secciones/${secA()}/resultados`)).status, 403);
  assert.equal((await d2.put(`/api/docente/secciones/${secA()}/modulos/${m3}`, { estado: 'abierto' })).status, 403);
  assert.equal(db.prepare('SELECT status FROM section_modules WHERE section_id=? AND module_id=?').get(secA(), m3).status, 'cerrado');
  assert.equal((await d2.get('/api/docente/secciones/999/panel')).status, 404);
});

// ================================================================ Motor de contenidos
test('C01 · módulos completados, en curso y bloqueados según progreso y docente', async () => {
  const c = await estudiante();
  const { modulos, abiertos, total } = (await c.get('/api/estudiante/modulos')).json;
  assert.equal(total, 7); assert.equal(abiertos, 2);
  assert.equal(modulos[0].estado, 'completado'); assert.equal(modulos[1].estado, 'en_curso'); assert.equal(modulos[1].temasCompletados, 2);
  assert.equal(modulos[2].estado, 'bloqueado');
  const m2 = (await c.get(`/api/estudiante/modulos/${modulos[1].id}`)).json;
  assert.deepEqual(m2.temas.map((t) => t.estado), ['completado', 'completado', 'disponible', 'bloqueado']);
  const m3 = (await c.get(`/api/estudiante/modulos/${modulos[2].id}`)).json;
  assert.equal(m3.abierto, false); assert.ok(m3.temas.every((t) => t.estado === 'bloqueado'));
});

test('C02 · un tema de módulo cerrado o fuera de secuencia se rechaza en el servidor', async () => {
  const c = await estudiante('carlos@geoistmo.test');
  assert.equal((await c.get(`/api/estudiante/temas/${tema(3, 1)}`)).status, 403);
  assert.equal((await c.get(`/api/estudiante/temas/${tema(1, 2)}`)).status, 403);
  assert.equal((await c.get(`/api/estudiante/temas/${tema(1, 1)}`)).status, 200);
  assert.equal((await c.get('/api/estudiante/temas/abc')).status, 400);
  assert.equal((await c.get('/api/estudiante/temas/99999')).status, 404);
});

test('C03 · temas sin contenido aparecen «en preparación» y no se pueden abrir', async () => {
  const d = await docente(); const m3 = idDe('SELECT id FROM modules WHERE number=3');
  assert.equal((await d.put(`/api/docente/secciones/${secA()}/modulos/${m3}`, { estado: 'abierto' })).status, 200);
  const c = await estudiante();
  const mod = (await c.get(`/api/estudiante/modulos/${m3}`)).json;
  assert.equal(mod.temas[0].estado, 'en_preparacion');
  assert.equal((await c.get(`/api/estudiante/temas/${mod.temas[0].id}`)).status, 409);
});

test('C04 · el detalle del tema entrega lecciones sin filtrar respuestas', async () => {
  const c = await estudiante();
  const r = await c.get(`/api/estudiante/temas/${tema(2, 3)}`);
  assert.equal(r.status, 200); assert.ok(r.json.lecciones.length >= 1); assert.equal(r.json.autoevaluacion.disponible, false);
  assert.ok(!JSON.stringify(r.json).includes('answer'));
});

// ================================================================ Actividades
test('T01 · iniciar una actividad no revela la respuesta correcta', async () => {
  const c = await estudiante();
  const r = await c.post(`/api/estudiante/actividades/${mision(2)}/intentos`);
  const texto = JSON.stringify(r.json);
  assert.equal(r.status, 201); assert.equal(r.json.preguntas.length, 5);
  for (const prop of ['answer', 'correcta', 'respuestaCorrecta', 'explicacion']) assert.ok(!texto.includes(prop), `filtra ${prop}`);
});

test('T02 · acierto y error: retroalimentación, vidas, combo y una respuesta por pregunta', async () => {
  const c = await estudiante();
  const ini = (await c.post(`/api/estudiante/actividades/${mision(2)}/intentos`)).json;
  const url = `/api/estudiante/intentos/${ini.intento.id}/respuestas`;
  const [p1, p2] = ini.preguntas;
  const a1 = JSON.parse(db.prepare('SELECT answer_json j FROM questions WHERE id=?').get(p1.id).j);
  const ok = await c.post(url, { preguntaId: p1.id, respuesta: a1.id });
  assert.equal(ok.json.correcta, true); assert.equal(ok.json.combo, 1); assert.equal(ok.json.vidas, 3); assert.ok(ok.json.explicacion);
  assert.equal((await c.post(url, { preguntaId: p1.id, respuesta: a1.id })).status, 409);
  const a2 = JSON.parse(db.prepare('SELECT answer_json j FROM questions WHERE id=?').get(p2.id).j);
  const mal = await c.post(url, { preguntaId: p2.id, respuesta: ['a', 'b', 'c', 'd'].find((x) => x !== a2.id) });
  assert.equal(mal.json.correcta, false); assert.equal(mal.json.vidas, 2); assert.equal(mal.json.combo, 0); assert.deepEqual(mal.json.respuestaCorrecta, a2);
  assert.equal((await c.post(url, { preguntaId: p2.id + 1000, respuesta: 'a' })).status, 400);
});

test('T03 · respuestas con formato inválido se rechazan', async () => {
  const c = await estudiante();
  const ini = (await c.post(`/api/estudiante/actividades/${mision(3)}/intentos`)).json;
  const url = `/api/estudiante/intentos/${ini.intento.id}/respuestas`;
  assert.equal((await c.post(url, { preguntaId: ini.preguntas[0].id, respuesta: 'verdadero' })).status, 400);
  assert.equal((await c.post(url, { preguntaId: ini.preguntas[0].id })).status, 400);
  const rel = (await c.post(`/api/estudiante/actividades/${mision(1)}/intentos`)).json;
  const urlRel = `/api/estudiante/intentos/${rel.intento.id}/respuestas`;
  assert.equal((await c.post(urlRel, { preguntaId: rel.preguntas[0].id, respuesta: { t1: 'd1' } })).status, 400);
  assert.equal((await c.post(urlRel, { preguntaId: rel.preguntas[0].id, respuesta: { t1: 'd1', t2: 'd1', t3: 'd3', t4: 'd4' } })).status, 400);
});

test('T04 · «Relaciona conceptos» califica por pares con puntaje parcial', async () => {
  const c = await estudiante();
  const ini = (await c.post(`/api/estudiante/actividades/${mision(1)}/intentos`)).json;
  const r = await c.post(`/api/estudiante/intentos/${ini.intento.id}/respuestas`, { preguntaId: ini.preguntas[0].id, respuesta: { t1: 'd2', t2: 'd1', t3: 'd3', t4: 'd4' } });
  assert.equal(r.json.correcta, false); assert.equal(r.json.pares.bien, 2); assert.equal(r.json.puntaje, 0.5); assert.equal(r.json.vidas, 2);
});

test('T05 · perder las tres vidas termina el intento sin dar XP', async () => {
  const c = await estudiante('ana@geoistmo.test');
  const xp = () => db.prepare("SELECT COALESCE(SUM(amount),0) s FROM xp_ledger WHERE user_id=(SELECT id FROM users WHERE email='ana@geoistmo.test')").get().s;
  const antes = xp();
  const { fin } = await resolver(c, mision(2), { fallos: 3 });
  assert.equal(fin.estado, 'sin_vidas'); assert.equal(fin.resumen.xp, 0); assert.equal(xp(), antes);
  assert.equal((await c.get('/api/estudiante/mision')).json.completos, 0);
});

test('T06 · un intento ajeno no se puede responder', async () => {
  const c1 = await estudiante(); const c2 = await estudiante('ana@geoistmo.test');
  const ini = (await c1.post(`/api/estudiante/actividades/${mision(3)}/intentos`)).json;
  assert.equal((await c2.post(`/api/estudiante/intentos/${ini.intento.id}/respuestas`, { preguntaId: ini.preguntas[0].id, respuesta: true })).status, 404);
});

test('T07 · misión del día: XP, bono, racha 4→5, insignia Volcán Barú y sin pagar dos veces', async () => {
  const c = await estudiante();
  const antes = (await c.get('/api/estudiante/inicio')).json;
  assert.equal(antes.racha, 4); assert.equal(antes.mision.completos, 0); assert.equal(antes.mision.xpEnJuego, 45);
  let ultimo;
  for (const slot of [1, 2, 3]) ultimo = (await resolver(c, mision(slot))).fin;
  assert.equal(ultimo.estado, 'completado'); assert.equal(ultimo.resumen.mision.completa, true);
  assert.equal(ultimo.resumen.mision.racha, 5); assert.equal(ultimo.resumen.mision.insignia.nombre, 'Volcán Barú'); assert.equal(ultimo.resumen.mision.bono, 15);
  const despues = (await c.get('/api/estudiante/inicio')).json;
  assert.equal(despues.mision.completa, true); assert.equal(despues.racha, 5); assert.equal(despues.xp - antes.xp, 45);
  assert.equal(despues.album.filter((b) => b.ganada).length, 5);
  for (const slot of [1, 2, 3]) await resolver(c, mision(slot));
  const otra = (await c.get('/api/estudiante/inicio')).json;
  assert.equal(otra.xp, despues.xp); assert.equal(otra.racha, 5);
});

test('T08 · la autoevaluación exige leer las lecciones; al aprobar se completa el tema y se abre el siguiente', async () => {
  const c = await estudiante('carlos@geoistmo.test');
  assert.equal((await c.post(`/api/estudiante/actividades/${quiz(1, 1)}/intentos`)).status, 409);
  for (const l of (await c.get(`/api/estudiante/temas/${tema(1, 1)}`)).json.lecciones) assert.equal((await c.post(`/api/estudiante/lecciones/${l.id}/leida`)).status, 200);
  const { fin } = await resolver(c, quiz(1, 1));
  assert.equal(fin.resumen.porcentaje, 100); assert.equal(fin.resumen.banda.clave, 'dominado');
  const m1 = (await c.get('/api/estudiante/modulos')).json.modulos[0];
  const temas = (await c.get(`/api/estudiante/modulos/${m1.id}`)).json.temas;
  assert.equal(temas[0].estado, 'completado'); assert.equal(temas[1].estado, 'disponible');
  const notas = (await c.get('/api/estudiante/notas')).json;
  assert.equal(notas.promedio, 100); assert.equal(notas.actividades.length, 1);
});

test('T09 · un resultado bajo la meta no completa el tema y se guarda el mejor intento', async () => {
  const c = await estudiante('carlos@geoistmo.test');
  for (const l of (await c.get(`/api/estudiante/temas/${tema(1, 1)}`)).json.lecciones) await c.post(`/api/estudiante/lecciones/${l.id}/leida`);
  const { fin } = await resolver(c, quiz(1, 1), { fallos: 2 });
  assert.equal(fin.resumen.porcentaje, 50); assert.equal(fin.resumen.banda.clave, 'reforzar');
  assert.equal((await c.get(`/api/estudiante/temas/${tema(1, 1)}`)).json.estado, 'en_curso');
  await resolver(c, quiz(1, 1));
  const n = (await c.get('/api/estudiante/notas')).json.actividades[0];
  assert.equal(n.mejor, 100); assert.equal(n.intentos, 2);
});

// ================================================================ Docente
test('D01 · el panel del docente refleja la actividad real de su sección', async () => {
  const d = await docente(); const sec = (await d.get('/api/docente/secciones')).json.secciones[0];
  assert.equal(sec.estudiantes, 6);
  const p = (await d.get(`/api/docente/secciones/${sec.id}/panel`)).json;
  assert.equal(p.totalEstudiantes, 6); assert.equal(p.porcentajeHoy, 0);
  assert.ok(p.paraReforzar.some((x) => x.nombre.startsWith('Carlos')));
  await resolver(await estudiante(), mision(3));
  const p2 = (await d.get(`/api/docente/secciones/${sec.id}/panel`)).json;
  assert.equal(p2.porcentajeHoy, 17); assert.equal(p2.estudiantes.find((x) => x.nombre.startsWith('Sergio')).estado, 'En curso');
});

test('D02 · el docente abre, cierra y programa módulos y el estudiante lo ve reflejado', async () => {
  const d = await docente(); const e = await estudiante();
  const m3 = (await d.get(`/api/docente/secciones/${secA()}/modulos`)).json.modulos[2];
  assert.equal(m3.estado, 'cerrado');
  const url = `/api/docente/secciones/${secA()}/modulos/${m3.id}`;
  assert.equal((await d.put(url, { estado: 'abierto' })).status, 200);
  assert.equal((await e.get('/api/estudiante/modulos')).json.modulos[2].estado, 'abierto');
  assert.equal((await d.put(url, { estado: 'cerrado' })).status, 200);
  assert.equal((await e.get('/api/estudiante/modulos')).json.modulos[2].estado, 'bloqueado');
  assert.equal((await d.put(url, { estado: 'programado', abreEn: '2020-01-01T00:00' })).status, 400);
  assert.equal((await d.put(url, { estado: 'secreto' })).status, 400);
  const futuro = new Date(Date.now() + 86_400_000).toISOString();
  assert.equal((await d.put(url, { estado: 'programado', abreEn: futuro })).status, 200);
  const prog = (await e.get('/api/estudiante/modulos')).json.modulos[2];
  assert.equal(prog.estado, 'bloqueado'); assert.equal(prog.programado, futuro);
  db.prepare("UPDATE section_modules SET opens_at='2020-01-01T00:00:00.000Z' WHERE module_id=? AND section_id=?").run(m3.id, secA()); // la fecha llega
  assert.equal((await e.get('/api/estudiante/modulos')).json.modulos[2].estado, 'abierto');
});

test('D03 · el docente consulta resultados por tema solo de sus estudiantes', async () => {
  const d = await docente();
  const r = (await d.get(`/api/docente/secciones/${secA()}/resultados`)).json;
  const marta = r.estudiantes.find((x) => x.nombre === 'Marta Ruiz');
  assert.equal(r.columnas.length, 7); assert.equal(marta.notas[0], 100); assert.equal(marta.promedio, 97); assert.equal(marta.banda.clave, 'dominado');
  assert.ok(!r.estudiantes.some((x) => x.nombre.startsWith('Laura')));
});

// ================================================================ Administrador
test('M01 · el administrador crea, edita y restablece usuarios con validación', async () => {
  const a = await admin();
  const malo = await a.post('/api/admin/usuarios', { nombre: 'X', email: 'mal', rol: 'estudiante', clave: '1' });
  assert.equal(malo.status, 400); assert.ok(malo.json.campos.nombre && malo.json.campos.email && malo.json.campos.clave && malo.json.campos.seccionId);
  const ok = await a.post('/api/admin/usuarios', { nombre: 'Docente Nuevo', email: 'nuevo.docente@geoistmo.test', rol: 'docente', clave: 'Clave2026x' });
  assert.equal(ok.status, 201);
  assert.equal((await a.post('/api/admin/usuarios', { nombre: 'Docente Nuevo', email: 'NUEVO.docente@geoistmo.test', rol: 'docente', clave: 'Clave2026x' })).status, 409);
  assert.equal((await cliente().login('nuevo.docente@geoistmo.test', 'Clave2026x', 'docente')).status, 200);
  assert.equal((await a.patch(`/api/admin/usuarios/${ok.json.id}`, { rol: 'estudiante', seccionId: secA() })).status, 200);
  assert.equal((await cliente().login('nuevo.docente@geoistmo.test', 'Clave2026x', 'docente')).status, 401);
  const rst = await a.post(`/api/admin/usuarios/${ok.json.id}/restablecer-clave`);
  assert.equal((await cliente().login('nuevo.docente@geoistmo.test', rst.json.clave, 'estudiante')).status, 200);
  const yo = idDe("SELECT id FROM users WHERE email='admin@geoistmo.test'");
  assert.equal((await a.patch(`/api/admin/usuarios/${yo}`, { activo: false })).status, 409);
  assert.equal((await a.patch(`/api/admin/usuarios/${yo}`, { rol: 'docente' })).status, 409);
});

test('M02 · el listado de usuarios filtra, no expone hashes y resiste texto malicioso', async () => {
  const a = await admin();
  assert.equal((await a.get('/api/admin/usuarios?rol=docente')).json.usuarios.length, 2);
  assert.equal((await a.get('/api/admin/usuarios?q=marta')).json.usuarios.length, 1);
  assert.equal((await a.get(`/api/admin/usuarios?q=${encodeURIComponent("' OR 1=1 --")}`)).json.usuarios.length, 0);
  const todos = (await a.get('/api/admin/usuarios')).json;
  assert.equal(todos.usuarios.length, 10); assert.ok(!JSON.stringify(todos).includes('password'));
  assert.equal(db.prepare('SELECT COUNT(*) n FROM users').get().n, 10);
});

test('M03 · el administrador gestiona secciones y asigna docentes', async () => {
  const a = await admin();
  const doc = idDe("SELECT id FROM users WHERE email='docente2@geoistmo.test'");
  assert.equal((await a.post('/api/admin/secciones', { nombre: '12.º C', codigo: 'G3O-12A-2026' })).status, 400);
  const ok = await a.post('/api/admin/secciones', { nombre: '12.º C', codigo: 'g3o-12c-2026', docenteId: doc });
  assert.equal(ok.status, 201);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM section_modules WHERE section_id=?').get(ok.json.id).n, 7);
  assert.equal((await (await docente('docente2@geoistmo.test')).get('/api/docente/secciones')).json.secciones.length, 2);
});

test('M04 · el catálogo curricular edita temas y preguntas y el cambio llega al estudiante', async () => {
  const a = await admin();
  const cat = (await a.get('/api/admin/catalogo')).json;
  assert.equal(cat.modulos.length, 7); assert.equal(cat.modulos[1].temas.length, 4); assert.equal(cat.mision.length, 3);
  const nuevo = await a.post(`/api/admin/modulos/${cat.modulos[2].id}/temas`, { titulo: 'Tema nuevo de prueba', minutos: 5 });
  assert.equal(nuevo.status, 201);
  assert.equal((await a.post(`/api/admin/modulos/${cat.modulos[2].id}/temas`, { titulo: 'x' })).status, 400);
  assert.equal((await a.delete(`/api/admin/temas/${nuevo.json.id}`)).status, 200);
  assert.equal((await a.delete(`/api/admin/temas/${cat.modulos[0].temas[0].id}`)).status, 409);
  const act = cat.modulos[0].temas[0].actividad;
  assert.equal((await a.get(`/api/admin/actividades/${act.id}/preguntas`)).json.preguntas.length, 4);
  assert.equal((await a.post(`/api/admin/actividades/${act.id}/preguntas`, { enunciado: '¿?', opciones: ['a'], correcta: 9 })).status, 400);
  const buena = await a.post(`/api/admin/actividades/${act.id}/preguntas`, { enunciado: '¿Cuál es la capital de la República de Panamá?', opciones: ['Ciudad de Panamá', 'David', 'Colón', 'Santiago'], correcta: 0, explicacion: 'La capital es la ciudad de Panamá.' });
  assert.equal(buena.status, 201);
  const e = await estudiante();
  assert.equal((await e.post(`/api/estudiante/actividades/${act.id}/intentos`)).json.preguntas.length, 5);
  assert.equal((await a.patch(`/api/admin/actividades/${act.id}`, { publicada: false })).status, 200);
  assert.equal((await e.post(`/api/estudiante/actividades/${act.id}/intentos`)).status, 404);
});

// ================================================================ Interfaz y recursos
test('U01 · la interfaz y todos sus recursos se sirven sin rutas rotas', async () => {
  const html = await (await fetch(base + '/')).text();
  assert.match(html, /GeoIstmo/);
  const refs = new Set([...html.matchAll(/(?:src|href)="(\/[^"]+)"/g)].map((m) => m[1]));
  assert.ok(refs.size >= 3, 'el HTML referencia CSS, JS e iconos');
  for (const ref of refs) assert.equal((await fetch(base + ref)).status, 200, ref);
  const css = await (await fetch(base + '/css/estilos.css')).text();
  for (const f of new Set([...css.matchAll(/url\(["']?(\/[^)"']+)["']?\)/g)].map((m) => m[1]))) assert.equal((await fetch(base + f)).status, 200, f);
  for (const img of db.prepare('SELECT image FROM badges').all().map((b) => b.image)) assert.equal((await fetch(base + img)).status, 200, img);
  for (const l of db.prepare('SELECT content_json FROM lessons').all()) for (const b of JSON.parse(l.content_json)) if (b.t === 'img') assert.equal((await fetch(base + b.src)).status, 200, b.src);
  // Los módulos JS del cliente también deben existir
  const js = await (await fetch(base + '/js/app.js')).text();
  for (const m of new Set([...js.matchAll(/from '\.\/([^']+)'/g)].map((x) => x[1]))) assert.equal((await fetch(`${base}/js/${m}`)).status, 200, m);
  assert.equal((await fetch(base + '/estudiante/modulos')).status, 200); // rutas de la SPA
});

test('A11 · detrás de un proxy (Codespaces) se acepta el origen que llega en X-Forwarded-Host', async () => {
  const cuerpo = JSON.stringify({ email: 'sergio@geoistmo.test', clave: CLAVE.est, rol: 'estudiante' });
  const h = { 'Content-Type': 'application/json', 'X-GeoIstmo': '1', Origin: 'https://ejemplo-3000.app.github.dev' };
  assert.equal((await fetch(base + '/api/auth/login', { method: 'POST', headers: h, body: cuerpo })).status, 403);
  assert.equal((await fetch(base + '/api/auth/login', { method: 'POST', headers: { ...h, 'X-Forwarded-Host': 'ejemplo-3000.app.github.dev' }, body: cuerpo })).status, 200);
});
