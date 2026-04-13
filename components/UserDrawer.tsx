'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Shield,
  User as UserIcon,
  Mail,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Tag,
  Activity
} from 'lucide-react';
import { api } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'free' | 'pro' | 'team' | 'early_access' | 'admin';
  status: 'active' | 'suspended';
  authProvider: 'email' | 'google';
  createdAt: string;
}

interface UserDrawerProps {
  user: User | null;
  onClose: () => void;
  onUpdate: (updatedUser: User) => void;
}

export default function UserDrawer({ user, onClose, onUpdate }: UserDrawerProps) {
  const [role, setRole] = useState<User['role']>('free');
  const [status, setStatus] = useState<User['status']>('active');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (user) {
      setRole(user.role);
      setStatus(user.status);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    
    try {
      // Solo llamar si el valor cambió
      if (role !== user.role) {
        await api.patch(`/minutas/admin/users/${user.id}/role`, { role });
      }
      
      if (status !== user.status) {
        await api.patch(`/minutas/admin/users/${user.id}/status`, { status });
      }
      
      const updatedUser: User = { ...user, role, status };
      onUpdate(updatedUser);
      
      setToast({ message: 'Usuario actualizado correctamente', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setToast({ message: err.message || 'Error al guardar cambios', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md border-l border-white/10 bg-[#0d0f14] shadow-2xl transition-transform">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 p-6">
            <h2 className="text-lg font-bold text-white">Detalle del Usuario</h2>
            <button 
              onClick={onClose}
              className="rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* User Info Card */}
            <div className="flex items-center gap-4 rounded-2xl bg-white/[0.02] p-4 border border-white/5">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary-light text-xl font-black">
                {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-lg font-bold text-white">{user.name}</p>
                <p className="truncate text-sm text-white/40">{user.email}</p>
              </div>
            </div>

            {/* Quick Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 text-center">Registrado el</p>
                <div className="flex items-center justify-center gap-2 rounded-xl bg-white/5 py-2 px-3 text-sm text-white/60">
                  <Calendar size={14} />
                  {new Date(user.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 text-center">Proveedor</p>
                <div className="flex items-center justify-center gap-2 rounded-xl bg-white/5 py-2 px-3 text-sm text-white/60 capitalize">
                  <Mail size={14} />
                  {user.authProvider}
                </div>
              </div>
            </div>

            {/* Role Management */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-white/60 uppercase tracking-wider">
                <Shield size={16} className="text-primary-light" />
                Rol y Acceso
              </div>
              <div className="space-y-3">
                {(['free', 'pro', 'team', 'early_access'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`flex w-full items-center justify-between rounded-xl border p-4 transition-all ${
                      role === r 
                        ? 'border-primary/50 bg-primary/10 text-white shadow-[0_0_15px_rgba(0,90,194,0.1)]' 
                        : 'border-white/5 bg-white/5 text-white/40 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-sm font-bold capitalize">{r.replace('_', ' ')}</span>
                    {role === r && <CheckCircle2 size={18} className="text-primary-light" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Management */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-white/60 uppercase tracking-wider">
                <Activity size={16} className="text-emerald-400" />
                Estado de la cuenta
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStatus('active')}
                  className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all ${
                    status === 'active'
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                      : 'bg-white/5 text-white/40 hover:bg-white/10'
                  }`}
                >
                  Activo
                </button>
                <button
                  onClick={() => setStatus('suspended')}
                  className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all ${
                    status === 'suspended'
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                      : 'bg-white/5 text-white/40 hover:bg-white/10'
                  }`}
                >
                  Suspendido
                </button>
              </div>
            </div>

            {/* Subscriptions History */}
            <div className="space-y-4 pb-10">
              <div className="flex items-center gap-2 text-sm font-bold text-white/60 uppercase tracking-wider">
                <Tag size={16} className="text-indigo-400" />
                Historial de Suscripciones
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-1">
                <div className="p-4 text-center text-xs text-white/30">
                  No hay suscripciones previas registradas.
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="border-t border-white/5 bg-[#0d0f14] p-6">
            <button
              onClick={handleSave}
              disabled={saving || (role === user.role && status === user.status)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-light hover:shadow-primary/40 disabled:opacity-30 disabled:shadow-none active:scale-[0.98]"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save size={18} />}
              Guardar Cambios
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`absolute bottom-24 left-6 right-6 flex items-center gap-3 rounded-xl p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 ${
            toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <p className="text-xs font-bold">{toast.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

