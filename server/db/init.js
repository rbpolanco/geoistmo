// node server/db/init.js          -> crea la base si no existe (y la siembra si está vacía)
// node server/db/init.js --reset  -> la borra y la vuelve a crear con los datos de demostración
import fs from 'node:fs';
import { config } from '../config.js';
import { abrirDb } from './connection.js';
import { sembrar, CREDENCIALES_DEMO } from './seed.js';

if (process.argv.includes('--reset')) for (const ext of ['', '-wal', '-shm']) fs.rmSync(config.dbPath + ext, { force: true });
const db = abrirDb();
const hay = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get() && db.prepare('SELECT COUNT(*) n FROM users').get().n > 0;
if (!hay) {
  sembrar(db);
  console.log('Base de datos creada en:', config.dbPath);
  console.log('\nCredenciales de DEMOSTRACIÓN (ficticias):');
  for (const [rol, lista] of Object.entries(CREDENCIALES_DEMO)) for (const c of lista) console.log(`  ${rol.padEnd(14)}${c.email.padEnd(27)}${c.clave}`);
} else console.log('La base de datos ya tiene datos. Use «npm run seed» para recrearla desde cero.');
db.close();
