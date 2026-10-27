import { config } from './config.js';
import { abrirDb } from './db/connection.js';
import { sembrar } from './db/seed.js';
import { crearApp } from './app.js';

const db = abrirDb();
const hay = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get() && db.prepare('SELECT COUNT(*) n FROM users').get().n > 0;
if (!hay) { console.log('Base de datos vacía: creando tablas y datos de demostración…'); sembrar(db); }

const servidor = crearApp(db).listen(config.puerto, () => console.log(`\nGeoIstmo está funcionando. Abre en tu navegador: http://localhost:${config.puerto}\n(Para detenerlo, pulsa Ctrl + C)`));
servidor.on('error', (e) => { console.error(e.code === 'EADDRINUSE' ? `El puerto ${config.puerto} ya está en uso. Cambia PORT en el archivo .env.` : e); process.exit(1); });
const cerrar = () => servidor.close(() => { db.close(); process.exit(0); });
process.on('SIGINT', cerrar); process.on('SIGTERM', cerrar);
