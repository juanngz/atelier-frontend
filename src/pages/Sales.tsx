/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  Loader2
} from 'lucide-react';
import { authenticatedFetch } from '../utils/api';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  unidad: string;
  category: string;
  image: string;
}

interface CartItem {
  productId: number;
  productName: string;
  quantity: number;
  priceSold: number;
  totalPrice: number;
}

interface Transaction {
  id: number;
  productId: number;
  customer: string;
  amount: number;
  quantity: number;
  status: string;
  createdAt: string;
  product: {
    name: string;
    image: string;
  };
}

interface Stats {
  totalSalesToday: number;
  avgOrderValue: number;
  totalTransactions: number;
}

export function Sales() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats>({ totalSalesToday: 0, avgOrderValue: 0, totalTransactions: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [priceSold, setPriceSold] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const [txRes, prodRes, statsRes] = await Promise.all([
        authenticatedFetch('/api/sales'),
        authenticatedFetch('/api/products'),
        authenticatedFetch('/api/sales/stats'),
      ]);
      if (!txRes.ok || !prodRes.ok || !statsRes.ok) throw new Error('Failed to fetch data');
      const [txData, prodData, statsData] = await Promise.all([
        txRes.json(),
        prodRes.json(),
        statsRes.json(),
      ]);
      setTransactions(txData);
      setProducts(prodData);
      const uniqueCategories = [...new Set(prodData.map((p: Product) => p.category))].filter(Boolean);
      setCategories(uniqueCategories);
      setStats(statsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Get filtered products by category
  const getProductsByCategory = () => {
    if (!selectedCategory) return [];
    return products.filter(p => p.category === selectedCategory);
  };

  // Auto-fill price when product is selected
  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    if (productId) {
      const product = products.find(p => p.id === Number(productId));
      if (product) setPriceSold(product.price.toString());
    } else {
      setPriceSold('');
    }
  };

  // Add product to cart
  const handleAddToCart = () => {
    if (!selectedProductId || !priceSold || !quantity) return;
    
    const product = products.find(p => p.id === Number(selectedProductId));
    if (!product) return;
    
    const newCartItem: CartItem = {
      productId: product.id,
      productName: product.name,
      quantity: Number(quantity),
      priceSold: Number(priceSold),
      totalPrice: Number(quantity) * Number(priceSold),
    };

    // Check if product already in cart, if so update quantity
    const existingIndex = cartItems.findIndex(item => item.productId === product.id);
    if (existingIndex >= 0) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += Number(quantity);
      updated[existingIndex].totalPrice = updated[existingIndex].quantity * updated[existingIndex].priceSold;
      setCartItems(updated);
    } else {
      setCartItems([...cartItems, newCartItem]);
    }

    // Reset form
    setSelectedProductId('');
    setPriceSold('');
    setQuantity('1');
  };

  // Remove item from cart
  const handleRemoveFromCart = (productId: number) => {
    setCartItems(cartItems.filter(item => item.productId !== productId));
  };

  // Update quantity in cart
  const handleUpdateCartQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    const updated = cartItems.map(item => 
      item.productId === productId 
        ? { ...item, quantity: newQuantity, totalPrice: newQuantity * item.priceSold }
        : item
    );
    setCartItems(updated);
  };

  const handleSubmit = async () => {
    if (cartItems.length === 0) {
      alert('Please add items to cart');
      return;
    }
    const token = localStorage.getItem('authToken');
    if (!token) { alert('Not authenticated'); return; }

    setSubmitting(true);
    try {
      // Create promises for all cart items
      const promises = cartItems.map(item => 
        authenticatedFetch('/api/sales', {
          method: 'POST',
          body: JSON.stringify({
            productId: item.productId,
            amount: item.priceSold,
            quantity: item.quantity,
            customer: 'Anonymous',
          }),
        })
      );

      const results = await Promise.all(promises);
      
      // Check if all requests were successful
      for (const res of results) {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to record sale');
        }
      }

      // Reset form & refresh data
      setSelectedCategory('');
      setSelectedProductId('');
      setPriceSold('');
      setQuantity('1');
      setCartItems([]);
      setLoading(true);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500 text-sm">{error}</p>
        <button
          onClick={() => { setError(null); setLoading(true); fetchData(); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-full text-xs font-bold"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  return (
    <div className="space-y-16">
      {/* Metric Strip */}
      <div className="flex items-baseline gap-20 mb-16">
        <div>
          <span className="block text-[0.6875rem] font-bold text-slate-400 uppercase tracking-[0.1em] mb-2">Ventas Totales Hoy</span>
          <div className="flex items-baseline gap-2">
            <span className="text-[3.5rem] font-semibold tracking-tighter text-slate-900 dark:text-slate-100 leading-none">${stats.totalSalesToday.toLocaleString()}</span>
          </div>
        </div>
        <div className="h-12 w-[1px] bg-slate-200 dark:bg-slate-800 self-center"></div>
        <div>
          <span className="block text-[0.6875rem] font-bold text-slate-400 uppercase tracking-[0.1em] mb-2">Valor Promedio de Orden</span>
          <div className="flex items-baseline gap-2">
            <span className="text-[3.5rem] font-semibold tracking-tighter text-slate-900 dark:text-slate-100 leading-none">${stats.avgOrderValue.toLocaleString()}</span>
            <span className="text-sm font-semibold text-slate-400">USD</span>
          </div>
        </div>
        <div className="h-12 w-[1px] bg-slate-200 dark:bg-slate-800 self-center"></div>
        <div>
          <span className="block text-[0.6875rem] font-bold text-slate-400 uppercase tracking-[0.1em] mb-2">Transacciones</span>
          <div className="flex items-baseline gap-2">
            <span className="text-[3.5rem] font-semibold tracking-tighter text-slate-900 dark:text-slate-100 leading-none">{stats.totalTransactions}</span>
          </div>
        </div>
      </div>

      {/* Asymmetric Grid: Form & List */}
      <div className="grid grid-cols-12 gap-10">
        {/* Left Column: Sales Form */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 sticky top-32 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold tracking-tight mb-8 text-slate-900 dark:text-slate-100">Registrar Venta</h2>
            <form className="space-y-6" onSubmit={e => e.preventDefault()}>
              {/* Category Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Seleccionar Categoría</label>
                <div className="relative">
                  <select
                    className="w-full appearance-none bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-blue-500/30 text-slate-900 dark:text-slate-100 shadow-sm"
                    value={selectedCategory}
                    onChange={e => {
                      setSelectedCategory(e.target.value);
                      setSelectedProductId('');
                      setPriceSold('');
                    }}
                  >
                    <option value="">Seleccionar una categoría...</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 w-4 h-4" />
                </div>
              </div>

              {/* Product Selection */}
              {selectedCategory && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Seleccionar Producto</label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-blue-500/30 text-slate-900 dark:text-slate-100 shadow-sm"
                      value={selectedProductId}
                      onChange={e => handleProductChange(e.target.value)}
                    >
                      <option value="">Seleccionar un producto...</option>
                      {getProductsByCategory().map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.stock} {p.unidad})</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 w-4 h-4" />
                  </div>
                </div>
              )}

              {/* Price and Quantity */}
              {selectedProductId && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Precio de Venta</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                      <input
                        className="w-full bg-white dark:bg-slate-800 border-none rounded-xl pl-8 pr-4 py-3 text-sm focus:ring-1 focus:ring-blue-500/30 text-slate-900 dark:text-slate-100 shadow-sm"
                        placeholder="0.00"
                        type="number"
                        step="0.01"
                        value={priceSold}
                        onChange={e => setPriceSold(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Cantidad</label>
                    <input
                      className="w-full bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-blue-500/30 text-slate-900 dark:text-slate-100 shadow-sm"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={e => setQuantity(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Add to Cart Button */}
              {selectedProductId && priceSold && (
                <button
                  className="w-full bg-green-600 text-white py-3 rounded-full font-semibold text-sm transition-all hover:bg-green-700 shadow-xl shadow-green-500/10 active:scale-95"
                  type="button"
                  onClick={handleAddToCart}
                >
                  Agregar al Carrito
                </button>
              )}

              {/* Shopping Cart */}
              {cartItems.length > 0 && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Carrito ({cartItems.length} productos)</h3>
                  <div className="space-y-3 mb-4">
                    {cartItems.map(item => (
                      <div key={item.productId} className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.productName}</p>
                          <p className="text-xs text-slate-500">
                            {item.quantity} × ${item.priceSold.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-blue-600">${item.totalPrice.toFixed(2)}</span>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => handleUpdateCartQuantity(item.productId, Number(e.target.value))}
                            className="w-12 bg-white dark:bg-slate-700 border-none rounded px-2 py-1 text-xs text-slate-900 dark:text-slate-100"
                          />
                          <button
                            onClick={() => handleRemoveFromCart(item.productId)}
                            className="text-red-500 hover:text-red-700 text-sm font-semibold"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg mb-4">
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-1">Total:</p>
                    <p className="text-xl font-bold text-blue-600">
                      ${cartItems.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              {/* Checkout Button */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  className="w-full bg-blue-600 text-white py-4 rounded-full font-semibold text-sm transition-all hover:bg-blue-700 shadow-xl shadow-blue-500/10 active:scale-95 disabled:opacity-50"
                  type="button"
                  disabled={submitting || cartItems.length === 0}
                  onClick={handleSubmit}
                >
                  {submitting ? 'Procesando...' : cartItems.length > 0 ? `Completar Venta (${cartItems.length})` : 'Completar Transacción'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Recent Sales List */}
        <div className="col-span-12 lg:col-span-8">
          <div className="flex justify-between items-center mb-8 px-4">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Transacciones Recientes</h2>
          </div>
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <p className="text-center text-slate-400 py-12 text-sm">Aún no hay transacciones. ¡Registrá tu primera venta!</p>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="group bg-white dark:bg-slate-900 p-6 rounded-2xl transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 overflow-hidden">
                      <img
                        src={tx.product.image}
                        alt={tx.product.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{tx.product.name}</p>
                      <p className="text-xs text-slate-500">{formatDate(tx.createdAt)} • Cliente: {tx.customer}{tx.quantity > 1 ? ` • Cant: ${tx.quantity}` : ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-slate-900 dark:text-slate-100">${(tx.amount * tx.quantity).toFixed(2)}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block ${tx.status === 'PAID' ? 'text-green-600 bg-green-50 dark:bg-green-900/20' :
                      tx.status === 'REFUNDED' ? 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' :
                        'text-slate-400 bg-slate-100 dark:bg-slate-800'
                      }`}>
                      {tx.status}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
