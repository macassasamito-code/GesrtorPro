export type UserRole = 'owner' | 'staff' | 'admin';

export type BusinessType = 'mercearia' | 'barraca' | 'salao' | 'barbearia' | 'outro';

export type PaymentMethod = 'dinheiro' | 'mpesa' | 'emola' | 'mkesh' | 'credito';

export type WalletProvider = 'mpesa' | 'emola' | 'mkesh';

export type PlanId = 'free' | 'monthly' | 'quarterly' | 'annual';

export type SubscriptionStatus = 'demo' | 'pending' | 'active' | 'expired';

export type AppTab = 'inicio' | 'vender' | 'produtos' | 'clientes' | 'relatorios';

export type SubView = 'none' | 'definicoes' | 'equipa' | 'admin' | 'subscricao';

export type DemoPreset = 'mercearia' | 'salao';

export interface UserProfile {
  uid: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  businessId: string;
  ownerUid: string;
  active: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Business {
  id: string;
  name: string;
  type: BusinessType;
  phone: string;
  nuit: string;
  logoDataUrl: string;
  categories: string[];
  ownerUid: string;
  memberUids: string[];
  staffCount: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Product {
  id: string;
  businessId: string;
  ownerUid: string;
  memberUids: string[];
  name: string;
  category: string;
  isService: boolean;
  costPrice: number;
  salePrice: number;
  quantity: number;
  minStock: number;
  photoDataUrl: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  isService: boolean;
  lineTotal: number;
}

export interface Sale {
  id: string;
  businessId: string;
  ownerUid: string;
  memberUids: string[];
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  estimatedProfit: number;
  paymentMethod: PaymentMethod;
  customerId: string;
  customerName: string;
  staffUid: string;
  staffName: string;
  offlineId: string;
  createdAtMs?: number;
  createdAt?: unknown;
}

export interface Customer {
  id: string;
  businessId: string;
  ownerUid: string;
  memberUids: string[];
  name: string;
  phone: string;
  secondaryPhone?: string;
  totalDebt: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Debt {
  id: string;
  businessId: string;
  ownerUid: string;
  memberUids: string[];
  customerId: string;
  saleId: string;
  description: string;
  originalAmount: number;
  remainingAmount: number;
  status: 'open' | 'partial' | 'paid';
  createdAtMs?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface DebtPayment {
  id: string;
  businessId: string;
  ownerUid: string;
  memberUids: string[];
  customerId: string;
  debtId: string;
  amount: number;
  method: Exclude<PaymentMethod, 'credito'>;
  note: string;
  createdAtMs?: number;
  createdAt?: unknown;
}

export interface Subscription {
  businessId: string;
  ownerUid: string;
  memberUids: string[];
  planId: PlanId;
  status: SubscriptionStatus;
  expiresAtMs: number;
  updatedAt?: unknown;
}

export interface PaymentRequest {
  id: string;
  businessId: string;
  ownerUid: string;
  ownerName: string;
  ownerPhone: string;
  planId: Exclude<PlanId, 'free'>;
  amount: number;
  wallet: WalletProvider;
  transactionCode: string;
  proofNote: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote: string;
  createdAtMs?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PasswordResetRequest {
  id: string;
  phone: string;
  name: string;
  note: string;
  status: 'pending' | 'resolved';
  createdAtMs?: number;
  createdAt?: unknown;
}

export interface OfflineQueuedSale {
  offlineId: string;
  businessId: string;
  ownerUid: string;
  memberUids: string[];
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  estimatedProfit: number;
  paymentMethod: PaymentMethod;
  customerId: string;
  customerName: string;
  staffUid: string;
  staffName: string;
  queuedAtMs: number;
}
