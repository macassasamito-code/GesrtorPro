import { PlanId } from '../types';
import {
  MOBILE_WALLETS,
  PAYMENT_INSTRUCTIONS,
  PAYMENT_METHODS,
  WalletPaymentInstruction,
} from './payment';

export type WalletPaymentConfig = WalletPaymentInstruction;
export { MOBILE_WALLETS, PAYMENT_INSTRUCTIONS, PAYMENT_METHODS };

export interface PlanDefinition {
  id: Exclude<PlanId, 'free'>;
  name: string;
  subtitle: string;
  priceMt: number;
  durationDays: number;
  badge?: string;
}

export const ADMIN_EMAIL = 'macassasamito@gmail.com';
export const EXPIRY_WARNING_DAYS = 5;
export const MAX_STAFF_ACCOUNTS = 2;

export const PRO_PLANS: PlanDefinition[] = [
  {
    id: 'monthly',
    name: 'Pro Mensal',
    subtitle: 'Renovação de 30 em 30 dias',
    priceMt: 300,
    durationDays: 30,
  },
  {
    id: 'quarterly',
    name: 'Pro Trimestral',
    subtitle: 'Poupe 100 MT em 3 meses',
    priceMt: 800,
    durationDays: 90,
    badge: 'Mais Popular',
  },
  {
    id: 'annual',
    name: 'Pro Anual',
    subtitle: 'Poupe 800 MT no ano inteiro',
    priceMt: 2800,
    durationDays: 365,
    badge: 'Melhor Valor',
  },
];

export const PRO_BENEFITS = [
  'Produtos, serviços e vendas ilimitados',
  'Controlo de dívidas (fiado) com cobrança no WhatsApp',
  'Relatórios completos com exportação em PDF e Excel',
  'Até 3 utilizadores no negócio (dono + 2 funcionários)',
  'Registo de vendas offline com sincronização automática',
];

export function getPlanById(planId: Exclude<PlanId, 'free'>): PlanDefinition {
  return PRO_PLANS.find((p) => p.id === planId) ?? PRO_PLANS[0];
}
