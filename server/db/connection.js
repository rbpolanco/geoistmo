// SQLite con el módulo integrado de Node (node:sqlite): sin compilar nada en Windows.
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';

const SCHEMA = fileURLToPath(new URL('./schema.sql', import.meta.url));

export function abrirDb(ruta = config.dbPath) {
  if (ruta !== ':memory:') fs.mkdirSync(path.dirname(ruta), { recursive: true });
  const db = new DatabaseSync(ruta);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  return db;
}
export const crearEsquema = (db) => db.exec(fs.readFileSync(SCHEMA, 'utf8'));

export function transaccion(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try { const r = fn(); db.exec('COMMIT'); return r; }
  catch (e) { db.exec('ROLLBACK'); throw e; }
}
export const ahoraISO = () => new Date().toISOString();
// Día calendario (AAAA-MM-DD) en la hora de Panamá (sin horario de verano).
export const diaPanama = (fecha = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: config.zonaHoraria, year: 'numeric', month: '2-digit', day: '2-digit' }).format(fecha);
export function sumarDias(dia, n) {
  const d = new Date(`${dia}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10);
}
