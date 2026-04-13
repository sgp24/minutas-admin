'use client';

import { useState, useEffect } from 'react';
import { 
  Mic, 
  FileText, 
  Cpu, 
  DollarSign, 
  Loader2,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { api } from '@/lib/api';

interface DailyUsage {
  date: string;
  sessionsProcessed: number;
  audioMinutes: number;
  minutasGenerated: number;
  llmTokens: number;
  estimatedCostUsd: number;
}

interface UsageResponse {
  summary: {
    totalAudioMinutes: number;
    totalMinutasGenerated: number;
    totalLlmTokens: number;
    estimatedGroqCostUsd: number;
    estimatedGeminiCostUsd: number;
    estimatedTotalCostUsd: number;
  };
  daily: DailyUsage[];
}

export default function UsagePage() {
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const data = await api.get<UsageResponse>('/minutas/admin/usage');
        setUsage(data);
      } catch (err) {
        console.error('Error fetching usage', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsage();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/20" />
      </div>
    );
  }

  const chartData = (usage?.daily || []).map(d => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
  }));

  return (
    <div className="space-y-10">
      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <UsageCard 
          title="Audio Procesado" 
          value={`${Math.round(usage?.summary.totalAudioMinutes || 0)}m`} 
          sub="Minutos via Groq"
          icon={Mic}
          color="blue"
        />
        <UsageCard 
          title="Minutas IA" 
          value={usage?.summary.totalMinutasGenerated || 0} 
          sub="Generadas con Gemini"
          icon={FileText}
          color="indigo"
        />
        <UsageCard 
          title="Consumo LLM" 
          value={(usage?.summary.totalLlmTokens || 0).toLocaleString('es-MX')} 
          sub="Total de Tokens"
          icon={Cpu}
          color="purple"
        />
        <UsageCard 
          title="Costo Estimado" 
          value={`$${usage?.summary.estimatedTotalCostUsd.toFixed(2)}`} 
          sub="Dólares USD (Total)"
          icon={DollarSign}
          color="emerald"
          tooltip={`Groq: $${usage?.summary.estimatedGroqCostUsd.toFixed(4)} | Gemini: $${usage?.summary.estimatedGeminiCostUsd.toFixed(4)}`}
        />
      </div>

      {/* Main Chart */}
      <div className="rounded-3xl border border-white/5 bg-[#111317] p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-xl bg-white/5 text-white/40">
            <BarChart3 size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Actividad Diaria de IA</h3>
            <p className="text-xs text-white/30">Distribución de minutos y minutas (últimos 30 días)</p>
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
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
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                contentStyle={{ 
                  backgroundColor: '#111317', 
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '16px',
                  fontSize: '12px'
                }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              <Bar name="Minutos Audio" dataKey="audioMinutes" stackId="a" fill="#4d8eff" radius={[0, 0, 0, 0]} />
              <Bar name="Minutas Gen" dataKey="minutasGenerated" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function UsageCard({ title, value, sub, icon: Icon, color, tooltip }: any) {
  const colorMap: any = {
    blue:    'bg-blue-500/10 text-blue-400',
    indigo:  'bg-indigo-500/10 text-indigo-400',
    purple:  'bg-purple-500/10 text-purple-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
  };

  return (
    <div className="group relative rounded-3xl border border-white/5 bg-[#111317] p-6 transition-all hover:border-white/10" title={tooltip}>
      <div className="flex items-center justify-between mb-4">
        <div className={`rounded-2xl p-3 ${colorMap[color]}`}>
          <Icon size={24} />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{title}</p>
        <p className="mt-1 text-2xl font-black text-white">{value}</p>
        <p className="mt-1 text-[10px] font-medium text-white/20 uppercase tracking-tighter">{sub}</p>
      </div>
    </div>
  );
}
