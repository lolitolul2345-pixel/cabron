import ExcelJS from 'exceljs';

export interface AlumnoEvidencia {
  id: string;
  num_control: string;
  nombre: string;
  carrera: string;
  semestre: string;
  grupo: string;
  conferencia: string;
  titulo_evidencia: string;
  descripcion?: string | null;
  evidencia_url_1?: string | null;
  evidencia_url_2?: string | null;
  evidencia_url_3?: string | null;
  evidencia_url_4?: string | null;
  evidencia_url_5?: string | null;
  hora: string;
}

async function descargarBufferImagen(
  url: string
): Promise<{ buffer: ArrayBuffer; extension: 'jpeg' | 'png' } | null> {
  try {
    const res = await fetch(url, { referrerPolicy: 'no-referrer' });
    if (!res.ok) return null;
    const type = res.headers.get('content-type') || '';
    const extension: 'jpeg' | 'png' = type.includes('png') ? 'png' : 'jpeg';
    const buffer = await res.arrayBuffer();
    return { buffer, extension };
  } catch {
    return null;
  }
}

// -------------------------------------------------------------
// 1. TU FUNCIÓN ORIGINAL (Fotos incrustadas celda por celda)
// -------------------------------------------------------------
export async function exportarTablaExcel(
  registros: AlumnoEvidencia[],
  nombreArchivo = 'reporte_conferencias_tecnm.xlsx'
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Conferencias TecNM');

  // 1. Definición de columnas (13 columnas en total: A hasta M)
  worksheet.columns = [
    { header: 'No. Control', key: 'num_control', width: 16 },
    { header: 'Nombre del Estudiante', key: 'nombre', width: 32 },
    { header: 'Carrera', key: 'carrera', width: 30 },
    { header: 'Semestre', key: 'semestre', width: 12 },
    { header: 'Grupo', key: 'grupo', width: 10 },
    { header: 'Título Evidencia', key: 'titulo_evidencia', width: 28 },
    { header: 'Descripción', key: 'descripcion', width: 40 },
    { header: 'Fecha y Hora', key: 'hora', width: 22 },
    { header: 'Foto 1', key: 'evidencia_1', width: 24 },
    { header: 'Foto 2', key: 'evidencia_2', width: 24 },
    { header: 'Foto 3', key: 'evidencia_3', width: 24 },
    { header: 'Foto 4', key: 'evidencia_4', width: 24 },
    { header: 'Foto 5', key: 'evidencia_5', width: 24 },
  ];

  // 2. Encabezado principal azul marino institucional
  const headerRow = worksheet.getRow(1);
  headerRow.height = 30;
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1B365D' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  const listaConferencias = [
    'Conferencia 1 (10:00 - 10:45AM)',
    'Conferencia 2 (11:00 - 11:45AM)',
    'Conferencia 3 (13:00 - 13:45PM)',
    'Conferencia 4 (15:00 - 15:45PM)',
    'Conferencia 1 (16:00 - 16:45PM)',
    'Conferencia 2 (17:00 - 17:45PM)',
    'Conferencia 3 (17:45 - 18:00PM)',
    'Conferencia 4 (12:00 - 12:45PM)',
  ];

  let currentRowIndex = 2;

  // 3. Iteración por cada conferencia agrupada
  for (const conf of listaConferencias) {
    const registrosDeEstaConf = registros.filter((r) => {
      const confItem = (r.conferencia || '').toLowerCase().trim();
      const confBuscada = conf.toLowerCase().trim();
      return confItem === confBuscada;
    });

    if (registrosDeEstaConf.length === 0) continue;

    // Fila divisoria / Banner naranja de la conferencia (Columnas A a M)
    const bannerRow = worksheet.getRow(currentRowIndex);
    bannerRow.height = 26;
    worksheet.mergeCells(`A${currentRowIndex}:M${currentRowIndex}`);
    const bannerCell = worksheet.getCell(`A${currentRowIndex}`);
    bannerCell.value = `📍 ${conf.toUpperCase()} — (${registrosDeEstaConf.length} REGISTROS)`;
    bannerCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    bannerCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE67E22' },
    };
    bannerCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

    currentRowIndex++;

    // Iteración por cada alumno registrado en esta conferencia
    for (const item of registrosDeEstaConf) {
      const row = worksheet.getRow(currentRowIndex);
      row.height = 135; // Altura para fotos

      row.getCell('num_control').value = item.num_control;
      row.getCell('nombre').value = item.nombre;
      row.getCell('carrera').value = item.carrera;
      row.getCell('semestre').value = item.semestre;
      row.getCell('grupo').value = item.grupo;
      row.getCell('titulo_evidencia').value = item.titulo_evidencia || 'Sin título';
      row.getCell('descripcion').value = item.descripcion || 'Sin descripción';
      row.getCell('hora').value = new Date(item.hora).toLocaleString();

      row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      row.getCell('num_control').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('semestre').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('grupo').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('hora').alignment = { vertical: 'middle', horizontal: 'center' };

      const fotosUrls = [
        item.evidencia_url_1,
        item.evidencia_url_2,
        item.evidencia_url_3,
        item.evidencia_url_4,
        item.evidencia_url_5,
      ];

      for (let f = 0; f < fotosUrls.length; f++) {
        const fotoUrl = fotosUrls[f];
        if (fotoUrl) {
          const imgDescargada = await descargarBufferImagen(fotoUrl);
          if (imgDescargada) {
            const imgId = workbook.addImage({
              buffer: imgDescargada.buffer,
              extension: imgDescargada.extension,
            });

            worksheet.addImage(imgId, {
              tl: { col: 8.18 + f, row: currentRowIndex - 0.88 },
              ext: { width: 115, height: 115 },
              editAs: 'oneCell',
            });
          }
        }
      }

      currentRowIndex++;
    }

    currentRowIndex++;
  }

  // 4. Descarga del archivo Excel
  const bufferSalida = await workbook.xlsx.writeBuffer();
  const blob = new Blob([bufferSalida], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = nombreArchivo;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}

// -------------------------------------------------------------
// 2. NUEVA FUNCIÓN RÁPIDA (Con enlaces directos, descarga en 3s)
// -------------------------------------------------------------
export async function exportarTablaExcelRapido(
  registros: AlumnoEvidencia[],
  nombreArchivo = 'reporte_rapido_conferencias.xlsx'
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Conferencias TecNM');

  // Mismas 13 columnas exactas de tu reporte
  worksheet.columns = [
    { header: 'No. Control', key: 'num_control', width: 16 },
    { header: 'Nombre del Estudiante', key: 'nombre', width: 32 },
    { header: 'Carrera', key: 'carrera', width: 30 },
    { header: 'Semestre', key: 'semestre', width: 12 },
    { header: 'Grupo', key: 'grupo', width: 10 },
    { header: 'Título Evidencia', key: 'titulo_evidencia', width: 28 },
    { header: 'Descripción', key: 'descripcion', width: 40 },
    { header: 'Fecha y Hora', key: 'hora', width: 22 },
    { header: 'Foto 1', key: 'evidencia_1', width: 20 },
    { header: 'Foto 2', key: 'evidencia_2', width: 20 },
    { header: 'Foto 3', key: 'evidencia_3', width: 20 },
    { header: 'Foto 4', key: 'evidencia_4', width: 20 },
    { header: 'Foto 5', key: 'evidencia_5', width: 20 },
  ];

  // Mismo encabezado azul marino institucional
  const headerRow = worksheet.getRow(1);
  headerRow.height = 30;
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1B365D' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  const listaConferencias = [
    'Conferencia 1 (10:00 - 10:45AM)',
    'Conferencia 2 (11:00 - 11:45AM)',
    'Conferencia 3 (13:00 - 13:45PM)',
    'Conferencia 4 (15:00 - 15:45PM)',
    'Conferencia 1 (16:00 - 16:45PM)',
    'Conferencia 2 (17:00 - 17:45PM)',
    'Conferencia 3 (17:45 - 18:00PM)',
    'Conferencia 4 (12:00 - 12:45PM)',
  ];

  let currentRowIndex = 2;

  for (const conf of listaConferencias) {
    const registrosDeEstaConf = registros.filter((r) => {
      const confItem = (r.conferencia || '').toLowerCase().trim();
      const confBuscada = conf.toLowerCase().trim();
      return confItem === confBuscada;
    });

    if (registrosDeEstaConf.length === 0) continue;

    // Mismo banner naranja
    const bannerRow = worksheet.getRow(currentRowIndex);
    bannerRow.height = 26;
    worksheet.mergeCells(`A${currentRowIndex}:M${currentRowIndex}`);
    const bannerCell = worksheet.getCell(`A${currentRowIndex}`);
    bannerCell.value = `📍 ${conf.toUpperCase()} — (${registrosDeEstaConf.length} REGISTROS)`;
    bannerCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    bannerCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE67E22' },
    };
    bannerCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

    currentRowIndex++;

    for (const item of registrosDeEstaConf) {
      const row = worksheet.getRow(currentRowIndex);
      row.height = 26; // Altura estándar de fila compacta

      row.getCell('num_control').value = item.num_control;
      row.getCell('nombre').value = item.nombre;
      row.getCell('carrera').value = item.carrera;
      row.getCell('semestre').value = item.semestre;
      row.getCell('grupo').value = item.grupo;
      row.getCell('titulo_evidencia').value = item.titulo_evidencia || 'Sin título';
      row.getCell('descripcion').value = item.descripcion || 'Sin descripción';
      row.getCell('hora').value = new Date(item.hora).toLocaleString();

      row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      row.getCell('num_control').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('semestre').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('grupo').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('hora').alignment = { vertical: 'middle', horizontal: 'center' };

      // Hipervínculos web directos en las columnas de fotos (I a M)
      const fotosUrls = [
        item.evidencia_url_1,
        item.evidencia_url_2,
        item.evidencia_url_3,
        item.evidencia_url_4,
        item.evidencia_url_5,
      ];

      for (let f = 0; f < fotosUrls.length; f++) {
        const fotoUrl = fotosUrls[f];
        const celdaFoto = row.getCell(9 + f); // Columna 9 = I ('Foto 1')
        if (fotoUrl) {
          celdaFoto.value = { text: `Ver Foto ${f + 1}`, hyperlink: fotoUrl };
          celdaFoto.font = { color: { argb: 'FF004B87' }, underline: true, bold: true };
          celdaFoto.alignment = { vertical: 'middle', horizontal: 'center' };
        } else {
          celdaFoto.value = '-';
          celdaFoto.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      }

      currentRowIndex++;
    }

    currentRowIndex++;
  }

  // Misma descarga nativa con Blob
  const bufferSalida = await workbook.xlsx.writeBuffer();
  const blob = new Blob([bufferSalida], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = nombreArchivo;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}
