import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  MessageCircle,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { PaymentMethod, Product, Sale, SaleItem } from '../types';
import {
  buildWhatsAppUrl,
  formatDateTimeMz,
  formatMT,
  isValidMzPhone,
  paymentMethodLabel,
} from '../utils/formatters';

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string }[] = [
  { id: 'dinheiro', label: 'Dinheiro' },
  { id: 'mpesa', label: 'M-Pesa' },
  { id: 'emola', label: 'e-Mola' },
  { id: 'mkesh', label: 'mKesh' },
  { id: 'credito', label: 'A crédito' },
];

export const PosView: React.FC = () => {
  const {
    business,
    products,
    customers,
    completeSale,
    saveCustomer,
    requireProOrOpenPaywall,
    showToast,
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [discountStr, setDiscountStr] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('dinheiro');
  const [customerId, setCustomerId] = useState('');
  const [newCustOpen, setNewCustOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>(['Todos', ...business.categories]);
    products.forEach((p) => set.add(p.category));
    return Array.from(set);
  }, [business.categories, products]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const catOk = selectedCategory === 'Todos' || p.category === selectedCategory;
      const searchOk = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      return catOk && searchOk;
    });
  }, [products, selectedCategory, search]);

  const subtotal = useMemo(() => cart.reduce((acc, i) => acc + i.lineTotal, 0), [cart]);
  const discount = Math.min(subtotal, Math.max(0, Number(discountStr) || 0));
  const total = Math.max(0, subtotal - discount);
  const totalItemsCount = useMemo(() => cart.reduce((acc, i) => acc + i.quantity, 0), [cart]);

  const addToCart = (product: Product) => {
    if (!product.isService && product.quantity <= 0) {
      showToast('Produto sem stock disponível.', 'warning');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        if (!product.isService && existing.quantity >= product.quantity) {
          showToast(`Stock máximo disponível: ${product.quantity} un.`, 'warning');
          return prev;
        }
        return prev.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + 1, lineTotal: (i.quantity + 1) * i.unitPrice }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          quantity: 1,
          unitPrice: product.salePrice,
          costPrice: product.costPrice,
          isService: product.isService,
          lineTotal: product.salePrice,
        },
      ];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    const prod = products.find((p) => p.id === productId);
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item;
          const nextQty = item.quantity + delta;
          if (nextQty <= 0) return null;
          if (prod && !prod.isService && nextQty > prod.quantity) {
            showToast(`Stock máximo: ${prod.quantity} un.`, 'warning');
            return item;
          }
          return { ...item, quantity: nextQty, lineTotal: nextQty * item.unitPrice };
        })
        .filter((x): x is SaleItem => x !== null)
    );
  };

  const handleQuickCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireProOrOpenPaywall('adicionar cliente')) return;
    if (!newCustName.trim()) return;
    if (!isValidMzPhone(newCustPhone)) {
      showToast('Telefone inválido. Use telemóvel (ex: 84 123 4567), fixo (21 490 123) ou +indicativo.', 'error');
      return;
    }
    try {
      const created = await saveCustomer({ name: newCustName, phone: newCustPhone });
      if (created) {
        setCustomerId(created.id);
        setNewCustName('');
        setNewCustPhone('');
        setNewCustOpen(false);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao guardar cliente.', 'error');
    }
  };

  const handleFinalizeSale = async () => {
    if (cart.length === 0) return;
    if (!requireProOrOpenPaywall('registar vendas')) return;

    if (paymentMethod === 'credito' && !customerId) {
      showToast('Seleccione ou adicione um cliente para vendas a crédito.', 'warning');
      return;
    }

    const chosenCustomer = customers.find((c) => c.id === customerId);
    setSubmitting(true);
    try {
      const sale = await completeSale({
        items: cart,
        discount,
        paymentMethod,
        customerId: chosenCustomer?.id || '',
        customerName: chosenCustomer?.name || 'Cliente Balcão',
      });
      if (sale) {
        setReceiptSale(sale);
        setCart([]);
        setDiscountStr('');
        setPaymentMethod('dinheiro');
        setCustomerId('');
        setMobileCartOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const buildReceiptText = (sale: Sale): string => {
    const lines = [
      `*${business.name}*`,
      `Recibo de Venda · ${formatDateTimeMz(sale.createdAtMs || Date.now())}`,
      `Cliente: ${sale.customerName || 'Cliente Balcão'}`,
      '-----------------------------',
      ...sale.items.map(
        (i) => `${i.quantity}x ${i.name} — ${formatMT(i.lineTotal)}`
      ),
      '-----------------------------',
    ];
    if (sale.discount > 0) {
      lines.push(`Subtotal: ${formatMT(sale.subtotal)}`);
      lines.push(`Desconto: -${formatMT(sale.discount)}`);
    }
    lines.push(`*Total Pago (${paymentMethodLabel(sale.paymentMethod)}): ${formatMT(sale.total)}*`);
    lines.push('Obrigado pela preferência!');
    return lines.join('\n');
  };

  const cartPanel = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-[#E2E8E4] dark:border-[#23382C]">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-[#15803D] dark:text-[#4ADE80]" />
          <h2 className="text-base font-bold text-[#0F1F16] dark:text-[#F1F5F2]">Carrinho ({totalItemsCount})</h2>
        </div>
        {cart.length > 0 && (
          <button
            type="button"
            onClick={() => setCart([])}
            className="text-xs font-semibold text-red-700 dark:text-red-400 hover:underline min-h-[36px] px-2"
          >
            Limpar
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="py-10 text-center text-sm text-[#4B5E53] dark:text-[#8FA598]">
          Toque nos produtos ou serviços ao lado para adicionar à venda.
        </div>
      ) : (
        <>
          <div className="divide-y divide-[#F1F5F2] dark:divide-[#23382C] max-h-64 overflow-y-auto my-2">
            {cart.map((item) => (
              <div key={item.productId} className="py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#0F1F16] dark:text-[#F1F5F2] truncate">{item.name}</p>
                  <p className="text-xs text-[#4B5E53] dark:text-[#8FA598] font-mono tabular-nums">
                    {formatMT(item.unitPrice)} / un.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateCartQty(item.productId, -1)}
                    aria-label="Diminuir quantidade"
                    className="h-10 w-10 rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#182920] flex items-center justify-center text-[#0F1F16] dark:text-[#F1F5F2] hover:bg-[#F1F5F2] dark:hover:bg-[#1E3327]"
                  >
                    {item.quantity === 1 ? <Trash2 className="h-4 w-4 text-red-700 dark:text-red-400" /> : <Minus className="h-4 w-4" />}
                  </button>
                  <span className="w-7 text-center font-mono text-sm font-bold text-[#0F1F16] dark:text-[#F1F5F2] tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateCartQty(item.productId, 1)}
                    aria-label="Aumentar quantidade"
                    className="h-10 w-10 rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#182920] flex items-center justify-center text-[#0F1F16] dark:text-[#F1F5F2] hover:bg-[#F1F5F2] dark:hover:bg-[#1E3327]"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-3 border-t border-[#E2E8E4] dark:border-[#23382C]">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-semibold text-[#4B5E53] dark:text-[#8FA598] shrink-0">Desconto (MT)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={discountStr}
                onChange={(e) => setDiscountStr(e.target.value)}
                placeholder="0"
                className="min-h-[42px] w-32 rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#0E1813] px-3 text-right font-mono text-sm text-[#0F1F16] dark:text-[#F1F5F2] placeholder:text-[#8FA598] focus:border-[#15803D] dark:focus:border-[#4ADE80] focus:outline-none"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-[#4B5E53] dark:text-[#8FA598] mb-1.5">Forma de pagamento</p>
              <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-3 gap-1.5">
                {PAYMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPaymentMethod(opt.id)}
                    className={`min-h-[42px] rounded-xl border px-2 text-xs font-bold transition-colors whitespace-nowrap ${
                      paymentMethod === opt.id
                        ? 'border-[#15803D] dark:border-[#4ADE80] bg-[#F0FDF4] dark:bg-[#143322] text-[#15803D] dark:text-[#4ADE80]'
                        : 'border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#182920] text-[#0F1F16] dark:text-[#F1F5F2]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === 'credito' && (
              <div className="rounded-xl bg-[#FEFCE8] dark:bg-[#2A230D] border border-[#EAB308]/40 dark:border-[#854D0E]/60 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#713F12] dark:text-[#FEF08A]">Cliente para fiado *</label>
                  <button
                    type="button"
                    onClick={() => setNewCustOpen((v) => !v)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#15803D] dark:text-[#4ADE80]"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Novo cliente</span>
                  </button>
                </div>

                {!newCustOpen ? (
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="min-h-[44px] w-full rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#0E1813] px-3 text-sm text-[#0F1F16] dark:text-[#F1F5F2]"
                  >
                    <option value="">Seleccione o cliente...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                ) : (
                  <form onSubmit={handleQuickCreateCustomer} className="space-y-2">
                    <input
                      type="text"
                      required
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      placeholder="Nome do cliente"
                      className="min-h-[42px] w-full rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#0E1813] px-3 text-sm text-[#0F1F16] dark:text-[#F1F5F2] placeholder:text-[#8FA598]"
                    />
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        inputMode="tel"
                        required
                        maxLength={22}
                        value={newCustPhone}
                        onChange={(e) => setNewCustPhone(e.target.value)}
                        placeholder="Telemóvel ou telefone (ex: 84 123 4567)"
                        className="min-h-[42px] flex-1 rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#0E1813] px-3 text-sm font-mono text-[#0F1F16] dark:text-[#F1F5F2] placeholder:text-[#8FA598]"
                      />
                      <button
                        type="submit"
                        className="min-h-[42px] rounded-xl bg-[#15803D] px-3 text-xs font-bold text-white"
                      >
                        Guardar
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-[#E2E8E4] dark:border-[#23382C]">
              <span className="text-sm font-bold text-[#0F1F16] dark:text-[#F1F5F2]">Total a pagar</span>
              <span className="font-mono text-2xl font-extrabold text-[#15803D] dark:text-[#4ADE80] tabular-nums">
                {formatMT(total)}
              </span>
            </div>

            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleFinalizeSale()}
              className="min-h-[54px] w-full rounded-2xl bg-[#15803D] hover:bg-[#166534] text-base font-extrabold text-white transition-colors disabled:opacity-60"
            >
              {submitting ? 'A registar...' : 'Concluir Venda'}
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pb-20 lg:pb-0">
      {/* Catalog Column */}
      <div className="lg:col-span-7 space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4B5E53] dark:text-[#8FA598]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Procurar produto ou serviço..."
            className="min-h-[48px] w-full rounded-2xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#121F18] pl-10 pr-4 text-sm text-[#0F1F16] dark:text-[#F1F5F2] placeholder:text-[#8FA598] focus:border-[#15803D] dark:focus:border-[#4ADE80] focus:outline-none"
          />
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`min-h-[40px] rounded-xl px-3.5 text-xs font-bold whitespace-nowrap shrink-0 transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#15803D] text-white'
                  : 'bg-white dark:bg-[#121F18] border border-[#E2E8E4] dark:border-[#23382C] text-[#36493E] dark:text-[#B9C9BF] hover:bg-[#F8FAF8] dark:hover:bg-[#182920]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-8 text-center text-sm text-[#4B5E53] dark:text-[#8FA598]">
            Nenhum artigo encontrado para esta pesquisa.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredProducts.map((product) => {
              const outOfStock = !product.isService && product.quantity <= 0;
              const inCartQty = cart.find((i) => i.productId === product.id)?.quantity || 0;

              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addToCart(product)}
                  disabled={outOfStock}
                  className={`relative text-left rounded-2xl border p-3.5 transition-colors flex flex-col justify-between min-h-[124px] ${
                    outOfStock
                      ? 'border-[#E2E8E4] dark:border-[#23382C] bg-[#F8FAF8] dark:bg-[#0E1813] opacity-60 cursor-not-allowed'
                      : inCartQty > 0
                      ? 'border-[#15803D] dark:border-[#4ADE80] bg-[#F0FDF4] dark:bg-[#143322]'
                      : 'border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] hover:border-[#15803D]/60 dark:hover:border-[#4ADE80]/60 active:scale-[0.98]'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-sm font-bold text-[#0F1F16] dark:text-[#F1F5F2] leading-snug line-clamp-2">
                        {product.name}
                      </p>
                      {inCartQty > 0 && (
                        <span className="h-6 min-w-[24px] rounded-lg bg-[#15803D] px-1.5 text-xs font-bold text-white flex items-center justify-center font-mono">
                          {inCartQty}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-[#4B5E53] dark:text-[#8FA598]">
                      {product.isService ? 'Serviço' : `Stock: ${product.quantity}`}
                    </p>
                  </div>

                  <p className="mt-3 font-mono text-sm font-extrabold text-[#15803D] dark:text-[#4ADE80] tabular-nums">
                    {formatMT(product.salePrice)}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop Cart Column */}
      <div className="hidden lg:block lg:col-span-5">
        <div className="sticky top-20 rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-5">
          {cartPanel}
        </div>
      </div>

      {/* Mobile Floating Cart Summary Bar */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-20 left-3 right-3 z-30">
          <button
            type="button"
            onClick={() => setMobileCartOpen(true)}
            className="min-h-[54px] w-full rounded-2xl bg-[#15803D] px-5 py-3 text-white shadow-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <ShoppingCart className="h-5 w-5 text-[#FEF08A]" />
              <span className="text-sm font-bold">
                Ver Carrinho ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'itens'})
              </span>
            </div>
            <span className="font-mono text-base font-extrabold text-[#FEF08A] tabular-nums">
              {formatMT(total)}
            </span>
          </button>
        </div>
      )}

      {/* Mobile Cart Sheet */}
      {mobileCartOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex items-end bg-[#0F1F16]/60 dark:bg-black/75 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-h-[90vh] overflow-y-auto rounded-t-3xl bg-white dark:bg-[#121F18] border-t border-[#E2E8E4] dark:border-[#23382C] p-5 shadow-2xl">
            <div className="w-10 h-1.5 bg-[#CBD5CF] dark:bg-[#2E4839] rounded-full mx-auto mb-3" />
            <div className="flex justify-end mb-1">
              <button
                type="button"
                onClick={() => setMobileCartOpen(false)}
                className="min-h-[40px] px-3 text-xs font-semibold text-[#4B5E53] dark:text-[#8FA598]"
              >
                Fechar
              </button>
            </div>
            {cartPanel}
          </div>
        </div>
      )}

      {/* Receipt & WhatsApp Share Modal */}
      {receiptSale && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0F1F16]/60 dark:bg-black/75 p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#121F18] p-6 shadow-2xl border border-[#E2E8E4] dark:border-[#23382C]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-6 w-6 text-[#15803D] dark:text-[#4ADE80]" />
                <h3 className="text-lg font-bold text-[#0F1F16] dark:text-[#F1F5F2]">Venda Concluída</h3>
              </div>
              <button
                type="button"
                onClick={() => setReceiptSale(null)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#4B5E53] dark:text-[#8FA598] hover:bg-[#F1F5F2] dark:hover:bg-[#182920]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 rounded-2xl bg-[#F8FAF8] dark:bg-[#0E1813] border border-[#E2E8E4] dark:border-[#23382C] p-4 font-mono text-xs text-[#0F1F16] dark:text-[#F1F5F2] whitespace-pre-wrap leading-relaxed">
              {buildReceiptText(receiptSale)}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(buildReceiptText(receiptSale));
                    showToast('Recibo copiado!');
                  } catch {
                    showToast('Copie o texto acima.');
                  }
                }}
                className="min-h-[48px] rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#182920] px-4 text-sm font-semibold text-[#0F1F16] dark:text-[#F1F5F2] inline-flex items-center justify-center gap-2"
              >
                <Copy className="h-4 w-4" />
                <span>Copiar</span>
              </button>
              <a
                href={buildWhatsAppUrl(
                  customers.find((c) => c.id === receiptSale.customerId)?.phone || '',
                  buildReceiptText(receiptSale)
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[48px] rounded-xl bg-[#15803D] px-4 text-sm font-bold text-white inline-flex items-center justify-center gap-2 hover:bg-[#166534]"
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
