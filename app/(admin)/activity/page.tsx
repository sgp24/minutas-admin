'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Loader2,
  Monitor,
  Upload,
  Globe,
  CheckCircle2,
  Download,
  MoreHorizontal,
  Copy,
  ExternalLink
} from 'lucide-react';
import { api } from '@/lib/api';
import SessionDrawer from '@/components/SessionDrawer';

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

interface SessionsResponse {
  items: SessionItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 30) return `hace ${days} días`;
  if (days < 365) return `hace ${Math.floor(days/30)} meses`;
  return `hace ${Math.floor(days/365)} años`;
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function exportToCSV(rows: Record<string, any>[], filename: string) {
  if (rows.length === 0) return
  const headers = Object.keys(rows[0])
  const csv = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const val = row[h] ?? ''
        return typeof val === 'string' && val.includes(',')
          ? `"${val.replace(/"/g, '""')}"`
          : val
      }).join(',')
    )
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

type StatusFilter = 'all' | 'completed' | 'active' | 'transcribed' | 'failed';

export default function ActivityPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<SessionItem | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const close = () => setOpenMenuId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: '20',
          ...(debouncedSearch && { search: debouncedSearch }),
          ...(filter !== 'all' && { status: filter }),
          ...(dateFrom && { from: dateFrom }),
          ...(dateTo   && { to: dateTo }),
        });

        const data = await api.get<SessionsResponse>(`/minutas/admin/sessions?${params}`);
        setSessions(data.items);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } catch (err) {
        console.error('Error fetching sessions', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [page, debouncedSearch, filter, dateFrom, dateTo]);

  const getSourceIcon = (source: SessionItem['source']) => {
    switch (source) {
      case 'extension': return <Globe size={14} className="text-cyan-400" />;
      case 'upload':    return <Upload size={14} className="text-indigo-400" />;
      default:          return <Monitor size={14} className="text-slate-400" />;
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
      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters & Actions */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative max-w-sm flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-white/30" />
              </div>
              <input
                type="text"
                placeholder="Buscar por usuario o título..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full rounded-xl border border-white/5 bg-[#111317] py-2.5 pl-10 pr-3 text-sm text-white placeholder-white/20 transition-all focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10"
              />
            </div>

            <div className="flex p-1 rounded-xl bg-[#111317] border border-white/5 gap-1">
              {(['all', 'completed', 'active', 'transcribed', 'failed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                    filter === f 
                      ? (f === 'failed' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-white/10 text-white') 
                      : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  {f === 'all' ? 'Todas' : f === 'failed' ? 'Fallidas' : f}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => exportToCSV(
                sessions.map(s => ({
                  id: s.id,
                  titulo: s.title || 'Sin título',
                  usuario: s.userEmail,
                  status: s.status,
                  fuente: s.source,
                  duracion_seg: s.durationSeconds ?? '',
                  minuta: s.hasMinuta ? 'Sí' : 'No',
                  creado: s.createdAt,
                })),
                'actividad.csv'
              )}
              className="flex items-center gap-1.5 text-white/40 hover:text-white text-xs font-semibold transition-all"
            >
              <Download size={14} />
              CSV
            </button>
            <div className="h-4 w-px bg-white/10" />
            <div className="text-xs font-bold text-white/30 uppercase tracking-widest">
              {total} sesiones
            </div>
          </div>
        </div>

        {/* Date Filters (TAREA-35) */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPage(1); }}
              className="rounded-xl border border-white/5 bg-[#111317] px-3 py-1.5 text-xs text-white/70 outline-none focus:border-primary/50 [color-scheme:dark]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPage(1); }}
              className="rounded-xl border border-white/5 bg-[#111317] px-3 py-1.5 text-xs text-white/70 outline-none focus:border-primary/50 [color-scheme:dark]"
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
              className="text-[10px] font-bold text-white/30 hover:text-white transition-colors"
            >
              Limpiar fechas
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#111317]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-bold uppercase tracking-wider text-white/40">
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Título</th>
                <th className="px-6 py-4">Fuente</th>
                <th className="px-6 py-4">Duración</th>
                <th className="px-6 py-4 text-center">Minuta</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Fecha</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-white/20" />
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-white/40">
                    No se encontraron sesiones
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr 
                    key={session.id} 
                    className="group hover:bg-white/[0.01] transition-colors cursor-pointer"
                    onClick={() => setSelectedSession(session)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 font-bold text-xs text-primary-light">
                          {session.userName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-white leading-none">{session.userName || 'Usuario'}</p>
                          <p className="text-[11px] text-white/30 mt-1">{session.userEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={session.title ? 'text-white/80' : 'text-white/20 italic'}>
                        {session.title || 'Sin título'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-white/60 capitalize">
                        {getSourceIcon(session.source)}
                        {session.source.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-white/40">
                      {formatDuration(session.durationSeconds)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {session.hasMinuta ? (
                        <CheckCircle2 size={16} className="mx-auto text-emerald-500" />
                      ) : (
                        <span className="text-white/10">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(session.status)}
                    </td>
                    <td className="px-6 py-4 text-right text-white/40 text-xs">
                      {timeAgo(session.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === session.id ? null : session.id)}
                          className="p-1.5 rounded-lg text-white/20 hover:text-white hover:bg-white/5 transition-all"
                        >
                          <MoreHorizontal size={14} />
                        </button>

                        {openMenuId === session.id && (
                          <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-2xl border border-white/10 bg-[#161920] shadow-2xl p-1.5 text-left animate-in fade-in zoom-in-95 duration-100">
                            <button
                              onClick={() => { navigator.clipboard.writeText(session.id); setOpenMenuId(null); }}
                              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-white/60 hover:bg-white/5 hover:text-white transition-all"
                            >
                              <Copy size={13} />
                              Copiar ID de sesión
                            </button>
                            <button
                              onClick={() => { setSelectedSession(session); setOpenMenuId(null); }}
                              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-white/60 hover:bg-white/5 hover:text-white transition-all"
                            >
                              <ExternalLink size={13} />
                              Ver detalle completo
                            </button>
                            <div className="my-1 border-t border-white/5" />
                            <button
                              onClick={() => { window.open(`https://minutas.com.mx/session/${session.id}`, '_blank'); setOpenMenuId(null); }}
                              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-white/60 hover:bg-white/5 hover:text-white transition-all"
                            >
                              <Globe size={13} />
                              Abrir en frontend
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/5 px-6 py-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-xs font-bold text-white/40 hover:text-white disabled:opacity-30 transition-colors"
            >
              Anterior
            </button>
            <span className="text-xs font-bold text-white/40 tracking-widest uppercase">
              Pág {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-xs font-bold text-white/40 hover:text-white disabled:opacity-30 transition-colors"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      <SessionDrawer 
        session={selectedSession} 
        onClose={() => setSelectedSession(null)} 
      />
    </div>
  );
}
