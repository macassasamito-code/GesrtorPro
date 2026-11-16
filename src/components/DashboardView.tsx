import React, { useMemo } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Crown,
  Package,
  PlusCircle,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { formatDateTimeMz, formatMT, paymentMethodLabel } from '../utils/formatters';

export const DashboardView: React.FC = () => {
  const {
    business,
    products,
    sales,
    customers,
    isDemoMode,
    isStaff,
    isProActive,
    isExpiringSoon,
    daysUntilExpiry,
    subscriptionStatusLabel,
    demoPreset,
    setDemoPreset,
    setActiveTab,
    openPaywall,
    setSubView,
  } = useApp();

  const stats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = startOfToday - 6 * 24 * 3600 * 1000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let todaySales = 0;
    let weekSales = 0;
    let monthSales = 0;
    let monthProfit = 0;

    for (const s of sales) {
      const ts = s.createdAtMs || 0;
      if (ts >= startOfToday) todaySales += s.total;
      if (ts >= startOfWeek) weekSales += s.total;
      if (ts >= startOfMonth) {
        monthSales += s.total;
        monthProfit += s.estimatedProfit;
      }
    }

    const totalDebt = customers.reduce((acc, c) => acc + c.totalDebt, 0);
    const lowStock = products.filter((p) => !p.isService && p.quantity <= p.minStock);

    return { todaySales, weekSales, monthSales, monthProfit, totalDebt, lowStock };
  }, [sales, customers, products]);

  return (
    <div className="space-y-5">
      {/* Demo Mode / Subscription Notice */}
      {isDemoMode ? (
        <div className="rounded-2xl border border-[#EAB308]/50 dark:border-[#854D0E]/70 bg-[#FEFCE8] dark:bg-[#2A230D] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[#0F1F16] dark:text-[#FEF08A]">
              Modo Demonstração (só leitura)
            </p>
            <p className="text-xs text-[#4B5E53] dark:text-[#FDE047]/80 mt-0.5">
              Está a explorar dados de exemplo locais. Subscreva o Plano Pro para gravar as suas próprias vendas e stock.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="inline-flex rounded-xl bg-white dark:bg-[#121F18] border border-[#E2E8E4] dark:border-[#23382C] p-1">
              <button
                type="button"
                onClick={() => setDemoPreset('mercearia')}
                className={`min-h-[36px] rounded-lg px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
                  demoPreset === 'mercearia'
                    ? 'bg-[#15803D] text-white'
                    : 'text-[#4B5E53] dark:text-[#B9C9BF] hover:text-[#0F1F16] dark:hover:text-[#F1F5F2]'
                }`}
              >
                Mercearia
              </button>
              <button
                type="button"
                onClick={() => setDemoPreset('salao')}
                className={`min-h-[36px] rounded-lg px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
                  demoPreset === 'salao'
                    ? 'bg-[#15803D] text-white'
                    : 'text-[#4B5E53] dark:text-[#B9C9BF] hover:text-[#0F1F16] dark:hover:text-[#F1F5F2]'
                }`}
              >
                Salão / Barbearia
              </button>
            </div>
            <button
              type="button"
              onClick={() => openPaywall('activar o seu negócio')}
              className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl bg-[#15803D] px-4 py-2 text-xs font-bold text-white hover:bg-[#166534] whitespace-nowrap"
            >
              <Crown className="h-4 w-4 text-[#FEF08A]" />
              <span>Subscrever Pro</span>
            </button>
          </div>
        </div>
      ) : (
        isExpiringSoon && (
          <div className="rounded-2xl border border-[#EAB308]/60 dark:border-[#854D0E]/70 bg-[#FEF9C3] dark:bg-[#2A230D] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-[#854D0E] dark:text-[#FACC15] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-[#0F1F16] dark:text-[#FEF08A]">
                  A sua subscrição Pro expira em {daysUntilExpiry}{' '}
                  {daysUntilExpiry === 1 ? 'dia' : 'dias'}
                </p>
                <p className="text-xs text-[#713F12] dark:text-[#FDE047]/90 mt-0.5">
                  Renove antes do prazo para não voltar ao modo demonstração. Os seus dados ficam sempre guardados.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openPaywall('renovar o plano Pro')}
              className="min-h-[44px] rounded-xl bg-[#0F1F16] dark:bg-[#FACC15] px-4 py-2 text-xs font-bold text-white dark:text-[#0F1F16] hover:bg-[#1E3527] dark:hover:bg-[#EAB308] whitespace-nowrap shrink-0"
            >
              Renovar Agora
            </button>
          </div>
        )
      )}

      {/* Primary CTA + Business Header */}
      <div className="rounded-3xl bg-[#15803D] dark:bg-[#14532D] text-white p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-transparent dark:border-[#1E6B3B]">
        <div>
          <p className="text-xs font-medium text-[#DCFCE7]">
            {business.name} · {subscriptionStatusLabel}
          </p>
          <p className="mt-1 text-xs text-[#BBF7D0]">Vendas de hoje</p>
          <p className="font-mono text-3xl sm:text-4xl font-bold tracking-tight tabular-nums mt-0.5">
            {formatMT(stats.todaySales)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('vender')}
          className="min-h-[54px] rounded-2xl bg-[#FACC15] hover:bg-[#EAB308] text-[#0F1F16] px-6 py-3.5 text-base font-extrabold flex items-center justify-center gap-2.5 shadow-sm transition-colors whitespace-nowrap shrink-0"
        >
          <PlusCircle className="h-5 w-5" />
          <span>Nova venda</span>
        </button>
      </div>

      {/* KPI Grid */}
      <div className={`grid grid-cols-2 ${isStaff ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-3 sm:gap-4`}>
        <div className="rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-4">
          <div className="flex items-center justify-between text-xs text-[#4B5E53] dark:text-[#8FA598]">
            <span>Esta semana</span>
            <ShoppingBag className="h-4 w-4 text-[#15803D] dark:text-[#4ADE80]" />
          </div>
          <p className="mt-2 font-mono text-lg sm:text-xl font-bold text-[#0F1F16] dark:text-[#F1F5F2] tabular-nums">
            {formatMT(stats.weekSales)}
          </p>
        </div>

        <div className="rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-4">
          <div className="flex items-center justify-between text-xs text-[#4B5E53] dark:text-[#8FA598]">
            <span>Este mês</span>
            <Wallet className="h-4 w-4 text-[#15803D] dark:text-[#4ADE80]" />
          </div>
          <p className="mt-2 font-mono text-lg sm:text-xl font-bold text-[#0F1F16] dark:text-[#F1F5F2] tabular-nums">
            {formatMT(stats.monthSales)}
          </p>
        </div>

        {!isStaff && (
          <div className="rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-4">
            <div className="flex items-center justify-between text-xs text-[#4B5E53] dark:text-[#8FA598]">
              <span>Lucro estimado (mês)</span>
              <TrendingUp className="h-4 w-4 text-[#15803D] dark:text-[#4ADE80]" />
            </div>
            <p className="mt-2 font-mono text-lg sm:text-xl font-bold text-[#15803D] dark:text-[#4ADE80] tabular-nums">
              {formatMT(stats.monthProfit)}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('clientes')}
          className="rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-4 text-left hover:bg-[#F8FAF8] dark:hover:bg-[#182920] transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-[#4B5E53] dark:text-[#8FA598]">
            <span>Total em dívida</span>
            <Users className="h-4 w-4 text-[#CA8A04] dark:text-[#FACC15]" />
          </div>
          <p className="mt-2 font-mono text-lg sm:text-xl font-bold text-[#854D0E] dark:text-[#FACC15] tabular-nums">
            {formatMT(stats.totalDebt)}
          </p>
        </button>
      </div>

      {/* Two-Column Lower Section: Low Stock + Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Low Stock Alert */}
        <section className="rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-[#CA8A04] dark:text-[#FACC15]" />
              <h2 className="text-base font-bold text-[#0F1F16] dark:text-[#F1F5F2]">Produtos com stock baixo</h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('produtos')}
              className="text-xs font-semibold text-[#15803D] dark:text-[#4ADE80] hover:underline inline-flex items-center gap-1 min-h-[36px]"
            >
              <span>Ver stock</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {stats.lowStock.length === 0 ? (
            <p className="text-sm text-[#4B5E53] dark:text-[#8FA598] py-4">
              Tudo em dia! Nenhum produto abaixo do stock mínimo.
            </p>
          ) : (
            <div className="divide-y divide-[#F1F5F2] dark:divide-[#23382C]">
              {stats.lowStock.slice(0, 5).map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0F1F16] dark:text-[#F1F5F2] truncate">{item.name}</p>
                    <p className="text-xs text-[#4B5E53] dark:text-[#8FA598]">
                      {item.category} · Mínimo {item.minStock} un.
                    </p>
                  </div>
                  <span
                    className={`font-mono text-sm font-bold tabular-nums shrink-0 ${
                      item.quantity === 0
                        ? 'text-red-700 dark:text-red-400'
                        : 'text-[#854D0E] dark:text-[#FACC15]'
                    }`}
                  >
                    {item.quantity} un.
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Sales */}
        <section className="rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-[#0F1F16] dark:text-[#F1F5F2]">Últimas vendas</h2>
            {!isStaff && (
              <button
                type="button"
                onClick={() => setActiveTab('relatorios')}
                className="text-xs font-semibold text-[#15803D] dark:text-[#4ADE80] hover:underline inline-flex items-center gap-1 min-h-[36px]"
              >
                <span>Relatórios</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {sales.length === 0 ? (
            <div className="py-6 text-center space-y-2">
              <p className="text-sm text-[#4B5E53] dark:text-[#8FA598]">Ainda não existem vendas registadas.</p>
              <button
                type="button"
                onClick={() => setActiveTab('vender')}
                className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl bg-[#F0FDF4] dark:bg-[#143322] px-4 text-xs font-bold text-[#15803D] dark:text-[#4ADE80]"
              >
                Registar primeira venda
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#F1F5F2] dark:divide-[#23382C]">
              {sales.slice(0, 5).map((sale) => (
                <div key={sale.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0F1F16] dark:text-[#F1F5F2] truncate">
                      {sale.customerName || 'Cliente Balcão'}
                    </p>
                    <p className="text-xs text-[#4B5E53] dark:text-[#8FA598] truncate">
                      {paymentMethodLabel(sale.paymentMethod)} · {formatDateTimeMz(sale.createdAtMs || 0)}
                    </p>
                  </div>
                  <p className="font-mono text-sm font-bold text-[#0F1F16] dark:text-[#F1F5F2] tabular-nums shrink-0">
                    {formatMT(sale.total)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Quick Settings Strip */}
      {!isStaff && (
        <div className="rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[#0F1F16] dark:text-[#F1F5F2]">
              {isProActive ? 'Gerir equipa, dados do negócio e subscrição' : 'Conheça os planos Pro (a partir de 300 MT/mês)'}
            </p>
            <p className="text-xs text-[#4B5E53] dark:text-[#8FA598]">
              M-Pesa, e-Mola e mKesh disponíveis · Até 3 utilizadores por negócio
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSubView('definicoes')}
            className="min-h-[44px] rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#182920] px-4 py-2 text-xs font-bold text-[#0F1F16] dark:text-[#F1F5F2] hover:bg-[#F8FAF8] dark:hover:bg-[#1E3327] whitespace-nowrap shrink-0"
          >
            Definições
          </button>
        </div>
      )}
    </div>
  );
};
