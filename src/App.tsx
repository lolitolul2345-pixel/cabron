import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router';
import { supabase } from './api_supabase/supabaseClient';
import { AdminPanel } from './Componentes/AdminPanel';
import { LoginOTP } from './Componentes/LoginOTP';
import Registro from './Componentes/registro';

// Contenedor de la pantalla Login para manejar la redirección tras el OTP
function VistaLogin({ onLoginExitoso }: { onLoginExitoso: () => void }) {
  const navigate = useNavigate();

  return (
    <div style={{ backgroundColor: '#f1f5f9', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <LoginOTP
        onLoginExitoso={() => {
          onLoginExitoso();
          navigate('/admin');
        }}
      />
    </div>
  );
}

export default function App() {
  const [autenticado, setAutenticado] = useState<boolean>(false);
  const [comprobando, setComprobando] = useState<boolean>(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAutenticado(!!session);
      setComprobando(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAutenticado(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut();
  };

  if (comprobando) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: 'sans-serif', color: '#64748b' }}>
        Verificando sesión...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Formulario público para alumnos */}
        <Route path="/" element={<Registro />} />

        {/* Pantalla de inicio de sesión OTP */}
        <Route
          path="/login"
          element={
            autenticado ? (
              <Navigate to="/admin" replace />
            ) : (
              <VistaLogin onLoginExitoso={() => setAutenticado(true)} />
            )
          }
        />

        {/* Panel Administrativo protegido */}
        <Route
          path="/admin"
          element={
            autenticado ? (
              <div style={{ backgroundColor: '#f1f5f9', minHeight: '100vh', padding: '20px' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto 12px auto', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <a
                    href="/"
                    style={{
                      textDecoration: 'none',
                      backgroundColor: '#e2e8f0',
                      color: '#334155',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '13px',
                      display: 'inline-flex',
                      alignItems: 'center'
                    }}
                  >
                    ← Formulario Alumnos
                  </a>
                  <button
                    onClick={handleCerrarSesion}
                    style={{
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '13px'
                    }}
                  >
                    Cerrar Sesión
                  </button>
                </div>
                <AdminPanel />
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Redirigir cualquier ruta desconocida al inicio */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}