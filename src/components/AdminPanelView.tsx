import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Info,
  KeyRound,
  Shield,
  Users,
  XCircle,
} from 'lucide-react';
import { PRO_PLANS } from '../config/plans';
import { useApp } from '../contexts/AppContext';
import { PlanId } from '../types';
import {
  formatDateMz,
  formatDateTimeMz,
  formatMT,
  formatPhoneDisplay,
  phoneToInternalEmail,
} from '../utils/formatters';

export const AdminPanelView: React.FC = () => {
  const {
    isAdmin,
    adminUsers,
    adminBusinesses,
    adminSubscriptions,
    adminPaymentRequests,
    adminPasswordResets,
    setSubView,
    approvePaymentRequest,
    rejectPaymentRequest,
    manualActivatePro,
    resolvePasswordReset,
  } = useApp();

  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [manualPlan, setManualPlan] = useState<Exclude<PlanId, 'free'>>('monthly');
  const [manualDays, setManualDays] = useState('30');
  const [rejectReason, setRejectReason] = useState('');

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-8 text-center">
        <p className="text-sm font-bold text-red-700 dark:text-red-400">
          Acesso reservado ao administrador da plataforma.
        </p>
      </div>
    );
  }

  const pendingPayments = adminPaymentRequests.filter((r) => r.status === 'pending');
  const pendingResets = adminPasswordResets.filter((r) => r.status === 'pending');
  const activeProCount = adminSubscriptions.filter(
    (s) => s.status === 'active' && s.expiresAtMs > Date.now()
  ).length;
  const activeUsersCount = adminUsers.filter((u) => u.active).length;

  const handleManualActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = selectedBusinessId || adminBusinesses[0]?.id;
    if (!targetId) return;
    const days = Math.max(1, Math.round(Number(manualDays) || 30));
    await manualActivatePro(targetId, days, manualPlan);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setSubView('definicoes')}
          className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#121F18] hover:bg-[#F8FAF8] dark:hover:bg-[#182920] px-3.5 text-sm font-semibold text-[#0F1F16] dark:text-[#F1F5F2] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar</span>
        </button>
        <div className="flex items-center gap-2 text-sm font-bold text-[#0F1F16] dark:text-[#F1F5F2]">
          <Shield className="h-5 w-5 text-[#15803D] dark:text-[#4ADE80]" />
          <span>Painel de Administrador</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-4">
          <p className="text-xs text-[#4B5E53] dark:text-[#8FA598]">Utilizadores activos</p>
          <p className="mt-1 font-mono text-2xl font-extrabold text-[#0F1F16] dark:text-[#F1F5F2] tabular-nums">
            {activeUsersCount}
          </p>
        </div>
        <div className="rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-4">
          <p className="text-xs text-[#4B5E53] dark:text-[#8FA598]">Negócios Pro activos</p>
          <p className="mt-1 font-mono text-2xl font-extrabold text-[#15803D] dark:text-[#4ADE80] tabular-nums">
            {activeProCount}
          </p>
        </div>
        <div className="rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-4">
          <p className="text-xs text-[#4B5E53] dark:text-[#8FA598]">Pagamentos pendentes</p>
          <p className="mt-1 font-mono text-2xl font-extrabold text-[#854D0E] dark:text-[#FACC15] tabular-nums">
            {pendingPayments.length}
          </p>
        </div>
        <div className="rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-4">
          <p className="text-xs text-[#4B5E53] dark:text-[#8FA598]">Pedidos de senha</p>
          <p className="mt-1 font-mono text-2xl font-extrabold text-[#0F1F16] dark:text-[#F1F5F2] tabular-nums">
            {pendingResets.length}
          </p>
        </div>
      </div>

      {/* Pending Payment Requests */}
      <section className="rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#CA8A04] dark:text-[#FACC15]" />
          <h2 className="text-base font-bold text-[#0F1F16] dark:text-[#F1F5F2]">Pedidos de Pagamento Pendentes</h2>
        </div>

        {pendingPayments.length === 0 ? (
          <p className="text-sm text-[#4B5E53] dark:text-[#8FA598]">Nenhum comprovativo pendente neste momento.</p>
        ) : (
          <div className="space-y-3">
            {pendingPayments.map((req) => (
              <div
                key={req.id}
                className="rounded-2xl border border-[#E2E8E4] dark:border-[#854D0E]/60 bg-[#FEFCE8] dark:bg-[#2A230D] p-4 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#0F1F16] dark:text-[#F1F5F2]">
                      {req.ownerName} · {req.ownerPhone ? formatPhoneDisplay(req.ownerPhone) : 'Google'}
                    </p>
                    <p className="text-xs text-[#4B5E53] dark:text-[#B9C9BF] break-words">
                      <strong className="uppercase">{req.wallet}</strong> · Cód.{' '}
                      <strong className="font-mono text-[#0F1F16] dark:text-[#F1F5F2]">{req.transactionCode}</strong> ·{' '}
                      {formatDateTimeMz(req.createdAtMs || 0)}
                    </p>
                    {req.proofNote && (
                      <p className="mt-1.5 rounded-xl bg-white/70 dark:bg-[#121F18]/70 border border-[#EAB308]/30 dark:border-[#854D0E]/50 px-3 py-2 text-xs text-[#36493E] dark:text-[#D1DDD6] whitespace-pre-wrap break-words">
                        {req.proofNote}
                      </p>
                    )}
                  </div>
                  <p className="font-mono text-lg font-extrabold text-[#15803D] dark:text-[#4ADE80] tabular-nums shrink-0">
                    {formatMT(req.amount)}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Motivo se rejeitar (opcional)"
                    className="min-h-[42px] flex-1 rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#0E1813] px-3 text-xs text-[#0F1F16] dark:text-[#F1F5F2] placeholder:text-[#8FA598] focus:border-[#15803D] dark:focus:border-[#4ADE80] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => void rejectPaymentRequest(req, rejectReason)}
                    className="min-h-[42px] rounded-xl border border-red-300 dark:border-red-800/60 bg-white dark:bg-[#121F18] hover:bg-red-50 dark:hover:bg-red-950/40 px-4 text-xs font-bold text-red-700 dark:text-red-400 inline-flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Rejeitar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void approvePaymentRequest(req)}
                    className="min-h-[42px] rounded-xl bg-[#15803D] hover:bg-[#166534] px-4 text-xs font-bold text-white inline-flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Aprovar e Activar Pro</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Manual Pro Activation / Extension */}
      <form onSubmit={handleManualActivate} className="rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-5 space-y-3">
        <h2 className="text-base font-bold text-[#0F1F16] dark:text-[#F1F5F2]">Activar ou Prolongar Pro Manualmente</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <select
            value={selectedBusinessId || adminBusinesses[0]?.id || ''}
            onChange={(e) => setSelectedBusinessId(e.target.value)}
            className="sm:col-span-2 min-h-[46px] rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#0E1813] px-3 text-sm text-[#0F1F16] dark:text-[#F1F5F2] focus:border-[#15803D] dark:focus:border-[#4ADE80] focus:outline-none"
          >
            {adminBusinesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.phone || b.id.slice(0, 8)})
              </option>
            ))}
          </select>

          <select
            value={manualPlan}
            onChange={(e) => setManualPlan(e.target.value as Exclude<PlanId, 'free'>)}
            className="min-h-[46px] rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#0E1813] px-3 text-sm text-[#0F1F16] dark:text-[#F1F5F2] focus:border-[#15803D] dark:focus:border-[#4ADE80] focus:outline-none"
          >
            {PRO_PLANS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              value={manualDays}
              onChange={(e) => setManualDays(e.target.value)}
              placeholder="Dias"
              className="min-h-[46px] w-20 rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#0E1813] px-3 font-mono text-sm text-[#0F1F16] dark:text-[#F1F5F2] focus:border-[#15803D] dark:focus:border-[#4ADE80] focus:outline-none"
            />
            <button
              type="submit"
              className="min-h-[46px] flex-1 rounded-xl bg-[#15803D] hover:bg-[#166534] px-3 text-xs font-bold text-white"
            >
              Activar
            </button>
          </div>
        </div>
      </form>

      {/* Password Reset Requests + Firebase Console Guide */}
      <section className="rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-5 space-y-3">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-[#15803D] dark:text-[#4ADE80]" />
          <h2 className="text-base font-bold text-[#0F1F16] dark:text-[#F1F5F2]">Pedidos de Redefinição de Palavra-passe</h2>
        </div>

        {adminPasswordResets.length === 0 ? (
          <p className="text-sm text-[#4B5E53] dark:text-[#8FA598]">Nenhum pedido registado.</p>
        ) : (
          <div className="divide-y divide-[#F1F5F2] dark:divide-[#23382C]">
            {adminPasswordResets.map((req) => (
              <div key={req.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-[#0F1F16] dark:text-[#F1F5F2]">
                    {req.name || 'Utilizador'} · {formatPhoneDisplay(req.phone)}
                  </p>
                  <p className="text-xs font-mono text-[#4B5E53] dark:text-[#8FA598]">
                    Email interno Firebase: {phoneToInternalEmail(req.phone)}
                  </p>
                  {req.note && <p className="text-xs text-[#36493E] dark:text-[#B9C9BF] mt-0.5">{req.note}</p>}
                </div>
                {req.status === 'pending' ? (
                  <button
                    type="button"
                    onClick={() => void resolvePasswordReset(req.id)}
                    className="min-h-[40px] rounded-xl bg-[#F0FDF4] dark:bg-[#143322] border border-[#15803D]/30 dark:border-[#4ADE80]/30 px-3.5 text-xs font-bold text-[#15803D] dark:text-[#4ADE80] shrink-0"
                  >
                    Marcar como resolvido
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-[#4B5E53] dark:text-[#8FA598]">Resolvido</span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl bg-[#F8FAF8] dark:bg-[#182920] border border-[#E2E8E4] dark:border-[#23382C] p-3.5 flex items-start gap-2.5 text-xs text-[#36493E] dark:text-[#B9C9BF]">
          <Info className="h-4 w-4 text-[#15803D] dark:text-[#4ADE80] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-[#0F1F16] dark:text-[#F1F5F2]">
              Guia rápido Firebase Console (Email/Palavra-passe e Redefinição)
            </p>
            <p>
              1. Para permitir registo com telefone/palavra-passe, abra o{' '}
              <strong>Firebase Console → Authentication → Sign-in method</strong> e active{' '}
              <strong>Email/Password</strong>.
            </p>
            <p>
              2. Para redefinir a senha de um cliente manualmente, procure o email interno{' '}
              <code className="font-mono text-[#0F1F16] dark:text-[#F1F5F2]">258[número]@bancafacil.app</code> na aba{' '}
              <strong>Users</strong> da Firebase Console e use a opção de redefinição.
            </p>
          </div>
        </div>
      </section>

      {/* Users Table */}
      <section className="rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-[#15803D] dark:text-[#4ADE80]" />
          <h2 className="text-base font-bold text-[#0F1F16] dark:text-[#F1F5F2]">
            Utilizadores Registados ({adminUsers.length})
          </h2>
        </div>

        <div className="divide-y divide-[#F1F5F2] dark:divide-[#23382C]">
          {adminUsers.map((u) => {
            const sub = adminSubscriptions.find((s) => s.businessId === u.businessId);
            const isSubActive = sub?.status === 'active' && (sub?.expiresAtMs || 0) > Date.now();
            return (
              <div key={u.uid} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <p className="text-sm font-bold text-[#0F1F16] dark:text-[#F1F5F2]">
                    {u.name} · <span className="text-[#4B5E53] dark:text-[#8FA598] font-normal">{u.role}</span>
                  </p>
                  <p className="text-[#4B5E53] dark:text-[#8FA598] font-mono">
                    {u.phone ? formatPhoneDisplay(u.phone) : u.email}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className={`font-bold ${isSubActive ? 'text-[#15803D] dark:text-[#4ADE80]' : 'text-[#854D0E] dark:text-[#FACC15]'}`}>
                    {isSubActive ? `Pro até ${formatDateMz(sub!.expiresAtMs)}` : sub?.status || 'demo'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
