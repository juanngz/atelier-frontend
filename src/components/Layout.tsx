/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ChevronRight } from 'lucide-react';

export function Layout() {
  const location = useLocation();

  const breadcrumbMap: Record<string, string> = {
    '/': 'Panel',
    '/inventory': 'Inventario',
    '/sales': 'Ventas',
    '/analytics': 'Analíticas',
    '/settings': 'Ajustes',
  };

  const currentPage = breadcrumbMap[location.pathname] || 'Página';

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Sidebar />
      <Topbar />
      <main className="ml-64 pt-24 px-10 pb-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-sm">
          <p className="text-slate-400">Atelier</p>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">{currentPage}</p>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
