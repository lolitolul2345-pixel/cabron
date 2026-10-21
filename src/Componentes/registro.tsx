import { useState, useRef, useEffect, type ChangeEvent, type FormEvent, type DragEvent } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../api_supabase/supabaseClient';

// Tipado estricto del estado del formulario
interface EvidenceFormData {
  numeroControl: string;
  nombreAlumno: string;
  semestre: string;
  grupo: string;
  carrera: string;
  numeroConferencia: string;
  titulo: string;
  descripcion: string;
}

interface PreviewImage {
  file?: File;
  previewUrl: string;
}

const CARRERAS_TECNM = [
  'Ingeniería en Sistemas Computacionales',
  'Ingeniería en Gestión Empresarial',
  'Ingeniería Industrial',
  'Ingeniería Mecatrónica',
  'Ingeniería Electrónica',
  'Ingeniería Eléctrica',
  'Ingeniería Mecánica',
  'Ingeniería Química',
  'Ingeniería Bioquímica',
  'Ingeniería Logística',
];

// Opciones con valor completo para coincidir con el Excel agrupado
const CONFERENCIAS = [
  { id: 'Conferencia 1 (10:00 - 10:45AM)', label: 'Conferencia 1 (10:00 - 10:45AM)' },
  { id: 'Conferencia 2 (11:00 - 11:45AM)', label: 'Conferencia 2 (11:00 - 11:45AM)' },
  { id: 'Conferencia 3 (13:00 - 13:45PM)', label: 'Conferencia 3 (13:00 - 13:45PM)' },
  { id: 'Conferencia 4 (15:00 - 15:45PM)', label: 'Conferencia 4 (15:00 - 15:45PM)' },
  { id: 'Conferencia 1 (16:00 - 16:45PM)', label: 'Conferencia 1 (16:00 - 16:45PM)' },
  { id: 'Conferencia 2 (17:00 - 17:45PM)', label: 'Conferencia 2 (17:00 - 17:45PM)' },
  { id: 'Conferencia 3 (17:45 - 18:00PM)', label: 'Conferencia 3 (17:45 - 18:00PM)' },
  { id: 'Conferencia 4 (12:00 - 12:45PM)', label: 'Conferencia 4 (12:00 - 12:45PM)' },  
];

const SEMESTRES = ['1°', '2°', '3°', '4°', '5°', '6°', '7°', '8°', '9°', '10°+'];

export default function Registro() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState<EvidenceFormData>({
    numeroControl: '',
    nombreAlumno: '',
    semestre: '',
    grupo: '',
    carrera: '',
    numeroConferencia: '',
    titulo: '',
    descripcion: '',
  });

  const [imagenes, setImagenes] = useState<PreviewImage[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Estados para búsqueda y edición de registro
  const [modoEdicion, setModoEdicion] = useState<boolean>(false);
  const [idRegistroEdicion, setIdRegistroEdicion] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      imagenes.forEach((img) => {
        if (img.file) URL.revokeObjectURL(img.previewUrl);
      });
    };
  }, [imagenes]);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'grupo' || name === 'numeroControl' ? value.toUpperCase() : value,
    }));
    setErrorMsg(null);
  };

  const processFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSizeBytes = 20 * 1024 * 1024;
    const nuevasImagenes: PreviewImage[] = [];

    Array.from(files).forEach((file) => {
      if (!validTypes.includes(file.type)) {
        setErrorMsg('Formato no válido. Solo se permiten imágenes JPG, PNG o WEBP.');
        return;
      }
      if (file.size > maxSizeBytes) {
        setErrorMsg(`La imagen "${file.name}" supera el límite de 20 MB.`);
        return;
      }
      nuevasImagenes.push({
        file,
        previewUrl: URL.createObjectURL(file),
      });
    });

    if (nuevasImagenes.length > 0) {
      setErrorMsg(null);
      setImagenes((prev) => [...prev, ...nuevasImagenes].slice(0, 5));
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const removeImage = (indexToRemove: number) => {
    setImagenes((prev) => {
      const target = prev[indexToRemove];
      if (target && target.file) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  // Buscar un registro previamente guardado para corregir datos
  const handleBuscarParaEditar = async () => {
    if (!formData.numeroControl.trim() || !formData.numeroConferencia) {
      setErrorMsg('Ingresa tu número de control y selecciona la conferencia para buscar tu registro.');
      return;
    }

    setIsSearching(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { data, error } = await supabase
        .from('registros_alumnos')
        .select('*')
        .eq('num_control', formData.numeroControl.trim().toUpperCase())
        .eq('conferencia', formData.numeroConferencia)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setErrorMsg(`No se encontró registro para el N° de Control "${formData.numeroControl.trim()}" en la conferencia seleccionada.`);
        return;
      }

      setFormData({
        numeroControl: data.num_control || '',
        nombreAlumno: data.nombre || '',
        semestre: data.semestre || '',
        grupo: data.grupo || '',
        carrera: data.carrera || '',
        numeroConferencia: data.conferencia || '',
        titulo: data.titulo_evidencia || '',
        descripcion: data.descripcion || '',
      });

      const fotosGuardadas: PreviewImage[] = [
        data.evidencia_url_1,
        data.evidencia_url_2,
        data.evidencia_url_3,
        data.evidencia_url_4,
        data.evidencia_url_5,
      ]
        .filter((url): url is string => Boolean(url))
        .map((url) => ({ previewUrl: url }));

      setImagenes(fotosGuardadas);
      setIdRegistroEdicion(data.id);
      setModoEdicion(true);
      setSuccessMsg('✅ Registro encontrado. Modifica los campos que necesites y pulsa "Guardar Cambios".');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al buscar tu registro.');
    } finally {
      setIsSearching(false);
    }
  };

  const cancelarEdicion = () => {
    setModoEdicion(false);
    setIdRegistroEdicion(null);
    setImagenes([]);
    setSuccessMsg(null);
    setErrorMsg(null);
    setFormData({
      numeroControl: '',
      nombreAlumno: '',
      semestre: '',
      grupo: '',
      carrera: '',
      numeroConferencia: '',
      titulo: '',
      descripcion: '',
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!formData.numeroConferencia) {
      setErrorMsg('Por favor, selecciona el número de conferencia.');
      return;
    }

    if (imagenes.length < 2) {
      setErrorMsg('Debes adjuntar al menos 2 imágenes de evidencia (máximo 5).');
      return;
    }

    setIsSubmitting(true);

    try {
      const urlsSubidas: string[] = [];

      for (let i = 0; i < imagenes.length; i++) {
        const item = imagenes[i];
        if (item.file) {
          const fileExt = item.file.name.split('.').pop();
          const cleanControl = formData.numeroControl.replace(/[^a-zA-Z0-9]/g, '');
          const filePath = `${cleanControl}_${Date.now()}_${i + 1}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('evidencias')
            .upload(filePath, item.file);

          if (uploadError) {
            throw new Error(`Error al subir imagen ${i + 1}: ${uploadError.message}`);
          }

          const { data: publicUrlData } = supabase.storage
            .from('evidencias')
            .getPublicUrl(filePath);

          urlsSubidas.push(publicUrlData.publicUrl);
        } else {
          urlsSubidas.push(item.previewUrl);
        }
      }

      if (modoEdicion && idRegistroEdicion) {
        // MODO EDICIÓN
        const { error: updateError } = await supabase
          .from('registros_alumnos')
          .update({
            num_control: formData.numeroControl.trim(),
            nombre: formData.nombreAlumno.trim(),
            carrera: formData.carrera,
            semestre: formData.semestre,
            grupo: formData.grupo.trim(),
            conferencia: formData.numeroConferencia,
            titulo_evidencia: formData.titulo.trim(),
            descripcion: formData.descripcion.trim() || null,
            evidencia_url_1: urlsSubidas[0] || null,
            evidencia_url_2: urlsSubidas[1] || null,
            evidencia_url_3: urlsSubidas[2] || null,
            evidencia_url_4: urlsSubidas[3] || null,
            evidencia_url_5: urlsSubidas[4] || null,
          })
          .eq('id', idRegistroEdicion);

        if (updateError) throw updateError;

        setSuccessMsg('¡Tu registro de asistencia ha sido actualizado exitosamente!');
        setModoEdicion(false);
        setIdRegistroEdicion(null);
      } else {
        // NUEVO REGISTRO
        const { error: insertError } = await supabase
          .from('registros_alumnos')
          .insert([
            {
              num_control: formData.numeroControl.trim(),
              nombre: formData.nombreAlumno.trim(),
              carrera: formData.carrera,
              semestre: formData.semestre,
              grupo: formData.grupo.trim(),
              conferencia: formData.numeroConferencia,
              titulo_evidencia: formData.titulo.trim(),
              descripcion: formData.descripcion.trim() || null,
              evidencia_url_1: urlsSubidas[0] || null,
              evidencia_url_2: urlsSubidas[1] || null,
              evidencia_url_3: urlsSubidas[2] || null,
              evidencia_url_4: urlsSubidas[3] || null,
              evidencia_url_5: urlsSubidas[4] || null,
              hora: new Date().toISOString(),
            },
          ]);

        if (insertError) {
          console.error('Error al insertar registro:', insertError);
          throw new Error(`Error en base de datos: ${insertError.message}`);
        }

        setSuccessMsg('¡Evidencia registrada exitosamente en CheckPoint!');
      }

      // Limpiar formulario
      imagenes.forEach((img) => {
        if (img.file) URL.revokeObjectURL(img.previewUrl);
      });
      setImagenes([]);
      setFormData({
        numeroControl: '',
        nombreAlumno: '',
        semestre: '',
        grupo: '',
        carrera: '',
        numeroConferencia: '',
        titulo: '',
        descripcion: '',
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error al procesar tu registro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* BARRA SUPERIOR INSTITUCIONAL (TecNM Azul Marino #1B396A) */}
      <header className="bg-[#1B396A] text-white shadow-md border-b-4 border-amber-500 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-tight text-white">
              CHECKPOINT
            </span>
            <span className="hidden sm:inline-block text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-md">
              TecNM Tuxtla
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/25 border border-white/20 text-sm font-semibold text-white transition-all duration-200 shadow-sm cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="w-4 h-4 text-amber-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>
            <span>Iniciar sesión</span>
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1B396A] tracking-tight">
            {modoEdicion ? 'Corregir Evidencia de Conferencia' : 'Registro de Evidencia de Conferencias'}
          </h1>
          <p className="mt-1.5 text-sm sm:text-base text-slate-600">
            {modoEdicion
              ? 'Estás en modo edición. Haz los cambios necesarios y presiona "Guardar Cambios".'
              : 'Completa tus datos académicos, selecciona la conferencia correspondiente y adjunta tu evidencia fotográfica de participación.'}
          </p>
        </div>

        {/* BANNER DE BÚSQUEDA PARA EDITAR REGISTROS PREVIOS */}
        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div>
            <span className="text-sm font-bold text-[#1B396A]">¿Te equivocaste en un registro enviado previamente?</span>
            <p className="text-xs text-slate-600 mt-0.5">
              Ingresa tu N° de Control, selecciona la conferencia abajo y haz clic en buscar para modificarlo.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={handleBuscarParaEditar}
              disabled={isSearching}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-900 font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSearching ? 'Buscando...' : '🔍 Buscar para Editar'}
            </button>
            {modoEdicion && (
              <button
                type="button"
                onClick={cancelarEdicion}
                className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-3 shadow-xs">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-3 shadow-xs">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden"
        >
          {/* ZONA BLANCA INSTITUCIONAL CON AMBOS LOGOTIPOS */}
          <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6 bg-white">
            <img
              src="/photos/Logo-TecNM.png"
              alt="Logo TecNM"
              className="h-16 w-auto object-contain shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />

            <div className="text-center flex-1">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full mb-1.5">
                TecNM Campus Tuxtla Gutiérrez
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-[#1B396A] tracking-tight">
                Registro de Evidencia de Conferencias
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
                Completa tus datos académicos y adjunta tu comprobante fotográfico de participación.
              </p>
            </div>

            <img
              src="/photos/tux.png"
              alt="Logo TecNM Tuxtla Gutiérrez"
              className="h-16 w-auto object-contain shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          {/* SECCIÓN 1: DATOS ACADÉMICOS */}
          <div className="p-6 sm:p-8 border-b border-slate-100">
            <div className="flex items-center gap-2.5 mb-6">
              <span className="w-2 h-6 rounded-full bg-[#1B396A]" />
              <h2 className="text-lg font-bold text-slate-900">
                1. Datos Académicos del Alumno
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
              <div className="sm:col-span-4">
                <label htmlFor="numeroControl" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Número de control <span className="text-red-500">*</span>
                </label>
                <input
                  id="numeroControl"
                  name="numeroControl"
                  type="text"
                  required
                  maxLength={10}
                  placeholder="Ej. 25270123"
                  value={formData.numeroControl}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#1B396A] focus:ring-3 focus:ring-[#1B396A]/15 transition-all"
                />
              </div>

              <div className="sm:col-span-8">
                <label htmlFor="nombreAlumno" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Nombre completo del alumno <span className="text-red-500">*</span>
                </label>
                <input
                  id="nombreAlumno"
                  name="nombreAlumno"
                  type="text"
                  required
                  placeholder="Apellido Paterno, Apellido Materno y Nombres"
                  value={formData.nombreAlumno}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#1B396A] focus:ring-3 focus:ring-[#1B396A]/15 transition-all"
                />
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="carrera" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Carrera <span className="text-red-500">*</span>
                </label>
                <select
                  id="carrera"
                  name="carrera"
                  required
                  value={formData.carrera}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm font-medium focus:bg-white focus:outline-none focus:border-[#1B396A] focus:ring-3 focus:ring-[#1B396A]/15 transition-all"
                >
                  <option value="" disabled>
                    Selecciona tu ingeniería...
                  </option>
                  {CARRERAS_TECNM.map((carrera) => (
                    <option key={carrera} value={carrera}>
                      {carrera}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="semestre" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Semestre <span className="text-red-500">*</span>
                </label>
                <select
                  id="semestre"
                  name="semestre"
                  required
                  value={formData.semestre}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm font-medium focus:bg-white focus:outline-none focus:border-[#1B396A] focus:ring-3 focus:ring-[#1B396A]/15 transition-all"
                >
                  <option value="" disabled>
                    Semestre
                  </option>
                  {SEMESTRES.map((sem) => (
                    <option key={sem} value={sem}>
                      {sem} Semestre
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="grupo" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Grupo <span className="text-red-500">*</span>
                </label>
                <input
                  id="grupo"
                  name="grupo"
                  type="text"
                  required
                  maxLength={5}
                  placeholder="Ej. A, B, S2B"
                  value={formData.grupo}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#1B396A] focus:ring-3 focus:ring-[#1B396A]/15 transition-all"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: INFORMACIÓN DE LA CONFERENCIA */}
          <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/30">
            <div className="flex items-center gap-2.5 mb-6">
              <span className="w-2 h-6 rounded-full bg-amber-500" />
              <h2 className="text-lg font-bold text-slate-900">
                2. Información de la Conferencia y Evidencia
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
              <div className="sm:col-span-5">
                <label htmlFor="numeroConferencia" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Número de conferencia <span className="text-red-500">*</span>
                </label>
                <select
                  id="numeroConferencia"
                  name="numeroConferencia"
                  required
                  value={formData.numeroConferencia}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold focus:outline-none focus:border-[#1B396A] focus:ring-3 focus:ring-[#1B396A]/15 transition-all"
                >
                  <option value="" disabled>
                    Selecciona la conferencia...
                  </option>
                  {CONFERENCIAS.map((conf) => (
                    <option key={conf.id} value={conf.id}>
                      {conf.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-7">
                <label htmlFor="titulo" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Título de la evidencia <span className="text-red-500">*</span>
                </label>
                <input
                  id="titulo"
                  name="titulo"
                  type="text"
                  required
                  placeholder="Ej. Asistencia y participación"
                  value={formData.titulo}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#1B396A] focus:ring-3 focus:ring-[#1B396A]/15 transition-all"
                />
              </div>

              <div className="sm:col-span-12">
                <label htmlFor="descripcion" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Descripción / Conclusión de lo aprendido <span className="text-slate-400 font-normal lowercase">(opcional)</span>
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  rows={3}
                  placeholder="Describe brevemente los puntos clave o conclusiones (opcional)..."
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#1B396A] focus:ring-3 focus:ring-[#1B396A]/15 transition-all resize-y"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: SUBIR FOTOS */}
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-6 rounded-full bg-[#1B396A]" />
                <h2 className="text-lg font-bold text-slate-900">
                  3. Adjuntar Evidencia Fotográfica <span className="text-red-500">*</span>
                </h2>
              </div>
              <span className="text-xs font-medium text-slate-500">
                {imagenes.length} / 5 imágenes (mínimo 2)
              </span>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? 'border-[#1B396A] bg-blue-50/70'
                  : 'border-slate-300 hover:border-[#1B396A] bg-slate-50/60 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="mx-auto w-14 h-14 rounded-2xl bg-[#1B396A]/10 text-[#1B396A] flex items-center justify-center mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                  className="w-7 h-7"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                  />
                </svg>
              </div>

              <p className="text-sm font-semibold text-slate-800">
                Haz clic para seleccionar una imagen{' '}
                <span className="font-normal text-slate-500">o arrástrala aquí</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Formatos permitidos: PNG, JPG o WEBP (Máx. 20 MB)
              </p>
            </div>

            {imagenes.length > 0 && (
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {imagenes.map((item, idx) => (
                  <div
                    key={item.previewUrl}
                    className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video shadow-xs"
                  >
                    <img
                      src={item.previewUrl}
                      alt={`Evidencia ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(idx);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-md cursor-pointer"
                      >
                        Eliminar
                      </button>
                    </div>
                    <span className="absolute bottom-2 left-2 bg-slate-900/75 text-white text-[11px] font-medium px-2 py-0.5 rounded-md truncate max-w-[85%]">
                      {item.file ? item.file.name : `Foto actual ${idx + 1}`}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full sm:w-auto min-w-[220px] py-3.5 px-6 rounded-xl text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  modoEdicion
                    ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 shadow-amber-600/20'
                    : 'bg-[#1B396A] hover:bg-[#152d54] active:bg-[#102240] shadow-[#1B396A]/20'
                } disabled:bg-slate-300 disabled:text-slate-500`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{modoEdicion ? 'Actualizando...' : 'Enviando evidencia...'}</span>
                  </>
                ) : modoEdicion ? (
                  'Guardar Cambios en Evidencia'
                ) : (
                  'Registrar Evidencia'
                )}
              </button>
            </div>
          </div>
        </form>
      </main>

      <footer className="py-5 text-center text-xs text-slate-500 border-t border-slate-200/80 bg-white">
        Sistema CheckPoint • Tecnológico Nacional de México Campus Tuxtla Gutiérrez
      </footer>
    </div>
  );
}
