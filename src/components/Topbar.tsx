/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Topbar() {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'User';

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    navigate('/login', { replace: true });
  };

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] z-40 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl flex justify-between items-center px-10 py-4 border-b border-slate-200 dark:border-slate-800">
      <div className="flex-1 max-w-md">
        <div className="relative flex items-center focus-within:ring-2 focus-within:ring-blue-500/20 rounded-full transition-all">
          <Search className="absolute left-4 w-4 h-4 text-slate-400" />
          <input 
            className="w-full bg-slate-200/50 dark:bg-slate-800/50 border-none rounded-full py-2.5 pl-12 text-xs focus:ring-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400" 
            placeholder="Buscar pedidos, productos..." 
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right text-sm">
          <p className="font-medium text-slate-900 dark:text-slate-100">{userName}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Conectado</p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-950 text-red-600 dark:text-red-400 text-xs font-medium transition"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
          Salir
        </button>
      </div>

    </header>
  );
}
