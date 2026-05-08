'use client';

import { useState, useEffect } from 'react';
import {
  Cloud,
  RefreshCw,
  Loader2,
  Server,
  HardDrive,
  Box,
  Cpu,
  MemoryStick,
  Zap,
  Package,
} from 'lucide-react';
import { api } from '@/lib/api';

interface GcpMetric {
  used: number;
  freeLimit: number;
  unit: string;
  tier: 'free' | 'paid';
  percent: number;
}

interface CloudRunMetrics {
  service: string;
  region: string;
  requests: GcpMetric;
  cpuSeconds: GcpMetric;
  memoryGbSeconds: GcpMetric;
}

interface GcsMetrics {
  bucket: string;
  storageGb: GcpMetric;
  objectCount: number;
}

interface ArtifactRegistryMetrics {
  repository: string;
  storageGb: GcpMetric;
}

interface GcpResponse {
  generatedAt: string;
  billingMonth: string;
  cloudRun: CloudRunMetrics;
  gcs: GcsMetrics;
  artifactRegistry: ArtifactRegistryMetrics;
}

function timeAgo(iso: string) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m === 0) return 'hace un momento';
  return `hace ${m}m`;
}

function fmt(value: number, unit: string): string {
  if (unit === 'requests') return value.toLocaleString('es-MX');
  if (unit === 'GB') return `${value.toFixed(3)} GB`;
  return `${value.toLocaleString('es-MX', { maximumFractionDigits: 2 })} ${unit}`;
}

function TierBadge({ tier }: { tier: 'free' | 'paid' }) {
  return tier === 'free' ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
      Free Tier
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-bold text-amber-400 border border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
      Pay-per-use
    </span>
  );
}

function MetricBar({ metric, label, icon: Icon }: { metric: GcpMetric; label: string; icon: any }) {
  const pct = Math.min(metric.percent, 100);
  const barColor =
    metric.tier === 'paid' ? 'bg-amber-400' :
    pct > 75 ? 'bg-amber-400' :
    pct > 40 ? 'bg-sky-400' : 'bg-emerald-400';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={15} className="text-white/40" />
          <span className="text-sm font-semibold text-white/70">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-white/90">{fmt(metric.used, metric.unit)}</span>
          <span className="text-white/20 text-xs">/ {fmt(metric.freeLimit, metric.unit)}</span>
        </div>
      </div>
      <div className="relative h-2 w-full rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-white/30 font-mono">{metric.percent.toFixed(3)}% consumido</span>
        <TierBadge tier={metric.tier} />
      </div>
    </div>
  );
}

function ServiceCard({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  children,
}: {
  title: string;
  subtitle: string;
  icon: any;
  iconColor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/5 bg-[#111317] p-6 space-y-6 hover:border-white/10 transition-all">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconColor}`}>
          <Icon size={22} />
        </div>
        <div>
          <h3 className="font-bold text-white/90">{title}</h3>
          <p className="text-xs text-white/30 font-mono">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-6 pt-2 border-t border-white/5">
        {children}
      </div>
    </div>
  );
}

export default function GcpPage() {
  const [data, setData] = useState<GcpResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const CACHE_KEY = 'gcp_metrics_cache';

  const fetchData = async (force = false) => {
    if (!force) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          setData(JSON.parse(cached));
          return;
        } catch {}
      }
    }
    setLoading(true);
    try {
      const res = await api.get<GcpResponse>('/minutas/admin/gcp');
      setData(res);
      localStorage.setItem(CACHE_KEY, JSON.stringify(res));
    } catch (err) {
      console.error('Error fetching GCP metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(false);
  }, []);

  useEffect(() => {
    if (refreshKey > 0) fetchData(true);
  }, [refreshKey]);

  if (loading && !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/20" />
      </div>
    );
  }

  const allMetrics = data ? [
    data.cloudRun.requests.tier,
    data.cloudRun.cpuSeconds.tier,
    data.cloudRun.memoryGbSeconds.tier,
    data.gcs.storageGb.tier,
    data.artifactRegistry.storageGb.tier,
  ] : [];
  const globalTier: 'free' | 'paid' = allMetrics.includes('paid') ? 'paid' : 'free';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-8 rounded-3xl border border-white/5 bg-[#111317]">
        <div className="flex items-center gap-6">
          <div className={`h-16 w-16 rounded-2xl flex items-center justify-center ${
            globalTier === 'free'
              ? 'bg-emerald-500/10 text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.1)]'
              : 'bg-amber-500/10 text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.1)]'
          }`}>
            <Cloud size={32} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">Google Cloud Platform</h2>
              <TierBadge tier={globalTier} />
            </div>
            <p className="text-xs text-white/30 font-mono">
              Período: {data?.billingMonth} · Actualizado: {data ? timeAgo(data.generatedAt) : '—'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setRefreshKey(k => k + 1)}
          disabled={loading}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Service Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cloud Run */}
        {data && (
          <ServiceCard
            title="Cloud Run"
            subtitle={`${data.cloudRun.service} · ${data.cloudRun.region}`}
            icon={Server}
            iconColor="bg-blue-500/10 text-blue-400"
          >
            <MetricBar metric={data.cloudRun.requests}        label="Requests"     icon={Zap} />
            <MetricBar metric={data.cloudRun.cpuSeconds}      label="CPU"          icon={Cpu} />
            <MetricBar metric={data.cloudRun.memoryGbSeconds} label="Memoria"      icon={MemoryStick} />
          </ServiceCard>
        )}

        {/* GCS */}
        {data && (
          <ServiceCard
            title="Cloud Storage"
            subtitle={`gs://${data.gcs.bucket}`}
            icon={HardDrive}
            iconColor="bg-purple-500/10 text-purple-400"
          >
            <MetricBar metric={data.gcs.storageGb} label="Almacenamiento" icon={HardDrive} />
            <div className="flex items-center justify-between rounded-2xl bg-white/[0.02] border border-white/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <Box size={15} className="text-white/40" />
                <span className="text-sm font-semibold text-white/70">Objetos activos</span>
              </div>
              <span className="font-mono text-sm text-white/90">{data.gcs.objectCount}</span>
            </div>
            <p className="text-[11px] text-white/20 leading-relaxed">
              Los objetos se eliminan automáticamente a las 24h por lifecycle policy.
              El bucket debería estar en 0 objetos fuera de procesamiento activo.
            </p>
          </ServiceCard>
        )}

        {/* Artifact Registry */}
        {data && (
          <ServiceCard
            title="Artifact Registry"
            subtitle={`us-central1 · ${data.artifactRegistry.repository}`}
            icon={Package}
            iconColor="bg-rose-500/10 text-rose-400"
          >
            <MetricBar metric={data.artifactRegistry.storageGb} label="Imágenes Docker" icon={Package} />
            <p className="text-[11px] text-white/20 leading-relaxed">
              Free tier: 0.5 GB/mes. Contiene las imágenes del microservicio{' '}
              <span className="font-mono text-white/40">audio-processor</span>.
              Puedes limpiar tags antiguos para reducir almacenamiento.
            </p>
          </ServiceCard>
        )}

        {/* Free Tier Summary */}
        <div className="rounded-3xl border border-white/5 bg-[#111317] p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white/40">
              <Cloud size={22} />
            </div>
            <div>
              <h3 className="font-bold text-white/90">Límites Free Tier GCP</h3>
              <p className="text-xs text-white/30">Referencia mensual por servicio</p>
            </div>
          </div>
          <div className="space-y-3 border-t border-white/5 pt-4">
            {[
              { label: 'Cloud Run · Requests',  value: '2,000,000 / mes' },
              { label: 'Cloud Run · CPU',        value: '360,000 vCPU-seg / mes' },
              { label: 'Cloud Run · Memoria',    value: '180,000 GB-seg / mes' },
              { label: 'Cloud Storage',          value: '5 GB / mes (us-central1)' },
              { label: 'Artifact Registry',      value: '0.5 GB / mes' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <span className="text-white/40">{label}</span>
                <span className="font-mono text-white/60">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
