/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Filter,
  Loader2,
  X,
  ChevronDown,
  Package,
  Sparkles,
  Pencil,
  Trash2,
  ArrowUpDown,
} from 'lucide-react';
import { authenticatedFetch } from '../utils/api';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  unidad: string;
  category: string;
}

const CREATE_NEW = '__CREATE_NEW__';
const CREATE_NEW_CAT = '__CREATE_NEW_CAT__';

export function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Stock / Create modal
  const [showModal, setShowModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [stockQuantity, setStockQuantity] = useState('1');
  const [submitting, setSubmitting] = useState(false);

  // New product fields
  const [newName, setNewName] = useState('');

  const [newPrice, setNewPrice] = useState('');
  const [newUnidad, setNewUnidad] = useState('cajas');
  const [newCategory, setNewCategory] = useState('');
  const [isNewCategoryMode, setIsNewCategoryMode] = useState(false);


  // Categories
  const [categories, setCategories] = useState<string[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  // Filters & sort
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStockLevel, setFilterStockLevel] = useState<string>('all'); // all, low, out
  const [sortBy, setSortBy] = useState<'default' | 'stock_desc' | 'stock_asc' | 'name_asc'>('default');

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');

  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editUnidad, setEditUnidad] = useState('cajas');
  const [editCategory, setEditCategory] = useState('');


  const isCreateMode = selectedProductId === CREATE_NEW;

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const res = await authenticatedFetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data.map((p: Product) => p.category))].filter(Boolean) as string[];
      setCategories(uniqueCategories);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  // ── Add Stock / Create Modal ──
  const openModal = (productId?: number) => {
    setSelectedProductId(productId ? String(productId) : '');
    setStockQuantity('1');
    resetNewProductForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProductId('');
    setStockQuantity('1');
    resetNewProductForm();
  };

  const resetNewProductForm = () => {
    setNewName(''); setNewPrice(''); setNewUnidad('cajas');
    setNewCategory(''); setIsNewCategoryMode(false);
  };

  const openCategoryModal = () => {
    setShowCategoryModal(true);
    setNewCategoryName('');
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setNewCategoryName('');
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    if (categories.includes(newCategoryName.trim())) {
      alert('This category already exists');
      return;
    }
    setCategorySubmitting(true);
    try {
      setCategories(prev => [...prev, newCategoryName.trim()]);
      closeCategoryModal();
    } finally {
      setCategorySubmitting(false);
    }
  };

  const handleAddStock = async () => {
    if (!selectedProductId || !stockQuantity) return;
    const product = products.find(p => p.id === Number(selectedProductId));
    if (!product) return;
    const token = localStorage.getItem('authToken');
    if (!token) { alert('Not authenticated'); return; }
    setSubmitting(true);
    try {
      const res = await authenticatedFetch(`/api/products/${product.id}`, {
        method: 'PUT',
        body: JSON.stringify({ stock: product.stock + Number(stockQuantity) }),
      });
      if (!res.ok) throw new Error('Failed to update stock');
      const updated = await res.json();
      setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
      closeModal();
    } catch (err: any) { alert('Error: ' + err.message); }
    finally { setSubmitting(false); }
  };

  const handleCreateProduct = async () => {
    if (!newName || !newPrice) return;
    const token = localStorage.getItem('authToken');
    if (!token) { alert('Not authenticated'); return; }
    setSubmitting(true);
    try {
      const res = await authenticatedFetch('/api/products', {
        method: 'POST',
        body: JSON.stringify({
          name: newName, price: Number(newPrice),
          stock: Number(stockQuantity) || 0,
          unidad: newUnidad,
          category: newCategory || 'General',
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      const created = await res.json();
      setProducts(prev => [created, ...prev]);
      closeModal();
      // Refresh categories in case a new one was added
      fetchProducts();
    } catch (err: any) { alert(err.message); }
    finally { setSubmitting(false); }
  };

  // ── Edit / Delete Modal ──
  const openEditModal = (product: Product) => {
    setEditProduct(product);
    setEditName(product.name);
    setEditPrice(String(product.price));
    setEditStock(String(product.stock));
    setEditUnidad(product.unidad || 'cajas');
    setEditCategory(product.category);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditProduct(null);
  };

  // Filter + sort
  const getFilteredProducts = () => {
    const filtered = products.filter(product => {
      if (filterCategory && product.category !== filterCategory) return false;
      if (filterStockLevel === 'out' && product.stock > 0) return false;
      if (filterStockLevel === 'low' && product.stock >= 5) return false;
      return true;
    });

    if (sortBy === 'stock_desc') return [...filtered].sort((a, b) => b.stock - a.stock);
    if (sortBy === 'stock_asc') return [...filtered].sort((a, b) => a.stock - b.stock);
    if (sortBy === 'name_asc') return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    return filtered;
  };

  const activeFilterCount = (filterCategory ? 1 : 0) + (filterStockLevel !== 'all' ? 1 : 0);

  const openFilterModal = () => setShowFilterModal(true);
  const closeFilterModal = () => setShowFilterModal(false);

  const clearFilters = () => {
    setFilterCategory('');
    setFilterStockLevel('all');
  };

  const handleSaveEdit = async () => {
    if (!editProduct || !editName || !editPrice) return;
    const token = localStorage.getItem('authToken');
    if (!token) { alert('Not authenticated'); return; }
    setSubmitting(true);
    try {
      const res = await authenticatedFetch(`/api/products/${editProduct.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editName, price: Number(editPrice),
          stock: Number(editStock) || 0, unidad: editUnidad, category: editCategory || 'General',
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      const updated = await res.json();
      setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
      closeEditModal();
      // Refresh categories in case a new one was added
      fetchProducts();
    } catch (err: any) { alert(err.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!editProduct) return;
    if (!confirm(`Delete "${editProduct.name}"? This cannot be undone.`)) return;
    const token = localStorage.getItem('authToken');
    if (!token) { alert('Not authenticated'); return; }
    setSubmitting(true);
    try {
      const res = await authenticatedFetch(`/api/products/${editProduct.id}`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete');
      setProducts(prev => prev.filter(p => p.id !== editProduct.id));
      closeEditModal();
    } catch (err: any) { alert(err.message); }
    finally { setSubmitting(false); }
  };

  const totalItems = products.length;
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const selectedProduct = products.find(p => p.id === Number(selectedProductId));
  const getProductDisplayName = (product: Product) =>
    product.category && product.name ? `${product.category} de ${product.name}` : product.name;
  const inputClass = "w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-slate-900 dark:text-slate-100 transition-all";

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500 text-sm">{error}</p>
        <button onClick={() => { setError(null); setLoading(true); fetchProducts(); }} className="px-4 py-2 bg-blue-600 text-white rounded-full text-xs font-bold">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-16 mt-8">
      {/* Header */}
      <section className="flex justify-between items-end">
        <div>
          <p className="text-[11px] font-bold tracking-[0.05em] text-slate-500 mb-3 uppercase">Gestión de Inventario</p>
          <h2 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Stock Management</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total Artículos</p>
            <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">{totalItems}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => openCategoryModal()} className="flex items-center gap-2 bg-purple-600 text-white px-5 py-3 rounded-full text-sm font-semibold transition-all hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-500/20 active:scale-95 shadow-md" title="Agregar nueva categoría">
              <Plus className="w-4 h-4" /> Categoría
            </button>
            <button onClick={() => openModal()} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-full text-sm font-semibold transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 shadow-md" title="Crear nuevo producto">
              <Plus className="w-4 h-4" /> Producto
            </button>
          </div>
        </div>
      </section>

      {/* Product List */}
      <section>
        {products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400 text-sm">Aún no hay productos. Hacé clic en "+ Producto" para crear el primero.</p>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {/* Filtrar button */}
              <button
                onClick={openFilterModal}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all active:scale-95 shadow-sm border ${
                  activeFilterCount > 0
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filtrar
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-white/30 text-[10px] font-bold flex items-center justify-center">{activeFilterCount}</span>
                )}
              </button>

              {/* Ordenar por */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as typeof sortBy)}
                  className={`appearance-none pl-9 pr-8 py-2.5 rounded-full text-sm font-semibold border transition-all cursor-pointer ${
                    sortBy !== 'default'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <option value="default">Ordenar por</option>
                  <option value="stock_desc">Stock: mayor a menor</option>
                  <option value="stock_asc">Stock: menor a mayor</option>
                  <option value="name_asc">Nombre: A → Z</option>
                </select>
                <ArrowUpDown className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none w-3.5 h-3.5 ${sortBy !== 'default' ? 'text-white' : 'text-slate-400'}`} />
                <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-3.5 h-3.5 ${sortBy !== 'default' ? 'text-white' : 'text-slate-400'}`} />
              </div>

              {/* Active filter chips */}
              {filterCategory && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold border border-blue-200 dark:border-blue-800">
                  {filterCategory}
                  <button onClick={() => setFilterCategory('')} className="hover:text-blue-900 dark:hover:text-blue-100 transition-colors"><X className="w-3 h-3" /></button>
                </span>
              )}
              {filterStockLevel !== 'all' && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-full text-xs font-semibold border border-amber-200 dark:border-amber-800">
                  {filterStockLevel === 'low' ? 'Stock bajo' : 'Sin stock'}
                  <button onClick={() => setFilterStockLevel('all')} className="hover:text-amber-900 dark:hover:text-amber-100 transition-colors"><X className="w-3 h-3" /></button>
                </span>
              )}
              {(activeFilterCount > 0 || sortBy !== 'default') && (
                <button
                  onClick={() => { clearFilters(); setSortBy('default'); }}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium transition-colors"
                >
                  Limpiar todo
                </button>
              )}

              {/* Count */}
              <span className="ml-auto text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                {getFilteredProducts().length} de {products.length} productos
              </span>
            </div>

            <div className="grid grid-cols-12 px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="col-span-5">Producto</div>
              <div className="col-span-2 text-center">Precio</div>
              <div className="col-span-1 text-center">Stock</div>
              <div className="col-span-4 text-right">Acciones</div>
            </div>
            <div className="space-y-4">
              {getFilteredProducts().map((product) => (
                <div key={product.id} className="grid grid-cols-12 items-center px-6 py-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300 group">
                  <div className="col-span-5 flex items-center gap-6">
                    <div>
                      <h3 className="text-base font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">{getProductDisplayName(product)}</h3>
                      <p className="text-xs text-slate-500 mt-1">{product.category}</p>
                    </div>
                  </div>
                  <div className="col-span-2 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">${product.price.toFixed(2)}</div>
                  <div className="col-span-1 text-center">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                      product.stock === 0
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        : product.stock < 5
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {product.stock} {product.unidad}
                    </span>
                  </div>
                  <div className="col-span-4 flex justify-end gap-2">
                    <button
                      onClick={() => openEditModal(product)}
                      className="bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-500 hover:text-white text-amber-600 dark:text-amber-400 px-4 py-2.5 rounded-full text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-sm hover:shadow-md"
                      title="Editar producto"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button
                      onClick={() => openModal(product.id)}
                      className="bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-400 px-4 py-2.5 rounded-full text-xs font-bold transition-all active:scale-95 shadow-sm hover:shadow-md"
                      title="Agregar más stock"
                    >
                      + Stock
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ══════ ADD STOCK / CREATE PRODUCT MODAL ══════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden ring-1 ring-black/5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-8 pt-8 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCreateMode ? 'bg-green-50 dark:bg-green-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                  {isCreateMode ? <Sparkles className="w-5 h-5 text-green-600" /> : <Package className="w-5 h-5 text-blue-600" />}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{isCreateMode ? 'Create New Product' : 'Add New Stock'}</h3>
                  <p className="text-xs text-slate-400">{today}</p>
                </div>
              </div>
              <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="px-8 pb-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Select Product</label>
                <div className="relative">
                  <select className={`${inputClass} appearance-none`} value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)}>
                    <option value="">Choose a product...</option>
                    <option value={CREATE_NEW}>＋ Create new product</option>
                    {products.length > 0 && (
                      <optgroup label="Existing products">
                        {products.map(p => <option key={p.id} value={p.id}>{getProductDisplayName(p)} — {p.stock} in stock</option>)}
                      </optgroup>
                    )}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 w-4 h-4" />
                </div>
              </div>

              {isCreateMode && (
                <>
                  <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Relleno / Sabor *</label><input className={inputClass} placeholder="e.g. Silk Blouse" value={newName} onChange={e => setNewName(e.target.value)} /></div>
                  <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Precio *</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span><input className={`${inputClass} pl-8`} type="number" step="0.01" placeholder="0.00" value={newPrice} onChange={e => setNewPrice(e.target.value)} /></div></div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Categoria</label>
                    {isNewCategoryMode ? (
                      <div className="flex gap-2">
                        <input
                          className={inputClass}
                          placeholder="Nombre de nueva categoría..."
                          value={newCategory}
                          onChange={e => setNewCategory(e.target.value)}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => { setIsNewCategoryMode(false); setNewCategory(''); }}
                          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 text-xs font-semibold transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <select
                          className={`${inputClass} appearance-none`}
                          value={newCategory}
                          onChange={e => {
                            if (e.target.value === CREATE_NEW_CAT) {
                              setIsNewCategoryMode(true);
                              setNewCategory('');
                            } else {
                              setNewCategory(e.target.value);
                            }
                          }}
                        >
                          <option value="">Seleccionar categoría...</option>
                          <option value={CREATE_NEW_CAT}>＋ Crear nueva categoría</option>
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 w-4 h-4" />
                      </div>
                    )}
                  </div>

                </>
              )}

              {selectedProduct && !isCreateMode && (
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{getProductDisplayName(selectedProduct)}</p><p className="text-xs text-slate-400">{selectedProduct.category}</p></div>
                  <div className="text-right"><p className="text-xs text-slate-400">Current</p><p className="text-lg font-bold text-slate-900 dark:text-slate-100">{selectedProduct.stock}</p></div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">{isCreateMode ? 'Initial Stock' : 'Quantity to Add'}</label>
                <input className={inputClass} type="number" min={isCreateMode ? '0' : '1'} value={stockQuantity} onChange={e => setStockQuantity(e.target.value)} />
              </div>

              {isCreateMode && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Unidad de Medida</label>
                  <div className="relative">
                    <select className={`${inputClass} appearance-none`} value={newUnidad} onChange={e => setNewUnidad(e.target.value)}>
                      <option value="cajas">Cajas</option>
                      <option value="kilos">Kilos</option>
                      <option value="unidades">Unidades</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 w-4 h-4" />
                  </div>
                </div>
              )}

              {selectedProduct && !isCreateMode && Number(stockQuantity) > 0 && (
                <div className="flex justify-between items-center px-4 py-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                  <span className="text-xs font-semibold text-blue-600">New Stock Total</span>
                  <span className="text-lg font-bold text-blue-600">{selectedProduct.stock + Number(stockQuantity)}</span>
                </div>
              )}

              {isCreateMode ? (
                <button onClick={handleCreateProduct} disabled={submitting || !newName || !newPrice} className="w-full bg-green-600 text-white py-4 rounded-full font-semibold text-sm transition-all hover:bg-green-700 shadow-xl shadow-green-500/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? 'Creating...' : 'Create Product'}
                </button>
              ) : (
                <button onClick={handleAddStock} disabled={submitting || !selectedProductId || !stockQuantity || Number(stockQuantity) < 1} className="w-full bg-blue-600 text-white py-4 rounded-full font-semibold text-sm transition-all hover:bg-blue-700 shadow-xl shadow-blue-500/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? 'Updating...' : 'Confirm Stock Update'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════ ADD CATEGORY MODAL ══════ */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeCategoryModal} />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden ring-1 ring-black/5">
            <div className="flex items-center justify-between px-8 pt-8 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 dark:bg-amber-900/20">
                  <Plus className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Add New Category</h3>
                  <p className="text-xs text-slate-400">{today}</p>
                </div>
              </div>
              <button onClick={closeCategoryModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="px-8 pb-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Category Name *</label>
                <input 
                  className={inputClass} 
                  placeholder="e.g. Electronics, Clothing, Food..." 
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  onKeyPress={e => {
                    if (e.key === 'Enter') {
                      handleAddCategory();
                    }
                  }}
                />
              </div>

              <button 
                onClick={handleAddCategory} 
                disabled={categorySubmitting || !newCategoryName.trim()} 
                className="w-full bg-amber-600 text-white py-4 rounded-full font-semibold text-sm transition-all hover:bg-amber-700 shadow-xl shadow-amber-500/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {categorySubmitting ? 'Adding...' : 'Add Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════ FILTER MODAL ══════ */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeFilterModal} />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden ring-1 ring-black/5">
            <div className="flex items-center justify-between px-8 pt-8 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-900/20">
                  <Filter className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Filtrar productos</h3>
                  <p className="text-xs text-slate-400">{today}</p>
                </div>
              </div>
              <button onClick={closeFilterModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="px-8 pb-8 space-y-5">
              {/* Filter by Category */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Categoría</label>
                <div className="relative">
                  <select 
                    className={`${inputClass} appearance-none`} 
                    value={filterCategory} 
                    onChange={e => setFilterCategory(e.target.value)}
                  >
                    <option value="">Todas las categorías</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 w-4 h-4" />
                </div>
              </div>

              {/* Filter by Stock Level */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Nivel de stock</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                    <input 
                      type="radio" 
                      name="stock-level" 
                      value="all" 
                      checked={filterStockLevel === 'all'}
                      onChange={e => setFilterStockLevel(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-slate-900 dark:text-slate-100 font-medium">Todos los productos</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                    <input 
                      type="radio" 
                      name="stock-level" 
                      value="low" 
                      checked={filterStockLevel === 'low'}
                      onChange={e => setFilterStockLevel(e.target.value)}
                      className="w-4 h-4 text-amber-600"
                    />
                    <span className="text-sm text-slate-900 dark:text-slate-100 font-medium">Stock bajo (0–4 unidades)</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                    <input 
                      type="radio" 
                      name="stock-level" 
                      value="out" 
                      checked={filterStockLevel === 'out'}
                      onChange={e => setFilterStockLevel(e.target.value)}
                      className="w-4 h-4 text-red-600"
                    />
                    <span className="text-sm text-slate-900 dark:text-slate-100 font-medium">Sin stock</span>
                  </label>
                </div>
              </div>

              {/* Active Filters Display */}
              {(filterCategory || filterStockLevel !== 'all') && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                  <p className="text-xs font-semibold text-blue-600 mb-2">Filtros activos:</p>
                  <div className="flex flex-wrap gap-2">
                    {filterCategory && (
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                        {filterCategory}
                      </span>
                    )}
                    {filterStockLevel !== 'all' && (
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                        {filterStockLevel === 'low' ? 'Stock bajo' : 'Sin stock'}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={clearFilters}
                  className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-full text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
                >
                  Limpiar
                </button>
                <button
                  onClick={closeFilterModal}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-full text-sm font-semibold hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-500/10"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════ EDIT / DELETE PRODUCT MODAL ══════ */}
      {showEditModal && editProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeEditModal} />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden ring-1 ring-black/5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-8 pt-8 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center">
                  <Pencil className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Modify Product</h3>
                  <p className="text-xs text-slate-400">{editProduct.category}</p>
                </div>
              </div>
              <button onClick={closeEditModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="px-8 pb-8 space-y-5">
              <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Product Name *</label><input className={inputClass} value={editName} onChange={e => setEditName(e.target.value)} /></div>
              <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Price *</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span><input className={`${inputClass} pl-8`} type="number" step="0.01" value={editPrice} onChange={e => setEditPrice(e.target.value)} /></div></div>
              <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Stock</label><input className={inputClass} type="number" min="0" value={editStock} onChange={e => setEditStock(e.target.value)} /></div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Unidad de Medida</label>
                <div className="relative">
                  <select className={`${inputClass} appearance-none`} value={editUnidad} onChange={e => setEditUnidad(e.target.value)}>
                    <option value="cajas">Cajas</option>
                    <option value="kilos">Kilos</option>
                    <option value="unidades">Unidades</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 w-4 h-4" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Categoría</label>
                <div className="relative">
                  <select className={`${inputClass} appearance-none`} value={editCategory} onChange={e => setEditCategory(e.target.value)}>
                    <option value="">Select a category...</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 w-4 h-4" />
                </div>
              </div>


              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleDelete}
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 px-5 py-4 rounded-full border border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 dark:hover:bg-red-900/10 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={submitting || !editName || !editPrice}
                  className="flex-1 bg-amber-500 text-white py-4 rounded-full font-semibold text-sm transition-all hover:bg-amber-600 shadow-xl shadow-amber-500/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
