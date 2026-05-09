'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  Send,
  Gauge,
  Clock,
  MailX,
} from 'lucide-react';
import { api } from '@/lib/api';

interface AwsAccount {
  sendingEnabled: boolean;
  enforcementStatus: string;
  sentLast24h: number;
  maxSendPerDay: number;
  maxSendPerSecond: number;
  utilizationPercent: number;
}

interface AwsSuppressions {
  bounceCount: number;
  complaintCount: number;
  total: number;
}

interface AwsResponse {
  generatedAt: string;
  region: string;
  domain: string;
  account: AwsAccount;
  suppressions: AwsSuppressions;
}

const LS_KEY = 'admin_aws_cache';

function timeAgo(iso: string) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m === 0) return 'hace un momento';
  if (m < 60) return `hace ${m}m`;
  return `hace ${Math.floor(m / 60)}h`;
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return ok ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-sm font-bold text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.1)]">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
      {label}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-sm font-bold text-red-400">
      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
      {label}
    </span>
  );
}

function UtilBar({ pct }: { pct: number }) {
  const color = pct > 80 ? 'bg-red-400' : pct > 50 ? 'bg-amber-400' : 'bg-emerald-400';
  return (
    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
      <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

export default function AwsPage() {
  const [data, setData]       = useState<AwsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);

  const load = useCallback(async (force = false) => {
    if (!force) {
      const cached = localStorage.getItem(LS_KEY);
      if (cached) {
        try { setData(JSON.parse(cached)); setFromCache(true); setLoading(false); return; }
        catch { /* ignore */ }
      }
    }
    setLoading(true);
    try {
      const resp = await api.get<AwsResponse>('/minutas/admin/aws');
      setData(resp);
      setFromCache(false);
      localStorage.setItem(LS_KEY, JSON.stringify(resp));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/20" />
      </div>
    );
  }

  const acc  = data?.account;
  const supr = data?.suppressions;
  const healthy = acc?.sendingEnabled && acc?.enforcementStatus === 'HEALTHY';

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col gap-4 rounded-3xl border border-white/5 bg-[#111317] p-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-6">
          <div className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-all ${
            healthy
              ? 'bg-emerald-500/10 text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.1)]'
              : 'bg-red-500/10 text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.1)]'
          }`}>
            <Mail size={32} strokeWidth={1.8} />
          </div>
          <div className="space-y-2">
            <StatusBadge ok={!!healthy} label={healthy ? 'Operativo' : 'Problema detectado'} />
            <p className="text-xs font-medium text-white/30">
              {data?.domain} · {data?.region} · actualizado {data ? timeAgo(data.generatedAt) : '—'}
              {fromCache && <span className="ml-2 rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/20">caché</span>}
            </p>
          </div>
        </div>
        <button
          onClick={() => load(true)}
          disabled={loading}
          className="flex items-center gap-2 rounded-2xl bg-white/5 px-6 py-3 text-sm font-bold text-white/60 transition-all hover:bg-white/10 hover:text-white disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Send}
          label="Enviados (últimas 24h)"
          value={acc?.sentLast24h.toLocaleString('es-MX') ?? '—'}
          sub={`Límite: ${acc?.maxSendPerDay.toLocaleString('es-MX') ?? '—'}/día`}
          color="text-blue-400"
          bg="bg-blue-500/10"
        >
          {acc && <UtilBar pct={acc.utilizationPercent} />}
          <p className="mt-2 text-xs text-white/30">{acc?.utilizationPercent ?? 0}% del cupo diario</p>
        </KpiCard>

        <KpiCard
          icon={Gauge}
          label="Velocidad máxima"
          value={`${acc?.maxSendPerSecond ?? '—'}/s`}
          sub="Emails por segundo"
          color="text-violet-400"
          bg="bg-violet-500/10"
        />

        <KpiCard
          icon={MailX}
          label="Supresiones"
          value={supr?.total.toString() ?? '—'}
          sub={`${supr?.bounceCount ?? 0} bounces · ${supr?.complaintCount ?? 0} complaints`}
          color={supr && supr.total > 5 ? 'text-amber-400' : 'text-emerald-400'}
          bg={supr && supr.total > 5 ? 'bg-amber-500/10' : 'bg-emerald-500/10'}
        />

        <KpiCard
          icon={ShieldAlert}
          label="Estado de cuenta"
          value={acc?.enforcementStatus ?? '—'}
          sub={acc?.sendingEnabled ? 'Envío habilitado' : 'Envío deshabilitado'}
          color={healthy ? 'text-emerald-400' : 'text-red-400'}
          bg={healthy ? 'bg-emerald-500/10' : 'bg-red-500/10'}
        />
      </div>

      {/* Cuota visual */}
      <div className="rounded-3xl border border-white/5 bg-[#111317] p-6 space-y-4">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/30">Cuota diaria de envío</h3>
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-3xl font-bold text-white">{acc?.sentLast24h.toLocaleString('es-MX') ?? '—'}</p>
            <p className="text-sm text-white/30 mt-1">enviados en las últimas 24h</p>
          </div>
          <p className="text-sm font-mono text-white/30">
            de {acc?.maxSendPerDay.toLocaleString('es-MX') ?? '—'}
          </p>
        </div>
        {acc && <UtilBar pct={acc.utilizationPercent} />}
        <div className="flex items-center justify-between text-xs text-white/20 pt-1">
          <span>0</span>
          <span className={acc && acc.utilizationPercent > 1 ? 'text-amber-400 font-bold' : ''}>
            {acc?.utilizationPercent ?? 0}% utilizado
          </span>
          <span>{acc?.maxSendPerDay.toLocaleString('es-MX') ?? '—'}</span>
        </div>
      </div>

      {/* Supresiones detalle */}
      <div className="grid gap-4 sm:grid-cols-2">
        <SuppressionCard
          label="Bounces"
          count={supr?.bounceCount ?? 0}
          description="Direcciones que rebotaron — el email no llegó al destino."
          icon={XCircle}
          good={supr ? supr.bounceCount < 3 : true}
        />
        <SuppressionCard
          label="Complaints"
          count={supr?.complaintCount ?? 0}
          description='Usuarios que marcaron el email como spam. Mantener bajo 0.1% para preservar reputación.'
          icon={AlertTriangle}
          good={supr ? supr.complaintCount === 0 : true}
        />
      </div>

      {/* Info técnica */}
      <div className="rounded-3xl border border-white/5 bg-[#111317] p-6">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-4">Configuración</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { label: 'Proveedor',   value: 'Amazon SES v2' },
            { label: 'Región',      value: data?.region ?? '—' },
            { label: 'Dominio',     value: data?.domain ?? '—' },
            { label: 'Precio',      value: '$0.10 USD / 1,000 emails' },
            { label: 'Remitente',   value: 'hola@minutas.com.mx' },
            { label: 'SPF / DKIM',  value: 'Verificado ✓' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-widest text-white/20">{label}</span>
              <span className="text-sm font-medium text-white/60">{value}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

function KpiCard({
  icon: Icon, label, value, sub, color, bg, children,
}: {
  icon: React.ElementType; label: string; value: string;
  sub: string; color: string; bg: string; children?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/5 bg-[#111317] p-6 space-y-3 hover:border-white/10 transition-all">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/30">{label}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}>
          <Icon size={18} className={color} />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-white/30">{sub}</p>
      {children}
    </div>
  );
}

function SuppressionCard({
  label, count, description, icon: Icon, good,
}: {
  label: string; count: number; description: string; icon: React.ElementType; good: boolean;
}) {
  return (
    <div className={`rounded-3xl border p-6 space-y-3 transition-all ${
      good ? 'border-white/5 bg-[#111317]' : 'border-amber-500/20 bg-amber-500/5'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${good ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
            <Icon size={18} className={good ? 'text-emerald-400' : 'text-amber-400'} />
          </div>
          <p className="font-bold text-white/80">{label}</p>
        </div>
        {good
          ? <CheckCircle2 size={18} className="text-emerald-400" />
          : <AlertTriangle size={18} className="text-amber-400" />}
      </div>
      <p className="text-3xl font-bold text-white">{count}</p>
      <p className="text-xs text-white/30 leading-relaxed">{description}</p>
    </div>
  );
}
