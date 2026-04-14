'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { 
  Users, 
  Activity, 
  FileText, 
  DollarSign,
  Loader2,
  RefreshCw,
  Radio,
  UserPlus
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

interface DailyStat {
  date: string;
  users: number;
  sessions: number;
}

interface RecentSignup {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface Metrics {
  totalUsers: number;
  activeToday: number;
  totalMinutas: number;
  planBreakdown: {
    free: number;
    pro: number;
    team: number;
    earlyAccess: number; // backend usa camelCase
  };
  mrr: number;
  dailyStats: DailyStat[];
  recentSignups: RecentSignup[];
}

const COLORS = ['#94a3b8', '#4d8eff', '#8b5cf6', '#22d3ee'];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'ahora';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Ayer';
  return `hace ${days}d`;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [activeSessions, setActiveSessions] = useState<{id: string, title?: string, userEmail: string, createdAt: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = await api.get<Metrics>('/minutas/admin/metrics');
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar métricas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [refreshKey]);

  useEffect(() => {
    const fetchActive = async () => {
      try {
        const data = await api.get<{ items: any[] }>('/minutas/admin/sessions?page=1&pageSize=5&status=active');
        setActiveSessions(data.items);
      } catch (err) {
        console.error('Error fetching active sessions', err);
      }
    };
    fetchActive();
    const interval = setInterval(fetchActive, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !metrics) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-white/40">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center text-red-400">
        <p className="text-lg font-bold">Oops!</p>
        <p className="text-sm opacity-80">{error || 'No se pudieron cargar los datos'}</p>
      </div>
    );
  }

  const chartData = [
    { name: 'Free', value: metrics.planBreakdown.free },
    { name: 'Pro', value: metrics.planBreakdown.pro },
    { name: 'Team', value: metrics.planBreakdown.team },
    { name: 'Early Access', value: metrics.planBreakdown.earlyAccess },
  ].filter(d => d.value > 0);

  // Formatear fechas para el gráfico de líneas (ej: "2026-04-13" -> "13 abr")
  const lineChartData = (metrics.dailyStats || []).map(d => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
  }));

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex justify-end">
        <button 
          onClick={() => setRefreshKey(k => k + 1)}
          disabled={loading}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/40 transition-all hover:text-white disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualizar datos
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard 
          title="Total Usuarios" 
          value={metrics.totalUsers} 
          icon={Users}
          color="blue"
        />
        <KPICard 
          title="Activos Hoy" 
          value={metrics.activeToday} 
          icon={Activity}
          color="cyan"
        />
        <KPICard 
          title="Minutas Totales" 
          value={metrics.totalMinutas} 
          icon={FileText}
          color="indigo"
        />
        <KPICard 
          title="MRR Estimado" 
          value={`$${metrics.mrr.toLocaleString('es-MX')} MXN`} 
          icon={DollarSign}
          color="emerald"
        />
      </div>

      {/* Widget: Sesiones Activas (TAREA-25) */}
      <div className="rounded-3xl border border-white/5 bg-[#111317] p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Radio size={18} />
            </div>
            <div>
              <h3 className="font-bold text-white">Sesiones activas</h3>
              <p className="text-xs text-white/30">Actualiza cada 15 segundos</p>
            </div>
          </div>
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
        </div>

        {activeSessions.length === 0 ? (
          <p className="text-center text-sm text-white/20 py-6 italic">Sin sesiones activas en este momento</p>
        ) : (
          <div className="space-y-3">
            {activeSessions.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{s.title || 'Sin título'}</p>
                  <p className="text-xs text-white/40 truncate">{s.userEmail}</p>
                </div>
                <span className="ml-3 text-xs font-mono text-white/30">{timeAgo(s.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Charts & Details */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Gráfico de Tendencia (TAREA-17) */}
        <div className="rounded-2xl border border-white/5 bg-[#111317] p-6 lg:col-span-2">
          <h3 className="mb-6 text-sm font-bold uppercase tracking-wider text-white/40">
            Tendencia de Crecimiento
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="displayDate" 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => Math.floor(val).toString()}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#111317', 
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Line 
                  name="Nuevos Usuarios"
                  type="monotone" 
                  dataKey="users" 
                  stroke="#4d8eff" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#4d8eff', strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Line 
                  name="Sesiones Creadas"
                  type="monotone" 
                  dataKey="sessions" 
                  stroke="#22d3ee" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#22d3ee', strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribución de Planes */}
        <div className="rounded-2xl border border-white/5 bg-[#111317] p-6 lg:col-span-1">
          <h3 className="mb-6 text-sm font-bold uppercase tracking-wider text-white/40">
            Distribución de Planes
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#111317', 
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Widget: Últimos registros (TAREA-29) */}
      <div className="rounded-3xl border border-white/5 bg-[#111317] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-white/5 text-white/40">
            <UserPlus size={18} />
          </div>
          <div>
            <h3 className="font-bold text-white">Últimos registros</h3>
            <p className="text-xs text-white/30">Los 5 usuarios más recientes</p>
          </div>
        </div>
        <div className="space-y-3">
          {(metrics?.recentSignups || []).map(u => (
            <div key={u.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary-light flex items-center justify-center text-xs font-bold shrink-0">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{u.name}</p>
                  <p className="text-xs text-white/40 truncate">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-3 shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  u.role === 'pro' ? 'bg-blue-500/10 text-blue-400' :
                  u.role === 'early_access' ? 'bg-cyan-500/10 text-cyan-400' :
                  'bg-white/5 text-white/40'
                }`}>{u.role === 'early_access' ? 'Early' : u.role}</span>
                <span className="text-xs text-white/30 font-mono">{timeAgo(u.createdAt)}</span>
              </div>
            </div>
          ))}
          {(!metrics?.recentSignups || metrics.recentSignups.length === 0) && (
            <p className="text-center text-sm text-white/20 py-4 italic">Sin registros recientes</p>
          )}
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon: Icon, color }: any) {
  const colorMap: any = {
    blue:    'bg-blue-500/10 text-blue-400',
    cyan:    'bg-cyan-500/10 text-cyan-400',
    indigo:  'bg-indigo-500/10 text-indigo-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-[#111317] p-6 transition-all hover:border-white/10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-white/40">
            {title}
          </p>
          <p className="mt-2 text-3xl font-black text-white">
            {value}
          </p>
        </div>
        <div className={`rounded-xl p-3 ${colorMap[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}
