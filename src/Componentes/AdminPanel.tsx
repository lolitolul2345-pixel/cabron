import React, { useState, useEffect } from 'react';
import { supabase } from '../api_supabase/supabaseClient';
export interface AlumnoEvidencia {
  id: string;
  num_control: string;
  nombre: string;
  carrera: string;
  semestre: string;
  grupo: string;
  conferencia: string;          // ej. "Conferencia 1", "Conferencia 2", etc.
  titulo_evidencia: string;
  descripcion: string;
  evidencia_url_1?: string;     // Foto 1
  evidencia_url_2?: string;     // Foto 2
  hora: string;
}
import { exportarTablaExcel } from '../utils/excelExporter';

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

      if (data && data.length > 0) {
        setRegistros(data as AlumnoEvidencia[]);
      } else {
        // Datos de prueba con el esquema completo de las 4 conferencias
        setRegistros([
          {
            id: '1',
            num_control: '25270123',
            nombre: 'Gómez Hernández Alejandro',
            carrera: 'Ingeniería en Sistemas Computacionales',
            semestre: '2',
            grupo: 'A',
            conferencia: 'Conferencia 1',
            titulo_evidencia: 'Ponencia de IA y Ciberseguridad',
            descripcion: 'Se abordaron modelos fundacionales y defensas perimetrales.',
            evidencia_url_1: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
            evidencia_url_2: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=300',
            hora: new Date().toISOString()
          },
          {
            id: '2',
            num_control: '24270088',
            nombre: 'López Morales Brenda',
            carrera: 'Ingeniería Química',
            semestre: '4',
            grupo: 'B',
            conferencia: 'Conferencia 2',
            titulo_evidencia: 'Transición Energética Sostenible',
            descripcion: 'Uso de biocombustibles en la industria química.',
            evidencia_url_1: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300',
            evidencia_url_2: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300',
            hora: new Date().toISOString()
          }
        ]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al conectar con la base de datos.');
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

  return (
    <div style={estilos.contenedor}>
      {/* Encabezado Institucional TecNM Tuxtla */}
      <header style={estilos.header}>
        <div style={estilos.badge}>TECNM TUXTLA</div>
        <h1 style={estilos.titulo}>CheckPoint — Panel de Conferencias</h1>
        <p style={estilos.subtitulo}>Supervisión y auditoría de asistencias con doble evidencia fotográfica</p>
      </header>

      {/* Barra de Búsqueda, Filtro y Acciones */}
      <section style={estilos.herramientas}>
        <input
          type="text"
          placeholder="🔍 Buscar por nombre, núm. control o carrera..."
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
        </select>

        <div style={estilos.botonesGrupo}>
          <button onClick={cargarDatos} disabled={cargando} style={estilos.botonRecargar}>
            {cargando ? 'Cargando...' : '🔄 Actualizar'}
          </button>

          <button
            onClick={handleDescargarExcel}
            disabled={descargandoExcel}
            style={estilos.botonExcel}
          >
            {descargandoExcel ? '⏳ Generando reporte...' : '📊 Exportar XLSX Agrupado'}
          </button>
        </div>
      </section>

      {errorMsg && <div style={estilos.error}>{errorMsg}</div>}

      {/* Tabla Principal */}
      <div style={estilos.tablaWrapper}>
        <table style={estilos.tabla}>
          <thead>
            <tr style={estilos.thFila}>
              <th style={estilos.th}>Evidencias (Foto 1 y 2)</th>
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
                  {/* Dos evidencias fotográficas en tamaño legible */}
                  <td style={estilos.td}>
                    <div style={estilos.fotosContenedor}>
                      {item.evidencia_url_1 ? (
                        <a href={item.evidencia_url_1} target="_blank" rel="noopener noreferrer">
                          <img
                            src={item.evidencia_url_1}
                            alt="Evidencia 1"
                            referrerPolicy="no-referrer"
                            style={estilos.fotoGrande}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://dummyimage.com/75x75/e2e8f0/4a5568.png&text=Foto+1';
                            }}
                          />
                        </a>
                      ) : (
                        <div style={estilos.sinFoto}>Sin Foto 1</div>
                      )}

                      {item.evidencia_url_2 ? (
                        <a href={item.evidencia_url_2} target="_blank" rel="noopener noreferrer">
                          <img
                            src={item.evidencia_url_2}
                            alt="Evidencia 2"
                            referrerPolicy="no-referrer"
                            style={estilos.fotoGrande}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://dummyimage.com/75x75/e2e8f0/4a5568.png&text=Foto+2';
                            }}
                          />
                        </a>
                      ) : (
                        <div style={estilos.sinFoto}>Sin Foto 2</div>
                      )}
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
                    <p style={estilos.parrafoDesc}>{item.descripcion}</p>
                    <small style={{ color: '#9ca3af' }}>{new Date(item.hora).toLocaleString()}</small>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={estilos.sinResultados}>
                  {cargando ? 'Obteniendo información...' : 'No se encontraron registros coincidentes.'}
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
    maxWidth: '1200px',
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
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  buscador: {
    flex: 1,
    minWidth: '260px',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e0',
    fontSize: '14px',
    outline: 'none'
  },
  select: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e0',
    fontSize: '14px',
    backgroundColor: '#f8fafc',
    outline: 'none',
    cursor: 'pointer'
  },
  botonesGrupo: { display: 'flex', gap: '10px' },
  botonRecargar: {
    backgroundColor: '#1b365d',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 16px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '14px'
  },
  botonExcel: {
    backgroundColor: '#107c41',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 16px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '14px'
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
  fotosContenedor: { display: 'flex', gap: '8px' },
  fotoGrande: {
    width: '175px',
    height: '175px',
    borderRadius: '8px',
    objectFit: 'cover',
    display: 'block',
    border: '1px solid #cbd5e0'
  },
  sinFoto: {
    width: '175px',
    height: '175px',
    borderRadius: '8px',
    backgroundColor: '#f8fafc',
    border: '1px dashed #cbd5e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    color: '#9ca3af'
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