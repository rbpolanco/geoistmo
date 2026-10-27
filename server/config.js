// Configuración central. Los valores se leen de variables de entorno (archivo .env opcional).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envFile = path.join(raiz, '.env');
if (fs.existsSync(envFile)) {
  for (const linea of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const num = (v, d) => (v !== undefined && v !== '' && Number.isFinite(Number(v)) ? Number(v) : d);

export const config = {
  raiz,
  puerto: num(process.env.PORT, 3000),
  dbPath: process.env.DB_PATH ? path.resolve(raiz, process.env.DB_PATH) : path.join(raiz, 'data', 'geoistmo.db'),
  publicDir: path.join(raiz, 'public'),
  bcryptRounds: num(process.env.BCRYPT_ROUNDS, 12),
  sesionHoras: num(process.env.SESSION_HOURS, 8),
  sesionRecordarDias: num(process.env.SESSION_REMEMBER_DAYS, 14),
  cookieSegura: process.env.COOKIE_SECURE === 'true',
  loginMaxIntentos: num(process.env.LOGIN_MAX_ATTEMPTS, 5),
  loginVentanaMin: num(process.env.LOGIN_WINDOW_MIN, 15),
  zonaHoraria: 'America/Panama',
};
