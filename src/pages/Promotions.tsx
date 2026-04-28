import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, Loader2, Pencil, Trash2, X, Plus, Tag, ToggleLeft, ToggleRight } from 'lucide-react';
import { authenticatedFetch } from '../utils/api';

interface ProductOption {
  id: number;
  name: string;
  category: string;
  price: number;
  unidad: string;
}

interface PromotionItem {
  id?: number;
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
  createdAt: string;
}

interface FormItem {
  type: 'product' | 'category';
  productId: string;
  categoryName: string;
  quantity: string;
}

const emptyFormItem = (): FormItem => ({ type: 'product', productId: '', categoryName: '', quantity: '1' });
const emptyForm = { name: '', promoPrice: '', items: [emptyFormItem()] };

export function Promotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const [form, setForm] = useState(emptyForm);

  const categories = useMemo(
    () => [...new Set(products.map(p => p.category))].filter(Boolean).sort(),
    [products]
  );

  const fetchData = async () => {
    try {
      const [promoRes, prodRes] = await Promise.all([
        authenticatedFetch('/api/promotions'),
        authenticatedFetch('/api/products'),
      ]);
      if (!promoRes.ok || !prodRes.ok) throw new Error('Error al cargar datos');
      const [promoData, prodData] = await Promise.all([promoRes.json(), prodRes.json()]);
      setPromotions(promoData);
      setProducts(prodData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditingPromo(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (promo: Promotion) => {
    setEditingPromo(promo);
    setForm({
      name: promo.name,
      promoPrice: String(promo.promoPrice),
      items: promo.items.map(i => ({
        type: i.productId ? 'product' : 'category',
        productId: i.productId ? String(i.productId) : '',
        categoryName: i.categoryName ?? '',
        quantity: String(i.quantity),
      })),
    });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingPromo(null); };

  const addFormItem = () => setForm(f => ({ ...f, items: [...f.items, emptyFormItem()] }));

  const removeFormItem = (index: number) =>
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== index) }));

  const updateFormItem = (index: number, patch: Partial<FormItem>) =>
    setForm(f => {
      const items = [...f.items];
      items[index] = { ...items[index], ...patch };
      // Reset the other selector when type changes
      if (patch.type === 'product') items[index].categoryName = '';
      if (patch.type === 'category') items[index].productId = '';
      return { ...f, items };
    });

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.promoPrice) {
      alert('Completá el nombre y el precio de la promoción');
      return;
    }
    const validItems = form.items.filter(i =>
      (i.type === 'product' ? i.productId : i.categoryName) && Number(i.quantity) > 0
    );
    if (validItems.length === 0) {
      alert('Agregá al menos un producto o categoría a la promoción');
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        name: form.name.trim(),
        promoPrice: Number(form.promoPrice),
        items: validItems.map(i => ({
          ...(i.type === 'product' ? { productId: Number(i.productId) } : { categoryName: i.categoryName }),
          quantity: Number(i.quantity),
        })),
      };

      const res = editingPromo
        ? await authenticatedFetch(`/api/promotions/${editingPromo.id}`, { method: 'PUT', body: JSON.stringify(body) })
        : await authenticatedFetch('/api/promotions', { method: 'POST', body: JSON.stringify(body) });

      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Error'); }
      closeModal();
      setLoading(true);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (promo: Promotion) => {
    try {
      const res = await authenticatedFetch(`/api/promotions/${promo.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !promo.isActive }),
      });
      if (!res.ok) throw new Error('Error al cambiar estado');
      await fetchData();
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await authenticatedFetch(`/api/promotions/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Error al eliminar');
      setConfirmDelete(null);
      setLoading(true);
      await fetchData();
    } catch (err: any) { alert(err.message); }
  };

  const getProductDisplay = (p: { name: string; category: string }) =>
    p.category ? `${p.category} de ${p.name}` : p.name;

  const itemLabel = (item: PromotionItem) => {
    if (item.product) return getProductDisplay(item.product);
    if (item.categoryName) return `cualquier ${item.categoryName}`;
    return '—';
  };

  const regularTotal = (promo: Promotion) =>
    promo.items.reduce((sum, i) => {
      if (i.product) return sum + i.product.price * i.quantity;
      // For category items we can't calculate exact regular price without knowing which products
      return sum;
    }, 0);

  const saving = (promo: Promotion) => {
    const regular = regularTotal(promo);
    return regular > 0 ? regular - promo.promoPrice : 0;
  };

  // Preview saving in form
  const formRegularTotal = useMemo(() => {
    return form.items.reduce((sum, i) => {
      if (i.type === 'product' && i.productId) {
        const p = products.find(p => p.id === Number(i.productId));
        return sum + (p?.price ?? 0) * Number(i.quantity || 1);
      }
      return sum; // can't calculate for categories without knowing which product
    }, 0);
  }, [form.items, products]);

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
        <button onClick={() => { setError(null); setLoading(true); fetchData(); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-full text-xs font-bold">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <section className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tighter text-slate-900 dark:text-slate-100 mb-2">Promociones</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Configurá combos y descuentos que se aplican automáticamente en ventas</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-full font-semibold text-sm hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 shadow-md">
          <Plus className="w-4 h-4" /> Nueva Promoción
        </button>
      </section>

      {/* List */}
      {promotions.length === 0 ? (
        <div className="text-center py-24">
          <Tag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-400 text-sm font-medium">No hay promociones todavía</p>
          <p className="text-slate-300 dark:text-slate-600 text-xs mt-1">Creá tu primera promoción con el botón de arriba</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {promotions.map(promo => {
            const save = saving(promo);
            return (
              <div key={promo.id}
                className={`group bg-white dark:bg-slate-900 rounded-2xl border transition-all ${promo.isActive ? 'border-slate-100 dark:border-slate-800' : 'border-dashed border-slate-200 dark:border-slate-700 opacity-60'}`}>
                <div className="p-6 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${promo.isActive ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                      <Tag className={`w-5 h-5 ${promo.isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{promo.name}</h3>
                        {!promo.isActive && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">Inactiva</span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {promo.items.map((item, i) => (
                          <span key={i} className={`text-xs px-2.5 py-1 rounded-lg ${item.categoryName ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                            {item.quantity} × {itemLabel(item)}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 flex items-baseline gap-3 flex-wrap">
                        <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                          ${promo.promoPrice.toLocaleString('es-AR')}
                        </span>
                        {save > 0 && (
                          <>
                            <span className="text-sm text-slate-400 line-through">
                              ${regularTotal(promo).toLocaleString('es-AR')}
                            </span>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                              Ahorro ${save.toLocaleString('es-AR')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleToggleActive(promo)}
                      className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title={promo.isActive ? 'Desactivar' : 'Activar'}>
                      {promo.isActive ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                    </button>
                    <button onClick={() => openEdit(promo)}
                      className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Editar">
                      <Pencil className="w-4 h-4 text-slate-400" />
                    </button>
                    <button onClick={() => setConfirmDelete(promo.id)}
                      className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Eliminar">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg ring-1 ring-black/5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-8 pt-8 pb-4 sticky top-0 bg-white dark:bg-slate-900 z-10 rounded-t-3xl border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {editingPromo ? 'Editar Promoción' : 'Nueva Promoción'}
                </h3>
                <p className="text-xs text-slate-400">Podés combinar productos específicos y categorías enteras</p>
              </div>
              <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="px-8 py-6 space-y-5">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Nombre de la promoción</label>
                <input
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/30 text-slate-900 dark:text-slate-100 outline-none"
                  placeholder="Ej: Promo 2 sorrentinos, Combo familiar..."
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>

              {/* Promo Price */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Precio de la promoción</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                  <input
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/30 text-slate-900 dark:text-slate-100 outline-none"
                    type="number" step="0.01" min="0" placeholder="0.00"
                    value={form.promoPrice}
                    onChange={e => setForm(f => ({ ...f, promoPrice: e.target.value }))}
                  />
                </div>
                {form.promoPrice && formRegularTotal > 0 && (() => {
                  const save = formRegularTotal - Number(form.promoPrice);
                  if (save > 0) return (
                    <p className="text-xs text-emerald-600 px-1 mt-1">
                      Precio regular: ${formRegularTotal.toLocaleString('es-AR')} · Ahorro: ${save.toLocaleString('es-AR')}
                    </p>
                  );
                  return null;
                })()}
              </div>

              {/* Items */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Productos del combo</label>

                {form.items.map((item, index) => (
                  <div key={index} className="space-y-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      {/* Type toggle */}
                      <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => updateFormItem(index, { type: 'product' })}
                          className={`px-3 py-1.5 text-xs font-semibold transition-colors ${item.type === 'product' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50'}`}
                        >
                          Producto
                        </button>
                        <button
                          type="button"
                          onClick={() => updateFormItem(index, { type: 'category' })}
                          className={`px-3 py-1.5 text-xs font-semibold transition-colors ${item.type === 'category' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50'}`}
                        >
                          Categoría
                        </button>
                      </div>

                      {/* Quantity */}
                      <input
                        type="number" min="1"
                        className="w-16 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100 text-center outline-none focus:ring-2 focus:ring-blue-500/30"
                        value={item.quantity}
                        onChange={e => updateFormItem(index, { quantity: e.target.value })}
                        placeholder="Cant"
                      />

                      {form.items.length > 1 && (
                        <button onClick={() => removeFormItem(index)}
                          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-auto">
                          <X className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      )}
                    </div>

                    {/* Product or Category selector */}
                    <div className="relative">
                      {item.type === 'product' ? (
                        <>
                          <select
                            className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/30 text-slate-900 dark:text-slate-100 outline-none"
                            value={item.productId}
                            onChange={e => updateFormItem(index, { productId: e.target.value })}
                          >
                            <option value="">Seleccionar producto específico...</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.category ? `${p.category} de ${p.name}` : p.name} — ${p.price.toLocaleString('es-AR')}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 w-4 h-4" />
                        </>
                      ) : (
                        <>
                          <select
                            className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/30 text-slate-900 dark:text-slate-100 outline-none"
                            value={item.categoryName}
                            onChange={e => updateFormItem(index, { categoryName: e.target.value })}
                          >
                            <option value="">Seleccionar categoría...</option>
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{cat} (cualquier variedad)</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 w-4 h-4" />
                        </>
                      )}
                    </div>
                  </div>
                ))}

                <button onClick={addFormItem}
                  className="flex items-center gap-2 text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors px-1">
                  <Plus className="w-4 h-4" /> Agregar otro producto o categoría
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button onClick={closeModal}
                  className="flex-1 py-4 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95">
                  Cancelar
                </button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-4 rounded-full font-semibold text-sm hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 shadow-md">
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                    </span>
                  ) : editingPromo ? 'Guardar cambios' : 'Crear Promoción'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm p-8 ring-1 ring-black/5 space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">¿Eliminar promoción?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Las ventas anteriores registradas con esta promo conservan el historial.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                Cancelar
              </button>
              <button onClick={() => handleDelete(confirmDelete)}
                className="flex-1 bg-red-600 text-white py-3 rounded-full font-semibold text-sm hover:bg-red-700 transition-all shadow-md">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
