'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Loader2,
  Database,
  Frown,
  PauseCircle,
  BarChart3,
  Trash2
} from 'lucide-react';
import { api } from '@/lib/api';

interface HealthCheck {
  status: 'ok' | 'warning' | 'error';
  message: string;
  responseMs: number;
  count: number;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  database: HealthCheck;
  recentFailures: HealthCheck;
  stuckSessions: HealthCheck;
  processingVolume: HealthCheck;
}

function timeAgo(dateStr: string): string {
  const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes === 0) return 'hace un momento';
  return `hace ${minutes}m`;
}

export default function HealthPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [cleaning, setCleaning] = useState(false);
  const [cleanResult, setCleanResult] = useState<{ count: number } | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const data = await api.get<HealthResponse>('/minutas/admin/health');
      setHealth(data);
    } catch (err) {
      console.error('Error fetching health', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    setCleaning(true);
    setCleanResult(null);
    try {
      const res = await api.post<{ sessionsCleaned: number }>('/minutas/admin/sessions/cleanup', { stuckAfterHours: 2 });
      setCleanResult({ count: res.sessionsCleaned });
      setRefreshKey(k => k + 1); // Refrescar health tras limpiar
    } catch (err) {
      console.error('Error cleaning sessions', err);
    } finally {
      setCleaning(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Auto-refresh 30s
    return () => clearInterval(interval);
  }, [refreshKey]);

  if (loading && !health) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/20" />
      </div>
    );
  }

  const getGlobalStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':  return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-1.5 rounded-full text-sm font-bold">Sistema Operativo</span>;
      case 'degraded': return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-4 py-1.5 rounded-full text-sm font-bold">Rendimiento Degradado</span>;
      default:         return <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-1.5 rounded-full text-sm font-bold">Falla Detectada</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Status */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-8 rounded-3xl border border-white/5 bg-[#111317]">
        <div className="flex items-center gap-6">
          <div className={`h-16 w-16 rounded-2xl flex items-center justify-center transition-all ${
            health?.status === 'healthy' ? 'bg-emerald-500/10 text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.1)]' :
            health?.status === 'degraded' ? 'bg-amber-500/10 text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.1)]' :
            'bg-red-500/10 text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.1)]'
          }`}>
            {health?.status === 'healthy' ? <CheckCircle2 size={32} strokeWidth={2.5} /> :
             health?.status === 'degraded' ? <AlertTriangle size={32} strokeWidth={2.5} /> :
             <XCircle size={32} strokeWidth={2.5} />}
          </div>
          <div className="space-y-1">
            {getGlobalStatusBadge(health?.status || 'down')}
            <p className="text-xs text-white/30 font-medium">Última verificación: {health ? timeAgo(health.timestamp) : '—'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Resultado de limpieza */}
          {cleanResult !== null && (
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
              cleanResult.count > 0
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-white/5 text-white/40'
            }`}>
              {cleanResult.count > 0
                ? `${cleanResult.count} sesión${cleanResult.count > 1 ? 'es' : ''} limpiada${cleanResult.count > 1 ? 's' : ''}`
                : 'Sin sesiones atascadas'}
            </span>
          )}

          {/* Limpiar sesiones atascadas */}
          <button
            onClick={handleCleanup}
            disabled={cleaning || loading}
            title="Marca como 'failed' todas las sesiones activas con más de 2 horas sin completarse"
            className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 px-4 py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
          >
            {cleaning ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            Limpiar atascadas
          </button>

          {/* Verificar ahora */}
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Verificar ahora
          </button>
        </div>
      </div>

      {/* Check Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <CheckCard title="Base de Datos" icon={Database} check={health?.database} />
        <CheckCard title="Sesiones Fallidas (24h)" icon={Frown} check={health?.recentFailures} />
        <CheckCard title="Sesiones Atascadas" icon={PauseCircle} check={health?.stuckSessions} />
        <CheckCard title="Volumen de Procesamiento" icon={BarChart3} check={health?.processingVolume} />
      </div>
    </div>
  );
}

function CheckCard({ title, icon: Icon, check }: { title: string; icon: any; check?: HealthCheck }) {
  if (!check) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':      return <CheckCircle2 size={18} className="text-emerald-400" />;
      case 'warning': return <AlertTriangle size={18} className="text-amber-400" />;
      default:        return <XCircle size={18} className="text-red-400" />;
    }
  };

  return (
    <div className="rounded-3xl border border-white/5 bg-[#111317] p-6 space-y-4 hover:border-white/10 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/5 text-white/40">
            <Icon size={20} />
          </div>
          <h3 className="font-bold text-white/80">{title}</h3>
        </div>
        {getStatusIcon(check.status)}
      </div>
      
      <p className="text-sm text-white/40 leading-relaxed">{check.message}</p>
      
      <div className="flex items-center gap-4 pt-2">
        {check.responseMs > 0 && (
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">Latencia</p>
            <p className="text-sm font-mono text-white/60">{check.responseMs}ms</p>
          </div>
        )}
        {check.count >= 0 && (
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">Registros</p>
            <p className="text-sm font-mono text-white/60">{check.count}</p>
          </div>
        )}
      </div>
    </div>
  );
}
