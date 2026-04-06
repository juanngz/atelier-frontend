/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Package, 
  Loader2
} from 'lucide-react';
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
    productImage: string;
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
        <p className="text-red-500 text-sm">{error || 'No data'}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-full text-xs font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const maxRevenue = Math.max(...data.chartData.map(d => d.revenue), 1);

  return (
    <div className="space-y-14">
      {/* Metric Strip */}
      <section>
        <div className="flex flex-wrap gap-20">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-2 block">Daily Revenue</span>
            <h2 className="text-[3.5rem] font-semibold leading-none tracking-tighter text-slate-900 dark:text-slate-100">
              ${data.dailyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <p className="text-xs text-blue-600 font-semibold mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Sales today
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-2 block">Transactions Today</span>
            <h2 className="text-[3.5rem] font-semibold leading-none tracking-tighter text-slate-900 dark:text-slate-100">{data.todayTxCount}</h2>
            <p className="text-xs text-slate-400 font-semibold mt-2 flex items-center gap-1">
              Paid transactions
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-2 block">Products</span>
            <h2 className="text-[3.5rem] font-semibold leading-none tracking-tighter text-slate-900 dark:text-slate-100">{data.totalProducts}</h2>
            <p className="text-xs text-slate-400 font-semibold mt-2 flex items-center gap-1">
              <Package className="w-3 h-3" /> In catalog
            </p>
          </div>
        </div>
      </section>

      {/* Sales Performance Chart */}
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h3 className="text-xl font-medium tracking-tight mb-1 text-slate-900 dark:text-slate-100">Sales Performance</h3>
            <p className="text-sm text-slate-500">Last 7 days revenue</p>
          </div>
        </div>
        
        <div className="h-64 w-full">
          {data.chartData.every(d => d.revenue === 0) ? (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              No sales data yet — chart will appear when transactions are recorded
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
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
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
          <h3 className="text-xl font-medium tracking-tight text-slate-900 dark:text-slate-100">Recent Transactions</h3>
        </div>
        {data.recentTransactions.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">No transactions yet</p>
        ) : (
          <div className="space-y-1">
            <div className="grid grid-cols-12 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <div className="col-span-4">Product</div>
              <div className="col-span-3 text-center">Status</div>
              <div className="col-span-3 text-center">Customer</div>
              <div className="col-span-2 text-right">Amount</div>
            </div>
            {data.recentTransactions.map((tx) => (
              <div key={tx.id} className="grid grid-cols-12 items-center px-6 py-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                <div className="col-span-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <img 
                      src={tx.productImage} 
                      alt={tx.productName} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
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
