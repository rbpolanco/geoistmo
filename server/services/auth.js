import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { config } from '../config.js';
import { ahoraISO } from '../db/connection.js';
import { hashToken } from '../middleware/auth.js';
import { ErrorHttp, invalido, txt, EMAIL_RE, validarClave, MSG_CLAVE } from '../util/errores.js';

// Hash ficticio para que un correo inexistente tarde lo mismo que uno real (evita enumerar cuentas).
const HASH_FALSO = bcrypt.hashSync(crypto.randomBytes(12).toString('hex'), config.bcryptRounds);
const ROLES = ['estudiante', 'docente', 'administrador'];

export function crearAuth(db) {
  return {
    // Registro público: SIEMPRE crea estudiantes, unidos a una sección por el código del docente (00-04).
    registrar({ nombre, email, clave, codigo }) {
      const campos = {};
      const n = txt(nombre, { min: 3, max: 80 }); if (!n) campos.nombre = 'Escribe tu nombre completo (mínimo 3 letras).';
      const e = typeof email === 'string' ? email.trim().toLowerCase() : ''; if (!EMAIL_RE.test(e)) campos.email = 'Escribe un correo válido.';
      if (!validarClave(clave)) campos.clave = MSG_CLAVE;
      const c = txt(codigo, { min: 3, max: 30 }); if (!c) campos.codigo = 'Escribe el código que te dio tu docente.';
      if (Object.keys(campos).length) throw invalido('Revisa los datos marcados.', campos);
      const sec = db.prepare('SELECT id, name FROM sections WHERE code=? COLLATE NOCASE').get(c);
      if (!sec) throw invalido('Revisa los datos marcados.', { codigo: 'Ese código no existe. Pídele el código correcto a tu docente.' });
      if (db.prepare('SELECT 1 FROM users WHERE email=?').get(e)) throw new ErrorHttp(409, 'Revisa los datos marcados.', { email: 'Ya existe una cuenta con ese correo.' });
      db.prepare('INSERT INTO users(name,email,password_hash,role,section_id) VALUES (?,?,?,?,?)').run(n, e, bcrypt.hashSync(clave, config.bcryptRounds), 'estudiante', sec.id);
      return { seccion: sec.name };
    },

    iniciarSesion({ email, clave, rol, recordar }) {
      if (!ROLES.includes(rol)) throw invalido('Elige si entras como estudiante, docente o administrador.');
      const e = typeof email === 'string' ? email.trim().toLowerCase() : '';
      if (!e || typeof clave !== 'string' || !clave) throw invalido('Escribe tu correo y tu contraseña.', { ...(e ? {} : { email: 'Falta el correo.' }), ...(clave ? {} : { clave: 'Falta la contraseña.' }) });
      const u = db.prepare('SELECT * FROM users WHERE email=?').get(e);
      const ok = bcrypt.compareSync(clave, u ? u.password_hash : HASH_FALSO);
      // Mismo mensaje para correo inexistente, clave errónea, rol equivocado o cuenta suspendida.
      if (!u || !ok || u.role !== rol || !u.active) throw new ErrorHttp(401, 'Correo o contraseña incorrectos, o el rol elegido no corresponde a tu cuenta.');
      const token = crypto.randomBytes(32).toString('base64url');
      const ms = (recordar ? config.sesionRecordarDias * 24 : config.sesionHoras) * 3_600_000;
      db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(ahoraISO());
      db.prepare('INSERT INTO sessions(id,user_id,created_at,expires_at) VALUES (?,?,?,?)').run(hashToken(token), u.id, ahoraISO(), new Date(Date.now() + ms).toISOString());
      db.prepare('UPDATE users SET last_login_at=? WHERE id=?').run(ahoraISO(), u.id);
      return { token, maxAge: recordar ? ms : 0, usuario: { id: u.id, nombre: u.name, email: u.email, rol: u.role } };
    },

    cerrarSesion(sid) { if (sid) db.prepare('DELETE FROM sessions WHERE id=?').run(sid); },
  };
}
