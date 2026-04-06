/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  CreditCard, 
  BarChart3, 
  Settings, 
  Sparkles 
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Sidebar() {
  const navItems = [
    { icon: LayoutDashboard, label: 'Panel', to: '/' },
    { icon: Package, label: 'Inventario', to: '/inventory' },
    { icon: CreditCard, label: 'Ventas', to: '/sales' },
    { icon: BarChart3, label: 'Analíticas', to: '/analytics' },
    { icon: Settings, label: 'Ajustes', to: '/settings' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 flex flex-col p-6 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50">
      <div className="mb-10 px-2 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
          <Sparkles className="w-5 h-5 fill-current" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tighter text-slate-900 dark:text-slate-100">Atelier</h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Gestión de Tienda</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 transition-all duration-200 ease-in-out rounded-xl text-sm font-medium tracking-tight",
              isActive 
                ? "text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-800 shadow-sm" 
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            <item.icon className={cn("w-5 h-5", item.to === '/' && "fill-none")} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>


    </aside>
  );
}
