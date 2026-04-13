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
  Package
} from 'lucide-react';
import Cookies from 'js-cookie';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Usuarios', href: '/users', icon: Users },
  { label: 'Actividad', href: '/activity', icon: Zap },
  { label: 'Suscripciones', href: '/subscriptions', icon: CreditCard },
  { label: 'Planes', href: '/plans', icon: Package },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('admin_user');
    if (userStr) {
      try {
        setAdminUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Error parsing admin user', e);
      }
    }
  }, []);

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
        <nav className="flex-1 space-y-1 px-3">
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

        {/* User & Logout */}
        <div className="border-t border-white/5 p-4">
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
      </aside>
    </>
  );
}
