'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Mail,
  Loader2
} from 'lucide-react';
import UserDrawer from '@/components/UserDrawer';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'free' | 'pro' | 'team' | 'early_access' | 'admin';
  status: 'active' | 'suspended';
  authProvider: 'email' | 'google';
  createdAt: string;
}

const INITIAL_MOCK_USERS: User[] = [
  { id: '1', name: 'Sergio Pedrosa', email: 'sergio@minutas.com.mx', role: 'admin', status: 'active', authProvider: 'google', createdAt: '2026-01-10T10:00:00Z' },
  { id: '2', name: 'Ana Garcia', email: 'ana@example.com', role: 'pro', status: 'active', authProvider: 'email', createdAt: '2026-02-15T14:30:00Z' },
  { id: '3', name: 'Luis Rodriguez', email: 'luis@corp.com', role: 'team', status: 'active', authProvider: 'email', createdAt: '2026-03-01T09:15:00Z' },
  { id: '4', name: 'Maria Lopez', email: 'maria@gmail.com', role: 'free', status: 'suspended', authProvider: 'google', createdAt: '2026-03-20T18:45:00Z' },
  { id: '5', name: 'David Smith', email: 'david@test.com', role: 'early_access', status: 'active', authProvider: 'email', createdAt: '2026-04-01T11:20:00Z' },
  { id: '6', name: 'Elena Beltrán', email: 'elena@minutas.app', role: 'pro', status: 'active', authProvider: 'google', createdAt: '2026-04-05T16:10:00Z' },
  ...Array.from({ length: 14 }).map((_, i) => ({
    id: `mock-${i + 7}`,
    name: `Usuario de Prueba ${i + 7}`,
    email: `test${i + 7}@example.com`,
    role: (['free', 'pro', 'early_access'] as const)[i % 3],
    status: 'active' as const,
    authProvider: (['email', 'google'] as const)[i % 2],
    createdAt: new Date(Date.now() - (i + 10) * 86400000).toISOString()
  }))
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(INITIAL_MOCK_USERS);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Debounce logic
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    // Simulamos carga inicial
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [debouncedSearch, users]);

  const totalPages = Math.ceil(filteredUsers.length / 20);
  const currentUsers = filteredUsers.slice((page - 1) * 20, page * 20);

  const getRoleBadge = (role: User['role']) => {
    const styles: Record<string, string> = {
      admin:        'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      pro:          'bg-primary/10 text-primary-light border-primary/20',
      team:         'bg-purple-500/10 text-purple-400 border-purple-500/20',
      early_access: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      free:         'bg-white/5 text-white/40 border-white/10',
    };
    return (
      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles[role]}`}>
        {role.replace('_', ' ')}
      </span>
    );
  };

  const getStatusBadge = (status: User['status']) => {
    const styles = status === 'active' 
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      : 'bg-red-500/10 text-red-400 border-red-500/20';
    return (
      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles}`}>
        {status}
      </span>
    );
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    setSelectedUser(updatedUser);
  };

  return (
    <div className="space-y-6">
      {/* Filters & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-white/30" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-xl border border-white/5 bg-[#111317] py-2.5 pl-10 pr-3 text-sm text-white placeholder-white/20 transition-all focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10"
          />
        </div>
        
        <div className="flex items-center gap-2 text-sm text-white/40">
          <span>{filteredUsers.length} usuarios encontrados</span>
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
                <th className="px-6 py-4">Auth</th>
                <th className="px-6 py-4 text-right">Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-white/20" />
                  </td>
                </tr>
              ) : currentUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-white/40">
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                currentUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    className="group cursor-pointer hover:bg-white/[0.02]"
                    onClick={() => setSelectedUser(user)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 font-bold text-primary-light">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{user.name}</p>
                          <p className="text-xs text-white/40">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-white/60">
                        {user.authProvider === 'google' ? (
                          <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
                        ) : (
                          <Mail size={12} />
                        )}
                        <span className="capitalize">{user.authProvider}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-white/40">
                      {new Date(user.createdAt).toLocaleDateString('es-MX', {
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
              className="flex items-center gap-1 text-xs font-bold text-white/40 transition-colors hover:text-white disabled:opacity-30"
            >
              <ChevronLeft size={16} /> Anterior
            </button>
            <span className="text-xs font-bold text-white/40">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 text-xs font-bold text-white/40 transition-colors hover:text-white disabled:opacity-30"
            >
              Siguiente <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <UserDrawer 
        user={selectedUser} 
        onClose={() => setSelectedUser(null)} 
        onUpdate={handleUpdateUser}
      />
    </div>
  );
}
