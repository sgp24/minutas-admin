'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { 
  Users, 
  Activity, 
  FileText, 
  DollarSign,
  Loader2,
  RefreshCw
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
}

const COLORS = ['#94a3b8', '#4d8eff', '#8b5cf6', '#22d3ee'];

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
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

    fetchMetrics();
  }, [refreshKey]);

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

      {/* Charts & Details */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Gráfico de Tendencia (Nueva TAREA-17) */}
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
