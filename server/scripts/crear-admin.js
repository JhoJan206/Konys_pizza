// Crea (o cambia la contraseña de) un usuario del panel de administración.
// Uso: npm run crear-admin
// La contraseña se muestra como asteriscos y se guarda cifrada con bcrypt.
import readline from 'node:readline';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';

if (!process.env.DATABASE_URL) {
  console.error('Falta DATABASE_URL en el archivo .env');
  process.exit(1);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: Boolean(process.stdin.isTTY) });

// Mientras se escribe la contraseña, cada tecla se muestra como *
let ocultar = false;
const escribirOriginal = rl._writeToOutput.bind(rl);
rl._writeToOutput = (texto) => {
  if (!ocultar) return escribirOriginal(texto);
  if (texto.includes('\n') || texto.includes('\r')) return escribirOriginal('\n');
  escribirOriginal('*'.repeat(texto.length));
};

// Las respuestas se guardan en una fila, así no se pierde ninguna
// aunque se escriban o peguen muy rápido.
const pendientes = [];
let esperando = null;
rl.on('line', (linea) => {
  if (esperando) {
    const resolver = esperando;
    esperando = null;
    ocultar = false;
    resolver(linea.trim());
  } else {
    pendientes.push(linea.trim());
  }
});
rl.on('close', () => esperando?.(''));

const preguntar = (pregunta, esSecreto = false) =>
  new Promise((resolver) => {
    if (pendientes.length) return resolver(pendientes.shift());
    rl.setPrompt(pregunta);
    rl.prompt();
    ocultar = esSecreto;
    esperando = resolver;
  });

console.log('\n=== Crear administrador del panel de Konys ===');
console.log('1. Escribe el nombre de usuario y presiona Enter.');
console.log('2. Escribe la contraseña (mínimo 8 caracteres) y presiona Enter.');
console.log('3. Repite la contraseña y presiona Enter.\n');

try {
  const usuario = (await preguntar('Usuario: ')).toLowerCase();
  if (usuario.length < 3) throw new Error('El usuario debe tener al menos 3 caracteres');
  const password = await preguntar('Contraseña: ', true);
  if (password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres');
  const repetida = await preguntar('Repite la contraseña: ', true);
  if (password !== repetida) throw new Error('Las contraseñas no coinciden');

  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    `insert into administradores (usuario, password_hash) values ($1, $2)
     on conflict (usuario) do update set password_hash = excluded.password_hash`,
    [usuario, hash]
  );
  console.log(`\n✔ Administrador "${usuario}" listo. Ya puedes entrar en https://konys.vercel.app/admin`);
} catch (error) {
  console.error(`\n✘ ${error.message}. Vuelve a ejecutar: npm run crear-admin`);
  process.exitCode = 1;
} finally {
  rl.close();
  await pool.end();
}
