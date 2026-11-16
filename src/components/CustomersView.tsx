import React, { useMemo, useState } from 'react';
import {
  ChevronRight,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  UserCheck,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Customer, Debt, PaymentMethod } from '../types';
import {
  buildWhatsAppUrl,
  formatDateTimeMz,
  formatMT,
  formatPhoneDisplay,
  isValidMzPhone,
  paymentMethodLabel,
} from '../utils/formatters';
import { ConfirmDialog } from './ConfirmDialog';

export const CustomersView: React.FC = () => {
  const {
    business,
    customers,
    debts,
    payments,
    isStaff,
    saveCustomer,
    deleteCustomer,
    recordDebtPayment,
    requireProOrOpenPaywall,
    showToast,
  } = useApp();

  const [search, setSearch] = useState('');
  const [onlyDebtors, setOnlyDebtors] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custSecondaryPhone, setCustSecondaryPhone] = useState('');
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [payDebtTarget, setPayDebtTarget] = useState<Debt | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<Exclude<PaymentMethod, 'credito'>>('dinheiro');
  const [payNote, setPayNote] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      if (onlyDebtors && c.totalDebt <= 0) return false;
      if (
        q &&
        !c.name.toLowerCase().includes(q) &&
        !c.phone.includes(q) &&
        !(c.secondaryPhone || '').includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [customers, search, onlyDebtors]);

  const totalReceivable = useMemo(
    () => customers.reduce((acc, c) => acc + c.totalDebt, 0),
    [customers]
  );

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) || null,
    [customers, selectedCustomerId]
  );

  const customerDebts = useMemo(
    () => debts.filter((d) => d.customerId === selectedCustomerId),
    [debts, selectedCustomerId]
  );

  const customerPayments = useMemo(
    () => payments.filter((p) => p.customerId === selectedCustomerId),
    [payments, selectedCustomerId]
  );

  const openCreateCustomerModal = () => {
    if (!requireProOrOpenPaywall('registar novos clientes')) return;
    setEditingCustomerId(null);
    setCustName('');
    setCustPhone('');
    setCustSecondaryPhone('');
    setAddModalOpen(true);
  };

  const openEditCustomerModal = (customer: Customer) => {
    if (!requireProOrOpenPaywall('editar dados do cliente')) return;
    setEditingCustomerId(customer.id);
    setCustName(customer.name);
    setCustPhone(customer.phone);
    setCustSecondaryPhone(customer.secondaryPhone || '');
    setAddModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidMzPhone(custPhone)) {
      showToast('Telefone inválido. Introduza telemóvel (ex: 84 123 4567), telefone fixo (ex: 21 490 123) ou número com +indicativo.', 'error');
      return;
    }
    if (custSecondaryPhone.trim() && !isValidMzPhone(custSecondaryPhone)) {
      showToast('Telefone alternativo inválido. Verifique os dígitos introduzidos.', 'error');
      return;
    }
    setSavingCustomer(true);
    try {
      await saveCustomer({
        id: editingCustomerId || undefined,
        name: custName,
        phone: custPhone,
        secondaryPhone: custSecondaryPhone,
      });
      setEditingCustomerId(null);
      setCustName('');
      setCustPhone('');
      setCustSecondaryPhone('');
      setAddModalOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao guardar cliente.', 'error');
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !payDebtTarget) return;
    const amount = Number(payAmount) || 0;
    if (amount <= 0) {
      showToast('Insira um valor válido maior que zero.', 'warning');
      return;
    }
    await recordDebtPayment({
      customerId: selectedCustomer.id,
      debtId: payDebtTarget.id,
      amount,
      method: payMethod,
      note: payNote,
    });
    setPayDebtTarget(null);
    setPayAmount('');
    setPayNote('');
  };

  const buildWhatsAppReminder = (c: Customer): string => {
    return `Olá ${c.name}, esperamos que esteja bem! Da parte de *${business.name}*, passamos apenas a lembrar do saldo pendente de *${formatMT(c.totalDebt)}*. Pode regularizar em dinheiro ou por M-Pesa/e-Mola quando lhe for conveniente. Muito obrigado!`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0F1F16] dark:text-[#F1F5F2]">Clientes e Dívidas</h1>
          <p className="text-xs text-[#4B5E53] dark:text-[#8FA598]">
            Total por receber:{' '}
            <strong className="font-mono text-[#854D0E] dark:text-[#FACC15] tabular-nums">
              {formatMT(totalReceivable)}
            </strong>
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateCustomerModal}
          className="min-h-[48px] rounded-xl bg-[#15803D] hover:bg-[#166534] px-4 py-2.5 text-sm font-bold text-white inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4B5E53] dark:text-[#8FA598]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Procurar cliente por nome ou telefone..."
            className="min-h-[48px] w-full rounded-2xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#121F18] pl-10 pr-4 text-sm text-[#0F1F16] dark:text-[#F1F5F2] placeholder:text-[#8FA598] focus:border-[#15803D] dark:focus:border-[#4ADE80] focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => setOnlyDebtors((v) => !v)}
          className={`min-h-[48px] rounded-2xl border px-4 text-xs font-bold whitespace-nowrap shrink-0 ${
            onlyDebtors
              ? 'border-[#CA8A04] bg-[#FEF9C3] dark:bg-[#2A230D] text-[#713F12] dark:text-[#FDE047]'
              : 'border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] text-[#4B5E53] dark:text-[#8FA598]'
          }`}
        >
          Só com dívida ({customers.filter((c) => c.totalDebt > 0).length})
        </button>
      </div>

      {/* Customer List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-10 text-center space-y-2">
          <Users className="h-8 w-8 text-[#94A3B8] mx-auto" />
          <p className="text-sm font-semibold text-[#0F1F16] dark:text-[#F1F5F2]">Sem clientes nesta lista</p>
          <p className="text-xs text-[#4B5E53] dark:text-[#8FA598]">
            Adicione clientes para acompanhar vendas a crédito e cobranças.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] divide-y divide-[#F1F5F2] dark:divide-[#23382C]">
          {filtered.map((customer) => (
            <div key={customer.id} className="p-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedCustomerId(customer.id)}
                className="flex-1 text-left flex items-center gap-3 min-w-0 min-h-[48px]"
              >
                <div
                  className={`h-11 w-11 rounded-xl shrink-0 flex items-center justify-center font-bold text-sm ${
                    customer.totalDebt > 0
                      ? 'bg-[#FEF9C3] dark:bg-[#2A230D] text-[#854D0E] dark:text-[#FACC15]'
                      : 'bg-[#F0FDF4] dark:bg-[#143322] text-[#15803D] dark:text-[#4ADE80]'
                  }`}
                >
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#0F1F16] dark:text-[#F1F5F2] truncate">{customer.name}</p>
                  <p className="text-xs text-[#4B5E53] dark:text-[#8FA598] font-mono truncate">
                    {formatPhoneDisplay(customer.phone)}
                    {customer.secondaryPhone ? ` · ${formatPhoneDisplay(customer.secondaryPhone)}` : ''}
                  </p>
                </div>
              </button>

              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <p
                    className={`font-mono text-sm font-bold tabular-nums ${
                      customer.totalDebt > 0
                        ? 'text-[#854D0E] dark:text-[#FACC15]'
                        : 'text-[#15803D] dark:text-[#4ADE80]'
                    }`}
                  >
                    {customer.totalDebt > 0 ? formatMT(customer.totalDebt) : 'Sem dívida'}
                  </p>
                </div>

                {customer.totalDebt > 0 && (
                  <a
                    href={buildWhatsAppUrl(customer.phone, buildWhatsAppReminder(customer))}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Lembrar por WhatsApp"
                    className="min-h-[44px] min-w-[44px] rounded-xl bg-[#F0FDF4] dark:bg-[#143322] text-[#15803D] dark:text-[#4ADE80] hover:bg-[#DCFCE7] dark:hover:bg-[#19402B] flex items-center justify-center"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedCustomerId(customer.id)}
                  aria-label="Abrir ficha do cliente"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#4B5E53] dark:text-[#8FA598] hover:bg-[#F1F5F2] dark:hover:bg-[#182920]"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Customer Detail Sheet */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0F1F16]/60 dark:bg-black/75 p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#121F18] p-6 shadow-2xl border border-[#E2E8E4] dark:border-[#23382C] space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#0F1F16] dark:text-[#F1F5F2]">{selectedCustomer.name}</h2>
                <p className="text-xs text-[#4B5E53] dark:text-[#8FA598] font-mono">
                  {formatPhoneDisplay(selectedCustomer.phone)}
                  {selectedCustomer.secondaryPhone
                    ? ` · ${formatPhoneDisplay(selectedCustomer.secondaryPhone)}`
                    : ''}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {!isStaff && (
                  <>
                    <button
                      type="button"
                      onClick={() => openEditCustomerModal(selectedCustomer)}
                      aria-label="Editar cliente"
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#4B5E53] dark:text-[#8FA598] hover:bg-[#F1F5F2] dark:hover:bg-[#182920]"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!requireProOrOpenPaywall('apagar cliente')) return;
                        setDeleteTarget(selectedCustomer);
                      }}
                      aria-label="Apagar cliente"
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedCustomerId(null)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#4B5E53] dark:text-[#8FA598] hover:bg-[#F1F5F2] dark:hover:bg-[#182920]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-[#F8FAF8] dark:bg-[#182920] border border-[#E2E8E4] dark:border-[#23382C] p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-[#4B5E53] dark:text-[#8FA598]">Saldo em dívida</p>
                <p className="font-mono text-2xl font-extrabold text-[#854D0E] dark:text-[#FACC15] tabular-nums">
                  {formatMT(selectedCustomer.totalDebt)}
                </p>
              </div>
              {selectedCustomer.totalDebt > 0 && (
                <a
                  href={buildWhatsAppUrl(selectedCustomer.phone, buildWhatsAppReminder(selectedCustomer))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] rounded-xl bg-[#15803D] hover:bg-[#166534] px-4 py-2 text-xs font-bold text-white inline-flex items-center gap-2 whitespace-nowrap"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Lembrar por WhatsApp</span>
                </a>
              )}
            </div>

            {/* Debts List */}
            <div>
              <h3 className="text-sm font-bold text-[#0F1F16] dark:text-[#F1F5F2] mb-2">Vendas a crédito</h3>
              {customerDebts.length === 0 ? (
                <p className="text-xs text-[#4B5E53] dark:text-[#8FA598] py-2">Sem registos de dívida para este cliente.</p>
              ) : (
                <div className="space-y-2.5">
                  {customerDebts.map((debt) => (
                    <div
                      key={debt.id}
                      className="rounded-xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#182920]/60 p-3.5 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#0F1F16] dark:text-[#F1F5F2] truncate">{debt.description}</p>
                        <p className="text-xs text-[#4B5E53] dark:text-[#8FA598]">
                          Original: {formatMT(debt.originalAmount)} · {formatDateTimeMz(debt.createdAtMs || 0)}
                        </p>
                        <p className="mt-1 text-xs font-mono font-bold text-[#854D0E] dark:text-[#FACC15] tabular-nums">
                          {debt.status === 'paid'
                            ? 'Liquidada'
                            : `Falta: ${formatMT(debt.remainingAmount)}`}
                        </p>
                      </div>

                      {debt.status !== 'paid' ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (!requireProOrOpenPaywall('registar pagamento de dívida')) return;
                            setPayDebtTarget(debt);
                            setPayAmount(String(debt.remainingAmount));
                          }}
                          className="min-h-[44px] rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] px-3.5 text-xs font-bold text-[#0F1F16] whitespace-nowrap shrink-0 inline-flex items-center gap-1.5"
                        >
                          <Wallet className="h-4 w-4" />
                          <span>Receber</span>
                        </button>
                      ) : (
                        <UserCheck className="h-5 w-5 text-[#15803D] dark:text-[#4ADE80] shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payments History */}
            <div>
              <h3 className="text-sm font-bold text-[#0F1F16] dark:text-[#F1F5F2] mb-2">Histórico de pagamentos</h3>
              {customerPayments.length === 0 ? (
                <p className="text-xs text-[#4B5E53] dark:text-[#8FA598]">Sem pagamentos registados.</p>
              ) : (
                <div className="divide-y divide-[#F1F5F2] dark:divide-[#23382C]">
                  {customerPayments.map((pay) => (
                    <div key={pay.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-[#0F1F16] dark:text-[#F1F5F2]">
                          {paymentMethodLabel(pay.method)} {pay.note ? `· ${pay.note}` : ''}
                        </p>
                        <p className="text-[#4B5E53] dark:text-[#8FA598]">{formatDateTimeMz(pay.createdAtMs || 0)}</p>
                      </div>
                      <span className="font-mono font-bold text-[#15803D] dark:text-[#4ADE80] tabular-nums">
                        +{formatMT(pay.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {addModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0F1F16]/60 dark:bg-black/75 p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#121F18] p-6 shadow-2xl border border-[#E2E8E4] dark:border-[#23382C]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#0F1F16] dark:text-[#F1F5F2]">
                {editingCustomerId ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#4B5E53] dark:text-[#8FA598] hover:bg-[#F1F5F2] dark:hover:bg-[#182920]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F1F16] dark:text-[#B9C9BF] mb-1">Nome completo *</label>
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="Ex: Dona Fátima Cossa"
                  className="min-h-[48px] w-full rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#0E1813] px-4 text-sm text-[#0F1F16] dark:text-[#F1F5F2] placeholder:text-[#8FA598] focus:border-[#15803D] dark:focus:border-[#4ADE80] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0F1F16] dark:text-[#B9C9BF] mb-1">
                  Telefone / Número de telefone *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4B5E53] dark:text-[#8FA598]" />
                  <input
                    type="tel"
                    inputMode="tel"
                    required
                    maxLength={22}
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="84 123 4567, 21 490 123 ou +258..."
                    className="min-h-[48px] w-full rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#0E1813] pl-10 pr-4 font-mono text-sm text-[#0F1F16] dark:text-[#F1F5F2] placeholder:text-[#8FA598] focus:border-[#15803D] dark:focus:border-[#4ADE80] focus:outline-none"
                  />
                </div>
                <p className="mt-1 text-[11px] text-[#4B5E53] dark:text-[#8FA598]">
                  Aceita telemóvel (82–87), telefone fixo (21–29) ou número com indicativo internacional.
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0F1F16] dark:text-[#B9C9BF] mb-1">
                  Telefone alternativo (opcional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4B5E53] dark:text-[#8FA598]" />
                  <input
                    type="tel"
                    inputMode="tel"
                    maxLength={22}
                    value={custSecondaryPhone}
                    onChange={(e) => setCustSecondaryPhone(e.target.value)}
                    placeholder="Ex: 82 987 6543 ou 21 490 123"
                    className="min-h-[48px] w-full rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#0E1813] pl-10 pr-4 font-mono text-sm text-[#0F1F16] dark:text-[#F1F5F2] placeholder:text-[#8FA598] focus:border-[#15803D] dark:focus:border-[#4ADE80] focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={savingCustomer}
                className="min-h-[50px] w-full rounded-xl bg-[#15803D] text-sm font-bold text-white hover:bg-[#166534] disabled:opacity-60"
              >
                {savingCustomer
                  ? 'A guardar...'
                  : editingCustomerId
                  ? 'Guardar Alterações'
                  : 'Guardar Cliente'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Partial/Full Payment Modal */}
      {payDebtTarget && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0F1F16]/60 dark:bg-black/75 p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#121F18] p-6 shadow-2xl border border-[#E2E8E4] dark:border-[#23382C]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-[#0F1F16] dark:text-[#F1F5F2]">Registar Pagamento</h3>
              <button
                type="button"
                onClick={() => setPayDebtTarget(null)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#4B5E53] dark:text-[#8FA598] hover:bg-[#F1F5F2] dark:hover:bg-[#182920]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-[#4B5E53] dark:text-[#8FA598] mb-4">
              {payDebtTarget.description} · Em dívida:{' '}
              <strong className="font-mono text-[#854D0E] dark:text-[#FACC15]">
                {formatMT(payDebtTarget.remainingAmount)}
              </strong>
            </p>
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F1F16] dark:text-[#B9C9BF] mb-1">
                  Valor pago (MT) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={payDebtTarget.remainingAmount}
                  step="0.5"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="min-h-[48px] w-full rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#0E1813] px-4 font-mono text-base font-bold text-[#0F1F16] dark:text-[#F1F5F2]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F1F16] dark:text-[#B9C9BF] mb-1">Método</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['dinheiro', 'mpesa', 'emola', 'mkesh'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPayMethod(m)}
                      className={`min-h-[44px] rounded-xl border text-xs font-bold ${
                        payMethod === m
                          ? 'border-[#15803D] dark:border-[#4ADE80] bg-[#F0FDF4] dark:bg-[#143322] text-[#15803D] dark:text-[#4ADE80]'
                          : 'border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#182920] text-[#0F1F16] dark:text-[#F1F5F2]'
                      }`}
                    >
                      {paymentMethodLabel(m)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F1F16] dark:text-[#B9C9BF] mb-1">Nota (opcional)</label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="Ex: Pagamento parcial"
                  className="min-h-[44px] w-full rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#0E1813] px-4 text-sm text-[#0F1F16] dark:text-[#F1F5F2] placeholder:text-[#8FA598]"
                />
              </div>

              <button
                type="submit"
                className="min-h-[50px] w-full rounded-xl bg-[#15803D] text-sm font-bold text-white hover:bg-[#166534]"
              >
                Confirmar Pagamento
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Apagar cliente?"
        message={`Deseja remover "${deleteTarget?.name || ''}"? Esta acção não pode ser desfeita.`}
        confirmLabel="Apagar"
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteCustomer(deleteTarget.id);
            setSelectedCustomerId(null);
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
