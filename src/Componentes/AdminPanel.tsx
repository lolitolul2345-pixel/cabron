import React, { useState, useEffect } from 'react';
import { supabase } from '../api_supabase/supabaseClient';
import { exportarTablaExcel } from '../utils/excelExporter';

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

export const AdminPanel: React.FC = () => {
  const [registros, setRegistros] = useState<AlumnoEvidencia[]>([]);
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroConferencia, setFiltroConferencia] = useState<string>('todas');
  const [cargando, setCargando] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [descargandoExcel, setDescargandoExcel] = useState<boolean>(false);

  const cargarDatos = async () => {
    setCargando(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase
        .from('registros_alumnos')
        .select('*')
        .order('hora', { ascending: false });

      if (error) throw error;

      setRegistros((data as AlumnoEvidencia[]) || []);
    } catch (err: any) {
      console.error('Error al cargar datos:', err);
      setErrorMsg(err.message || 'Error al conectar con la base de datos.');
      setRegistros([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const registrosFiltrados = registros.filter((reg) => {
    const query = busqueda.toLowerCase().trim();
    const coincideTexto =
      reg.nombre.toLowerCase().includes(query) ||
      reg.num_control.toLowerCase().includes(query) ||
      (reg.carrera && reg.carrera.toLowerCase().includes(query));

    const coincideConf =
      filtroConferencia === 'todas' || reg.conferencia === filtroConferencia;

    return coincideTexto && coincideConf;
  });

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

  // Función para vaciar la tabla tras confirmación del usuario
  const handleReiniciarLista = async () => {
    const confirmacion = window.confirm(
      '⚠️ ADVERTENCIA: Esta acción es completamente IRREVERSIBLE.\n\n' +
      '¿Estás seguro de que deseas vaciar todos los registros de los alumnos para iniciar una nueva jornada?\n\n' +
      '(Asegúrate de haber descargado el reporte en Excel antes de continuar).'
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
      alert('✅ La lista se ha reiniciado exitosamente. La tabla está lista para un nuevo día.');
    } catch (err: any) {
      console.error('Error al vaciar registros:', err);
      setErrorMsg(err.message || 'Error al intentar vaciar la base de datos.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={estilos.contenedor}>
      {/* ENCABEZADO INSTITUCIONAL CON LOGOTIPOS TUXTLA / TECNM */}
      <header style={estilos.header}>
        <div style={estilos.logosContenedor}>
          {/* Logo TecNM */}
          <img
            src="/photos/Logo-TecNM.png"
            alt="Logo TecNM"
            style={estilos.logoTecnm}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />

          {/* Título central */}
          <div style={estilos.textoEncabezado}>
            <div style={estilos.badge}>TECNM TUXTLA</div>
            <h1 style={estilos.titulo}>CheckPoint — Panel de Conferencias</h1>
            <p style={estilos.subtitulo}>Supervisión y auditoría de asistencias con evidencias fotográficas</p>
          </div>

          {/* Escudo TecNM Tuxtla Gutiérrez */}
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

      {/* BARRA DE HERRAMIENTAS: REINICIO A LA IZQUIERDA, FILTROS Y EXCEL A LA DERECHA */}
      <section style={estilos.herramientas}>
        {/* BOTÓN REINICIAR JORNADA */}
        <div>
          <button
            type="button"
            onClick={handleReiniciarLista}
            disabled={cargando || registros.length === 0}
            title="Borra todos los registros actuales para iniciar un nuevo día"
            style={{
              ...estilos.botonReiniciar,
              backgroundColor: registros.length === 0 ? '#cbd5e1' : '#dc2626',
              cursor: registros.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Reiniciar Jornada (Vaciar Lista)
          </button>
        </div>

        {/* CONTROLES DERECHA */}
        <div style={estilos.filtrosDerecha}>
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, núm. control..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={estilos.buscador}
          />

          <select
            value={filtroConferencia}
            onChange={(e) => setFiltroConferencia(e.target.value)}
            style={estilos.select}
          >
            <option value="todas">Todas las conferencias</option>
            <option value="Conferencia 1">Conferencia 1</option>
            <option value="Conferencia 2">Conferencia 2</option>
            <option value="Conferencia 3">Conferencia 3</option>
            <option value="Conferencia 4">Conferencia 4</option>
            <option value="Conferencia 1 PM">Conferencia 1 PM</option>
            <option value="Conferencia 2 PM">Conferencia 2 PM</option>
            <option value="Conferencia 3 PM">Conferencia 3 PM</option>
            <option value="Conferencia 4 PM">Conferencia 4 PM</option>
          </select>

          <button onClick={cargarDatos} disabled={cargando} style={estilos.botonRecargar}>
            {cargando ? 'Cargando...' : '🔄 Actualizar'}
          </button>

          <button
            onClick={handleDescargarExcel}
            disabled={descargandoExcel || registrosFiltrados.length === 0}
            style={{
              ...estilos.botonExcel,
              backgroundColor: registrosFiltrados.length === 0 ? '#94a3b8' : '#107c41',
              cursor: registrosFiltrados.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            {descargandoExcel ? '⏳ Generando...' : '📊 Exportar XLSX Agrupado'}
          </button>
        </div>
      </section>

      {errorMsg && <div style={estilos.error}>{errorMsg}</div>}

      {/* TABLA PRINCIPAL DE REGISTROS */}
      <div style={estilos.tablaWrapper}>
        <table style={estilos.tabla}>
          <thead>
            <tr style={estilos.thFila}>
              <th style={estilos.th}>Evidencias (Hasta 5 fotos)</th>
              <th style={estilos.th}>Estudiante / Control</th>
              <th style={estilos.th}>Carrera y Semestre</th>
              <th style={estilos.th}>Conferencia</th>
              <th style={estilos.th}>Resumen / Aprendizaje</th>
            </tr>
          </thead>
          <tbody>
            {registrosFiltrados.length > 0 ? (
              registrosFiltrados.map((item) => (
                <tr key={item.id} style={estilos.tdFila}>
                  {/* Evidencias: Lista dinámica de miniaturas (hasta 5) */}
                  <td style={estilos.td}>
                    <div style={estilos.fotosContenedor}>
                      {[
                        item.evidencia_url_1,
                        item.evidencia_url_2,
                        item.evidencia_url_3,
                        item.evidencia_url_4,
                        item.evidencia_url_5
                      ]
                        .filter((url): url is string => Boolean(url))
                        .map((url, index) => (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
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
                    <span style={estilos.badgeConf}>{item.conferencia}</span>
                  </td>

                  <td style={estilos.td}>
                    <strong>{item.titulo_evidencia || 'Sin título'}</strong>
                    <p style={estilos.parrafoDesc}>{item.descripcion || 'Sin descripción'}</p>
                    <small style={{ color: '#9ca3af' }}>{new Date(item.hora).toLocaleString()}</small>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={estilos.sinResultados}>
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
    color: '#333'
  },
  header: {
    borderBottom: '2px solid #f3f4f6',
    paddingBottom: '16px',
    marginBottom: '20px'
  },
  logosContenedor: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap'
  },
  logoTecnm: {
    height: '62px',
    objectFit: 'contain'
  },
  logoTuxtla: {
    height: '62px',
    objectFit: 'contain'
  },
  textoEncabezado: {
    textAlign: 'center',
    flex: 1,
    minWidth: '260px'
  },
  badge: {
    display: 'inline-block',
    backgroundColor: '#e0a926',
    color: '#ffffff',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
    marginBottom: '6px'
  },
  titulo: { margin: '0 0 4px 0', fontSize: '24px', color: '#1b365d' },
  subtitulo: { margin: 0, fontSize: '14px', color: '#6b7280' },
  herramientas: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  botonReiniciar: {
    color: '#ffffff',
    border: 'none',
    padding: '9px 14px',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '13px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)'
  },
  filtrosDerecha: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  buscador: {
    minWidth: '220px',
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e0',
    fontSize: '13px',
    outline: 'none'
  },
  select: {
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e0',
    fontSize: '13px',
    backgroundColor: '#f8fafc',
    outline: 'none',
    cursor: 'pointer'
  },
  botonRecargar: {
    backgroundColor: '#1b365d',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '9px 14px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '13px'
  },
  botonExcel: {
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '9px 14px',
    fontWeight: 600,
    fontSize: '13px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px'
  },
  error: {
    padding: '10px 14px',
    backgroundColor: '#fed7d7',
    color: '#c53030',
    borderRadius: '8px',
    marginBottom: '16px'
  },
  tablaWrapper: {
    overflowX: 'auto',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },
  tabla: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  thFila: {
    backgroundColor: '#f8fafc',
    borderBottom: '2px solid #e2e8f0'
  },
  th: {
    padding: '14px 16px',
    fontWeight: 600,
    fontSize: '13px',
    color: '#374151'
  },
  tdFila: { borderBottom: '1px solid #edf2f7' },
  td: {
    padding: '12px 16px',
    fontSize: '13px',
    verticalAlign: 'middle'
  },
  fotosContenedor: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    maxWidth: '280px'
  },
  fotoMiniatura: {
    width: '64px',
    height: '64px',
    borderRadius: '8px',
    objectFit: 'cover',
    display: 'block',
    border: '1px solid #cbd5e0'
  },
  tagControl: {
    display: 'inline-block',
    backgroundColor: '#e2e8f0',
    color: '#334155',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '12px',
    marginTop: '4px'
  },
  badgeConf: {
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    padding: '4px 8px',
    borderRadius: '6px',
    fontWeight: 600,
    fontSize: '12px'
  },
  parrafoDesc: {
    margin: '4px 0 6px 0',
    color: '#4b5563',
    fontSize: '12px',
    maxHeight: '40px',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  sinResultados: {
    textAlign: 'center',
    padding: '30px',
    color: '#a0aec0',
    fontSize: '15px'
  },
  footer: {
    marginTop: '16px',
    fontSize: '13px',
    color: '#718096',
    textAlign: 'right'
  }
};