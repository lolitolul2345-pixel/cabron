import React, { useState } from 'react';
import { supabase } from '../api_supabase/supabaseClient';

interface LoginOTPProps {
  onLoginExitoso: () => void;
}

export const LoginOTP: React.FC<LoginOTPProps> = ({ onLoginExitoso }) => {
  const [correo, setCorreo] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(false);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // Inicio de sesión directo con correo y contraseña fija (sin enviar correos)
  const handleIniciarSesion = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensajeError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: correo.trim(),
        password: password.trim(),
      });

      if (error) throw error;

      if (data.session) {
        onLoginExitoso();
      }
    } catch (err: any) {
      setMensajeError(err.message || 'Credenciales incorrectas. Verifica tu correo y contraseña.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={estilos.tarjeta}>
      <h2 style={estilos.titulo}>CheckPoint Admin</h2>
      <p style={estilos.subtitulo}>
        Ingresa tus credenciales de administrador para continuar
      </p>

      {mensajeError && <div style={estilos.error}>{mensajeError}</div>}

      <form onSubmit={handleIniciarSesion}>
        <div style={{ textAlign: 'left', marginBottom: '6px' }}>
          <label style={estilos.etiqueta}>Correo institucional</label>
        </div>
        <input
          type="email"
          placeholder="admin@tuxtla.tecnm.mx"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          required
          style={estilos.input}
        />

        <div style={{ textAlign: 'left', marginBottom: '6px' }}>
          <label style={estilos.etiqueta}>Contraseña</label>
        </div>
        <input
          type="password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={estilos.input}
        />

        <button type="submit" disabled={cargando} style={estilos.boton}>
          {cargando ? 'Iniciando sesión...' : 'Entrar al Panel'}
        </button>
      </form>
    </div>
  );
};

const estilos: { [key: string]: React.CSSProperties } = {
  tarjeta: {
    maxWidth: '380px',
    margin: '80px auto',
    padding: '30px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
    fontFamily: 'Segoe UI, sans-serif',
    textAlign: 'center',
    border: '1px solid #e2e8f0',
  },
  titulo: { margin: '0 0 8px 0', fontSize: '22px', fontWeight: 700, color: '#1B396A' },
  subtitulo: { margin: '0 0 20px 0', fontSize: '14px', color: '#64748b' },
  etiqueta: { fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase' },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    marginBottom: '16px',
    fontSize: '14px',
    outline: 'none',
  },
  boton: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#1B396A',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '6px',
  },
  error: {
    padding: '10px',
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    borderRadius: '8px',
    marginBottom: '15px',
    fontSize: '13px',
    textAlign: 'left',
  },
};