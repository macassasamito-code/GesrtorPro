import React, { useMemo, useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  Lock,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { formatMT, paymentMethodLabel } from '../utils/formatters';

type PeriodKey = 'day' | 'week' | 'month';

export const ReportsView: React.FC = () => {
  const {
    business,
    products,
    sales,
    customers,
    isStaff,
    requireProOrOpenPaywall,
    showToast,
  } = useApp();

  const [period, setPeriod] = useState<PeriodKey>('month');

  const periodLabel = period === 'day' ? 'Hoje' : period === 'week' ? 'Últimos 7 dias' : 'Este mês';

  const report = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const cutoff =
      period === 'day'
        ? startOfToday
        : period === 'week'
        ? startOfToday - 6 * 24 * 3600 * 1000
        : new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const filteredSales = sales.filter((s) => (s.createdAtMs || 0) >= cutoff);
    const totalSales = filteredSales.reduce((acc, s) => acc + s.total, 0);
    const estimatedProfit = filteredSales.reduce((acc, s) => acc + s.estimatedProfit, 0);
    const totalReceivable = customers.reduce((acc, c) => acc + c.totalDebt, 0);
    const stockValue = products
      .filter((p) => !p.isService)
      .reduce((acc, p) => acc + p.quantity * p.salePrice, 0);

    // Top products
    const productMap = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const s of filteredSales) {
      for (const item of s.items) {
        const curr = productMap.get(item.productId) || { name: item.name, qty: 0, revenue: 0 };
        curr.qty += item.quantity;
        curr.revenue += item.lineTotal;
        productMap.set(item.productId, curr);
      }
    }
    const topProducts = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue);

    // Payment method totals
    const byMethod = new Map<string, number>();
    for (const s of filteredSales) {
      byMethod.set(s.paymentMethod, (byMethod.get(s.paymentMethod) || 0) + s.total);
    }

    // Daily buckets (last 7 days for visual trend)
    const dayBuckets: { label: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(startOfToday - i * 24 * 3600 * 1000);
      const dayStart = d.getTime();
      const dayEnd = dayStart + 24 * 3600 * 1000;
      const sum = sales
        .filter((s) => {
          const ts = s.createdAtMs || 0;
          return ts >= dayStart && ts < dayEnd;
        })
        .reduce((acc, s) => acc + s.total, 0);
      const label = new Intl.DateTimeFormat('pt-MZ', { weekday: 'short' }).format(d).slice(0, 3);
      dayBuckets.push({ label, total: sum });
    }
    const maxBucket = Math.max(1, ...dayBuckets.map((b) => b.total));

    return {
      filteredSales,
      totalSales,
      estimatedProfit,
      totalReceivable,
      stockValue,
      topProducts,
      byMethod,
      dayBuckets,
      maxBucket,
    };
  }, [sales, customers, products, period]);

  if (isStaff) {
    return (
      <div className="rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-8 text-center space-y-2 transition-colors">
        <Lock className="h-8 w-8 text-[#4B5E53] dark:text-[#8FA598] mx-auto" />
        <h1 className="text-lg font-bold text-[#0F1F16] dark:text-[#F1F5F2]">Acesso restrito ao proprietário</h1>
        <p className="text-sm text-[#4B5E53] dark:text-[#8FA598]">
          Os relatórios financeiros e o cálculo de lucro estão disponíveis apenas para o dono do negócio.
        </p>
      </div>
    );
  }

  const handleExportPDF = async () => {
    if (!requireProOrOpenPaywall('exportar relatórios em PDF')) return;
    const { exportReportToPDF } = await import('../services/exportService');
    exportReportToPDF({
      business,
      periodLabel,
      sales: report.filteredSales,
      products,
      customers,
      totalSales: report.totalSales,
      estimatedProfit: report.estimatedProfit,
      totalReceivable: report.totalReceivable,
      stockValue: report.stockValue,
      topProducts: report.topProducts,
    });
    showToast('Relatório PDF transferido.');
  };

  const handleExportExcel = async () => {
    if (!requireProOrOpenPaywall('exportar relatórios em Excel')) return;
    const { exportReportToExcel } = await import('../services/exportService');
    exportReportToExcel({
      business,
      periodLabel,
      sales: report.filteredSales,
      products,
      customers,
      totalSales: report.totalSales,
      estimatedProfit: report.estimatedProfit,
      totalReceivable: report.totalReceivable,
      stockValue: report.stockValue,
      topProducts: report.topProducts,
    });
    showToast('Planilha Excel transferida.');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0F1F16] dark:text-[#F1F5F2]">Relatórios</h1>
          <p className="text-xs text-[#4B5E53] dark:text-[#8FA598]">Desempenho de vendas, lucro e stock actual</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportPDF}
            className="min-h-[44px] rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#121F18] hover:bg-[#F8FAF8] dark:hover:bg-[#182920] px-3.5 text-xs font-bold text-[#0F1F16] dark:text-[#F1F5F2] inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
          >
            <Download className="h-4 w-4 text-[#15803D] dark:text-[#4ADE80]" />
            <span>Exportar PDF</span>
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            className="min-h-[44px] rounded-xl bg-[#15803D] hover:bg-[#166534] px-3.5 text-xs font-bold text-white inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* Period Filter */}
      <div className="inline-flex rounded-xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-1">
        {(
          [
            { id: 'day', label: 'Hoje' },
            { id: 'week', label: 'Semana' },
            { id: 'month', label: 'Mês' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setPeriod(tab.id)}
            className={`min-h-[40px] rounded-lg px-4 text-xs font-bold transition-colors ${
              period === tab.id
                ? 'bg-[#15803D] text-white'
                : 'text-[#4B5E53] dark:text-[#8FA598] hover:text-[#0F1F16] dark:hover:text-[#F1F5F2]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-4">
          <p className="text-xs text-[#4B5E53] dark:text-[#8FA598]">Vendas ({periodLabel})</p>
          <p className="mt-1.5 font-mono text-lg sm:text-xl font-bold text-[#0F1F16] dark:text-[#F1F5F2] tabular-nums">
            {formatMT(report.totalSales)}
          </p>
          <p className="text-[11px] text-[#4B5E53] dark:text-[#8FA598] mt-0.5">
            {report.filteredSales.length} {report.filteredSales.length === 1 ? 'venda' : 'vendas'}
          </p>
        </div>

        <div className="rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-4">
          <p className="text-xs text-[#4B5E53] dark:text-[#8FA598]">Lucro estimado</p>
          <p className="mt-1.5 font-mono text-lg sm:text-xl font-bold text-[#15803D] dark:text-[#4ADE80] tabular-nums">
            {formatMT(report.estimatedProfit)}
          </p>
          <p className="text-[11px] text-[#4B5E53] dark:text-[#8FA598] mt-0.5">Venda menos custo</p>
        </div>

        <div className="rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-4">
          <p className="text-xs text-[#4B5E53] dark:text-[#8FA598]">Dívidas por receber</p>
          <p className="mt-1.5 font-mono text-lg sm:text-xl font-bold text-[#854D0E] dark:text-[#FACC15] tabular-nums">
            {formatMT(report.totalReceivable)}
          </p>
          <p className="text-[11px] text-[#4B5E53] dark:text-[#8FA598] mt-0.5">Saldo em aberto</p>
        </div>

        <div className="rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-4">
          <p className="text-xs text-[#4B5E53] dark:text-[#8FA598]">Valor do stock actual</p>
          <p className="mt-1.5 font-mono text-lg sm:text-xl font-bold text-[#0F1F16] dark:text-[#F1F5F2] tabular-nums">
            {formatMT(report.stockValue)}
          </p>
          <p className="text-[11px] text-[#4B5E53] dark:text-[#8FA598] mt-0.5">A preço de venda</p>
        </div>
      </div>

      {/* 7-Day Simple Bar Chart + Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-[#15803D] dark:text-[#4ADE80]" />
            <h2 className="text-sm font-bold text-[#0F1F16] dark:text-[#F1F5F2]">Vendas dos últimos 7 dias</h2>
          </div>

          <div className="grid grid-cols-7 gap-2 items-end h-40 pt-4">
            {report.dayBuckets.map((bucket, idx) => {
              const pct = Math.max(6, Math.round((bucket.total / report.maxBucket) * 100));
              return (
                <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[10px] font-mono text-[#4B5E53] dark:text-[#8FA598] tabular-nums">
                    {bucket.total > 0 ? Math.round(bucket.total) : ''}
                  </span>
                  <div className="w-full max-w-[34px] flex-1 flex items-end">
                    <div
                      className={`w-full rounded-t-lg transition-all ${
                        bucket.total > 0
                          ? 'bg-[#15803D] dark:bg-[#4ADE80]'
                          : 'bg-[#E2E8E4] dark:bg-[#23382C]'
                      }`}
                      style={{ height: `${bucket.total > 0 ? pct : 6}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-[#4B5E53] dark:text-[#8FA598] capitalize">
                    {bucket.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-5">
          <h2 className="text-sm font-bold text-[#0F1F16] dark:text-[#F1F5F2] mb-3">Por forma de pagamento</h2>
          <div className="space-y-3">
            {(['dinheiro', 'mpesa', 'emola', 'mkesh', 'credito'] as const).map((method) => {
              const amt = report.byMethod.get(method) || 0;
              const share = report.totalSales > 0 ? Math.round((amt / report.totalSales) * 100) : 0;
              return (
                <div key={method} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#0F1F16] dark:text-[#F1F5F2]">{paymentMethodLabel(method)}</span>
                    <span className="font-mono font-bold text-[#0F1F16] dark:text-[#F1F5F2] tabular-nums">
                      {formatMT(amt)} · {share}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#F1F5F2] dark:bg-[#182920] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        method === 'credito'
                          ? 'bg-[#CA8A04] dark:bg-[#FACC15]'
                          : 'bg-[#15803D] dark:bg-[#4ADE80]'
                      }`}
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-5">
        <h2 className="text-sm font-bold text-[#0F1F16] dark:text-[#F1F5F2] mb-3">
          Produtos e serviços mais vendidos ({periodLabel})
        </h2>
        {report.topProducts.length === 0 ? (
          <p className="text-sm text-[#4B5E53] dark:text-[#8FA598] py-3">Sem vendas neste período.</p>
        ) : (
          <div className="divide-y divide-[#F1F5F2] dark:divide-[#23382C]">
            {report.topProducts.slice(0, 8).map((item, idx) => (
              <div key={item.name} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs font-bold text-[#4B5E53] dark:text-[#8FA598] w-5">0{idx + 1}.</span>
                  <span className="font-semibold text-[#0F1F16] dark:text-[#F1F5F2] truncate">{item.name}</span>
                </div>
                <div className="text-right shrink-0 font-mono tabular-nums">
                  <span className="text-xs text-[#4B5E53] dark:text-[#8FA598] mr-3">{item.qty}x</span>
                  <span className="font-bold text-[#15803D] dark:text-[#4ADE80]">{formatMT(item.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
