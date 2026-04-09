/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Package, 
  Loader2,
  Plus,
  ShoppingCart,
  Package2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { authenticatedFetch } from '../utils/api';

interface DashboardData {
  dailyRevenue: number;
  todayTxCount: number;
  totalProducts: number;
  chartData: { day: string; revenue: number }[];
  recentTransactions: {
    id: number;
    productName: string;
    customer: string;
    amount: number;
    status: string;
    date: string;
  }[];
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('No authenticated');
      setLoading(false);
      return;
    }

    authenticatedFetch('/api/dashboard')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch dashboard');
        return res.json();
      })
      .then(setData)
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500 text-sm">{error || 'Sin datos'}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-full text-xs font-bold"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('es-AR', { month: 'short', day: 'numeric' });

  const maxRevenue = Math.max(...data.chartData.map(d => d.revenue), 1);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <section>
        <h1 className="text-4xl font-semibold tracking-tighter text-slate-900 dark:text-slate-100 mb-2">Bienvenido de nuevo</h1>
        <p className="text-slate-500 dark:text-slate-400">Aquí está el resumen de tu negocio de hoy</p>
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/sales')}
          className="group flex items-center gap-4 p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 rounded-2xl border border-blue-200 dark:border-blue-900/50 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">Registrar Venta</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Añadir nueva transacción</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/inventory')}
          className="group flex items-center gap-4 p-6 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-300 text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Package2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">Ver Inventario</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Gestionar productos</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/inventory')}
          className="group flex items-center gap-4 p-6 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 rounded-2xl border border-purple-200 dark:border-purple-900/50 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">Añadir Producto</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Nuevo artículo</p>
          </div>
        </button>
      </section>

      {/* Metric Strip */}
      <section>
        <div className="flex flex-wrap gap-20">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-2 block">Ingreso Diario</span>
            <h2 className="text-[3.5rem] font-semibold leading-none tracking-tighter text-slate-900 dark:text-slate-100">
              ${data.dailyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <p className="text-xs text-blue-600 font-semibold mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Ventas de hoy
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-2 block">Transacciones Hoy</span>
            <h2 className="text-[3.5rem] font-semibold leading-none tracking-tighter text-slate-900 dark:text-slate-100">{data.todayTxCount}</h2>
            <p className="text-xs text-slate-400 font-semibold mt-2 flex items-center gap-1">
              Transacciones pagadas
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-2 block">Productos</span>
            <h2 className="text-[3.5rem] font-semibold leading-none tracking-tighter text-slate-900 dark:text-slate-100">{data.totalProducts}</h2>
            <p className="text-xs text-slate-400 font-semibold mt-2 flex items-center gap-1">
              <Package className="w-3 h-3" /> En catálogo
            </p>
          </div>
        </div>
      </section>

      {/* Sales Performance Chart */}
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h3 className="text-xl font-medium tracking-tight mb-1 text-slate-900 dark:text-slate-100">Rendimiento de Ventas</h3>
            <p className="text-sm text-slate-500">Ingresos de los últimos 7 días</p>
          </div>
        </div>
        
        <div className="h-64 w-full">
          {data.chartData.every(d => d.revenue === 0) ? (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              Aún no hay datos de ventas — el gráfico aparecerá cuando se registren transacciones
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.chartData}>
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                  dy={10}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Ingresos']}
                />
                <Bar dataKey="revenue" radius={[12, 12, 0, 0]}>
                  {data.chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.revenue === maxRevenue && entry.revenue > 0 ? '#2563eb' : '#e2e8f0'} 
                      className="hover:fill-blue-400 transition-colors duration-300"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-medium tracking-tight text-slate-900 dark:text-slate-100">Transacciones Recientes</h3>
        </div>
        {data.recentTransactions.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">Aún no hay transacciones</p>
        ) : (
          <div className="space-y-1">
            <div className="grid grid-cols-12 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <div className="col-span-4">Producto</div>
              <div className="col-span-3 text-center">Estado</div>
              <div className="col-span-3 text-center">Cliente</div>
              <div className="col-span-2 text-right">Monto</div>
            </div>
            {data.recentTransactions.map((tx) => (
              <div key={tx.id} className="grid grid-cols-12 items-center px-6 py-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                <div className="col-span-4 flex items-center gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{tx.productName}</p>
                    <p className="text-[10px] text-slate-400">{formatDate(tx.date)}</p>
                  </div>
                </div>
                <div className="col-span-3 flex justify-center">
                  <span className={`px-3 py-1 text-[10px] font-bold rounded-full ${
                    tx.status === 'PAID' ? 'bg-green-50 text-green-600 dark:bg-green-900/20' :
                    tx.status === 'REFUNDED' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {tx.status}
                  </span>
                </div>
                <div className="col-span-3 text-center text-sm font-medium text-slate-600 dark:text-slate-400">{tx.customer}</div>
                <div className="col-span-2 text-right text-sm font-bold text-slate-900 dark:text-slate-100">${tx.amount.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
