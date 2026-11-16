import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Business, Customer, Product, Sale } from '../types';
import { formatDateMz, formatDateTimeMz, formatMT, paymentMethodLabel } from '../utils/formatters';

export interface ReportExportPayload {
  business: Business;
  periodLabel: string;
  sales: Sale[];
  products: Product[];
  customers: Customer[];
  totalSales: number;
  estimatedProfit: number;
  totalReceivable: number;
  stockValue: number;
  topProducts: { name: string; qty: number; revenue: number }[];
}

export function exportReportToPDF(data: ReportExportPayload): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  let y = 48;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(21, 128, 61);
  doc.text('GestorPro — Relatório Comercial', 40, y);

  y += 22;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(15, 31, 22);
  doc.text(`Negócio: ${data.business.name}`, 40, y);
  y += 16;
  const metaParts = [`Período: ${data.periodLabel}`, `Emitido: ${formatDateMz(Date.now())}`];
  if (data.business.nuit) metaParts.push(`NUIT: ${data.business.nuit}`);
  doc.setTextColor(75, 94, 83);
  doc.text(metaParts.join('  |  '), 40, y);

  y += 28;
  doc.setDrawColor(226, 232, 228);
  doc.line(40, y, 555, y);
  y += 22;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 31, 22);
  doc.text('Resumo Financeiro', 40, y);
  y += 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  const summaryLines = [
    `Total de Vendas (${data.periodLabel}): ${formatMT(data.totalSales)}`,
    `Lucro Estimado (${data.periodLabel}): ${formatMT(data.estimatedProfit)}`,
    `Total de Dívidas por Receber: ${formatMT(data.totalReceivable)}`,
    `Valor do Stock Actual (preço de venda): ${formatMT(data.stockValue)}`,
  ];
  for (const line of summaryLines) {
    doc.text(line, 40, y);
    y += 16;
  }

  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Produtos e Serviços Mais Vendidos', 40, y);
  y += 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  if (data.topProducts.length === 0) {
    doc.text('Sem vendas registadas neste período.', 40, y);
    y += 16;
  } else {
    for (const item of data.topProducts.slice(0, 10)) {
      doc.text(`• ${item.name} — ${item.qty}x — ${formatMT(item.revenue)}`, 40, y);
      y += 15;
    }
  }

  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Últimas Vendas do Período', 40, y);
  y += 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  for (const sale of data.sales.slice(0, 18)) {
    if (y > 760) {
      doc.addPage();
      y = 48;
    }
    const when = formatDateTimeMz(sale.createdAtMs || Date.now());
    const method = paymentMethodLabel(sale.paymentMethod);
    doc.text(
      `${when}  |  ${sale.customerName || 'Balcão'}  |  ${method}  |  ${formatMT(sale.total)}`,
      40,
      y
    );
    y += 14;
  }

  const safeName = data.business.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  doc.save(`gestorpro-relatorio-${safeName}.pdf`);
}

export function exportReportToExcel(data: ReportExportPayload): void {
  const wb = XLSX.utils.book_new();

  const summaryRows = [
    { Indicador: 'Negócio', Valor: data.business.name },
    { Indicador: 'NUIT', Valor: data.business.nuit || '—' },
    { Indicador: 'Período', Valor: data.periodLabel },
    { Indicador: 'Total de Vendas (MT)', Valor: Number(data.totalSales.toFixed(2)) },
    { Indicador: 'Lucro Estimado (MT)', Valor: Number(data.estimatedProfit.toFixed(2)) },
    { Indicador: 'Dívidas por Receber (MT)', Valor: Number(data.totalReceivable.toFixed(2)) },
    { Indicador: 'Valor do Stock Actual (MT)', Valor: Number(data.stockValue.toFixed(2)) },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Resumo');

  const salesRows = data.sales.map((s) => ({
    Data: formatDateTimeMz(s.createdAtMs || Date.now()),
    Cliente: s.customerName || 'Cliente Balcão',
    Pagamento: paymentMethodLabel(s.paymentMethod),
    Subtotal_MT: s.subtotal,
    Desconto_MT: s.discount,
    Total_MT: s.total,
    Lucro_Estimado_MT: s.estimatedProfit,
    Operador: s.staffName,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(salesRows), 'Vendas');

  const stockRows = data.products.map((p) => ({
    Nome: p.name,
    Categoria: p.category,
    Tipo: p.isService ? 'Serviço' : 'Produto',
    Preco_Compra_MT: p.costPrice,
    Preco_Venda_MT: p.salePrice,
    Quantidade: p.isService ? 'N/A' : p.quantity,
    Stock_Minimo: p.isService ? 'N/A' : p.minStock,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stockRows), 'Produtos');

  const debtRows = data.customers
    .filter((c) => c.totalDebt > 0)
    .map((c) => ({
      Cliente: c.name,
      Telefone: c.phone,
      Divida_Actual_MT: c.totalDebt,
    }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(debtRows), 'Dividas');

  const safeName = data.business.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  XLSX.writeFile(wb, `gestorpro-relatorio-${safeName}.xlsx`);
}
