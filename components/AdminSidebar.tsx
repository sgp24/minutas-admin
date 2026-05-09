'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  LogOut,
  Shield,
  Menu,
  X,
  User as UserIcon,
  Zap,
  Package,
  Activity,
  Cpu,
  Bell,
  AlertCircle,
  AlertTriangle,
  Info,
  Cloud,
  Mail,
} from 'lucide-react';
import Cookies from 'js-cookie';
import { api } from '@/lib/api';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Usuarios', href: '/users', icon: Users },
  { label: 'Actividad', href: '/activity', icon: Zap },
  { label: 'Suscripciones', href: '/subscriptions', icon: CreditCard },
  { label: 'Planes', href: '/plans', icon: Package },
  { label: 'Sistema', href: '/health', icon: Activity },
  { label: 'Consumo IA', href: '/usage', icon: Cpu },
  { label: 'GCP', href: '/gcp', icon: Cloud },
  { label: 'Correos', href: '/emails', icon: Mail },
];

interface Alert {
  type: string;
  severity: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  count: number;
  timestamp: string;
}

interface AlertsResponse {
  alerts: Alert[];
  unreadCount: number;
}

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

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<{ name: string; email: string } | null>(null);
  
  // Alert states (TAREA-39)
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [lastReadAt, setLastReadAt] = useState<string>(() => {
    if (typeof window === 'undefined') return new Date(0).toISOString();
    return localStorage.getItem('admin_alerts_read_at') ?? new Date(0).toISOString();
  });
  const [showAlertsPanel, setShowAlertsPanel] = useState(false);

  const computedUnread = alerts.filter(a => new Date(a.timestamp) > new Date(lastReadAt)).length;

  useEffect(() => {
    const userStr = localStorage.getItem('admin_user');
    if (userStr) {
      try {
        setAdminUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Error parsing admin user', e);
      }
    }

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // Polling 60s
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const data = await api.get<AlertsResponse>('/minutas/admin/alerts');
      setAlerts(data.alerts);
    } catch (err) {
      console.error('Error fetching alerts', err);
    }
  };

  const markAsRead = () => {
    const now = new Date().toISOString();
    setLastReadAt(now);
    localStorage.setItem('admin_alerts_read_at', now);
  };

  const handleLogout = () => {
    Cookies.remove('admin_token');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    router.push('/login');
  };

  const navClasses = (href: string) => {
    const isActive = pathname === href;
    return `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
      isActive 
        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
        : 'text-white/60 hover:bg-white/5 hover:text-white'
    }`;
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        className="fixed top-4 left-4 z-50 rounded-lg bg-primary p-2 text-white shadow-lg lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-40 h-full w-[240px] flex-col border-r border-white/5 bg-[#0d0f14] transition-transform lg:flex lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-5 w-5 text-primary-light" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Minutas <span className="text-primary-light">Admin</span>
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={navClasses(item.href)}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Alerts & User Section */}
        <div className="border-t border-white/5 p-4 space-y-4">
          
          {/* Alerts Bell */}
          <div className="relative">
            <button 
              onClick={() => {
                setShowAlertsPanel(!showAlertsPanel);
                if (!showAlertsPanel) markAsRead();
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                showAlertsPanel ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5'
              }`}
            >
              <div className="relative">
                <Bell size={18} />
                {computedUnread > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                    {computedUnread}
                  </span>
                )}
              </div>
              Alertas
            </button>

            {/* Inline Alerts Panel */}
            {showAlertsPanel && (
              <div className="absolute bottom-full left-0 mb-2 w-full rounded-2xl border border-white/10 bg-[#161920] p-2 shadow-2xl animate-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center justify-between border-b border-white/5 p-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Notificaciones</span>
                  <button onClick={() => setShowAlertsPanel(false)} className="text-white/20 hover:text-white">
                    <X size={14} />
                  </button>
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-1">
                  {alerts.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-white/20 italic">Sin alertas activas</div>
                  ) : (
                    alerts.map((alert, i) => (
                      <div key={i} className="rounded-xl bg-white/[0.02] p-3 border border-white/5">
                        <div className="flex items-start gap-2">
                          {alert.severity === 'error' && <AlertCircle size={14} className="mt-0.5 text-red-400 shrink-0" />}
                          {alert.severity === 'warning' && <AlertTriangle size={14} className="mt-0.5 text-amber-400 shrink-0" />}
                          {alert.severity === 'info' && <Info size={14} className="mt-0.5 text-blue-400 shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-[11px] font-bold text-white/90">{alert.title}</p>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {alert.count > 1 && (
                                  <span className="bg-white/10 px-1 rounded text-[9px] font-mono text-white/40">x{alert.count}</span>
                                )}
                                {new Date(alert.timestamp) > new Date(lastReadAt) && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0 shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                                )}
                              </div>
                            </div>
                            <p className="text-[10px] text-white/40 leading-tight mt-0.5 line-clamp-2">{alert.message}</p>
                            <p className="text-[9px] text-white/20 mt-1.5 font-medium uppercase tracking-tighter">{timeAgo(alert.timestamp)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Block */}
          <div>
            <div className="mb-4 flex items-center gap-3 px-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/40">
                <UserIcon size={18} />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-bold text-white">
                  {adminUser?.name || 'Administrador'}
                </p>
                <p className="truncate text-xs text-white/40">
                  {adminUser?.email || 'admin@minutas.com.mx'}
                </p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut size={18} />
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
