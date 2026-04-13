'use client';

import AdminSidebar from '@/components/AdminSidebar';
import { usePathname } from 'next/navigation';

const TITLES: Record<string, string> = {
  '/dashboard': 'Panel de Control',
  '/users': 'Gestión de Usuarios',
  '/activity': 'Feed de Actividad',
  '/subscriptions': 'Suscripciones y Pagos',
  '/plans': 'Gestión de Planes',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const title = TITLES[pathname] || 'Minutas Admin';

  return (
    <div className="flex min-h-screen bg-[#0c0e12] text-white">
      <AdminSidebar />
      
      <main className="flex-1 lg:pl-[240px]">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-white/5 bg-[#0c0e12]/80 px-8 backdrop-blur-md">
          <h1 className="text-xl font-bold tracking-tight text-white lg:text-2xl">
            {title}
          </h1>
        </header>

        {/* Content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
