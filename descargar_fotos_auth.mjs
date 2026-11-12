import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Credenciales del proyecto VIEJO bloqueado
const VIEJA_SUPABASE_URL = 'https://hamyrbznkrin.supabase.co';
const VIEJA_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53d3Rpc3BxbmFteXJiem5rcmluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTk0NjE5NiwiZXhwIjoyMTA3NTIyMTk2fQ.L_ARut7H-8EONfG898zyvoPDpOQsiq0UK4-6MwJF0wk';

// Nombre del bucket donde se guardaron las evidencias (por ejemplo: 'evidencias')
const BUCKET_NAME = 'evidencias';

const CARPETA_DESTINO = './fotos_recuperadas';
if (!fs.existsSync(CARPETA_DESTINO)) {
  fs.mkdirSync(CARPETA_DESTINO, { recursive: true });
}

const supabase = createClient(VIEJA_SUPABASE_URL, VIEJA_SERVICE_ROLE);
const alumnos = JSON.parse(fs.readFileSync('respaldo_alumnos.json', 'utf8'));

// Extrae el path interno del archivo dentro del bucket
function extraerRutaBucket(url) {
  if (!url || typeof url !== 'string') return null;
  const marcador = `/${BUCKET_NAME}/`;
  const indice = url.indexOf(marcador);
  if (indice === -1) {
    // Si la URL no coincide directamente con el nombre del bucket, tomamos el nombre del archivo final
    const partes = url.split('/');
    return partes[partes.length - 1];
  }
  return decodeURIComponent(url.substring(indice + marcador.length).split('?')[0]);
}

async function procesar() {
  console.log(`Buscando imágenes en ${alumnos.length} registros usando service_role...`);
  let exitosas = 0;
  let fallidas = 0;

  for (const alumno of alumnos) {
    const matricula = alumno.num_control || 'sin_control';

    for (let i = 1; i <= 5; i++) {
      const url = alumno[`evidencia_url_${i}`];
      if (!url) continue;

      const rutaArchivo = extraerRutaBucket(url);
      if (!rutaArchivo) continue;

      try {
        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .download(rutaArchivo);

        if (error || !data) {
          console.error(`❌ Falló ${rutaArchivo}: ${error?.message || 'Sin datos'}`);
          fallidas++;
        } else {
          const buffer = Buffer.from(await data.arrayBuffer());
          const nombreLimpio = rutaArchivo.replace(/\//g, '_');
          const nombreLocal = `${matricula}_evidencia_${i}_${nombreLimpio}`;
          
          fs.writeFileSync(path.join(CARPETA_DESTINO, nombreLocal), buffer);
          exitosas++;
          console.log(`✅ [${exitosas}] Descargada: ${nombreLocal}`);
        }
      } catch (err) {
        console.error(`⚠️ Excepción en ${rutaArchivo}:`, err.message);
        fallidas++;
      }
    }
  }

  console.log(`\n🎉 Finalizado: ${exitosas} imágenes recuperadas, ${fallidas} errores.`);
}

procesar();