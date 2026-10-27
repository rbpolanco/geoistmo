import express from 'express';
import { config } from './config.js';
import { cabeceras, protegerCsrf } from './middleware/seguridad.js';
import { cargarSesion, requerirRol } from './middleware/auth.js';
import { crearAuth } from './services/auth.js';
import { crearProgreso } from './services/progreso.js';
import { crearContenido } from './services/contenido.js';
import { crearActividades } from './services/actividades.js';
import { crearDocente } from './services/docente.js';
import { crearAdmin } from './services/admin.js';
import { rutasAuth } from './routes/auth.js';
import { rutasEstudiante } from './routes/estudiante.js';
import { rutasDocente } from './routes/docente.js';
import { rutasAdmin } from './routes/admin.js';
import { ErrorHttp } from './util/errores.js';

export function crearApp(db) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cabeceras);
  app.use(express.json({ limit: '100kb' }));
  app.use(express.static(config.publicDir, { maxAge: '1h' }));

  const progreso = crearProgreso(db);
  const contenido = crearContenido(db);
  const s = { db, progreso, contenido, actividades: crearActividades(db, progreso, contenido), docente: crearDocente(db, progreso), admin: crearAdmin(db) };

  const api = express.Router();
  api.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  api.use(protegerCsrf);
  api.use(cargarSesion(db));
  api.use('/auth', rutasAuth(crearAuth(db)));
  // Cada grupo exige su rol ANTES de llegar a la lógica: cambiar la URL no abre nada.
  api.use('/estudiante', requerirRol('estudiante'), rutasEstudiante(s));
  api.use('/docente', requerirRol('docente'), rutasDocente(s));
  api.use('/admin', requerirRol('administrador'), rutasAdmin(s));
  api.use((_req, _res, next) => next(new ErrorHttp(404, 'Ese recurso no existe.')));
  app.use('/api', api);

  // La interfaz es una aplicación de una sola página: cualquier otra ruta devuelve index.html.
  app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile('index.html', { root: config.publicDir }));

  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Los datos enviados no tienen un formato válido.' });
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Los datos enviados son demasiado grandes.' });
    const status = err.status && err.status < 500 ? err.status : 500;
    if (status === 500) console.error(err);
    res.status(status).json({ error: status === 500 ? 'Ocurrió un error inesperado. Inténtalo de nuevo.' : err.message, ...(err.campos ? { campos: err.campos } : {}) });
  });
  return app;
}
