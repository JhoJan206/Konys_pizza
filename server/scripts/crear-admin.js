// Crea (o cambia la contraseña de) un usuario del panel de administración.
// Uso: npm run crear-admin
// La contraseña se escribe sin mostrarse en pantalla y se guarda cifrada con bcrypt.
import readline from 'node:readline';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';

if (!process.env.DATABASE_URL) {
  console.error('Falta DATABASE_URL en el archivo .env');
  process.exit(1);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
let ocultar = false;
// Mientras se escribe la contraseña no se muestra lo que se teclea
rl._writeToOutput = (texto) => {
  if (!ocultar || texto.includes('\n')) rl.output.write(ocultar ? '\n' : texto);
};
const preguntar = (texto, esSecreto = false) =>
  new Promise((resolver) => {
    rl.output.write(texto);
    ocultar = esSecreto;
    rl.question('', (respuesta) => {
      ocultar = false;
      resolver(respuesta.trim());
    });
  });

try {
  const usuario = (await preguntar('Usuario del administrador: ')).toLowerCase();
  const password = await preguntar('Contraseña (mínimo 8 caracteres): ', true);
  const repetida = await preguntar('Repite la contraseña: ', true);

  if (usuario.length < 3) throw new Error('El usuario debe tener al menos 3 caracteres');
  if (password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres');
  if (password !== repetida) throw new Error('Las contraseñas no coinciden');

  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    `insert into administradores (usuario, password_hash) values ($1, $2)
     on conflict (usuario) do update set password_hash = excluded.password_hash`,
    [usuario, hash]
  );
  console.log(`✔ Administrador "${usuario}" listo. Ya puede iniciar sesión en /admin`);
} catch (error) {
  console.error('✘', error.message);
  process.exitCode = 1;
} finally {
  rl.close();
  await pool.end();
}
