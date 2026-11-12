import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../api_supabase/supabaseClient';
import { exportarTablaExcel, exportarTablaExcelRapido } from '../utils/excelExporter';
import * as XLSX from 'xlsx';

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
  evidencia_url_3?: string;
  evidencia_url_4?: string;
  evidencia_url_5?: string;
  hora: string;
}

export interface DetalleConferenciaAlumno {
  conferencia: string;
  titulo_evidencia: string;
  descripcion: string;
  hora: string;
}

export interface AlumnoFrecuente {
  num_control: string;
  nombre: string;
  carrera: string;
  semestre: string;
  grupo: string;
  total_conferencias: number;
  detalles_conferencias: DetalleConferenciaAlumno[];
}

const OPCIONES_FILTRO = [
  { id: 'todas', label: 'Todas las conferencias' },
  { id: '10:00', label: 'Conferencia 1 (10:00 - 10:45 AM)' },
  { id: '11:00', label: 'Conferencia 2 (11:00 - 11:45 AM)' },
  { id: '12:00', label: 'Conferencia 4 PM (12:00 - 12:45 PM)' },
  { id: '13:00', label: 'Conferencia 3 (13:00 - 13:45 PM)' },
  { id: '15:00', label: 'Conferencia 4 (15:00 - 15:45 PM)' },
  { id: '16:00', label: 'Conferencia 1 PM (16:00 - 16:45 PM)' },
  { id: '17:00', label: 'Conferencia 2 PM (17:00 - 17:45 PM)' },
  { id: '17:45', label: 'Conferencia 3 PM (17:45 - 18:00 PM)' },
];

// Paleta de colores distintivos según el horario o nombre de la conferencia
const obtenerEstiloConferencia = (conferencia: string): React.CSSProperties => {
  const conf = (conferencia || '').toLowerCase();

  if (conf.includes('10:00')) {
    return { backgroundColor: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' }; // Azul
  }
  if (conf.includes('11:00')) {
    return { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #86efac' }; // Verde esmeralda
  }
  if (conf.includes('12:00')) {
    return { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' }; // Ámbar / Dorado
  }
  if (conf.includes('13:00')) {
    return { backgroundColor: '#f3e8ff', color: '#6b21a8', border: '1px solid #d8b4fe' }; // Morado
  }
  if (conf.includes('15:00')) {
    return { backgroundColor: '#ffe4e6', color: '#9f1239', border: '1px solid #fda4af' }; // Rosa / Carmesí
  }
  if (conf.includes('16:00')) {
    return { backgroundColor: '#ccfbf1', color: '#115e59', border: '1px solid #5eead4' }; // Turquesa / Teal
  }
  if (conf.includes('17:00')) {
    return { backgroundColor: '#ffedd5', color: '#9a3412', border: '1px solid #fdba74' }; // Naranja
  }
  if (conf.includes('17:45')) {
    return { backgroundColor: '#e0e7ff', color: '#3730a3', border: '1px solid #a5b4fc' }; // Índigo
  }

  return { backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }; // Gris por defecto
};

// Convierte la hora inicial de la conferencia a minutos desde las 00:00 para ordenar de AM a PM
const obtenerMinutosHorario = (conferencia: string): number => {
  const texto = (conferencia || '').toLowerCase();
  const match = texto.match(/(\d{1,2}):(\d{2})/);

  if (!match) return 9999; // Si alguna conferencia no tiene hora, la manda al final

  let horas = parseInt(match[1], 10);
  const minutos = parseInt(match[2], 10);

  // Ajuste por si alguna hora viniera en formato 12h con "pm" (ej. "03:00 pm" -> 15:00)
  if (texto.includes('pm') && horas >= 1 && horas <= 11) {
    horas += 12;
  }

  return horas * 60 + minutos;
};

export const AdminPanel: React.FC = () => {
  const [registros, setRegistros] = useState<AlumnoEvidencia[]>([]);
  const [vistaActiva, setVistaActiva] = useState<'todos' | 'frecuentes'>('todos');
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroConferencia, setFiltroConferencia] = useState<string>('todas');
  const [cargando, setCargando] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [descargandoExcel, setDescargandoExcel] = useState<boolean>(false);
  const [descargandoRapido, setDescargandoRapido] = useState<boolean>(false);

  const cargarDatos = async () => {
    setCargando(true);
    setErrorMsg(null);

    try {
      let todosLosRegistros: AlumnoEvidencia[] = [];
      let desde = 0;
      const tamanoLote = 1000;
      let hayMas = true;

      while (hayMas) {
        const { data, error } = await supabase
          .from('registros_alumnos')
          .select('*')
          .order('hora', { ascending: false })
          .range(desde, desde + tamanoLote - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          todosLosRegistros = [...todosLosRegistros, ...(data as AlumnoEvidencia[])];
          desde += tamanoLote;
          if (data.length < tamanoLote) {
            hayMas = false;
          }
        } else {
          hayMas = false;
        }
      }

      setRegistros(todosLosRegistros);
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error al conectar con la base de datos.';
      console.error('Error al cargar datos:', err);
      setErrorMsg(mensaje);
      setRegistros([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Filtrado vista general
  const registrosFiltrados = registros.filter((reg) => {
    const query = busqueda.toLowerCase().trim();
    const coincideTexto =
      reg.nombre.toLowerCase().includes(query) ||
      reg.num_control.toLowerCase().includes(query) ||
      (reg.carrera && reg.carrera.toLowerCase().includes(query));

    let coincideConf = false;
    if (filtroConferencia === 'todas') {
      coincideConf = true;
    } else {
      const confReg = (reg.conferencia || '').toLowerCase();
      coincideConf = confReg.includes(filtroConferencia);
    }

    return coincideTexto && coincideConf;
  });

  // Agrupación por Número de Control conservando observaciones de cada conferencia
  const alumnosDosOMas = useMemo(() => {
    const mapa = new Map<string, AlumnoFrecuente>();

    registros.forEach((reg) => {
      const controlLimpio = (reg.num_control || '').trim().toUpperCase();
      if (!controlLimpio) return;

      const conferenciaLimpia = (reg.conferencia || '').trim();
      const tituloLimpio = (reg.titulo_evidencia || '').trim();
      const descripcionLimpia = (reg.descripcion || '').trim();

      if (!mapa.has(controlLimpio)) {
        mapa.set(controlLimpio, {
          num_control: controlLimpio,
          nombre: (reg.nombre || '').trim(),
          carrera: (reg.carrera || '').trim(),
          semestre: (reg.semestre || '').trim(),
          grupo: (reg.grupo || '').trim(),
          total_conferencias: conferenciaLimpia ? 1 : 0,
          detalles_conferencias: conferenciaLimpia
            ? [
                {
                  conferencia: conferenciaLimpia,
                  titulo_evidencia: tituloLimpio,
                  descripcion: descripcionLimpia,
                  hora: reg.hora,
                },
              ]
            : [],
        });
      } else {
        const existente = mapa.get(controlLimpio)!;
        const indiceExistente = existente.detalles_conferencias.findIndex(
          (item) => item.conferencia.toLowerCase() === conferenciaLimpia.toLowerCase()
        );

        if (conferenciaLimpia && indiceExistente === -1) {
          existente.detalles_conferencias.push({
            conferencia: conferenciaLimpia,
            titulo_evidencia: tituloLimpio,
            descripcion: descripcionLimpia,
            hora: reg.hora,
          });
          existente.total_conferencias = existente.detalles_conferencias.length;
        } else if (indiceExistente !== -1) {
          // Si ya existía esa conferencia pero el nuevo registro tiene observación y el anterior no, la completamos
          const previo = existente.detalles_conferencias[indiceExistente];
          if (!previo.descripcion && descripcionLimpia) {
            previo.descripcion = descripcionLimpia;
          }
          if (!previo.titulo_evidencia && tituloLimpio) {
            previo.titulo_evidencia = tituloLimpio;
          }
        }
      }
    });

    const query = busqueda.toLowerCase().trim();

return Array.from(mapa.values())
      .filter((alumno) => alumno.total_conferencias >= 2)
      .map((alumno) => ({
        ...alumno,
        // Ordenamos las conferencias del alumno cronológicamente (AM -> PM)
        detalles_conferencias: [...alumno.detalles_conferencias].sort(
          (a, b) => obtenerMinutosHorario(a.conferencia) - obtenerMinutosHorario(b.conferencia)
        ),
      }))
      .filter(
        (alumno) =>
          !query ||
          alumno.nombre.toLowerCase().includes(query) ||
          alumno.num_control.toLowerCase().includes(query) ||
          alumno.carrera.toLowerCase().includes(query)
      )
      .sort((a, b) => b.total_conferencias - a.total_conferencias);
  }, [registros, busqueda]);

  // Descargar Excel de la tabla (2+ Conferencias) con sus observaciones
  const handleDescargarExcelFrecuentes = () => {
    if (alumnosDosOMas.length === 0) {
      alert('No hay alumnos con 2 o más conferencias para exportar.');
      return;
    }

    const datosParaExcel = alumnosDosOMas.map((alumno, index) => {
      const resumenConferencias = alumno.detalles_conferencias
        .map((det, idx) => {
          const obs = det.descripcion ? ` (Obs: ${det.descripcion})` : '';
          const tit = det.titulo_evidencia ? ` - "${det.titulo_evidencia}"` : '';
          return `${idx + 1}. ${det.conferencia}${tit}${obs}`;
        })
        .join('\n');

      return {
        '#': index + 1,
        'No. Control': alumno.num_control,
        'Nombre Completo': alumno.nombre,
        'Carrera': alumno.carrera,
        'Semestre': alumno.semestre,
        'Grupo': alumno.grupo,
        'Total Conferencias': alumno.total_conferencias,
        'Conferencias y Observaciones': resumenConferencias,
      };
    });

    const hoja = XLSX.utils.json_to_sheet(datosParaExcel);
    hoja['!cols'] = [
      { wch: 5 },
      { wch: 15 },
      { wch: 34 },
      { wch: 28 },
      { wch: 10 },
      { wch: 8 },
      { wch: 18 },
      { wch: 80 },
    ];

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, '2 o mas Conferencias');
    XLSX.writeFile(
      libro,
      `alumnos_2+_conferencias_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const handleDescargarRapido = async () => {
    if (registrosFiltrados.length === 0) {
      alert('No hay registros en pantalla para exportar.');
      return;
    }
    setDescargandoRapido(true);
    try {
      await exportarTablaExcelRapido(
        registrosFiltrados,
        `reporte_rapido_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } catch (error) {
      console.error('Error al generar Excel rápido:', error);
      alert('Ocurrió un error al generar el archivo rápido.');
    } finally {
      setDescargandoRapido(false);
    }
  };

  const handleDescargarExcel = async () => {
    if (registrosFiltrados.length === 0) {
      alert('No hay registros en pantalla para exportar.');
      return;
    }

    setDescargandoExcel(true);
    try {
      await exportarTablaExcel(
        registrosFiltrados,
        `conferencias_checkpoint_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } catch (error) {
      console.error('Error al generar Excel:', error);
      alert('Ocurrió un error al procesar las fotos y generar el archivo.');
    } finally {
      setDescargandoExcel(false);
    }
  };

  const handleEliminarRegistro = async (id: string, nombreAlumno: string) => {
    const confirmar = window.confirm(
      `¿Deseas eliminar definitivamente el registro de ${nombreAlumno}?`
    );
    if (!confirmar) return;

    try {
      const { error } = await supabase
        .from('registros_alumnos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setRegistros((prev) => prev.filter((r) => r.id !== id));
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error al eliminar fila:', err);
      alert(`No se pudo eliminar el registro: ${mensaje}`);
    }
  };

  const handleReiniciarLista = async () => {
    const confirmacion = window.confirm(
      '⚠️ ADVERTENCIA: Esta acción es completamente IRREVERSIBLE.\n\n' +
        '¿Estás seguro de que deseas vaciar todos los registros para iniciar una nueva jornada?'
    );
    if (!confirmacion) return;

    try {
      setCargando(true);
      setErrorMsg(null);

      const { error } = await supabase
        .from('registros_alumnos')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;

      setRegistros([]);
      alert('✅ La lista se ha reiniciado exitosamente.');
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error al intentar vaciar la base de datos.';
      console.error('Error al vaciar registros:', err);
      setErrorMsg(mensaje);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={estilos.contenedor}>
      <header style={estilos.header}>
        <div style={estilos.logosContenedor}>
          <img
            src="/photos/Logo-TecNM.png"
            alt="Logo TecNM"
            style={estilos.logoTecnm}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div style={estilos.textoEncabezado}>
            <div style={estilos.badge}>TECNM TUXTLA</div>
            <h1 style={estilos.titulo}>CheckPoint — Panel de Conferencias</h1>
            <p style={estilos.subtitulo}>Supervisión y auditoría de asistencias</p>
          </div>
          <img
            src="/photos/tux.png"
            alt="Logo TecNM Tuxtla Gutiérrez"
            style={estilos.logoTuxtla}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      </header>

      {/* Selector de Pestañas / Secciones */}
      <div style={estilos.tabsContenedor}>
        <button
          type="button"
          onClick={() => setVistaActiva('todos')}
          style={{
            ...estilos.tabBoton,
            backgroundColor: vistaActiva === 'todos' ? '#1b365d' : '#f1f5f9',
            color: vistaActiva === 'todos' ? '#ffffff' : '#475569',
            boxShadow: vistaActiva === 'todos' ? '0 2px 6px rgba(27,54,93,0.25)' : 'none',
          }}
        >
          📋 Todos los Registros ({registros.length})
        </button>

        <button
          type="button"
          onClick={() => setVistaActiva('frecuentes')}
          style={{
            ...estilos.tabBoton,
            backgroundColor: vistaActiva === 'frecuentes' ? '#0f766e' : '#f0fdfa',
            color: vistaActiva === 'frecuentes' ? '#ffffff' : '#0f766e',
            border: vistaActiva === 'frecuentes' ? 'none' : '1px solid #99f6e4',
            boxShadow: vistaActiva === 'frecuentes' ? '0 2px 6px rgba(15,118,110,0.25)' : 'none',
          }}
        >
          🏆 2 o más Conferencias ({alumnosDosOMas.length})
        </button>
      </div>

      <section style={estilos.herramientas}>
        <div>
          {vistaActiva === 'todos' && (
            <button
              type="button"
              onClick={handleReiniciarLista}
              disabled={cargando || registros.length === 0}
              style={{
                ...estilos.botonReiniciar,
                backgroundColor: registros.length === 0 ? '#cbd5e1' : '#dc2626',
                cursor: registros.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              🗑️ Reiniciar Jornada
            </button>
          )}
        </div>

        <div style={estilos.filtrosDerecha}>
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, control..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={estilos.buscador}
          />

          {vistaActiva === 'todos' && (
            <select
              value={filtroConferencia}
              onChange={(e) => setFiltroConferencia(e.target.value)}
              style={estilos.select}
            >
              {OPCIONES_FILTRO.map((opcion) => (
                <option key={opcion.id} value={opcion.id}>
                  {opcion.label}
                </option>
              ))}
            </select>
          )}

          <button onClick={cargarDatos} disabled={cargando} style={estilos.botonRecargar}>
            {cargando ? 'Cargando...' : '🔄 Actualizar'}
          </button>

          {vistaActiva === 'todos' ? (
            <>
              <button
                onClick={handleDescargarExcel}
                disabled={descargandoExcel || registrosFiltrados.length === 0}
                style={{
                  ...estilos.botonExcel,
                  backgroundColor: registrosFiltrados.length === 0 ? '#94a3b8' : '#107c41',
                  cursor: registrosFiltrados.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                {descargandoExcel ? '⏳ Generando...' : '📊 Exportar XLSX'}
              </button>

              <button
                onClick={handleDescargarRapido}
                disabled={descargandoRapido || registrosFiltrados.length === 0}
                style={{
                  ...estilos.botonExcel,
                  backgroundColor: registrosFiltrados.length === 0 ? '#94a3b8' : '#0284c7',
                  cursor: registrosFiltrados.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                {descargandoRapido ? '⏳ Generando...' : '⚡ Excel Rápido (URLs)'}
              </button>
            </>
          ) : (
            <button
              onClick={handleDescargarExcelFrecuentes}
              disabled={alumnosDosOMas.length === 0}
              style={{
                ...estilos.botonExcel,
                backgroundColor: alumnosDosOMas.length === 0 ? '#94a3b8' : '#107c41',
                cursor: alumnosDosOMas.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              📥 Descargar Excel (2+ Conferencias)
            </button>
          )}
        </div>
      </section>

      {errorMsg && <div style={estilos.error}>{errorMsg}</div>}

      {vistaActiva === 'todos' ? (
        <>
          <div style={estilos.tablaWrapper}>
            <table style={estilos.tabla}>
              <thead>
                <tr style={estilos.thFila}>
                  <th style={estilos.th}>Evidencias (Hasta 5 fotos)</th>
                  <th style={estilos.th}>Estudiante / Control</th>
                  <th style={estilos.th}>Carrera y Semestre</th>
                  <th style={estilos.th}>Conferencia</th>
                  <th style={estilos.th}>Resumen / Aprendizaje</th>
                  <th style={{ ...estilos.th, textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {registrosFiltrados.length > 0 ? (
                  registrosFiltrados.map((item) => (
                    <tr key={item.id} style={estilos.tdFila}>
                      <td style={estilos.td}>
                        <div style={estilos.fotosContenedor}>
                          {[
                            item.evidencia_url_1,
                            item.evidencia_url_2,
                            item.evidencia_url_3,
                            item.evidencia_url_4,
                            item.evidencia_url_5,
                          ]
                            .filter((url): url is string => Boolean(url))
                            .map((url, index) => (
                              <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={url}
                                  alt={`Evidencia ${index + 1}`}
                                  referrerPolicy="no-referrer"
                                  style={estilos.fotoMiniatura}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://dummyimage.com/75x75/e2e8f0/4a5568.png&text=Foto+${index + 1}`;
                                  }}
                                />
                              </a>
                            ))}
                        </div>
                      </td>

                      <td style={estilos.td}>
                        <strong>{item.nombre}</strong>
                        <div style={estilos.tagControl}>{item.num_control}</div>
                      </td>

                      <td style={estilos.td}>
                        <div>{item.carrera}</div>
                        <small style={{ color: '#6b7280' }}>
                          Sem: {item.semestre} | Grupo: {item.grupo}
                        </small>
                      </td>

                      <td style={estilos.td}>
                        <span
                          style={{
                            ...estilos.badgeConf,
                            ...obtenerEstiloConferencia(item.conferencia),
                          }}
                        >
                          {item.conferencia}
                        </span>
                      </td>

                      <td style={estilos.td}>
                        <strong>{item.titulo_evidencia || 'Sin título'}</strong>
                        <p style={estilos.parrafoDesc}>{item.descripcion || 'Sin descripción'}</p>
                        <small style={{ color: '#9ca3af' }}>{new Date(item.hora).toLocaleString()}</small>
                      </td>

                      <td style={{ ...estilos.td, textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleEliminarRegistro(item.id, item.nombre)}
                          title="Eliminar este registro individual"
                          style={estilos.botonEliminarFila}
                        >
                          ❌ Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={estilos.sinResultados}>
                      {cargando ? 'Obteniendo información...' : 'No se encontraron registros en la base de datos.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <footer style={estilos.footer}>
            Mostrando <strong>{registrosFiltrados.length}</strong> de <strong>{registros.length}</strong> registros
          </footer>
        </>
      ) : (
        <>
          <div style={estilos.tablaWrapper}>
            <table style={estilos.tabla}>
              <thead>
                <tr style={estilos.thFila}>
                  <th style={estilos.th}>No. Control</th>
                  <th style={estilos.th}>Estudiante</th>
                  <th style={estilos.th}>Carrera y Semestre</th>
                  <th style={{ ...estilos.th, textAlign: 'center' }}>Total</th>
                  <th style={estilos.th}>Conferencias Asistidas y Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {alumnosDosOMas.length > 0 ? (
                  alumnosDosOMas.map((alumno, filaIdx) => (
                    <tr
                      key={alumno.num_control}
                      style={{
                        ...estilos.tdFila,
                        backgroundColor: filaIdx % 2 === 0 ? '#ffffff' : '#f8fafc',
                      }}
                    >
                      <td style={estilos.td}>
                        <div style={estilos.tagControlDestacado}>{alumno.num_control}</div>
                      </td>

                      <td style={estilos.td}>
                        <strong style={{ color: '#0f172a', fontSize: '14px' }}>{alumno.nombre}</strong>
                      </td>

                      <td style={estilos.td}>
                        <div style={{ fontWeight: 500, color: '#334155' }}>{alumno.carrera}</div>
                        <small style={{ color: '#64748b' }}>
                          Sem: {alumno.semestre} | Grupo: {alumno.grupo}
                        </small>
                      </td>

                      <td style={{ ...estilos.td, textAlign: 'center' }}>
                        <span
                          style={{
                            ...estilos.badgeTotal,
                            backgroundColor: alumno.total_conferencias >= 3 ? '#fef08a' : '#dcfce7',
                            color: alumno.total_conferencias >= 3 ? '#854d0e' : '#166534',
                            border:
                              alumno.total_conferencias >= 3
                                ? '1px solid #fde047'
                                : '1px solid #86efac',
                          }}
                        >
                          {alumno.total_conferencias} conf.
                        </span>
                      </td>

                      <td style={estilos.td}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {alumno.detalles_conferencias.map((det, idx) => {
                            const tieneObservacion = Boolean(
                              det.descripcion &&
                                det.descripcion.toLowerCase() !== 'sin descripción' &&
                                det.descripcion.toLowerCase() !== 'sin descripcion'
                            );
                            const tieneTitulo = Boolean(
                              det.titulo_evidencia &&
                                det.titulo_evidencia.toLowerCase() !== 'sin título' &&
                                det.titulo_evidencia.toLowerCase() !== 'sin titulo'
                            );

                            return (
                              <div key={idx} style={estilos.tarjetaDetalleConf}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <span
                                    style={{
                                      ...estilos.badgeConf,
                                      ...obtenerEstiloConferencia(det.conferencia),
                                    }}
                                  >
                                    {det.conferencia}
                                  </span>
                                  {tieneTitulo && (
                                    <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '12px' }}>
                                      — {det.titulo_evidencia}
                                    </span>
                                  )}
                                </div>

                                {tieneObservacion && (
                                  <div style={estilos.cajaObservacion}>
                                    <span style={{ fontWeight: 600, color: '#475569' }}>Observación: </span>
                                    {det.descripcion}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={estilos.sinResultados}>
                      {cargando
                        ? 'Procesando asistencias...'
                        : 'Aún no hay alumnos con 2 o más conferencias registradas.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <footer style={estilos.footer}>
            Total de alumnos acreditados con 2 o más conferencias: <strong>{alumnosDosOMas.length}</strong>
          </footer>
        </>
      )}
    </div>
  );
};

const estilos: { [key: string]: React.CSSProperties } = {
  contenedor: {
    maxWidth: '1280px',
    margin: '20px auto',
    padding: '24px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    fontFamily: 'Segoe UI, -apple-system, sans-serif',
    color: '#333',
  },
  header: { borderBottom: '2px solid #f3f4f6', paddingBottom: '16px', marginBottom: '20px' },
  logosContenedor: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' },
  logoTecnm: { height: '62px', objectFit: 'contain' },
  logoTuxtla: { height: '62px', objectFit: 'contain' },
  textoEncabezado: { textAlign: 'center', flex: 1, minWidth: '260px' },
  badge: { display: 'inline-block', backgroundColor: '#e0a926', color: '#ffffff', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', marginBottom: '6px' },
  titulo: { margin: '0 0 4px 0', fontSize: '24px', color: '#1b365d' },
  subtitulo: { margin: 0, fontSize: '14px', color: '#6b7280' },
  tabsContenedor: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '12px',
    flexWrap: 'wrap',
  },
  tabBoton: {
    border: 'none',
    padding: '10px 18px',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  herramientas: { display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' },
  botonReiniciar: { color: '#ffffff', border: 'none', padding: '9px 14px', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' },
  filtrosDerecha: { display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' },
  buscador: { minWidth: '220px', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px', outline: 'none' },
  select: { padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '13px', backgroundColor: '#f8fafc', outline: 'none', cursor: 'pointer' },
  botonRecargar: { backgroundColor: '#1b365d', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '9px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' },
  botonExcel: { color: '#ffffff', border: 'none', borderRadius: '8px', padding: '9px 14px', fontWeight: 600, fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' },
  error: { padding: '10px 14px', backgroundColor: '#fed7d7', color: '#c53030', borderRadius: '8px', marginBottom: '16px' },
  tablaWrapper: { overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' },
  tabla: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  thFila: { backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' },
  th: { padding: '14px 16px', fontWeight: 700, fontSize: '13px', color: '#1e293b' },
  tdFila: { borderBottom: '1px solid #e2e8f0' },
  td: { padding: '12px 16px', fontSize: '13px', verticalAlign: 'middle' },
  fotosContenedor: { display: 'flex', gap: '6px', flexWrap: 'wrap', maxWidth: '280px' },
  fotoMiniatura: { width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover', display: 'block', border: '1px solid #cbd5e0' },
  tagControl: { display: 'inline-block', backgroundColor: '#e2e8f0', color: '#334155', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', marginTop: '4px' },
  tagControlDestacado: {
    display: 'inline-block',
    backgroundColor: '#1b365d',
    color: '#ffffff',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '0.4px',
  },
  badgeConf: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '6px',
    fontWeight: 600,
    fontSize: '12px',
  },
  badgeTotal: {
    display: 'inline-block',
    padding: '5px 12px',
    borderRadius: '999px',
    fontWeight: 700,
    fontSize: '13px',
  },
  tarjetaDetalleConf: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '8px 10px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
  },
  cajaObservacion: {
    marginTop: '6px',
    padding: '6px 10px',
    backgroundColor: '#f8fafc',
    borderLeft: '3px solid #3b82f6',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#334155',
    lineHeight: '1.4',
  },
  parrafoDesc: { margin: '4px 0 6px 0', color: '#4b5563', fontSize: '12px', maxHeight: '40px', overflow: 'hidden', textOverflow: 'ellipsis' },
  botonEliminarFila: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    border: '1px solid #fca5a5',
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  sinResultados: { textAlign: 'center', padding: '30px', color: '#a0aec0', fontSize: '15px' },
  footer: { marginTop: '16px', fontSize: '13px', color: '#718096', textAlign: 'right' },
};