import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  Edit3,
  Package,
  Plus,
  Search,
  Scissors,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Product } from '../types';
import { compressImageToDataUrl, formatMT } from '../utils/formatters';
import { ConfirmDialog } from './ConfirmDialog';

export const ProductsView: React.FC = () => {
  const {
    business,
    products,
    isStaff,
    saveProduct,
    adjustProductStock,
    deleteProduct,
    requireProOrOpenPaywall,
    showToast,
  } = useApp();

  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'low' | 'services'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [stockModalProduct, setStockModalProduct] = useState<Product | null>(null);
  const [stockDelta, setStockDelta] = useState('10');
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState(business.categories[0] || 'Geral');
  const [isService, setIsService] = useState(false);
  const [costPrice, setCostPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [minStock, setMinStock] = useState('5');
  const [photoDataUrl, setPhotoDataUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (filterMode === 'low' && (p.isService || p.quantity > p.minStock)) return false;
      if (filterMode === 'services' && !p.isService) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.category.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, search, filterMode]);

  const lowStockCount = useMemo(
    () => products.filter((p) => !p.isService && p.quantity <= p.minStock).length,
    [products]
  );

  const openCreateModal = () => {
    if (!requireProOrOpenPaywall('adicionar produtos ou serviços')) return;
    setEditing(null);
    setName('');
    setCategory(business.categories[0] || 'Geral');
    setIsService(false);
    setCostPrice('');
    setSalePrice('');
    setQuantity('0');
    setMinStock('5');
    setPhotoDataUrl('');
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    if (!requireProOrOpenPaywall('editar produtos')) return;
    setEditing(product);
    setName(product.name);
    setCategory(product.category);
    setIsService(product.isService);
    setCostPrice(String(product.costPrice));
    setSalePrice(String(product.salePrice));
    setQuantity(String(product.quantity));
    setMinStock(String(product.minStock));
    setPhotoDataUrl(product.photoDataUrl || '');
    setModalOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageToDataUrl(file);
      setPhotoDataUrl(dataUrl);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Não foi possível carregar a foto.', 'error');
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await saveProduct({
        id: editing?.id,
        name,
        category: category.trim() || 'Geral',
        isService,
        costPrice: Math.max(0, Number(costPrice) || 0),
        salePrice: Math.max(0, Number(salePrice) || 0),
        quantity: isService ? 0 : Math.max(0, Number(quantity) || 0),
        minStock: isService ? 0 : Math.max(0, Number(minStock) || 0),
        photoDataUrl,
      });
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustStock = async (sign: 1 | -1) => {
    if (!stockModalProduct) return;
    const val = Math.max(1, Math.round(Number(stockDelta) || 0));
    await adjustProductStock(stockModalProduct.id, sign * val);
    setStockModalProduct(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0F1F16] dark:text-[#F1F5F2]">Produtos e Stock</h1>
          <p className="text-xs text-[#4B5E53] dark:text-[#8FA598]">
            {products.length} artigos · {lowStockCount} com stock baixo
          </p>
        </div>

        {!isStaff && (
          <button
            type="button"
            onClick={openCreateModal}
            className="min-h-[48px] rounded-xl bg-[#15803D] hover:bg-[#166534] px-4 py-2.5 text-sm font-bold text-white inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Produto / Serviço</span>
          </button>
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4B5E53] dark:text-[#8FA598]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome ou categoria..."
            className="min-h-[48px] w-full rounded-2xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#121F18] pl-10 pr-4 text-sm text-[#0F1F16] dark:text-[#F1F5F2] placeholder:text-[#8FA598] focus:border-[#15803D] dark:focus:border-[#4ADE80] focus:outline-none"
          />
        </div>

        <div className="inline-flex rounded-xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-1 shrink-0">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`min-h-[40px] rounded-lg px-3.5 text-xs font-bold whitespace-nowrap ${
              filterMode === 'all' ? 'bg-[#15803D] text-white' : 'text-[#4B5E53] dark:text-[#8FA598]'
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('low')}
            className={`min-h-[40px] rounded-lg px-3.5 text-xs font-bold whitespace-nowrap ${
              filterMode === 'low' ? 'bg-[#FEF08A] text-[#0F1F16]' : 'text-[#4B5E53] dark:text-[#8FA598]'
            }`}
          >
            Stock baixo ({lowStockCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('services')}
            className={`min-h-[40px] rounded-lg px-3.5 text-xs font-bold whitespace-nowrap ${
              filterMode === 'services' ? 'bg-[#15803D] text-white' : 'text-[#4B5E53] dark:text-[#8FA598]'
            }`}
          >
            Serviços
          </button>
        </div>
      </div>

      {/* Product List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-10 text-center space-y-2">
          <Package className="h-8 w-8 text-[#94A3B8] mx-auto" />
          <p className="text-sm font-semibold text-[#0F1F16] dark:text-[#F1F5F2]">Nenhum artigo encontrado</p>
          <p className="text-xs text-[#4B5E53] dark:text-[#8FA598]">
            Ajuste a pesquisa ou adicione novos produtos e serviços.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((product) => {
            const isLow = !product.isService && product.quantity <= product.minStock;
            return (
              <div
                key={product.id}
                className="rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-4 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {product.photoDataUrl ? (
                    <img
                      src={product.photoDataUrl}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="h-14 w-14 rounded-xl object-cover shrink-0 border border-[#E2E8E4] dark:border-[#23382C]"
                    />
                  ) : (
                    <div
                      className={`h-14 w-14 rounded-xl shrink-0 flex items-center justify-center ${
                        product.isService
                          ? 'bg-[#FEF9C3] dark:bg-[#2A230D] text-[#854D0E] dark:text-[#FACC15]'
                          : 'bg-[#F0FDF4] dark:bg-[#143322] text-[#15803D] dark:text-[#4ADE80]'
                      }`}
                    >
                      {product.isService ? <Scissors className="h-6 w-6" /> : <Package className="h-6 w-6" />}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#0F1F16] dark:text-[#F1F5F2] truncate">{product.name}</p>
                    <p className="text-xs text-[#4B5E53] dark:text-[#8FA598] mt-0.5 truncate">
                      {product.category} · Venda:{' '}
                      <strong className="font-mono text-[#0F1F16] dark:text-[#F1F5F2] tabular-nums">
                        {formatMT(product.salePrice)}
                      </strong>
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      {product.isService ? (
                        <span className="font-medium text-[#854D0E] dark:text-[#FACC15]">Serviço (sem stock)</span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 font-mono font-bold tabular-nums ${
                            product.quantity === 0
                              ? 'text-red-700 dark:text-red-400'
                              : isLow
                              ? 'text-[#854D0E] dark:text-[#FACC15]'
                              : 'text-[#15803D] dark:text-[#4ADE80]'
                          }`}
                        >
                          {isLow && <AlertTriangle className="h-3.5 w-3.5" />}
                          {product.quantity} un. {isLow ? '(Stock baixo)' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!isStaff && (
                  <div className="flex items-center gap-1 shrink-0">
                    {!product.isService && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!requireProOrOpenPaywall('ajustar o stock')) return;
                          setStockDelta('10');
                          setStockModalProduct(product);
                        }}
                        className="min-h-[44px] rounded-xl bg-[#F0FDF4] dark:bg-[#143322] hover:bg-[#DCFCE7] dark:hover:bg-[#19402B] px-3 text-xs font-bold text-[#15803D] dark:text-[#4ADE80]"
                      >
                        Stock
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEditModal(product)}
                      aria-label="Editar artigo"
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#4B5E53] dark:text-[#8FA598] hover:bg-[#F1F5F2] dark:hover:bg-[#182920]"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!requireProOrOpenPaywall('apagar produtos')) return;
                        setDeleteTarget(product);
                      }}
                      aria-label="Apagar artigo"
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Product Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0F1F16]/60 dark:bg-black/75 p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#121F18] p-6 shadow-2xl border border-[#E2E8E4] dark:border-[#23382C]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#0F1F16] dark:text-[#F1F5F2]">
                {editing ? 'Editar Artigo' : 'Novo Produto ou Serviço'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#4B5E53] dark:text-[#8FA598] hover:bg-[#F1F5F2] dark:hover:bg-[#182920]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-[#E2E8E4] dark:border-[#23382C] bg-[#F8FAF8] dark:bg-[#182920] p-3.5">
                <div>
                  <p className="text-sm font-bold text-[#0F1F16] dark:text-[#F1F5F2]">Item é um serviço (sem stock)</p>
                  <p className="text-xs text-[#4B5E53] dark:text-[#8FA598]">Ideal para cortes, tranças, manicure ou recargas.</p>
                </div>
                <input
                  type="checkbox"
                  checked={isService}
                  onChange={(e) => setIsService(e.target.checked)}
                  className="h-6 w-6 accent-[#15803D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F1F16] dark:text-[#B9C9BF] mb-1">Nome *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Arroz 5kg ou Corte Masculino"
                  className="min-h-[48px] w-full rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#0E1813] px-4 text-sm text-[#0F1F16] dark:text-[#F1F5F2] placeholder:text-[#8FA598] focus:border-[#15803D] dark:focus:border-[#4ADE80] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F1F16] dark:text-[#B9C9BF] mb-1">Categoria *</label>
                <input
                  type="text"
                  list="bf-categories"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="min-h-[48px] w-full rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#0E1813] px-4 text-sm text-[#0F1F16] dark:text-[#F1F5F2] focus:border-[#15803D] dark:focus:border-[#4ADE80] focus:outline-none"
                />
                <datalist id="bf-categories">
                  {business.categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F1F16] dark:text-[#B9C9BF] mb-1">
                    Preço de compra / custo (MT)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="0"
                    className="min-h-[48px] w-full rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#0E1813] px-3 text-sm font-mono text-[#0F1F16] dark:text-[#F1F5F2] placeholder:text-[#8FA598] focus:border-[#15803D] dark:focus:border-[#4ADE80] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F1F16] dark:text-[#B9C9BF] mb-1">
                    Preço de venda (MT) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="0"
                    className="min-h-[48px] w-full rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#0E1813] px-3 text-sm font-mono text-[#0F1F16] dark:text-[#F1F5F2] placeholder:text-[#8FA598] focus:border-[#15803D] dark:focus:border-[#4ADE80] focus:outline-none"
                  />
                </div>
              </div>

              {!isService && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#0F1F16] dark:text-[#B9C9BF] mb-1">
                      Quantidade actual *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="min-h-[48px] w-full rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#0E1813] px-3 text-sm font-mono text-[#0F1F16] dark:text-[#F1F5F2] focus:border-[#15803D] dark:focus:border-[#4ADE80] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0F1F16] dark:text-[#B9C9BF] mb-1">
                      Stock mínimo (alerta) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={minStock}
                      onChange={(e) => setMinStock(e.target.value)}
                      className="min-h-[48px] w-full rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#0E1813] px-3 text-sm font-mono text-[#0F1F16] dark:text-[#F1F5F2] focus:border-[#15803D] dark:focus:border-[#4ADE80] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#0F1F16] dark:text-[#B9C9BF] mb-1">
                  Foto do produto (opcional)
                </label>
                <div className="flex items-center gap-3">
                  <label className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#182920] px-4 text-xs font-semibold text-[#0F1F16] dark:text-[#F1F5F2] cursor-pointer hover:bg-[#F8FAF8] dark:hover:bg-[#1E3327]">
                    <Camera className="h-4 w-4 text-[#15803D] dark:text-[#4ADE80]" />
                    <span>Escolher foto</span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                  {photoDataUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoDataUrl('')}
                      className="text-xs font-semibold text-red-700 dark:text-red-400"
                    >
                      Remover foto
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="min-h-[52px] w-full rounded-xl bg-[#15803D] text-sm font-bold text-white hover:bg-[#166534] disabled:opacity-60"
              >
                {saving ? 'A guardar...' : editing ? 'Guardar Alterações' : 'Adicionar Artigo'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {stockModalProduct && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0F1F16]/60 dark:bg-black/75 p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#121F18] p-6 shadow-2xl border border-[#E2E8E4] dark:border-[#23382C]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#0F1F16] dark:text-[#F1F5F2]">Entrada / Ajuste de Stock</h3>
              <button
                type="button"
                onClick={() => setStockModalProduct(null)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#4B5E53] dark:text-[#8FA598] hover:bg-[#F1F5F2] dark:hover:bg-[#182920]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 text-sm text-[#4B5E53] dark:text-[#8FA598]">
              {stockModalProduct.name} · Actual:{' '}
              <strong className="font-mono text-[#0F1F16] dark:text-[#F1F5F2]">{stockModalProduct.quantity} un.</strong>
            </p>
            <div className="mt-4">
              <label className="block text-xs font-semibold text-[#0F1F16] dark:text-[#B9C9BF] mb-1">Quantidade</label>
              <input
                type="number"
                min="1"
                value={stockDelta}
                onChange={(e) => setStockDelta(e.target.value)}
                className="min-h-[48px] w-full rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#0E1813] px-4 font-mono text-base font-bold text-[#0F1F16] dark:text-[#F1F5F2]"
              />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => void handleAdjustStock(-1)}
                className="min-h-[48px] rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/50 text-sm font-bold text-red-700 dark:text-red-400"
              >
                - Baixar
              </button>
              <button
                type="button"
                onClick={() => void handleAdjustStock(1)}
                className="min-h-[48px] rounded-xl bg-[#15803D] text-sm font-bold text-white"
              >
                + Entrada
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Apagar artigo?"
        message={`Tem a certeza que pretende remover "${deleteTarget?.name || ''}" do catálogo? Esta acção não pode ser desfeita.`}
        confirmLabel="Apagar"
        onConfirm={async () => {
          if (deleteTarget) await deleteProduct(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
