import pg from 'pg';
import fs from 'fs';
const { Client } = pg;

// Pega aquí tu Connection String URI de Supabase
const client = new Client({
  connectionString: 'postgresql://postgres.nwwtispqnamyrbznkrin:Perritoguao08@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const res = await client.query('SELECT * FROM registros_alumnos;');
  fs.writeFileSync('respaldo_alumnos.json', JSON.stringify(res.rows, null, 2));
  console.log(`✅ ¡Éxito! Se descargaron ${res.rows.length} registros en respaldo_alumnos.json`);
  await client.end();
}
run();