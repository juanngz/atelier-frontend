import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AtSign, Lock, Sparkles, AlertCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutos

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const navigate = useNavigate();

  // Verificar si hay bloqueo activo al cargar
  useEffect(() => {
    const checkLockout = () => {
      const lockoutTime = localStorage.getItem('loginLockoutTime');
      if (lockoutTime) {
        const lockoutExpires = parseInt(lockoutTime, 10);
        const now = Date.now();
        const timeLeft = lockoutExpires - now;

        if (timeLeft > 0) {
          setIsLocked(true);
          setRemainingTime(Math.ceil(timeLeft / 1000));
        } else {
          // El bloqueo expiró
          localStorage.removeItem('loginLockoutTime');
          localStorage.removeItem('loginAttempts');
          setIsLocked(false);
        }
      }
    };

    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, []);

  // Actualizar tiempo restante cada segundo
  useEffect(() => {
    if (!isLocked) return;

    const timer = setInterval(() => {
      const lockoutTime = localStorage.getItem('loginLockoutTime');
      if (lockoutTime) {
        const timeLeft = parseInt(lockoutTime, 10) - Date.now();
        if (timeLeft > 0) {
          setRemainingTime(Math.ceil(timeLeft / 1000));
        } else {
          localStorage.removeItem('loginLockoutTime');
          localStorage.removeItem('loginAttempts');
          setIsLocked(false);
          setRemainingTime(0);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isLocked]);

  const recordFailedAttempt = () => {
    const attempts = parseInt(localStorage.getItem('loginAttempts') || '0', 10);
    const newAttempts = attempts + 1;

    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      const lockoutExpires = Date.now() + LOCKOUT_DURATION_MS;
      localStorage.setItem('loginLockoutTime', lockoutExpires.toString());
      localStorage.setItem('loginAttempts', MAX_LOGIN_ATTEMPTS.toString());
      setIsLocked(true);
      setRemainingTime(Math.ceil(LOCKOUT_DURATION_MS / 1000));
      setError(`Demasiados intentos fallidos. Intenta de nuevo en 15 minutos.`);
    } else {
      localStorage.setItem('loginAttempts', newAttempts.toString());
      setError(`Credenciales incorrectas. Intento ${newAttempts}/${MAX_LOGIN_ATTEMPTS}`);
    }
  };

  const clearAttempts = () => {
    localStorage.removeItem('loginAttempts');
    localStorage.removeItem('loginLockoutTime');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLocked) {
      setError(`Cuenta bloqueada. Intenta de nuevo en ${remainingTime} segundos.`);
      return;
    }

    if (!email || !password) {
      setError('Por favor completa el correo y la contraseña.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        recordFailedAttempt();
        return;
      }

      // Login exitoso - limpiar intentos
      clearAttempts();

      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }

      if (data.nombre) {
        localStorage.setItem('userName', `${data.nombre} ${data.apellido}`);
      }

      navigate('/');
    } catch (err) {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md rounded-[32px] border border-slate-200 bg-white/95 p-10 shadow-2xl shadow-slate-900/5 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Bienvenido de nuevo</h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Inicia sesión para administrar tu tienda y ver tus estadísticas.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
              Correo electrónico
            </label>
            <div className="relative mt-3">
              <AtSign className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                placeholder="tu@correo.com"
                disabled={isLocked}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
              Contraseña
            </label>
            <div className="relative mt-3">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                placeholder="********"
                disabled={isLocked}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {error ? (
            <div className={`rounded-2xl border px-4 py-3 text-sm flex items-start gap-3 ${
              isLocked
                ? 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300'
                : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300'
            }`}>
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isLocked || loading}
            className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
          >
            {isLocked ? `Bloqueado (${remainingTime}s)` : 'Iniciar sesión'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          ¿No tienes cuenta?{' '}
          <Link
            to="/register"
            className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Regístrate
          </Link>
        </div>
      </div>
    </div>
  );
}
