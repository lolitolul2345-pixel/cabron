import fs from 'fs';
import path from 'path';

const CARPETA_DESTINO = './fotos_recuperadas';
if (!fs.existsSync(CARPETA_DESTINO)) {
  fs.mkdirSync(CARPETA_DESTINO, { recursive: true });
}

const alumnos = JSON.parse(fs.readFileSync('respaldo_alumnos.json', 'utf8'));

async function descargarArchivo(url, nombreArchivo) {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return { ok: false, status: res.status };
    }
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(path.join(CARPETA_DESTINO, nombreArchivo), buffer);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function procesar() {
  console.log('Iniciando rescate de imágenes...');
  let totalDescargadas = 0;
  let totalFallidas = 0;

  for (const alumno of alumnos) {
    const matricula = alumno.num_control || 'sin_control';

    for (let i = 1; i <= 5; i++) {
      const url = alumno[`evidencia_url_${i}`];
      if (url && typeof url === 'string' && url.startsWith('http')) {
        // Extraer nombre original o generar uno ordenado
        const extension = url.split('.').pop().split('?')[0] || 'jpg';
        const nombreLocal = `${matricula}_evidencia_${i}_${Date.now()}.${extension}`;

        const resultado = await descargarArchivo(url, nombreLocal);
        if (resultado.ok) {
          totalDescargadas++;
          console.log(`✅ [${totalDescargadas}] Guardada: ${nombreLocal}`);
        } else {
          totalFallidas++;
          console.log(`❌ Falló (${resultado.status || resultado.error}): ${url}`);
        }
      }
    }
  }

  console.log(`\n🎉 Finalizado: ${totalDescargadas} fotos recuperadas, ${totalFallidas} no disponibles.`);
}

procesar();