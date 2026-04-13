'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Cookies from 'js-cookie';
import { Shield, Lock, Mail, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await api.post<{
        token: string;
        role: string;
        name: string;
        email: string;
      }>('/minutas/auth/login', { email, password });

      if (data.role !== 'admin') {
        throw new Error('Sin permisos de administrador');
      }

      // Guardar token en ambos lugares para middleware y cliente API
      Cookies.set('admin_token', data.token, { expires: 7 }); // 7 días
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify({
        name: data.name,
        email: data.email,
        role: data.role
      }));

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0c0e12] px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-white/5 bg-[#111317] p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 shadow-[0_0_20px_rgba(0,90,194,0.3)]">
            <Shield className="h-8 w-8 text-primary-light" strokeWidth={2.5} />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white">
            Minutas Admin
          </h2>
          <p className="mt-2 text-sm text-white/40">
            Panel de control y administración
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-white/50">
                Correo electrónico
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-white/30" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-white/5 bg-white/5 py-3 pl-10 pr-3 text-sm text-white placeholder-white/20 transition-all focus:border-primary/50 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-primary/10"
                  placeholder="admin@minutas.com.mx"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-white/50">
                Contraseña
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-white/30" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-white/5 bg-white/5 py-3 pl-10 pr-3 text-sm text-white placeholder-white/20 transition-all focus:border-primary/50 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-primary/10"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              <p className="font-medium">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-[0_4px_14px_rgba(0,90,194,0.4)] transition-all hover:bg-primary-light hover:shadow-[0_6px_20px_rgba(77,142,255,0.4)] focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
