'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  Loader2,
  Filter
} from 'lucide-react';

interface Subscription {
  id: string;
  userId: string;
  userEmail: string;
  status: 'active' | 'canceled' | 'past_due';
  planName: string;
  externalSubscriptionId: string;
  createdAt: string;
}

const MOCK_SUBS: Subscription[] = [
  { id: 'sub_1', userId: '2', userEmail: 'ana@example.com', status: 'active', planName: 'Pro Monthly', externalSubscriptionId: 'sub_Stripe123', createdAt: '2026-02-15T14:30:00Z' },
  { id: 'sub_2', userId: '3', userEmail: 'luis@corp.com', status: 'active', planName: 'Team Annual', externalSubscriptionId: 'sub_Stripe456', createdAt: '2026-03-01T09:15:00Z' },
  { id: 'sub_3', userId: '6', userEmail: 'elena@minutas.app', status: 'canceled', planName: 'Pro Monthly', externalSubscriptionId: 'sub_Stripe789', createdAt: '2026-04-05T16:10:00Z' },
  ...Array.from({ length: 12 }).map((_, i) => ({
    id: `sub-mock-${i + 4}`,
    userId: `user-${i + 10}`,
    userEmail: `subscriber${i + 10}@test.com`,
    status: (['active', 'canceled', 'past_due'] as const)[i % 3],
    planName: i % 2 === 0 ? 'Pro Monthly' : 'Early Access Special',
    externalSubscriptionId: `sub_StripeMock${i + 100}`,
    createdAt: new Date(Date.now() - (i + 5) * 86400000).toISOString()
  }))
];

export default function SubscriptionsPage() {
  const [filter, setFilter] = useState<'all' | 'active' | 'canceled' | 'past_due'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    // Simulamos carga
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const filteredSubs = useMemo(() => {
    return MOCK_SUBS.filter(s => {
      const matchesFilter = filter === 'all' || s.status === filter;
      const matchesSearch = s.userEmail.toLowerCase().includes(search.toLowerCase()) || 
                           s.externalSubscriptionId.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [filter, search]);

  const totalPages = Math.ceil(filteredSubs.length / 20);
  const currentSubs = filteredSubs.slice((page - 1) * 20, page * 20);

  const getStatusBadge = (status: Subscription['status']) => {
    const styles: Record<string, string> = {
      active:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      canceled: 'bg-white/5 text-white/40 border-white/10',
      past_due: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    };
    return (
      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles[status]}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative max-w-sm flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-white/30" />
            </div>
            <input
              type="text"
              placeholder="Buscar por email o ID Stripe..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full rounded-xl border border-white/5 bg-[#111317] py-2.5 pl-10 pr-3 text-sm text-white placeholder-white/20 transition-all focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div className="flex p-1 rounded-xl bg-[#111317] border border-white/5 gap-1">
            {(['all', 'active', 'canceled', 'past_due'] as const).map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                  filter === f 
                    ? 'bg-white/10 text-white' 
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                {f === 'all' ? 'Todas' : f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#111317]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-bold uppercase tracking-wider text-white/40">
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">ID Stripe</th>
                <th className="px-6 py-4 text-right">Fecha Inicio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-white/20" />
                  </td>
                </tr>
              ) : currentSubs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-white/40">
                    No se encontraron suscripciones
                  </td>
                </tr>
              ) : (
                currentSubs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-white">{sub.userEmail}</p>
                      <p className="text-[10px] text-white/20 font-mono uppercase tracking-tighter">ID: {sub.userId}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary-light shadow-[0_0_8px_rgba(77,142,255,0.5)]" />
                        <span className="font-medium text-white/80">{sub.planName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(sub.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-mono text-xs text-white/40">
                        {sub.externalSubscriptionId}
                        <button className="text-white/20 hover:text-primary-light">
                          <ExternalLink size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-white/40">
                      {new Date(sub.createdAt).toLocaleDateString('es-MX', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
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
              className="text-xs font-bold text-white/40 hover:text-white disabled:opacity-30"
            >
              Anterior
            </button>
            <span className="text-xs font-bold text-white/40 tracking-widest uppercase">
              Pág {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-xs font-bold text-white/40 hover:text-white disabled:opacity-30"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
