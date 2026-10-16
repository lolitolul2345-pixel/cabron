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
  descripcion: string;
  evidencia_url_1?: string;
  evidencia_url_2?: string;
  hora: string;
}

async function descargarBufferImagen(url: string): Promise<{ buffer: ArrayBuffer; extension: 'jpeg' | 'png' } | null> {
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

export async function exportarTablaExcel(
  registros: AlumnoEvidencia[],
  nombreArchivo = 'reporte_conferencias_tecnm.xlsx'
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Conferencias TecNM');

  // Columnas proporcionadas para tamaño mediano
  worksheet.columns = [
    { header: 'Foto 1', key: 'foto1', width: 24 },
    { header: 'Foto 2', key: 'foto2', width: 24 },
    { header: 'Núm. Control', key: 'num_control', width: 16 },
    { header: 'Nombre del Alumno', key: 'nombre', width: 32 },
    { header: 'Carrera', key: 'carrera', width: 28 },
    { header: 'Semestre', key: 'semestre', width: 12 },
    { header: 'Grupo', key: 'grupo', width: 10 },
    { header: 'Título / Resumen', key: 'resumen', width: 36 },
    { header: 'Hora de Registro', key: 'hora', width: 22 }
  ];

  // Encabezado institucional azul marino
  const headerRow = worksheet.getRow(1);
  headerRow.height = 30;
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1B365D' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  const listaConferencias = ['Conferencia 1', 'Conferencia 2', 'Conferencia 3', 'Conferencia 4'];
  let currentRowIndex = 2;

  for (const conf of listaConferencias) {
    const registrosDeEstaConf = registros.filter((r) => {
      const confItem = (r.conferencia || '').toLowerCase().trim();
      const confBuscada = conf.toLowerCase().trim();
      return confItem === confBuscada || confItem.includes(confBuscada.replace('conferencia ', ''));
    });

    if (registrosDeEstaConf.length === 0) continue;

    // Fila divisoria de cada conferencia
    worksheet.mergeCells(`A${currentRowIndex}:I${currentRowIndex}`);
    const sepRow = worksheet.getRow(currentRowIndex);
    sepRow.height = 26;
    const sepCell = worksheet.getCell(`A${currentRowIndex}`);
    sepCell.value = `📍 ${conf.toUpperCase()} — (${registrosDeEstaConf.length} REGISTROS)`;
    sepCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    sepCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE69138' }
    };
    sepCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    currentRowIndex++;

    for (const item of registrosDeEstaConf) {
      worksheet.addRow({
        foto1: '',
        foto2: '',
        num_control: item.num_control,
        nombre: item.nombre,
        carrera: item.carrera,
        semestre: item.semestre,
        grupo: item.grupo,
        resumen: `${item.titulo_evidencia || 'Sin título'}\n\n${item.descripcion || ''}`,
        hora: new Date(item.hora).toLocaleString()
      });

      const row = worksheet.getRow(currentRowIndex);
      row.height = 120; // 120 puntos da espacio perfecto para fotos de 140px sin salirse
      row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      row.getCell('num_control').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('semestre').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('grupo').alignment = { vertical: 'middle', horizontal: 'center' };

      // Foto 1: anclada en columna A, centrada y sin deformación
      if (item.evidencia_url_1) {
        const img1 = await descargarBufferImagen(item.evidencia_url_1);
        if (img1) {
          const imgId1 = workbook.addImage({ buffer: img1.buffer, extension: img1.extension });
          worksheet.addImage(imgId1, {
            tl: { col: 0.15, row: currentRowIndex - 0.88 },
            ext: { width: 140, height: 140 },
            editAs: 'oneCell'
          });
        }
      }

      // Foto 2: anclada en columna B, centrada y sin deformación
      if (item.evidencia_url_2) {
        const img2 = await descargarBufferImagen(item.evidencia_url_2);
        if (img2) {
          const imgId2 = workbook.addImage({ buffer: img2.buffer, extension: img2.extension });
          worksheet.addImage(imgId2, {
            tl: { col: 1.15, row: currentRowIndex - 0.88 },
            ext: { width: 140, height: 140 },
            editAs: 'oneCell'
          });
        }
      }

      currentRowIndex++;
    }

    currentRowIndex++;
  }

  const bufferSalida = await workbook.xlsx.writeBuffer();
  const blob = new Blob([bufferSalida], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
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