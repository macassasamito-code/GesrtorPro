import React, { useState } from 'react';
import { Check, CheckCircle2, Clock, Copy, ShieldCheck, Smartphone, X } from 'lucide-react';
import { getWalletInstruction, PAYMENT_METHODS } from '../config/payment';
import { PRO_BENEFITS, PRO_PLANS } from '../config/plans';
import { useApp } from '../contexts/AppContext';
import { PlanId, WalletProvider } from '../types';
import { formatDateTimeMz, formatMT } from '../utils/formatters';

interface ProPaywallModalProps {
  open: boolean;
  onClose: () => void;
}

export const ProPaywallModal: React.FC<ProPaywallModalProps> = ({ open, onClose }) => {
  const {
    firebaseUser,
    paywallReason,
    setAuthModalMode,
    subscription,
    subscriptionStatusLabel,
    paymentRequests,
    submitProPaymentRequest,
    showToast,
  } = useApp();

  const [selectedPlan, setSelectedPlan] = useState<Exclude<PlanId, 'free'>>('quarterly');
  const [selectedWallet, setSelectedWallet] = useState<WalletProvider>('mpesa');
  const [transactionCode, setTransactionCode] = useState('');
  const [proofNote, setProofNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'plans' | 'checkout'>('plans');

  if (!open) return null;

  const activePlan = PRO_PLANS.find((p) => p.id === selectedPlan) || PRO_PLANS[0];
  const activeWallet = getWalletInstruction(selectedWallet);
  const hasPendingRequest = paymentRequests.some((r) => r.status === 'pending');

  const handleCopyNumber = async (num: string) => {
    try {
      await navigator.clipboard.writeText(num.replace(/\s+/g, ''));
      showToast(`Número ${num} copiado!`);
    } catch {
      showToast(`Número: ${num}`);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!firebaseUser) {
      onClose();
      setAuthModalMode('register');
      return;
    }
    if (transactionCode.trim().length < 3) {
      setError('Insira o código da transacção recebido por SMS.');
      return;
    }

    setSubmitting(true);
    try {
      await submitProPaymentRequest({
        planId: selectedPlan,
        wallet: selectedWallet,
        transactionCode,
        proofNote,
      });
      setTransactionCode('');
      setProofNote('');
      setStep('plans');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar comprovativo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0F1F16]/60 dark:bg-black/75 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full sm:max-w-xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#121F18] shadow-2xl border border-[#E2E8E4] dark:border-[#23382C] transition-colors">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-[#0F1F16] dark:text-[#F1F5F2]">
              {step === 'plans' ? 'Subscreve o plano Pro para usar a plataforma' : activeWallet.title}
            </h2>
            {paywallReason && step === 'plans' && (
              <p className="text-xs text-[#4B5E53] dark:text-[#8FA598] mt-0.5">
                Para {paywallReason}, active uma subscrição Pro.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#4B5E53] dark:text-[#8FA598] hover:bg-[#F1F5F2] dark:hover:bg-[#182920]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {firebaseUser && (
            <div className="flex items-center justify-between rounded-xl bg-[#F8FAF8] dark:bg-[#182920] border border-[#E2E8E4] dark:border-[#23382C] px-4 py-3 text-sm">
              <span className="text-[#4B5E53] dark:text-[#8FA598]">Estado actual</span>
              <span className="font-semibold text-[#0F1F16] dark:text-[#F1F5F2]">{subscriptionStatusLabel}</span>
            </div>
          )}

          {hasPendingRequest && (
            <div className="flex items-start gap-3 rounded-xl bg-[#FEF9C3] dark:bg-[#2A230D] border border-[#EAB308]/40 dark:border-[#854D0E]/60 p-4 text-sm text-[#713F12] dark:text-[#FDE047]">
              <Clock className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Comprovativo em análise (Pendente)</p>
                <p className="mt-0.5 text-xs leading-relaxed">
                  Já recebemos o seu código de transacção. Assim que o administrador confirmar, o seu plano Pro será activado automaticamente.
                </p>
              </div>
            </div>
          )}

          {step === 'plans' ? (
            <>
              <div className="space-y-2.5">
                {PRO_PLANS.map((plan) => {
                  const isSelected = selectedPlan === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`w-full text-left rounded-2xl border p-4 transition-colors flex items-center justify-between gap-4 min-h-[68px] ${
                        isSelected
                          ? 'border-[#15803D] dark:border-[#4ADE80] bg-[#F0FDF4] dark:bg-[#143322]'
                          : 'border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#182920] hover:bg-[#F8FAF8] dark:hover:bg-[#1E3327]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 text-sm font-bold text-[#0F1F16] dark:text-[#F1F5F2]">
                          <span>{plan.name}</span>
                          {plan.badge && (
                            <span className="text-xs font-semibold text-[#854D0E] dark:text-[#FACC15]">
                              · {plan.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#4B5E53] dark:text-[#8FA598] mt-0.5">{plan.subtitle}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono text-base font-bold text-[#15803D] dark:text-[#4ADE80] tabular-nums">
                          {formatMT(plan.priceMt)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-[#F8FAF8] dark:bg-[#182920] p-4 space-y-2">
                <p className="text-xs font-bold text-[#0F1F16] dark:text-[#F1F5F2]">Tudo incluído no Plano Pro</p>
                <ul className="space-y-1.5">
                  {PRO_BENEFITS.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2 text-xs text-[#36493E] dark:text-[#B9C9BF]">
                      <Check className="h-4 w-4 shrink-0 text-[#15803D] dark:text-[#4ADE80] mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {!firebaseUser ? (
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      setAuthModalMode('register');
                    }}
                    className="min-h-[52px] w-full rounded-xl bg-[#15803D] px-4 py-3 text-base font-bold text-white hover:bg-[#166534] transition-colors"
                  >
                    Criar conta e Subscrever Pro
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      setAuthModalMode('login');
                    }}
                    className="min-h-[48px] w-full rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#182920] px-4 py-2.5 text-sm font-semibold text-[#0F1F16] dark:text-[#F1F5F2] hover:bg-[#F8FAF8] dark:hover:bg-[#1E3327]"
                  >
                    Já tenho conta — Entrar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep('checkout')}
                  className="min-h-[52px] w-full rounded-xl bg-[#15803D] px-4 py-3 text-base font-bold text-white hover:bg-[#166534] transition-colors"
                >
                  Continuar para Pagamento ({formatMT(activePlan.priceMt)})
                </button>
              )}

              {paymentRequests.length > 0 && (
                <div className="pt-2 border-t border-[#E2E8E4] dark:border-[#23382C]">
                  <p className="text-xs font-bold text-[#0F1F16] dark:text-[#F1F5F2] mb-2">Os meus pedidos de pagamento</p>
                  <div className="space-y-2">
                    {paymentRequests.slice(0, 3).map((req) => (
                      <div key={req.id} className="flex items-center justify-between text-xs py-1.5 border-b border-[#F1F5F2] dark:border-[#23382C] last:border-0">
                        <div>
                          <span className="font-semibold text-[#0F1F16] dark:text-[#F1F5F2] uppercase">{req.wallet}</span>
                          <span className="text-[#4B5E53] dark:text-[#8FA598]"> · Cód. {req.transactionCode}</span>
                          <p className="text-[11px] text-[#64748B] dark:text-[#8FA598]">{formatDateTimeMz(req.createdAtMs || 0)}</p>
                        </div>
                        <span
                          className={`font-semibold ${
                            req.status === 'approved'
                              ? 'text-[#15803D] dark:text-[#4ADE80]'
                              : req.status === 'rejected'
                              ? 'text-red-700 dark:text-red-400'
                              : 'text-[#854D0E] dark:text-[#FACC15]'
                          }`}
                        >
                          {req.status === 'approved' ? 'Aprovado' : req.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <p className="text-xs font-bold text-[#0F1F16] dark:text-[#F1F5F2] mb-2">1. Escolha a carteira móvel</p>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map((wallet) => (
                    <button
                      key={wallet.id}
                      type="button"
                      onClick={() => setSelectedWallet(wallet.id)}
                      className={`min-h-[48px] rounded-xl border px-3 py-2 text-sm font-bold transition-colors ${
                        selectedWallet === wallet.id
                          ? 'border-[#15803D] dark:border-[#4ADE80] bg-[#F0FDF4] dark:bg-[#143322] text-[#15803D] dark:text-[#4ADE80]'
                          : 'border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#182920] text-[#0F1F16] dark:text-[#F1F5F2]'
                      }`}
                    >
                      {wallet.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[#E2E8E4] dark:border-[#854D0E]/60 bg-[#FEFCE8] dark:bg-[#2A230D] p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-[#713F12] dark:text-[#FDE047]">{activeWallet.title}</p>
                    <p className="font-mono text-xl font-bold text-[#0F1F16] dark:text-[#F1F5F2] tabular-nums mt-0.5">
                      {activeWallet.phoneNumber}
                    </p>
                    <p className="text-xs text-[#4B5E53] dark:text-[#B9C9BF]">
                      Titular: <strong className="text-[#0F1F16] dark:text-[#F1F5F2]">{activeWallet.accountName}</strong> · Valor:{' '}
                      <strong className="text-[#15803D] dark:text-[#4ADE80] font-mono tabular-nums">{formatMT(activePlan.priceMt)}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleCopyNumber(activeWallet.phoneNumber)}
                    className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-[#CA8A04]/40 dark:border-[#FACC15]/40 bg-white dark:bg-[#121F18] px-3 py-2 text-xs font-semibold text-[#713F12] dark:text-[#FDE047] hover:bg-[#FEF9C3] dark:hover:bg-[#182920]"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copiar</span>
                  </button>
                </div>

                <p className="text-xs font-medium text-[#713F12] dark:text-[#FDE047] leading-relaxed">
                  {activeWallet.instructionMessage}
                </p>

                <ol className="space-y-1 text-xs text-[#36493E] dark:text-[#D1DDD6] border-t border-[#EAB308]/25 dark:border-[#854D0E]/40 pt-2.5">
                  {activeWallet.instructions.map((line, idx) => (
                    <li key={idx}>
                      {idx + 1}. {line}
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0F1F16] dark:text-[#F1F5F2] mb-1.5">
                  2. Código da transacção (SMS) *
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4B5E53] dark:text-[#8FA598]" />
                  <input
                    type="text"
                    required
                    value={transactionCode}
                    onChange={(e) => setTransactionCode(e.target.value)}
                    placeholder="Ex: PP240519.1234.A89012"
                    className="min-h-[48px] w-full rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#0E1813] pl-10 pr-4 text-sm font-mono text-[#0F1F16] dark:text-[#F1F5F2] placeholder:text-[#8FA598] focus:border-[#15803D] dark:focus:border-[#4ADE80] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0F1F16] dark:text-[#F1F5F2] mb-1.5">
                  Comprovativo ou número usado no envio (opcional)
                </label>
                <input
                  type="text"
                  value={proofNote}
                  onChange={(e) => setProofNote(e.target.value)}
                  placeholder="Ex: Enviado do 84 123 4567"
                  className="min-h-[48px] w-full rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#0E1813] px-4 text-sm text-[#0F1F16] dark:text-[#F1F5F2] placeholder:text-[#8FA598] focus:border-[#15803D] dark:focus:border-[#4ADE80] focus:outline-none"
                />
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/60 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:text-red-400">
                  {error}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep('plans')}
                  className="min-h-[48px] rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#182920] text-sm font-semibold text-[#0F1F16] dark:text-[#F1F5F2] hover:bg-[#F8FAF8] dark:hover:bg-[#1E3327]"
                >
                  Voltar aos planos
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[48px] rounded-xl bg-[#15803D] text-sm font-bold text-white hover:bg-[#166534] disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{submitting ? 'A enviar...' : 'Enviar Comprovativo'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#4B5E53] dark:text-[#8FA598]">
                <ShieldCheck className="h-4 w-4 text-[#15803D] dark:text-[#4ADE80] shrink-0" />
                <span>
                  O seu pedido fica como Pendente e é validado rapidamente pelo administrador.
                  {subscription?.status === 'active' && ' A renovação soma dias ao seu prazo actual.'}
                </span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
