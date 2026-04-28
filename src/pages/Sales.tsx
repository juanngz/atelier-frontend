import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, Loader2, Pencil, Trash2, X, Tag } from 'lucide-react';
import { authenticatedFetch } from '../utils/api';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  unidad: string;
  category: string;
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
  amount: number;
  quantity: number;
  status: string;
  createdAt: string;
  promotionName?: string;
  product: {
    name: string;
    category?: string;
  };
}

interface Stats {
  totalSalesToday: number;
  avgOrderValue: number;
  totalTransactions: number;
}

interface PromotionItem {
  productId?: number | null;
  categoryName?: string | null;
  quantity: number;
  product?: {
    id: number;
    name: string;
    category: string;
    price: number;
    unidad: string;
  } | null;
}

interface Promotion {
  id: number;
  name: string;
  promoPrice: number;
  isActive: boolean;
  items: PromotionItem[];
}

// --- Resolved cart types ---

interface PromoLineItem {
  productId: number;
  productName: string;
  quantityCovered: number;
  unitPrice: number; // prorated promo price per unit
}

interface PromoLine {
  type: 'promo';
  promotionId: number;
  promotionName: string;
  promoCount: number;
  promoPrice: number; // price per single application
  lineItems: PromoLineItem[];
  total: number;
}

interface RegularLine {
  type: 'regular';
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

type CartLine = PromoLine | RegularLine;

// Computes which promos apply given current cart and returns resolved lines
function applyPromotions(cartItems: CartItem[], promotions: Promotion[], products: Product[]): CartLine[] {
  const remaining = new Map<number, number>();
  for (const item of cartItems) {
    remaining.set(item.productId, (remaining.get(item.productId) ?? 0) + item.quantity);
  }

  const lines: CartLine[] = [];

  for (const promo of promotions.filter(p => p.isActive)) {
    if (promo.items.length === 0) continue;

    // How many times can we fully apply this promo?
    let count = Infinity;
    for (const pi of promo.items) {
      if (pi.productId != null) {
        const available = remaining.get(pi.productId) ?? 0;
        count = Math.min(count, Math.floor(available / pi.quantity));
      } else if (pi.categoryName) {
        const totalInCat = cartItems
          .filter(ci => products.find(p => p.id === ci.productId)?.category === pi.categoryName)
          .reduce((sum, ci) => sum + (remaining.get(ci.productId) ?? 0), 0);
        count = Math.min(count, Math.floor(totalInCat / pi.quantity));
      }
    }
    if (!isFinite(count) || count === 0) continue;

    // Collect covered items and subtract from remaining
    const covered: Array<{ productId: number; productName: string; quantityCovered: number; regularPrice: number }> = [];

    for (const pi of promo.items) {
      if (pi.productId != null) {
        const product = products.find(p => p.id === pi.productId);
        if (!product) continue;
        const qty = pi.quantity * count;
        remaining.set(pi.productId, (remaining.get(pi.productId) ?? 0) - qty);
        covered.push({
          productId: pi.productId,
          productName: product.category ? `${product.category} de ${product.name}` : product.name,
          quantityCovered: qty,
          regularPrice: product.price,
        });
      } else if (pi.categoryName) {
        let toTake = pi.quantity * count;
        const catItems = cartItems.filter(ci => {
          const p = products.find(p => p.id === ci.productId);
          return p?.category === pi.categoryName && (remaining.get(ci.productId) ?? 0) > 0;
        });
        for (const ci of catItems) {
          if (toTake <= 0) break;
          const available = remaining.get(ci.productId) ?? 0;
          const take = Math.min(available, toTake);
          remaining.set(ci.productId, available - take);
          toTake -= take;
          const product = products.find(p => p.id === ci.productId)!;
          covered.push({
            productId: ci.productId,
            productName: product.category ? `${product.category} de ${product.name}` : product.name,
            quantityCovered: take,
            regularPrice: product.price,
          });
        }
      }
    }

    // Allocate promo price proportionally by regular price
    const totalRegular = covered.reduce((sum, c) => sum + c.regularPrice * c.quantityCovered, 0);
    const promoTotal = promo.promoPrice * count;

    const lineItems: PromoLineItem[] = covered.map(c => ({
      productId: c.productId,
      productName: c.productName,
      quantityCovered: c.quantityCovered,
      unitPrice: totalRegular > 0
        ? (c.regularPrice / totalRegular) * promoTotal
        : promoTotal / covered.reduce((s, x) => s + x.quantityCovered, 0),
    }));

    lines.push({
      type: 'promo',
      promotionId: promo.id,
      promotionName: promo.name,
      promoCount: count,
      promoPrice: promo.promoPrice,
      lineItems,
      total: promoTotal,
    });
  }

  // Remaining units at regular price
  for (const item of cartItems) {
    const qty = remaining.get(item.productId) ?? 0;
    if (qty > 0) {
      lines.push({
        type: 'regular',
        productId: item.productId,
        productName: item.productName,
        quantity: qty,
        unitPrice: item.priceSold,
        total: qty * item.priceSold,
      });
    }
  }

  return lines;
}

export function Sales() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
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

  // Edit transaction modal
  const [showTxModal, setShowTxModal] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [txSubmitting, setTxSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const openTxModal = (tx: Transaction, isDelete: boolean = false) => {
    setEditTx(tx);
    setEditAmount(String(tx.amount));
    setEditQuantity(String(tx.quantity));
    setEditStatus(tx.status);
    setConfirmDelete(isDelete);
    setShowTxModal(true);
  };

  const closeTxModal = () => { setShowTxModal(false); setEditTx(null); setConfirmDelete(false); };

  const handleSaveTx = async () => {
    if (!editTx) return;
    setTxSubmitting(true);
    try {
      const res = await authenticatedFetch(`/api/sales/${editTx.id}`, {
        method: 'PUT',
        body: JSON.stringify({ amount: Number(editAmount), quantity: Number(editQuantity), status: editStatus }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      closeTxModal();
      await fetchData();
    } catch (err: any) { alert(err.message); }
    finally { setTxSubmitting(false); }
  };

  const handleDeleteTx = async () => {
    if (!editTx) return;
    setTxSubmitting(true);
    try {
      const res = await authenticatedFetch(`/api/sales/${editTx.id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        const errorText = await res.text();
        throw new Error(`Failed to delete (${res.status}): ${errorText.substring(0, 50)}`);
      }
      closeTxModal();
      await fetchData();
    } catch (err: any) { alert(err.message); }
    finally { setTxSubmitting(false); }
  };

  const getProductDisplayName = (product: Product) =>
    product.category ? `${product.category} de ${product.name}` : product.name;

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) { setError('Not authenticated'); setLoading(false); return; }

      const [txRes, prodRes, statsRes, promoRes] = await Promise.all([
        authenticatedFetch('/api/sales'),
        authenticatedFetch('/api/products'),
        authenticatedFetch('/api/sales/stats'),
        authenticatedFetch('/api/promotions'),
      ]);
      if (!txRes.ok || !prodRes.ok || !statsRes.ok || !promoRes.ok) throw new Error('Failed to fetch data');
      const [txData, prodData, statsData, promoData] = await Promise.all([
        txRes.json(), prodRes.json(), statsRes.json(), promoRes.json(),
      ]);
      setTransactions(txData);
      setProducts(prodData);
      setStats(statsData);
      setPromotions(promoData);
      const uniqueCategories = [...new Set(prodData.map((p: Product) => p.category))].filter(Boolean) as string[];
      setCategories(uniqueCategories);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getProductsByCategory = () => {
    if (!selectedCategory) return [];
    return products.filter(p => p.category === selectedCategory);
  };

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    if (productId) {
      const product = products.find(p => p.id === Number(productId));
      if (product) setPriceSold(product.price.toString());
    } else {
      setPriceSold('');
    }
  };

  const handleAddToCart = () => {
    if (!selectedProductId || !priceSold || !quantity) return;
    const product = products.find(p => p.id === Number(selectedProductId));
    if (!product) return;

    const displayName = getProductDisplayName(product);
    const existingIndex = cartItems.findIndex(item => item.productId === product.id);
    if (existingIndex >= 0) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += Number(quantity);
      updated[existingIndex].totalPrice = updated[existingIndex].quantity * updated[existingIndex].priceSold;
      setCartItems(updated);
    } else {
      setCartItems([...cartItems, {
        productId: product.id,
        productName: displayName,
        quantity: Number(quantity),
        priceSold: Number(priceSold),
        totalPrice: Number(quantity) * Number(priceSold),
      }]);
    }

    setSelectedProductId('');
    setPriceSold('');
    setQuantity('1');
  };

  const handleRemoveFromCart = (productId: number) => {
    setCartItems(cartItems.filter(item => item.productId !== productId));
  };

  const handleUpdateCartQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) { handleRemoveFromCart(productId); return; }
    setCartItems(cartItems.map(item =>
      item.productId === productId
        ? { ...item, quantity: newQuantity, totalPrice: newQuantity * item.priceSold }
        : item
    ));
  };

  // Resolved cart: promos applied
  const resolvedCart = useMemo(
    () => applyPromotions(cartItems, promotions, products),
    [cartItems, promotions, products]
  );

  const resolvedTotal = resolvedCart.reduce((sum, line) => sum + line.total, 0);
  const regularTotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalSaving = regularTotal - resolvedTotal;
  const hasPromos = resolvedCart.some(l => l.type === 'promo');

  const handleSubmit = async () => {
    if (cartItems.length === 0) { alert('Agregá artículos al carrito'); return; }
    const token = localStorage.getItem('authToken');
    if (!token) { alert('Not authenticated'); return; }

    setSubmitting(true);
    try {
      const promises = resolvedCart.flatMap(line => {
        if (line.type === 'promo') {
          return line.lineItems.map(item =>
            authenticatedFetch('/api/sales', {
              method: 'POST',
              body: JSON.stringify({
                productId: item.productId,
                amount: item.unitPrice,
                quantity: item.quantityCovered,
                promotionId: line.promotionId,
                promotionName: line.promotionName,
              }),
            })
          );
        }
        return [authenticatedFetch('/api/sales', {
          method: 'POST',
          body: JSON.stringify({
            productId: line.productId,
            amount: line.unitPrice,
            quantity: line.quantity,
          }),
        })];
      });

      const results = await Promise.all(promises);
      for (const res of results) {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to record sale');
        }
      }

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
    <div className="space-y-10">
      {/* Header */}
      <section>
        <h1 className="text-4xl font-semibold tracking-tighter text-slate-900 dark:text-slate-100 mb-2">Registrar Ventas</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Seleccioná un producto, establecé el precio de venta y cantidad</p>
      </section>

      {/* Metric Strip */}
      <div className="flex items-baseline gap-20 mb-10">
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

      {/* Asymmetric Grid */}
      <div className="grid grid-cols-12 gap-10">
        {/* Left Column: Sales Form */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 sticky top-32 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold tracking-tight mb-8 text-slate-900 dark:text-slate-100">Registrar Venta</h2>
            <form className="space-y-6" onSubmit={e => e.preventDefault()}>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Seleccionar Categoría</label>
                <div className="relative">
                  <select
                    className="w-full appearance-none bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-blue-500/30 text-slate-900 dark:text-slate-100 shadow-sm"
                    value={selectedCategory}
                    onChange={e => { setSelectedCategory(e.target.value); setSelectedProductId(''); setPriceSold(''); }}
                  >
                    <option value="">Seleccionar una categoría...</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 w-4 h-4" />
                </div>
              </div>

              {/* Product */}
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
                        <option key={p.id} value={p.id}>{getProductDisplayName(p)} ({p.stock} {p.unidad})</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 w-4 h-4" />
                  </div>
                </div>
              )}

              {/* Price & Quantity */}
              {selectedProductId && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Precio de Venta</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                      <input
                        className="w-full bg-white dark:bg-slate-800 border-none rounded-xl pl-8 pr-4 py-3 text-sm focus:ring-1 focus:ring-blue-500/30 text-slate-900 dark:text-slate-100 shadow-sm"
                        placeholder="0.00" type="number" step="0.01"
                        value={priceSold} onChange={e => setPriceSold(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Cantidad</label>
                    <div className="relative">
                      <input
                        className="w-full bg-white dark:bg-slate-800 border-none rounded-xl px-4 pr-12 py-3 text-sm focus:ring-1 focus:ring-blue-500/30 text-slate-900 dark:text-slate-100 shadow-sm"
                        type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)}
                      />
                      {selectedProductId && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                          {products.find(p => p.id === Number(selectedProductId))?.unidad}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Add to cart */}
              {selectedProductId && priceSold && (
                <button
                  className="w-full bg-emerald-600 text-white py-3 rounded-full font-semibold text-sm transition-all hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95 shadow-md"
                  type="button" onClick={handleAddToCart}
                >
                  + Agregar al Carrito
                </button>
              )}

              {/* Cart */}
              {cartItems.length > 0 && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6 space-y-5">

                  {/* Raw items (editable) */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Carrito ({cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'})</h3>
                    <div className="space-y-2">
                      {cartItems.map(item => (
                        <div key={item.productId} className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{item.productName}</p>
                            <p className="text-xs text-slate-500">${item.priceSold.toFixed(2)} c/u</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <input
                              type="number" min="1" value={item.quantity}
                              onChange={e => handleUpdateCartQuantity(item.productId, Number(e.target.value))}
                              className="w-12 bg-white dark:bg-slate-700 border-none rounded px-2 py-1 text-xs text-slate-900 dark:text-slate-100 text-center"
                            />
                            <button onClick={() => handleRemoveFromCart(item.productId)}
                              className="text-red-400 hover:text-red-600 text-sm leading-none">✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Promo-resolved summary */}
                  <div className="rounded-xl p-4 space-y-2 bg-blue-50 dark:bg-blue-900/10">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                      {hasPromos ? 'Resumen con Promociones' : 'Resumen'}
                    </p>

                    {resolvedCart.map((line, i) => (
                      line.type === 'promo' ? (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Tag className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                {line.promotionName} × {line.promoCount}
                              </span>
                            </div>
                            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                              ${line.total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="pl-5 space-y-0.5">
                            {line.lineItems.map((li, j) => (
                              <p key={j} className="text-[11px] text-slate-500">
                                {li.productName} × {li.quantityCovered}
                              </p>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-xs text-slate-600 dark:text-slate-400">
                            {line.productName} × {line.quantity}
                          </span>
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            ${line.total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )
                    ))}

                    <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Total</span>
                        <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                          ${resolvedTotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      {totalSaving > 0.01 && (
                        <p className="text-[11px] text-emerald-600 text-right mt-0.5 font-medium">
                          Ahorro: ${totalSaving.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Checkout */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-full font-semibold text-sm transition-all hover:from-green-700 hover:to-emerald-700 hover:shadow-lg hover:shadow-green-500/20 active:scale-95 disabled:opacity-50 shadow-md disabled:shadow-none"
                  type="button" disabled={submitting || cartItems.length === 0}
                  onClick={handleSubmit}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Procesando...
                    </span>
                  ) : cartItems.length > 0 ? (
                    `✓ Completar Venta (${cartItems.length} ${cartItems.length === 1 ? 'artículo' : 'artículos'})`
                  ) : (
                    'Completar Transacción'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Transactions */}
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
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {tx.product.category ? `${tx.product.category} de ${tx.product.name}` : tx.product.name}
                        </p>
                        {tx.promotionName && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                            <Tag className="w-2.5 h-2.5" />{tx.promotionName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {formatDate(tx.createdAt)}{tx.quantity > 1 ? ` · Cant: ${tx.quantity}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-sm text-slate-900 dark:text-slate-100">${(tx.amount * tx.quantity).toFixed(2)}</p>
                      <p className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block ${tx.status === 'PAID' ? 'text-green-600 bg-green-50 dark:bg-green-900/20' :
                        tx.status === 'REFUNDED' ? 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' :
                          'text-slate-400 bg-slate-100 dark:bg-slate-800'}`}>
                        {tx.status}
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <button onClick={() => openTxModal(tx)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Editar">
                        <Pencil className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                      <button onClick={() => openTxModal(tx, true)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Eliminar">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Edit Transaction Modal */}
      {showTxModal && editTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeTxModal} />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md mx-4 ring-1 ring-black/5">
            <div className="flex items-center justify-between px-8 pt-8 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Editar Transacción</h3>
                <p className="text-xs text-slate-400">{editTx.product.category ? `${editTx.product.category} de ${editTx.product.name}` : editTx.product.name}</p>
              </div>
              <button onClick={closeTxModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="px-8 pb-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Precio unitario</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                  <input className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500/30 text-slate-900 dark:text-slate-100"
                    type="number" step="0.01" value={editAmount} onChange={e => setEditAmount(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Cantidad</label>
                <input className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500/30 text-slate-900 dark:text-slate-100"
                  type="number" min="1" value={editQuantity} onChange={e => setEditQuantity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Estado</label>
                <select className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500/30 text-slate-900 dark:text-slate-100"
                  value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                  <option value="PAID">PAID</option>
                  <option value="REFUNDED">REFUNDED</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </div>
              {confirmDelete ? (
                <div className="pt-2 space-y-3">
                  <p className="text-sm text-center text-slate-600 dark:text-slate-400">¿Eliminar esta transacción? El stock será restaurado.</p>
                  <div className="flex gap-3">
                    <button onClick={() => setConfirmDelete(false)} disabled={txSubmitting}
                      className="flex-1 py-4 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50">
                      Cancelar
                    </button>
                    <button onClick={handleDeleteTx} disabled={txSubmitting}
                      className="flex-1 bg-red-600 text-white py-4 rounded-full font-semibold text-sm hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 shadow-md">
                      {txSubmitting ? 'Eliminando...' : 'Confirmar'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setConfirmDelete(true)} disabled={txSubmitting}
                    className="flex items-center gap-2 px-5 py-4 rounded-full border border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 dark:hover:bg-red-900/10 transition-all active:scale-95 disabled:opacity-50">
                    <Trash2 className="w-4 h-4" /> Eliminar
                  </button>
                  <button onClick={handleSaveTx} disabled={txSubmitting || !editAmount || !editQuantity}
                    className="flex-1 bg-blue-600 text-white py-4 rounded-full font-semibold text-sm hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 shadow-md">
                    {txSubmitting ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
