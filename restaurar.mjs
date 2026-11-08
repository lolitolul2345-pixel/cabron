import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Credenciales del NUEVO proyecto de Supabase
// (Obtén la URL y la service_role key en: Project Settings > API)
const NUEVA_SUPABASE_URL = 'https://jibiidxlvntuglkpmcay.supabase.co';
const NUEVA_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppYmlpZHhsdm50dWdsa3BtY2F5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NDE3NTgyMSwiZXhwIjoyMTA5NzUxODIxfQ.Y7hgajQBz1Hqyot6ZoCOzB5soXWEBOh9_nE289jceog';

const supabase = createClient(NUEVA_SUPABASE_URL, NUEVA_SERVICE_ROLE_KEY);

const alumnos = JSON.parse(fs.readFileSync('respaldo_alumnos.json', 'utf8'));

async function restaurar() {
  console.log(`Subiendo ${alumnos.length} registros a la nueva base de datos...`);
  
  // Limpiar campos que generen conflicto de id si vienen duplicados
  const datosLimpios = alumnos.map(item => {
    const { ...resto } = item;
    return resto;
  });

  for (let i = 0; i < datosLimpios.length; i += 100) {
    const lote = datosLimpios.slice(i, i + 100);
    const { error } = await supabase.from('registros_alumnos').insert(lote);
    if (error) {
      console.error(`Error en lote ${i}:`, error.message);
    } else {
      console.log(`Lote ${i + lote.length} / ${datosLimpios.length} subido exitosamente.`);
    }
  }

  console.log('✅ ¡Restauración completada!');
}

restaurar();