/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Topbar() {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'User';

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    navigate('/login', { replace: true });
  };

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl flex justify-end items-center px-10 py-4 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-6">
        {/* User Info */}
        <div className="text-right text-sm border-r border-slate-200 dark:border-slate-800 pr-6">
          <p className="font-semibold text-slate-900 dark:text-slate-100">{userName}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Tienda Principal</p>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
          Salir
        </button>
      </div>
    </header>
  );
}
