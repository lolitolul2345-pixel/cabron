import React, { useState } from 'react';
import { supabase } from '../api_supabase/supabaseClient';


interface LoginOTPProps {
  onLoginExitoso: () => void;
}

export const LoginOTP: React.FC<LoginOTPProps> = ({ onLoginExitoso }) => {
  const [correo, setCorreo] = useState<string>('');
  const [codigo, setCodigo] = useState<string>('');
  const [codigoEnviado, setCodigoEnviado] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(false);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // 1. Enviar el código de 6 dígitos al correo vía Supabase + Brevo
  const handleEnviarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensajeError(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: correo.trim(),
        options: {
          shouldCreateUser: false // Solo permite entrar a correos ya autorizados
        }
      });

      if (error) throw error;
      setCodigoEnviado(true);
    } catch (err: any) {
      setMensajeError(err.message || 'Error al enviar el código de verificación.');
    } finally {
      setCargando(false);
    }
  };

  // 2. Verificar el código de 6 dígitos ingresado
  const handleVerificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensajeError(null);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: correo.trim(),
        token: codigo.trim(),
        type: 'email'
      });

      if (error) throw error;

      if (data.session) {
        onLoginExitoso();
      }
    } catch (err: any) {
      setMensajeError(err.message || 'Código incorrecto o expirado.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={estilos.tarjeta}>
      <h2 style={estilos.titulo}>CheckPoint Admin</h2>
      <p style={estilos.subtitulo}>
        {!codigoEnviado
          ? 'Ingresa tu correo para recibir tu código de acceso'
          : `Ingresa el código enviado a ${correo}`}
      </p>

      {mensajeError && <div style={estilos.error}>{mensajeError}</div>}

      {!codigoEnviado ? (
        <form onSubmit={handleEnviarCodigo}>
          <input
            type="email"
            placeholder="correo@ejemplo.com"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
            style={estilos.input}
          />
          <button type="submit" disabled={cargando} style={estilos.boton}>
            {cargando ? 'Enviando...' : 'Enviar Código OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerificarCodigo}>
          <input
            type="text"
            placeholder="Código de 6 dígitos"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            maxLength={6}
            required
            style={{ ...estilos.input, letterSpacing: '4px', textAlign: 'center', fontSize: '18px' }}
          />
          <button type="submit" disabled={cargando} style={estilos.boton}>
            {cargando ? 'Verificando...' : 'Verificar e Ingresar'}
          </button>
          <button
            type="button"
            onClick={() => { setCodigoEnviado(false); setCodigo(''); }}
            style={estilos.botonSecundario}
          >
            Cambiar correo
          </button>
        </form>
      )}
    </div>
  );
};

const estilos: { [key: string]: React.CSSProperties } = {
  tarjeta: {
    maxWidth: '380px',
    margin: '80px auto',
    padding: '30px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    fontFamily: 'Segoe UI, sans-serif',
    textAlign: 'center'
  },
  titulo: { margin: '0 0 8px 0', fontSize: '22px', color: '#1a202c' },
  subtitulo: { margin: '0 0 20px 0', fontSize: '14px', color: '#718096' },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e0',
    marginBottom: '15px',
    fontSize: '15px',
    outline: 'none'
  },
  boton: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#3182ce',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: '8px'
  },
  botonSecundario: {
    background: 'none',
    border: 'none',
    color: '#718096',
    fontSize: '13px',
    cursor: 'pointer',
    marginTop: '6px'
  },
  error: {
    padding: '10px',
    backgroundColor: '#fed7d7',
    color: '#c53030',
    borderRadius: '8px',
    marginBottom: '15px',
    fontSize: '13px'
  }
};