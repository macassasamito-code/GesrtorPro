import React, { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  KeyRound,
  Lock,
  MessageCircle,
  Package,
  Phone,
  ShieldCheck,
  Store,
  User,
  X,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { BusinessType } from '../types';
import { isValidMzPhone } from '../utils/formatters';
import { PWAInstallButton } from './PWAInstallButton';

export const WelcomeAuthView: React.FC = () => {
  const {
    enterDemoMode,
    authModalMode,
    setAuthModalMode,
    registerWithPhone,
    loginWithPhone,
    loginWithGoogle,
    requestPasswordReset,
  } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType>('mercearia');
  const [resetNote, setResetNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidMzPhone(phone)) {
      setError('Telefone inválido. Introduza um número de telemóvel (ex: 84 123 4567), telefone fixo (ex: 21 490 123) ou número com +indicativo.');
      return;
    }

    setLoading(true);
    try {
      if (authModalMode === 'register') {
        if (!name.trim()) throw new Error('Escreva o seu nome.');
        if (password.length < 6) throw new Error('A palavra-passe precisa de pelo menos 6 caracteres.');
        await registerWithPhone({
          name,
          phone,
          password,
          businessName: businessName.trim() || `Negócio de ${name.trim().split(' ')[0]}`,
          businessType,
        });
      } else if (authModalMode === 'login') {
        await loginWithPhone(phone, password);
      } else if (authModalMode === 'reset') {
        await requestPasswordReset(phone, name, resetNote);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar com Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8F6] dark:bg-[#0B140F] flex flex-col justify-between transition-colors duration-200">
      {/* Main Content */}
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-14 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero & 3-Step Intro */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2.5">
              <div className="h-11 w-11 rounded-2xl bg-[#15803D] flex items-center justify-center text-white font-display font-extrabold text-xl shadow-xs">
                GP
              </div>
              <span className="font-display text-xl font-extrabold tracking-tight text-[#0F1F16] dark:text-[#F1F5F2]">
                GestorPro
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F1F16] dark:text-[#F1F5F2] leading-tight text-balance">
                Deixe o caderno. Controle o seu negócio no telemóvel.
              </h1>
              <p className="text-base text-[#36493E] dark:text-[#B9C9BF] max-w-xl leading-relaxed">
                Feito para lojas, barracas, salões de beleza e barbearias em Moçambique. Leve, rápido e pronto para vender mesmo sem internet.
              </p>
            </div>

            {/* 3 Simple Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-4">
                <div className="h-9 w-9 rounded-xl bg-[#DCFCE7] dark:bg-[#143322] text-[#15803D] dark:text-[#4ADE80] flex items-center justify-center mb-3">
                  <Package className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-bold text-[#0F1F16] dark:text-[#F1F5F2]">1. Registe o stock</h2>
                <p className="mt-1 text-xs text-[#4B5E53] dark:text-[#8FA598] leading-relaxed">
                  Produtos com aviso de falta e serviços de salão sem stock.
                </p>
              </div>

              <div className="rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-4">
                <div className="h-9 w-9 rounded-xl bg-[#FEF9C3] dark:bg-[#2A230D] text-[#854D0E] dark:text-[#FACC15] flex items-center justify-center mb-3">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-bold text-[#0F1F16] dark:text-[#F1F5F2]">2. Venda rápido</h2>
                <p className="mt-1 text-xs text-[#4B5E53] dark:text-[#8FA598] leading-relaxed">
                  Dinheiro, M-Pesa, e-Mola, mKesh ou fiado com recibo na hora.
                </p>
              </div>

              <div className="rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-4">
                <div className="h-9 w-9 rounded-xl bg-[#DCFCE7] dark:bg-[#143322] text-[#15803D] dark:text-[#4ADE80] flex items-center justify-center mb-3">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-bold text-[#0F1F16] dark:text-[#F1F5F2]">3. Cobre dívidas</h2>
                <p className="mt-1 text-xs text-[#4B5E53] dark:text-[#8FA598] leading-relaxed">
                  Pagamentos parciais e lembrete pronto pelo WhatsApp.
                </p>
              </div>
            </div>
          </div>

          {/* Right Entry Actions Card */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-6 sm:p-7 shadow-sm space-y-4">
              <div>
                <h2 className="text-xl font-bold text-[#0F1F16] dark:text-[#F1F5F2]">Comece agora</h2>
                <p className="mt-1 text-sm text-[#4B5E53] dark:text-[#8FA598]">
                  Experimente tudo gratuitamente sem criar conta ou entre no seu negócio.
                </p>
              </div>

              <button
                type="button"
                onClick={enterDemoMode}
                className="min-h-[54px] w-full rounded-2xl bg-[#15803D] px-5 py-3.5 text-base font-bold text-white hover:bg-[#166534] transition-colors flex items-center justify-between shadow-xs"
              >
                <span>Explorar sem conta</span>
                <ArrowRight className="h-5 w-5" />
              </button>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setAuthModalMode('register');
                  }}
                  className="min-h-[48px] rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] px-4 py-3 text-sm font-bold text-[#0F1F16] transition-colors"
                >
                  Criar conta
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setAuthModalMode('login');
                  }}
                  className="min-h-[48px] rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#182920] hover:bg-[#F8FAF8] dark:hover:bg-[#1E3327] px-4 py-3 text-sm font-bold text-[#0F1F16] dark:text-[#F1F5F2] transition-colors"
                >
                  Entrar
                </button>
              </div>

              <div className="pt-2 border-t border-[#E2E8E4] dark:border-[#23382C] space-y-3">
                <PWAInstallButton />
                <div className="flex items-center gap-2 text-xs text-[#4B5E53] dark:text-[#8FA598]">
                  <ShieldCheck className="h-4 w-4 text-[#15803D] dark:text-[#4ADE80] shrink-0" />
                  <span>Moeda em Meticais (MT) · Dados protegidos por negócio</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Auth Modal */}
      {authModalMode && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0F1F16]/60 dark:bg-black/75 backdrop-blur-xs p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#121F18] p-6 shadow-2xl border border-[#E2E8E4] dark:border-[#23382C]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#0F1F16] dark:text-[#F1F5F2]">
                {authModalMode === 'register'
                  ? 'Criar conta rápida'
                  : authModalMode === 'login'
                  ? 'Entrar no GestorPro'
                  : 'Recuperar palavra-passe'}
              </h2>
              <button
                type="button"
                onClick={() => setAuthModalMode(null)}
                aria-label="Fechar"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#4B5E53] dark:text-[#8FA598] hover:bg-[#F1F5F2] dark:hover:bg-[#182920]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {authModalMode !== 'reset' && (
              <>
                <button
                  type="button"
                  onClick={() => void handleGoogle()}
                  disabled={loading}
                  className="min-h-[48px] w-full rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#182920] hover:bg-[#F8FAF8] dark:hover:bg-[#1E3327] px-4 py-2.5 text-sm font-semibold text-[#0F1F16] dark:text-[#F1F5F2] flex items-center justify-center gap-2.5 transition-colors"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                    />
                  </svg>
                  <span>Entrar com Google</span>
                </button>

                <div className="my-4 flex items-center gap-3 text-xs text-[#64748B] dark:text-[#8FA598]">
                  <div className="h-px flex-1 bg-[#E2E8E4] dark:bg-[#23382C]" />
                  <span>ou com telefone / número de telefone</span>
                  <div className="h-px flex-1 bg-[#E2E8E4] dark:bg-[#23382C]" />
                </div>
              </>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {(authModalMode === 'register' || authModalMode === 'reset') && (
                <div>
                  <label className="block text-xs font-semibold text-[#0F1F16] dark:text-[#B9C9BF] mb-1">
                    O seu nome {authModalMode === 'register' ? '*' : '(opcional)'}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4B5E53] dark:text-[#8FA598]" />
                    <input
                      type="text"
                      required={authModalMode === 'register'}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Armando Cossa"
                      className="min-h-[48px] w-full rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#0E1813] pl-10 pr-4 text-sm text-[#0F1F16] dark:text-[#F1F5F2] placeholder:text-[#8FA598] focus:border-[#15803D] dark:focus:border-[#4ADE80] focus:outline-none"
                    />
                  </div>
                </div>
              )}

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
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="84 123 4567, 21 490 123 ou +258..."
                    className="min-h-[48px] w-full rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#0E1813] pl-10 pr-4 text-sm font-mono text-[#0F1F16] dark:text-[#F1F5F2] placeholder:text-[#8FA598] focus:border-[#15803D] dark:focus:border-[#4ADE80] focus:outline-none"
                  />
                </div>
                <p className="mt-1 text-[11px] text-[#4B5E53] dark:text-[#8FA598]">
                  Aceita telemóvel (82–87), telefone fixo (21–29) ou número internacional com +indicativo.
                </p>
              </div>

              {authModalMode !== 'reset' ? (
                <div>
                  <label className="block text-xs font-semibold text-[#0F1F16] dark:text-[#B9C9BF] mb-1">
                    Palavra-passe *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4B5E53] dark:text-[#8FA598]" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="min-h-[48px] w-full rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#0E1813] pl-10 pr-4 text-sm text-[#0F1F16] dark:text-[#F1F5F2] placeholder:text-[#8FA598] focus:border-[#15803D] dark:focus:border-[#4ADE80] focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-[#0F1F16] dark:text-[#B9C9BF] mb-1">
                    Observação para o administrador (opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={resetNote}
                    onChange={(e) => setResetNote(e.target.value)}
                    placeholder="Ex: Nome da minha loja ou melhor hora para contacto"
                    className="w-full rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#0E1813] p-3 text-sm text-[#0F1F16] dark:text-[#F1F5F2] placeholder:text-[#8FA598] focus:border-[#15803D] dark:focus:border-[#4ADE80] focus:outline-none"
                  />
                </div>
              )}

              {authModalMode === 'register' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-[#0F1F16] dark:text-[#B9C9BF] mb-1">
                      Nome do negócio (opcional)
                    </label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4B5E53] dark:text-[#8FA598]" />
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Ex: Barraca Boa Sorte"
                        className="min-h-[44px] w-full rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#0E1813] pl-9 pr-3 text-sm text-[#0F1F16] dark:text-[#F1F5F2] placeholder:text-[#8FA598] focus:border-[#15803D] dark:focus:border-[#4ADE80] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0F1F16] dark:text-[#B9C9BF] mb-1">
                      Tipo de negócio
                    </label>
                    <select
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value as BusinessType)}
                      className="min-h-[44px] w-full rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#0E1813] px-3 text-sm text-[#0F1F16] dark:text-[#F1F5F2] focus:border-[#15803D] dark:focus:border-[#4ADE80] focus:outline-none"
                    >
                      <option value="mercearia">Mercearia / Loja</option>
                      <option value="barraca">Barraca</option>
                      <option value="salao">Salão de Beleza</option>
                      <option value="barbearia">Barbearia</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/60 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:text-red-400 leading-relaxed">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="min-h-[50px] w-full rounded-xl bg-[#15803D] px-4 py-3 text-sm font-bold text-white hover:bg-[#166534] disabled:opacity-60 transition-colors"
              >
                {loading
                  ? 'A processar...'
                  : authModalMode === 'register'
                  ? 'Criar Conta'
                  : authModalMode === 'login'
                  ? 'Entrar'
                  : 'Pedir Redefinição ao Administrador'}
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-[#E2E8E4] dark:border-[#23382C] flex flex-wrap items-center justify-between gap-2 text-xs">
              {authModalMode === 'login' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setAuthModalMode('reset');
                    }}
                    className="inline-flex items-center gap-1 font-semibold text-[#4B5E53] dark:text-[#8FA598] hover:text-[#0F1F16] dark:hover:text-[#F1F5F2] py-1"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    <span>Esqueceu a palavra-passe?</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setAuthModalMode('register');
                    }}
                    className="font-bold text-[#15803D] dark:text-[#4ADE80] py-1"
                  >
                    Criar conta nova
                  </button>
                </>
              )}
              {authModalMode === 'register' && (
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setAuthModalMode('login');
                  }}
                  className="font-bold text-[#15803D] dark:text-[#4ADE80] py-1 mx-auto"
                >
                  Já tem conta? Entrar aqui
                </button>
              )}
              {authModalMode === 'reset' && (
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setAuthModalMode('login');
                  }}
                  className="font-bold text-[#15803D] dark:text-[#4ADE80] py-1 mx-auto"
                >
                  Voltar ao início de sessão
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
