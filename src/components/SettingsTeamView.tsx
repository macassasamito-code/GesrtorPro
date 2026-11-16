import React, { useState } from 'react';
import {
  ArrowLeft,
  Camera,
  Crown,
  LogOut,
  Moon,
  Plus,
  Shield,
  Sun,
  Trash2,
  UserCheck,
  UserMinus,
  Users,
  X,
} from 'lucide-react';
import { MAX_STAFF_ACCOUNTS } from '../config/plans';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { BusinessType, UserProfile } from '../types';
import { compressImageToDataUrl, formatPhoneDisplay } from '../utils/formatters';
import { ConfirmDialog } from './ConfirmDialog';
import { PWAInstallButton } from './PWAInstallButton';

export const SettingsTeamView: React.FC = () => {
  const {
    firebaseUser,
    userProfile,
    business,
    isAdmin,
    isStaff,
    isDemoMode,
    subscriptionStatusLabel,
    staffMembers,
    setSubView,
    openPaywall,
    setAuthModalMode,
    setShowWelcomeScreen,
    updateBusinessSettings,
    createStaffMember,
    toggleStaffActive,
    removeStaffMember,
    requireProOrOpenPaywall,
    logout,
    showToast,
  } = useApp();

  const { isDark, toggleTheme } = useTheme();

  // Business form
  const [bizName, setBizName] = useState(business.name);
  const [bizType, setBizType] = useState<BusinessType>(business.type);
  const [bizPhone, setBizPhone] = useState(business.phone);
  const [bizNuit, setBizNuit] = useState(business.nuit);
  const [bizLogo, setBizLogo] = useState(business.logoDataUrl);
  const [categories, setCategories] = useState<string[]>(business.categories);
  const [newCategory, setNewCategory] = useState('');
  const [savingBiz, setSavingBiz] = useState(false);

  // Staff modal
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffError, setStaffError] = useState('');
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<UserProfile | null>(null);

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireProOrOpenPaywall('guardar definições do negócio')) return;
    setSavingBiz(true);
    try {
      await updateBusinessSettings({
        name: bizName,
        type: bizType,
        phone: bizPhone,
        nuit: bizNuit,
        logoDataUrl: bizLogo,
        categories,
      });
    } finally {
      setSavingBiz(false);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await compressImageToDataUrl(file, 256, 0.75);
      setBizLogo(url);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao processar logótipo.', 'error');
    }
  };

  const handleAddCategory = () => {
    const clean = newCategory.trim();
    if (!clean) return;
    if (categories.includes(clean)) return;
    setCategories((prev) => [...prev, clean]);
    setNewCategory('');
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError('');
    setCreatingStaff(true);
    try {
      await createStaffMember({
        name: staffName,
        phone: staffPhone,
        password: staffPassword,
      });
      setStaffName('');
      setStaffPhone('');
      setStaffPassword('');
      setStaffModalOpen(false);
    } catch (err) {
      setStaffError(err instanceof Error ? err.message : 'Erro ao criar funcionário.');
    } finally {
      setCreatingStaff(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setSubView('none')}
          className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#121F18] px-3.5 text-sm font-semibold text-[#0F1F16] dark:text-[#F1F5F2] hover:bg-[#F8FAF8] dark:hover:bg-[#182920]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar</span>
        </button>
        <h1 className="text-lg font-bold text-[#0F1F16] dark:text-[#F1F5F2]">Definições e Equipa</h1>
      </div>

      {/* Appearance / Dark Mode Toggle */}
      <section className="rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 rounded-xl bg-[#F0FDF4] dark:bg-[#143322] text-[#15803D] dark:text-[#4ADE80] flex items-center justify-center shrink-0">
              {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#0F1F16] dark:text-[#F1F5F2]">Modo Escuro</h2>
              <p className="text-xs text-[#4B5E53] dark:text-[#8FA598] mt-0.5">
                {isDark
                  ? 'Tema escuro activo para poupar bateria e conforto nocturno.'
                  : 'Mude para cores escuras para uso à noite ou em locais com pouca luz.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            aria-label={isDark ? 'Desactivar modo escuro' : 'Activar modo escuro'}
            onClick={toggleTheme}
            className={`min-h-[44px] inline-flex items-center gap-2.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
              isDark
                ? 'border-[#16A34A] bg-[#143322] text-[#4ADE80] hover:bg-[#19402B]'
                : 'border-[#CBD5CF] bg-[#F8FAF8] text-[#0F1F16] hover:bg-[#F1F5F2]'
            }`}
          >
            <span>{isDark ? 'Activado' : 'Desactivado'}</span>
            <span
              aria-hidden="true"
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isDark ? 'bg-[#16A34A]' : 'bg-[#CBD5CF]'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                  isDark ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </span>
          </button>
        </div>
      </section>

      {/* Subscription & Account Status */}
      <section className="rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs text-[#4B5E53] dark:text-[#8FA598]">Subscrição</p>
            <p className="text-base font-bold text-[#0F1F16] dark:text-[#F1F5F2]">{subscriptionStatusLabel}</p>
            {userProfile && (
              <p className="text-xs text-[#4B5E53] dark:text-[#8FA598] mt-0.5">
                Conta: {userProfile.name} {userProfile.phone ? `· ${formatPhoneDisplay(userProfile.phone)}` : ''}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openPaywall('gerir a subscrição Pro')}
              className="min-h-[44px] rounded-xl bg-[#15803D] hover:bg-[#166534] px-4 text-xs font-bold text-white inline-flex items-center gap-1.5"
            >
              <Crown className="h-4 w-4 text-[#FEF08A]" />
              <span>{isDemoMode ? 'Subscrever Pro' : 'Renovar / Ver Planos'}</span>
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setSubView('admin')}
                className="min-h-[44px] rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] px-4 text-xs font-bold text-[#0F1F16] inline-flex items-center gap-1.5"
              >
                <Shield className="h-4 w-4" />
                <span>Painel Administrador</span>
              </button>
            )}
          </div>
        </div>

        <PWAInstallButton />
      </section>

      {/* Team Section (Owner only) */}
      {!isStaff && (
        <section className="rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#0F1F16] dark:text-[#F1F5F2] flex items-center gap-2">
                <Users className="h-5 w-5 text-[#15803D] dark:text-[#4ADE80]" />
                <span>Equipa ({staffMembers.length}/{MAX_STAFF_ACCOUNTS} funcionários)</span>
              </h2>
              <p className="text-xs text-[#4B5E53] dark:text-[#8FA598] mt-0.5">
                O funcionário regista vendas e consulta stock, mas não vê lucros nem relatórios.
              </p>
            </div>
            <button
              type="button"
              disabled={staffMembers.length >= MAX_STAFF_ACCOUNTS}
              onClick={() => {
                if (!requireProOrOpenPaywall('adicionar funcionários')) return;
                setStaffError('');
                setStaffModalOpen(true);
              }}
              className="min-h-[44px] rounded-xl bg-[#F0FDF4] dark:bg-[#143322] border border-[#15803D]/30 dark:border-[#4ADE80]/30 px-3.5 text-xs font-bold text-[#15803D] dark:text-[#4ADE80] inline-flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>Adicionar</span>
            </button>
          </div>

          {staffMembers.length === 0 ? (
            <p className="text-sm text-[#4B5E53] dark:text-[#8FA598]">
              Nenhum funcionário adicionado. O plano Pro permite até 2 funcionários além do dono.
            </p>
          ) : (
            <div className="divide-y divide-[#F1F5F2] dark:divide-[#23382C]">
              {staffMembers.map((member) => (
                <div key={member.uid} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#0F1F16] dark:text-[#F1F5F2]">
                      {member.name}{' '}
                      {!member.active && <span className="text-red-700 dark:text-red-400 text-xs">(Suspenso)</span>}
                    </p>
                    <p className="text-xs text-[#4B5E53] dark:text-[#8FA598] font-mono">
                      {formatPhoneDisplay(member.phone)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => void toggleStaffActive(member.uid, !member.active)}
                      className="min-h-[40px] rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] px-3 text-xs font-semibold text-[#0F1F16] dark:text-[#F1F5F2] hover:bg-[#F8FAF8] dark:hover:bg-[#182920] inline-flex items-center gap-1"
                    >
                      {member.active ? <UserMinus className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                      <span>{member.active ? 'Suspender' : 'Activar'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRemoveTarget(member)}
                      aria-label="Remover funcionário"
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Business Settings Form */}
      {!isStaff && (
        <form
          onSubmit={handleSaveBusiness}
          className="rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-white dark:bg-[#121F18] p-5 space-y-4"
        >
          <h2 className="text-base font-bold text-[#0F1F16] dark:text-[#F1F5F2]">Dados do Negócio</h2>

          <div className="flex items-center gap-4">
            {bizLogo ? (
              <img
                src={bizLogo}
                alt="Logótipo"
                referrerPolicy="no-referrer"
                className="h-16 w-16 rounded-2xl object-cover border border-[#E2E8E4] dark:border-[#23382C]"
              />
            ) : (
              <div className="h-16 w-16 rounded-2xl bg-[#F0FDF4] dark:bg-[#143322] border border-[#E2E8E4] dark:border-[#23382C] flex items-center justify-center font-display font-extrabold text-xl text-[#15803D] dark:text-[#4ADE80]">
                {bizName.charAt(0).toUpperCase() || 'G'}
              </div>
            )}
            <label className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] px-4 text-xs font-semibold text-[#0F1F16] dark:text-[#F1F5F2] cursor-pointer hover:bg-[#F8FAF8] dark:hover:bg-[#182920]">
              <Camera className="h-4 w-4 text-[#15803D] dark:text-[#4ADE80]" />
              <span>Alterar logótipo</span>
              <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0F1F16] dark:text-[#B9C9BF] mb-1">Nome do negócio</label>
              <input
                type="text"
                required
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
                className="min-h-[46px] w-full rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#0E1813] px-3.5 text-sm text-[#0F1F16] dark:text-[#F1F5F2] focus:border-[#15803D] dark:focus:border-[#4ADE80] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0F1F16] dark:text-[#B9C9BF] mb-1">Tipo</label>
              <select
                value={bizType}
                onChange={(e) => setBizType(e.target.value as BusinessType)}
                className="min-h-[46px] w-full rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#0E1813] px-3.5 text-sm text-[#0F1F16] dark:text-[#F1F5F2] focus:border-[#15803D] dark:focus:border-[#4ADE80] focus:outline-none"
              >
                <option value="mercearia">Mercearia / Loja</option>
                <option value="barraca">Barraca</option>
                <option value="salao">Salão de Beleza</option>
                <option value="barbearia">Barbearia</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0F1F16] dark:text-[#B9C9BF] mb-1">Telefone do negócio</label>
              <input
                type="tel"
                inputMode="tel"
                maxLength={22}
                value={bizPhone}
                onChange={(e) => setBizPhone(e.target.value)}
                placeholder="84 123 4567 ou 21 490 123"
                className="min-h-[46px] w-full rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#0E1813] px-3.5 font-mono text-sm text-[#0F1F16] dark:text-[#F1F5F2] placeholder:text-[#8FA598] focus:border-[#15803D] dark:focus:border-[#4ADE80] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0F1F16] dark:text-[#B9C9BF] mb-1">NUIT (opcional)</label>
              <input
                type="text"
                value={bizNuit}
                onChange={(e) => setBizNuit(e.target.value)}
                placeholder="Ex: 400123456"
                className="min-h-[46px] w-full rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#0E1813] px-3.5 font-mono text-sm text-[#0F1F16] dark:text-[#F1F5F2] placeholder:text-[#8FA598] focus:border-[#15803D] dark:focus:border-[#4ADE80] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F1F16] dark:text-[#B9C9BF] mb-1.5">Categorias</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Nova categoria..."
                className="min-h-[44px] flex-1 rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#0E1813] px-3.5 text-sm text-[#0F1F16] dark:text-[#F1F5F2] placeholder:text-[#8FA598] focus:border-[#15803D] dark:focus:border-[#4ADE80] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="min-h-[44px] rounded-xl bg-[#F0FDF4] dark:bg-[#143322] border border-[#15803D]/30 dark:border-[#4ADE80]/30 px-4 text-xs font-bold text-[#15803D] dark:text-[#4ADE80]"
              >
                Adicionar
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategories((prev) => prev.filter((c) => c !== cat))}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E8E4] dark:border-[#23382C] bg-[#F8FAF8] dark:bg-[#182920] px-3 py-1.5 text-xs font-medium text-[#0F1F16] dark:text-[#F1F5F2] hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 dark:hover:text-red-400"
                >
                  <span>{cat}</span>
                  <X className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={savingBiz}
            className="min-h-[50px] w-full rounded-xl bg-[#15803D] text-sm font-bold text-white hover:bg-[#166534] disabled:opacity-60"
          >
            {savingBiz ? 'A guardar...' : 'Guardar Definições'}
          </button>
        </form>
      )}

      {/* Session Footer */}
      <div className="flex flex-col sm:flex-row gap-3">
        {firebaseUser ? (
          <button
            type="button"
            onClick={() => void logout()}
            className="min-h-[48px] flex-1 rounded-xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-[#121F18] text-sm font-bold text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 inline-flex items-center justify-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Terminar Sessão</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setShowWelcomeScreen(true);
              setAuthModalMode('register');
            }}
            className="min-h-[48px] flex-1 rounded-xl bg-[#15803D] text-sm font-bold text-white hover:bg-[#166534]"
          >
            Criar conta / Entrar
          </button>
        )}
      </div>

      {/* Add Staff Modal */}
      {staffModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0F1F16]/60 dark:bg-black/75 p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#121F18] p-6 shadow-2xl border border-[#E2E8E4] dark:border-[#23382C]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#0F1F16] dark:text-[#F1F5F2]">Novo Funcionário</h3>
              <button
                type="button"
                onClick={() => setStaffModalOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#4B5E53] dark:text-[#8FA598] hover:bg-[#F1F5F2] dark:hover:bg-[#182920]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F1F16] dark:text-[#B9C9BF] mb-1">Nome *</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="Ex: Marta Sitoe"
                  className="min-h-[48px] w-full rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#0E1813] px-4 text-sm text-[#0F1F16] dark:text-[#F1F5F2] placeholder:text-[#8FA598]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0F1F16] dark:text-[#B9C9BF] mb-1">
                  Telefone / Número de telefone *
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  required
                  maxLength={22}
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  placeholder="84 987 6543 ou +258..."
                  className="min-h-[48px] w-full rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#0E1813] px-4 font-mono text-sm text-[#0F1F16] dark:text-[#F1F5F2] placeholder:text-[#8FA598]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0F1F16] dark:text-[#B9C9BF] mb-1">Palavra-passe inicial *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="min-h-[48px] w-full rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#0E1813] px-4 text-sm text-[#0F1F16] dark:text-[#F1F5F2] placeholder:text-[#8FA598]"
                />
              </div>
              {staffError && (
                <p className="rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/60 p-3 text-xs text-red-700 dark:text-red-400">
                  {staffError}
                </p>
              )}
              <button
                type="submit"
                disabled={creatingStaff}
                className="min-h-[50px] w-full rounded-xl bg-[#15803D] text-sm font-bold text-white hover:bg-[#166534] disabled:opacity-60"
              >
                {creatingStaff ? 'A criar...' : 'Criar Funcionário'}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!removeTarget}
        title="Remover funcionário?"
        message={`O acesso de "${removeTarget?.name || ''}" às vendas e stock deste negócio será removido.`}
        confirmLabel="Remover"
        onConfirm={async () => {
          if (removeTarget) await removeStaffMember(removeTarget.uid);
          setRemoveTarget(null);
        }}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
};
