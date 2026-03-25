/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Filter,
  Loader2,
  X,
  ChevronDown,
  Package,
  Sparkles,
  Pencil,
  Trash2
} from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
  image: string;
  description?: string;
}

const CREATE_NEW = '__CREATE_NEW__';

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
  const [newCategory, setNewCategory] = useState('');
  const [newImage, setNewImage] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');

  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const isCreateMode = selectedProductId === CREATE_NEW;

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data);
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
    setNewName(''); setNewPrice('');
    setNewCategory(''); setNewImage(''); setNewDescription('');
  };

  const handleAddStock = async () => {
    if (!selectedProductId || !stockQuantity) return;
    const product = products.find(p => p.id === Number(selectedProductId));
    if (!product) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
    setSubmitting(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName, price: Number(newPrice),
          stock: Number(stockQuantity) || 0,
          category: newCategory || 'General',
          image: newImage || '', description: newDescription || undefined,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      const created = await res.json();
      setProducts(prev => [created, ...prev]);
      closeModal();
    } catch (err: any) { alert(err.message); }
    finally { setSubmitting(false); }
  };

  // ── Edit / Delete Modal ──
  const openEditModal = (product: Product) => {
    setEditProduct(product);
    setEditName(product.name);
    setEditPrice(String(product.price));
    setEditStock(String(product.stock));
    setEditCategory(product.category);
    setEditImage(product.image);
    setEditDescription(product.description || '');
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditProduct(null);
  };

  const handleSaveEdit = async () => {
    if (!editProduct || !editName || !editPrice) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${editProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName, price: Number(editPrice),
          stock: Number(editStock) || 0, category: editCategory || 'General',
          image: editImage || '', description: editDescription || undefined,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      const updated = await res.json();
      setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
      closeEditModal();
    } catch (err: any) { alert(err.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!editProduct) return;
    if (!confirm(`Delete "${editProduct.name}"? This cannot be undone.`)) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${editProduct.id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete');
      setProducts(prev => prev.filter(p => p.id !== editProduct.id));
      closeEditModal();
    } catch (err: any) { alert(err.message); }
    finally { setSubmitting(false); }
  };

  const totalItems = products.reduce((sum, p) => sum + p.stock, 0);
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const selectedProduct = products.find(p => p.id === Number(selectedProductId));
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
          <p className="text-[11px] font-bold tracking-[0.05em] text-blue-600 mb-3 uppercase">Stock Overview</p>
          <h2 className="text-4xl font-medium tracking-tight text-slate-900 dark:text-slate-100">Curated Inventory</h2>
        </div>
        <div className="flex items-center gap-12">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total Items</p>
            <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">{totalItems}</p>
          </div>
          <button onClick={() => openModal()} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full text-sm font-semibold transition-all hover:bg-blue-700 shadow-xl shadow-blue-500/10 active:scale-95">
            <Plus className="w-4 h-4" /> Add New Stock
          </button>
        </div>
      </section>

      {/* Product List */}
      <section>
        {products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400 text-sm">No products yet. Click "Add New Stock" to create your first product.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-12 px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="col-span-5">Product Details</div>
              <div className="col-span-2 text-center">Price</div>
              <div className="col-span-1 text-center">Stock</div>
              <div className="col-span-4 text-right">Actions</div>
            </div>
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="grid grid-cols-12 items-center px-6 py-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300 group">
                  <div className="col-span-5 flex items-center gap-6">
                    <div className="w-16 h-20 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-slate-300" /></div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">{product.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">{product.category}</p>
                    </div>
                  </div>
                  <div className="col-span-2 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">${product.price.toFixed(2)}</div>
                  <div className="col-span-1 text-center">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {product.stock}
                    </span>
                  </div>
                  <div className="col-span-4 flex justify-end gap-2">
                    <button
                      onClick={() => openEditModal(product)}
                      className="bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white text-slate-900 dark:text-slate-100 px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <Pencil className="w-3 h-3" /> Modify
                    </button>
                    <button
                      onClick={() => openModal(product.id)}
                      className="bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-900 dark:text-slate-100 px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95"
                    >
                      Add Stock
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Footer */}
      {products.length > 0 && (
        <footer className="mt-12 flex justify-between items-center px-6">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Showing {products.length} Products</p>
        </footer>
      )}

      {/* Floating Filter */}
      <div className="fixed bottom-10 right-10 flex flex-col gap-3 z-30">
        <button className="w-14 h-14 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-90 ring-1 ring-black/5">
          <Filter className="w-6 h-6" />
        </button>
      </div>

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
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} — {p.stock} in stock</option>)}
                      </optgroup>
                    )}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 w-4 h-4" />
                </div>
              </div>

              {isCreateMode && (
                <>
                  <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Product Name *</label><input className={inputClass} placeholder="e.g. Silk Blouse" value={newName} onChange={e => setNewName(e.target.value)} /></div>
                  <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Price *</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span><input className={`${inputClass} pl-8`} type="number" step="0.01" placeholder="0.00" value={newPrice} onChange={e => setNewPrice(e.target.value)} /></div></div>
                  <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Category</label><input className={inputClass} placeholder="e.g. Accessories" value={newCategory} onChange={e => setNewCategory(e.target.value)} /></div>
                  <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Image URL</label><input className={inputClass} placeholder="https://..." value={newImage} onChange={e => setNewImage(e.target.value)} /></div>
                  <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Description</label><input className={inputClass} placeholder="Optional" value={newDescription} onChange={e => setNewDescription(e.target.value)} /></div>
                </>
              )}

              {selectedProduct && !isCreateMode && (
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                  <div className="w-12 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                    {selectedProduct.image ? <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-slate-300" /></div>}
                  </div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{selectedProduct.name}</p><p className="text-xs text-slate-400">{selectedProduct.category}</p></div>
                  <div className="text-right"><p className="text-xs text-slate-400">Current</p><p className="text-lg font-bold text-slate-900 dark:text-slate-100">{selectedProduct.stock}</p></div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">{isCreateMode ? 'Initial Stock' : 'Quantity to Add'}</label>
                <input className={inputClass} type="number" min={isCreateMode ? '0' : '1'} value={stockQuantity} onChange={e => setStockQuantity(e.target.value)} />
              </div>

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
              <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Category</label><input className={inputClass} value={editCategory} onChange={e => setEditCategory(e.target.value)} /></div>
              <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Image URL</label><input className={inputClass} value={editImage} onChange={e => setEditImage(e.target.value)} /></div>
              <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Description</label><input className={inputClass} value={editDescription} onChange={e => setEditDescription(e.target.value)} /></div>

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
