'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Loader2, FileText, User as UserIcon, X } from 'lucide-react';
import { api } from '@/lib/api';

interface GUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface GSession {
  id: string;
  title?: string;
  userEmail: string;
  status: string;
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<GUser[]>([]);
  const [sessions, setSessions] = useState<GSession[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setUsers([]);
      setSessions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [uRes, sRes] = await Promise.all([
          api.get<{ items: GUser[] }>(`/minutas/admin/users?search=${encodeURIComponent(query)}&pageSize=5`),
          api.get<{ items: GSession[] }>(`/minutas/admin/sessions?search=${encodeURIComponent(query)}&pageSize=5`),
        ]);
        setUsers(uRes.items);
        setSessions(sRes.items);
      } catch (err) {
        console.error('Global search failed', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setUsers([]);
      setSessions([]);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 pt-[15vh] px-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => setOpen(false)}
    >
      <div 
        className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-[#111317] shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-white/5 px-5 py-4">
          <Search size={18} className="shrink-0 text-white/30" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar usuario o sesión…"
            className="flex-1 bg-transparent text-sm text-white placeholder-white/20 outline-none"
          />
          {loading && <Loader2 size={14} className="animate-spin text-white/20" />}
          <kbd className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] font-bold text-white/20">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {query.length < 2 ? (
            <p className="py-8 text-center text-xs text-white/20 italic">
              Escribe al menos 2 caracteres para buscar
            </p>
          ) : (
            <>
              {/* Users */}
              {users.length > 0 && (
                <div className="mb-2">
                  <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white/20">
                    Usuarios
                  </p>
                  <div className="space-y-1">
                    {users.map(u => (
                      <Link 
                        key={u.id} 
                        href="/users" 
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-white/5"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary-light">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{u.name}</p>
                          <p className="truncate text-xs text-white/40">{u.email}</p>
                        </div>
                        <span className="ml-auto shrink-0 text-[10px] font-bold uppercase tracking-tighter text-white/30">
                          {u.role}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Sessions */}
              {sessions.length > 0 && (
                <div>
                  <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white/20">
                    Sesiones
                  </p>
                  <div className="space-y-1">
                    {sessions.map(s => (
                      <Link 
                        key={s.id} 
                        href="/activity" 
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-white/5"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5">
                          <FileText size={13} className="text-white/40" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{s.title || 'Sin título'}</p>
                          <p className="truncate text-xs text-white/40">{s.userEmail}</p>
                        </div>
                        <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-tighter ${
                          s.status === 'completed' || s.status === 'transcribed'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : s.status === 'failed'
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-white/5 text-white/40'
                        }`}>
                          {s.status}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!loading && users.length === 0 && sessions.length === 0 && (
                <p className="py-8 text-center text-xs text-white/20 italic">
                  Sin resultados para "{query}"
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 border-t border-white/5 px-5 py-3">
          <span className="text-[10px] text-white/20">
            <span className="font-bold text-white/40">↵</span> navegar
          </span>
          <span className="text-[10px] text-white/20">
            <span className="font-bold text-white/40">ESC</span> cerrar
          </span>
        </div>
      </div>
    </div>
  );
}
