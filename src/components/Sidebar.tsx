/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  CreditCard, 
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Sidebar() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const navItems = [
    { icon: LayoutDashboard, label: 'Panel', to: '/', description: 'Resumen de ventas' },
    { icon: Package, label: 'Inventario', to: '/inventory', description: 'Gestionar productos' },
    { icon: CreditCard, label: 'Ventas', to: '/sales', description: 'Registrar ventas' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 flex flex-col p-6 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50">
      <div className="mb-12 px-2 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white shadow-lg">
          <Sparkles className="w-6 h-6 fill-current" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tighter text-slate-900 dark:text-slate-100">Atelier</h1>
          <p className="text-[9px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold">Tienda</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-4 mb-3">Principal</p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 transition-all duration-200 ease-in-out rounded-xl text-sm font-medium tracking-tight group relative",
              isActive 
                ? "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 shadow-sm border border-blue-200 dark:border-blue-900/50" 
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
            )}
            title={item.description}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span>{item.label}</span>
            <span className="absolute right-2 text-slate-300 dark:text-slate-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity">→</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-4">
        <div className="flex items-center justify-between px-2">
          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{localStorage.getItem('userName') || 'Usuario'}</p>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-all duration-200"
            title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
