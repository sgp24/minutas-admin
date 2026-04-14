'use client';

import { useState } from 'react';
import { 
  X, 
  Monitor, 
  Upload, 
  Globe, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Copy, 
  User as UserIcon,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { api } from '@/lib/api';

interface SessionItem {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  title?: string;
  status: 'active' | 'completed' | 'transcribed' | 'failed';
  source: 'browser_record' | 'upload' | 'extension';
  durationSeconds?: number;
  hasMinuta: boolean;
  createdAt: string;
}

interface AdminSessionDetail {
  id: string;
  title: string | null;
  status: string;
  source: string;
  durationSeconds: number | null;
  hasMinuta: boolean;
  createdAt: string;
  userEmail: string;
  userName: string;
  transcription: {
    fullText: string;
    engine: string;
    processingMs: number | null;
  } | null;
  minuta: {
    contentMd: string;
    summary: string | null;
  } | null;
}

interface SessionDrawerProps {
  session: SessionItem | null;
  onClose: () => void;
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function SessionDrawer({ session, onClose }: SessionDrawerProps) {
  const [detail, setDetail] = useState<AdminSessionDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showModal, setShowModal] = useState<'transcription' | 'minuta' | null>(null);

  if (!session) return null;

  const loadDetail = async (show: 'transcription' | 'minuta') => {
    if (!detail || detail.id !== session.id) {
      setLoadingDetail(true);
      try {
        const data = await api.get<AdminSessionDetail>(`/minutas/admin/sessions/${session.id}`);
        setDetail(data);
      } catch (err) {
        console.error('Error loading session detail', err);
      } finally {
        setLoadingDetail(false);
      }
    }
    setShowModal(show);
  };

  const getSourceIcon = (source: SessionItem['source']) => {
    switch (source) {
      case 'extension': return <Globe size={18} className="text-cyan-400" />;
      case 'upload':    return <Upload size={18} className="text-indigo-400" />;
      default:          return <Monitor size={18} className="text-slate-400" />;
    }
  };

  const getStatusBadge = (status: SessionItem['status']) => {
    const styles: Record<string, string> = {
      completed:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      active:      'bg-blue-500/10 text-blue-400 border-blue-500/20',
      transcribed: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      failed:      'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return (
      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md border-l border-white/10 bg-[#0d0f14] shadow-2xl transition-transform animate-in slide-in-from-right duration-300">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 p-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold text-white leading-tight truncate max-w-[280px]">
                {session.title || 'Sin título'}
              </h2>
              <div>{getStatusBadge(session.status)}</div>
            </div>
            <button 
              onClick={() => {
                onClose();
                setDetail(null);
                setShowModal(null);
              }}
              className="rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-white transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* User Section */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Usuario</p>
              <div className="flex items-center justify-between group cursor-pointer rounded-2xl bg-white/[0.02] p-4 border border-white/5 hover:bg-white/5 transition-all">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary-light text-sm font-black">
                    {session.userName?.charAt(0) || '?'}
                  </div>
                  <div className="overflow-hidden">
                    <p className="truncate text-sm font-bold text-white">{session.userName || 'Usuario'}</p>
                    <p className="truncate text-xs text-white/40">{session.userEmail}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-white/10 group-hover:text-white/40 transition-all" />
              </div>
            </div>

            {/* Session Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <DetailCard 
                label="Fuente" 
                value={session.source.replace('_', ' ')} 
                icon={getSourceIcon(session.source)} 
              />
              <DetailCard 
                label="Duración" 
                value={formatDuration(session.durationSeconds)} 
                icon={<Clock size={18} className="text-slate-400" />} 
              />
            </div>

            {/* Creation Date */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Fecha de creación</p>
              <div className="flex items-center gap-3 rounded-2xl bg-white/[0.02] p-4 border border-white/5">
                <Calendar size={18} className="text-slate-400" />
                <span className="text-sm text-white/80">
                  {new Date(session.createdAt).toLocaleDateString('es-MX', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </div>

            {/* Minuta Status */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Análisis de IA</p>
              <div className={`flex items-center gap-3 rounded-2xl p-4 border transition-all ${
                session.hasMinuta 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-white/[0.02] border-white/5 text-white/30'
              }`}>
                {session.hasMinuta ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                <span className="text-sm font-bold">
                  {session.hasMinuta ? 'Minuta generada ✓' : 'Sin minuta'}
                </span>
              </div>
            </div>

            {/* Content Actions */}
            <div className="flex gap-2 pt-4 border-t border-white/5">
              {session.hasMinuta && (
                <button
                  onClick={() => loadDetail('minuta')}
                  disabled={loadingDetail}
                  className="flex-1 text-xs font-bold py-3 rounded-xl bg-primary/10 text-primary-light hover:bg-primary/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loadingDetail ? <Loader2 size={14} className="animate-spin" /> : 'Ver minuta'}
                </button>
              )}
              <button
                onClick={() => loadDetail('transcription')}
                disabled={loadingDetail}
                className="flex-1 text-xs font-bold py-3 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loadingDetail ? <Loader2 size={14} className="animate-spin" /> : 'Ver transcripción'}
              </button>
            </div>

            {/* Session ID */}
            <div className="pt-4">
              <button 
                onClick={() => navigator.clipboard.writeText(session.id)}
                className="flex w-full items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-[10px] font-mono text-white/20 hover:bg-white/10 hover:text-white/40 transition-all overflow-hidden"
              >
                <span className="truncate">ID: {session.id}</span>
                <Copy size={12} />
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Content Modal Overlay */}
      {showModal && detail && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[80vh] flex flex-col rounded-3xl border border-white/10 bg-[#111317] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="font-bold text-white">
                {showModal === 'transcription' ? 'Transcripción completa' : 'Minuta generada'}
              </h3>
              <button onClick={() => setShowModal(null)} className="text-white/30 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {showModal === 'transcription' && !detail.transcription && (
                <p className="text-sm text-white/30 italic text-center py-12">Sin transcripción disponible</p>
              )}
              {showModal === 'minuta' && !detail.minuta && (
                <p className="text-sm text-white/30 italic text-center py-12">Sin minuta disponible</p>
              )}
              {showModal === 'transcription' && detail.transcription && (
                <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap font-mono text-xs">
                  {detail.transcription.fullText}
                </p>
              )}
              {showModal === 'minuta' && detail.minuta && (
                <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
                  {detail.minuta.contentMd}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">{label}</p>
      <div className="flex items-center gap-3 rounded-2xl bg-white/[0.02] p-4 border border-white/5">
        {icon}
        <span className="text-sm font-bold text-white/80 capitalize">{value}</span>
      </div>
    </div>
  );
}
