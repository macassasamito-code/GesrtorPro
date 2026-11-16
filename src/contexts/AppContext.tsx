import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { ADMIN_EMAIL, EXPIRY_WARNING_DAYS, getPlanById, MAX_STAFF_ACCOUNTS } from '../config/plans';
import { getDemoDataset } from '../data/demoData';
import {
  auth,
  createStaffAuthAccount,
  db,
  googleProvider,
  handleFirestoreError,
  mapAuthErrorToPortuguese,
  OperationType,
} from '../services/firebase';
import {
  enqueueOfflineSale,
  loadOfflineQueue,
  removeOfflineSale,
  useOnlineStatus,
} from '../services/offlineSync';
import { paymentGateway } from '../services/paymentGateway';
import {
  AppTab,
  Business,
  BusinessType,
  Customer,
  Debt,
  DebtPayment,
  DemoPreset,
  OfflineQueuedSale,
  PasswordResetRequest,
  PaymentMethod,
  PaymentRequest,
  PlanId,
  Product,
  Sale,
  SaleItem,
  Subscription,
  SubView,
  UserProfile,
  WalletProvider,
} from '../types';
import {
  generateId,
  getTimestampMs,
  isValidMzPhone,
  normalizeMzPhone,
  phoneToInternalEmail,
} from '../utils/formatters';

interface ToastState {
  id: number;
  message: string;
  tone: 'success' | 'error' | 'warning';
}

interface AppContextValue {
  authReady: boolean;
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  isStaff: boolean;
  isDemoMode: boolean;
  isProActive: boolean;
  isExpiringSoon: boolean;
  daysUntilExpiry: number;
  subscriptionStatusLabel: string;
  showWelcomeScreen: boolean;
  setShowWelcomeScreen: (v: boolean) => void;
  demoPreset: DemoPreset;
  setDemoPreset: (preset: DemoPreset) => void;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  subView: SubView;
  setSubView: (view: SubView) => void;
  paywallOpen: boolean;
  paywallReason: string;
  openPaywall: (reason?: string) => void;
  closePaywall: () => void;
  authModalMode: 'login' | 'register' | 'reset' | null;
  setAuthModalMode: (mode: 'login' | 'register' | 'reset' | null) => void;
  enterDemoMode: () => void;
  isOnline: boolean;
  offlineQueue: OfflineQueuedSale[];
  syncingOffline: boolean;
  syncOfflineQueue: () => Promise<void>;
  toast: ToastState | null;
  showToast: (message: string, tone?: 'success' | 'error' | 'warning') => void;

  // Business Data
  business: Business;
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  debts: Debt[];
  payments: DebtPayment[];
  subscription: Subscription | null;
  paymentRequests: PaymentRequest[];
  staffMembers: UserProfile[];

  // Admin Data
  adminUsers: UserProfile[];
  adminBusinesses: Business[];
  adminSubscriptions: Subscription[];
  adminPaymentRequests: PaymentRequest[];
  adminPasswordResets: PasswordResetRequest[];

  // Auth Actions
  registerWithPhone: (input: {
    name: string;
    phone: string;
    password: string;
    businessName: string;
    businessType: BusinessType;
  }) => Promise<void>;
  loginWithPhone: (phone: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  requestPasswordReset: (phone: string, name: string, note: string) => Promise<void>;
  logout: () => Promise<void>;

  // Guard
  requireProOrOpenPaywall: (actionLabel: string) => boolean;

  // Business Operations
  saveProduct: (input: Omit<Product, 'id' | 'businessId' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<void>;
  adjustProductStock: (productId: string, delta: number) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  completeSale: (input: {
    items: SaleItem[];
    discount: number;
    paymentMethod: PaymentMethod;
    customerId: string;
    customerName: string;
  }) => Promise<Sale | null>;
  saveCustomer: (input: {
    id?: string;
    name: string;
    phone: string;
    secondaryPhone?: string;
  }) => Promise<Customer | null>;
  deleteCustomer: (customerId: string) => Promise<void>;
  recordDebtPayment: (input: {
    customerId: string;
    debtId: string;
    amount: number;
    method: Exclude<PaymentMethod, 'credito'>;
    note: string;
  }) => Promise<void>;
  updateBusinessSettings: (input: {
    name: string;
    type: BusinessType;
    phone: string;
    nuit: string;
    logoDataUrl: string;
    categories: string[];
  }) => Promise<void>;
  createStaffMember: (input: { name: string; phone: string; password: string }) => Promise<void>;
  toggleStaffActive: (staffUid: string, active: boolean) => Promise<void>;
  removeStaffMember: (staffUid: string) => Promise<void>;
  submitProPaymentRequest: (input: {
    planId: Exclude<PlanId, 'free'>;
    wallet: WalletProvider;
    transactionCode: string;
    proofNote: string;
  }) => Promise<void>;

  // Admin Operations
  approvePaymentRequest: (req: PaymentRequest) => Promise<void>;
  rejectPaymentRequest: (req: PaymentRequest, reason: string) => Promise<void>;
  manualActivatePro: (businessId: string, days: number, planId: Exclude<PlanId, 'free'>) => Promise<void>;
  resolvePasswordReset: (requestId: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const isOnline = useOnlineStatus();
  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);
  const [demoPreset, setDemoPreset] = useState<DemoPreset>('mercearia');
  const [activeTab, setActiveTab] = useState<AppTab>('inicio');
  const [subView, setSubView] = useState<SubView>('none');
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallReason, setPaywallReason] = useState('');
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'reset' | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueuedSale[]>(() => loadOfflineQueue());
  const [syncingOffline, setSyncingOffline] = useState(false);

  // Live Firestore states for authenticated user
  const [liveBusiness, setLiveBusiness] = useState<Business | null>(null);
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [liveSales, setLiveSales] = useState<Sale[]>([]);
  const [liveCustomers, setLiveCustomers] = useState<Customer[]>([]);
  const [liveDebts, setLiveDebts] = useState<Debt[]>([]);
  const [livePayments, setLivePayments] = useState<DebtPayment[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [staffMembers, setStaffMembers] = useState<UserProfile[]>([]);

  // Admin states
  const [adminUsers, setAdminUsers] = useState<UserProfile[]>([]);
  const [adminBusinesses, setAdminBusinesses] = useState<Business[]>([]);
  const [adminSubscriptions, setAdminSubscriptions] = useState<Subscription[]>([]);
  const [adminPaymentRequests, setAdminPaymentRequests] = useState<PaymentRequest[]>([]);
  const [adminPasswordResets, setAdminPasswordResets] = useState<PasswordResetRequest[]>([]);

  const showToast = useCallback((message: string, tone: 'success' | 'error' | 'warning' = 'success') => {
    const id = Date.now();
    setToast({ id, message, tone });
    window.setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr));
    }, 3800);
  }, []);

  const isAdmin = useMemo(() => {
    return (
      (firebaseUser?.email === ADMIN_EMAIL && firebaseUser?.emailVerified === true) ||
      userProfile?.role === 'admin'
    );
  }, [firebaseUser, userProfile]);

  const isStaff = useMemo(() => {
    return !!firebaseUser && userProfile?.role === 'staff';
  }, [firebaseUser, userProfile]);

  // Subscription state calculations
  const nowMs = Date.now();
  const isProActive = useMemo(() => {
    if (!firebaseUser || !subscription) return false;
    return subscription.status === 'active' && subscription.expiresAtMs > nowMs;
  }, [firebaseUser, subscription, nowMs]);

  const daysUntilExpiry = useMemo(() => {
    if (!subscription || subscription.expiresAtMs <= 0) return 0;
    const diff = subscription.expiresAtMs - Date.now();
    return Math.max(0, Math.ceil(diff / (24 * 3600 * 1000)));
  }, [subscription]);

  const isExpiringSoon = useMemo(() => {
    return isProActive && daysUntilExpiry > 0 && daysUntilExpiry <= EXPIRY_WARNING_DAYS;
  }, [isProActive, daysUntilExpiry]);

  const subscriptionStatusLabel = useMemo(() => {
    if (!firebaseUser) return 'Modo Demonstração (Gratuito)';
    if (!subscription) return 'A verificar subscrição...';
    if (subscription.status === 'active' && subscription.expiresAtMs > Date.now()) {
      return `Pro Activo · Expira em ${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'dia' : 'dias'}`;
    }
    if (subscription.status === 'active' && subscription.expiresAtMs <= Date.now()) {
      return 'Subscrição Expirada · Modo Demonstração';
    }
    if (subscription.status === 'expired') {
      return 'Subscrição Expirada · Modo Demonstração';
    }
    if (subscription.status === 'pending') {
      return 'Pagamento Pendente de Aprovação';
    }
    return 'Plano Gratuito (Demonstração)';
  }, [firebaseUser, subscription, daysUntilExpiry]);

  // Demo mode is active when not logged in OR when logged in without active Pro
  const isDemoMode = !firebaseUser || !isProActive;

  const demoData = useMemo(() => getDemoDataset(demoPreset), [demoPreset]);

  const provisioningMapRef = useRef<Map<string, Promise<UserProfile>>>(new Map());
  const pendingRegOverridesRef = useRef<{
    name?: string;
    phone?: string;
    businessName?: string;
    businessType?: BusinessType;
  } | null>(null);

  // Ensure initial user + business + subscription docs exist for a Firebase user (serialized per UID)
  const ensureOwnerProvisioned = useCallback(
    async (
      user: User,
      overrides?: { name?: string; phone?: string; businessName?: string; businessType?: BusinessType }
    ): Promise<UserProfile> => {
      const existingInFlight = provisioningMapRef.current.get(user.uid);
      if (existingInFlight) {
        return existingInFlight;
      }

      const task = (async (): Promise<UserProfile> => {
        const effectiveOverrides = overrides || pendingRegOverridesRef.current || undefined;
        pendingRegOverridesRef.current = null;

        const userRef = doc(db, 'users', user.uid);
        const bizRef = doc(db, 'businesses', user.uid);
        const subRef = doc(db, 'subscriptions', user.uid);

        const safeGetDoc = async (ref: ReturnType<typeof doc>) => {
          try {
            return await getDocFromServer(ref);
          } catch {
            return await getDoc(ref);
          }
        };

        const userSnap = await safeGetDoc(userRef);
        if (userSnap.exists()) {
          return userSnap.data() as UserProfile;
        }

        const [bizSnap, subSnap] = await Promise.all([safeGetDoc(bizRef), safeGetDoc(subRef)]);

        const businessId = user.uid;
        const cleanName = (effectiveOverrides?.name?.trim() || user.displayName || 'Comerciante').slice(0, 100);
        const cleanPhone = effectiveOverrides?.phone ? normalizeMzPhone(effectiveOverrides.phone) : '';
        const bizName = (
          effectiveOverrides?.businessName?.trim() || `Negócio de ${cleanName.split(' ')[0]}`
        ).slice(0, 120);
        const bizType = effectiveOverrides?.businessType || 'mercearia';

        const defaultCategories =
          bizType === 'salao' || bizType === 'barbearia'
            ? ['Cortes', 'Tranças & Penteados', 'Manicure', 'Produtos Capilares']
            : ['Alimentação', 'Bebidas', 'Higiene', 'Outros'];

        const batch = writeBatch(db);
        const profilePayload: UserProfile = {
          uid: user.uid,
          name: cleanName,
          phone: cleanPhone,
          email: (user.email || '').slice(0, 160),
          role: 'owner',
          businessId,
          ownerUid: user.uid,
          active: true,
        };

        let hasWrites = false;

        if (!userSnap.exists()) {
          batch.set(userRef, {
            ...profilePayload,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          hasWrites = true;
        }

        if (!bizSnap.exists()) {
          batch.set(bizRef, {
            id: businessId,
            name: bizName,
            type: bizType,
            phone: cleanPhone,
            nuit: '',
            logoDataUrl: '',
            categories: defaultCategories,
            ownerUid: user.uid,
            memberUids: [user.uid],
            staffCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          hasWrites = true;
        }

        if (!subSnap.exists()) {
          batch.set(subRef, {
            businessId,
            ownerUid: user.uid,
            memberUids: [user.uid],
            planId: 'free',
            status: 'demo',
            expiresAtMs: 0,
            updatedAt: serverTimestamp(),
          });
          hasWrites = true;
        }

        if (hasWrites) {
          try {
            await batch.commit();
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
          }
        }
        return profilePayload;
      })();

      provisioningMapRef.current.set(user.uid, task);
      try {
        return await task;
      } finally {
        provisioningMapRef.current.delete(user.uid);
      }
    },
    []
  );

  // Firebase Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        setShowWelcomeScreen(false);
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) {
            setUserProfile(snap.data() as UserProfile);
          } else {
            const created = await ensureOwnerProvisioned(user);
            setUserProfile(created);
          }
        } catch {
          // Listener will retry if offline
        }
      } else {
        setUserProfile(null);
        setLiveBusiness(null);
        setLiveProducts([]);
        setLiveSales([]);
        setLiveCustomers([]);
        setLiveDebts([]);
        setLivePayments([]);
        setSubscription(null);
        setPaymentRequests([]);
        setStaffMembers([]);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, [ensureOwnerProvisioned]);

  // Business-scoped Firestore listeners
  useEffect(() => {
    if (!authReady || !firebaseUser) return;

    const uid = firebaseUser.uid;
    const unsubs: (() => void)[] = [];

    unsubs.push(
      onSnapshot(
        doc(db, 'users', uid),
        (snap) => {
          if (snap.exists()) {
            const prof = snap.data() as UserProfile;
            setUserProfile(prof);
            if (!prof.active) {
              showToast('A sua conta de funcionário foi desactivada pelo proprietário.', 'error');
              void signOut(auth);
            }
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}`)
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'businesses'), where('memberUids', 'array-contains', uid)),
        (snap) => {
          const first = snap.docs[0]?.data() as Business | undefined;
          setLiveBusiness(first || null);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'businesses')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'subscriptions'), where('memberUids', 'array-contains', uid)),
        (snap) => {
          const first = snap.docs[0]?.data() as Subscription | undefined;
          setSubscription(first || null);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'subscriptions')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'products'), where('memberUids', 'array-contains', uid)),
        (snap) => {
          const items = snap.docs.map((d) => d.data() as Product);
          items.sort((a, b) => a.name.localeCompare(b.name, 'pt'));
          setLiveProducts(items);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'products')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'sales'), where('memberUids', 'array-contains', uid)),
        (snap) => {
          const items = snap.docs.map((d) => {
            const raw = d.data() as Sale;
            return { ...raw, createdAtMs: getTimestampMs(raw.createdAt, raw.createdAtMs) };
          });
          items.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
          setLiveSales(items);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'sales')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'customers'), where('memberUids', 'array-contains', uid)),
        (snap) => {
          const items = snap.docs.map((d) => d.data() as Customer);
          items.sort((a, b) => a.name.localeCompare(b.name, 'pt'));
          setLiveCustomers(items);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'customers')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'debts'), where('memberUids', 'array-contains', uid)),
        (snap) => {
          const items = snap.docs.map((d) => {
            const raw = d.data() as Debt;
            return { ...raw, createdAtMs: getTimestampMs(raw.createdAt, raw.createdAtMs) };
          });
          items.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
          setLiveDebts(items);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'debts')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'payments'), where('memberUids', 'array-contains', uid)),
        (snap) => {
          const items = snap.docs.map((d) => {
            const raw = d.data() as DebtPayment;
            return { ...raw, createdAtMs: getTimestampMs(raw.createdAt, raw.createdAtMs) };
          });
          items.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
          setLivePayments(items);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'payments')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'paymentRequests'), where('ownerUid', '==', uid)),
        (snap) => {
          const items = snap.docs.map((d) => {
            const raw = d.data() as PaymentRequest;
            return { ...raw, createdAtMs: getTimestampMs(raw.createdAt, raw.createdAtMs) };
          });
          items.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
          setPaymentRequests(items);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'paymentRequests')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'users'), where('ownerUid', '==', uid)),
        (snap) => {
          const staff = snap.docs
            .map((d) => d.data() as UserProfile)
            .filter((u) => u.role === 'staff');
          setStaffMembers(staff);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'users')
      )
    );

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [authReady, firebaseUser, showToast]);

  // Admin-only listeners
  useEffect(() => {
    if (!authReady || !firebaseUser || !isAdmin || subView !== 'admin') return;

    const unsubs: (() => void)[] = [];

    unsubs.push(
      onSnapshot(collection(db, 'users'), (snap) => {
        setAdminUsers(snap.docs.map((d) => d.data() as UserProfile));
      })
    );
    unsubs.push(
      onSnapshot(collection(db, 'businesses'), (snap) => {
        setAdminBusinesses(snap.docs.map((d) => d.data() as Business));
      })
    );
    unsubs.push(
      onSnapshot(collection(db, 'subscriptions'), (snap) => {
        setAdminSubscriptions(snap.docs.map((d) => d.data() as Subscription));
      })
    );
    unsubs.push(
      onSnapshot(collection(db, 'paymentRequests'), (snap) => {
        const list = snap.docs.map((d) => {
          const raw = d.data() as PaymentRequest;
          return { ...raw, createdAtMs: getTimestampMs(raw.createdAt, raw.createdAtMs) };
        });
        list.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
        setAdminPaymentRequests(list);
      })
    );
    unsubs.push(
      onSnapshot(collection(db, 'passwordResetRequests'), (snap) => {
        const list = snap.docs.map((d) => {
          const raw = d.data() as PasswordResetRequest;
          return { ...raw, createdAtMs: getTimestampMs(raw.createdAt, raw.createdAtMs) };
        });
        list.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
        setAdminPasswordResets(list);
      })
    );

    return () => unsubs.forEach((fn) => fn());
  }, [authReady, firebaseUser, isAdmin, subView]);

  // Active data exposed to UI (Demo read-only data vs Live Pro data)
  const business = isDemoMode ? demoData.business : liveBusiness || demoData.business;
  const products = isDemoMode ? demoData.products : liveProducts;
  const sales = isDemoMode ? demoData.sales : liveSales;
  const customers = isDemoMode ? demoData.customers : liveCustomers;
  const debts = isDemoMode ? demoData.debts : liveDebts;
  const payments = isDemoMode ? demoData.payments : livePayments;

  const openPaywall = useCallback((reason?: string) => {
    setPaywallReason(reason || '');
    setPaywallOpen(true);
  }, []);

  const closePaywall = useCallback(() => {
    setPaywallOpen(false);
    setPaywallReason('');
  }, []);

  const enterDemoMode = useCallback(() => {
    setShowWelcomeScreen(false);
    setActiveTab('inicio');
    setSubView('none');
  }, []);

  const requireProOrOpenPaywall = useCallback(
    (actionLabel: string): boolean => {
      if (isProActive) return true;
      openPaywall(actionLabel);
      return false;
    },
    [isProActive, openPaywall]
  );

  // Sync queued offline sales automatically when back online
  const syncOfflineQueue = useCallback(async () => {
    if (!isOnline || !firebaseUser || !isProActive || syncingOffline) return;
    const queue = loadOfflineQueue().filter((q) => q.businessId === (liveBusiness?.id || firebaseUser.uid));
    if (queue.length === 0) return;

    setSyncingOffline(true);
    let syncedCount = 0;
    try {
      for (const queued of queue) {
        const batch = writeBatch(db);
        const saleId = generateId('sale');
        batch.set(doc(db, 'sales', saleId), {
          id: saleId,
          businessId: queued.businessId,
          ownerUid: queued.ownerUid,
          memberUids: queued.memberUids,
          items: queued.items,
          subtotal: queued.subtotal,
          discount: queued.discount,
          total: queued.total,
          estimatedProfit: queued.estimatedProfit,
          paymentMethod: queued.paymentMethod,
          customerId: queued.customerId,
          customerName: queued.customerName,
          staffUid: queued.staffUid,
          staffName: queued.staffName,
          offlineId: queued.offlineId,
          createdAt: serverTimestamp(),
        });

        for (const item of queued.items) {
          if (!item.isService) {
            const prod = liveProducts.find((p) => p.id === item.productId);
            if (prod) {
              const nextQty = Math.max(0, prod.quantity - item.quantity);
              batch.update(doc(db, 'products', prod.id), {
                quantity: nextQty,
                updatedAt: serverTimestamp(),
              });
            }
          }
        }

        if (queued.paymentMethod === 'credito' && queued.customerId) {
          const debtId = generateId('debt');
          const desc = queued.items.map((i) => `${i.quantity}x ${i.name}`).join(', ').slice(0, 220);
          batch.set(doc(db, 'debts', debtId), {
            id: debtId,
            businessId: queued.businessId,
            ownerUid: queued.ownerUid,
            memberUids: queued.memberUids,
            customerId: queued.customerId,
            saleId,
            description: desc || 'Venda a crédito (offline)',
            originalAmount: queued.total,
            remainingAmount: queued.total,
            status: 'open',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          const cust = liveCustomers.find((c) => c.id === queued.customerId);
          if (cust) {
            batch.update(doc(db, 'customers', cust.id), {
              totalDebt: cust.totalDebt + queued.total,
              updatedAt: serverTimestamp(),
            });
          }
        }

        await batch.commit();
        setOfflineQueue(removeOfflineSale(queued.offlineId));
        syncedCount += 1;
      }
      if (syncedCount > 0) {
        showToast(`${syncedCount} ${syncedCount === 1 ? 'venda offline sincronizada' : 'vendas offline sincronizadas'} com sucesso.`);
      }
    } catch (error) {
      console.error('Offline sync paused:', error);
    } finally {
      setSyncingOffline(false);
    }
  }, [isOnline, firebaseUser, isProActive, syncingOffline, liveBusiness, liveProducts, liveCustomers, showToast]);

  useEffect(() => {
    if (isOnline && isProActive && offlineQueue.length > 0) {
      void syncOfflineQueue();
    }
  }, [isOnline, isProActive, offlineQueue.length, syncOfflineQueue]);

  // Auth Actions
  const registerWithPhone: AppContextValue['registerWithPhone'] = async ({
    name,
    phone,
    password,
    businessName,
    businessType,
  }) => {
    if (!isValidMzPhone(phone)) {
      throw new Error('Telefone inválido. Introduza telemóvel (ex: 84 123 4567), telefone fixo (ex: 21 490 123) ou número com +indicativo.');
    }
    if (password.length < 6) {
      throw new Error('A palavra-passe deve ter pelo menos 6 caracteres.');
    }
    try {
      const internalEmail = phoneToInternalEmail(phone);
      pendingRegOverridesRef.current = { name, phone, businessName, businessType };
      const cred = await createUserWithEmailAndPassword(auth, internalEmail, password);
      const profile = await ensureOwnerProvisioned(cred.user, {
        name,
        phone,
        businessName,
        businessType,
      });
      setUserProfile(profile);
      setShowWelcomeScreen(false);
      setAuthModalMode(null);
      showToast('Conta criada! Agora pode activar o plano Pro.');
    } catch (error) {
      pendingRegOverridesRef.current = null;
      throw new Error(mapAuthErrorToPortuguese(error));
    }
  };

  const loginWithPhone: AppContextValue['loginWithPhone'] = async (phone, password) => {
    if (!isValidMzPhone(phone)) {
      throw new Error('Telefone inválido. Introduza telemóvel (ex: 84 123 4567), telefone fixo (ex: 21 490 123) ou número com +indicativo.');
    }
    try {
      const internalEmail = phoneToInternalEmail(phone);
      await signInWithEmailAndPassword(auth, internalEmail, password);
      setShowWelcomeScreen(false);
      setAuthModalMode(null);
      showToast('Sessão iniciada com sucesso.');
    } catch (error) {
      throw new Error(mapAuthErrorToPortuguese(error));
    }
  };

  const loginWithGoogle: AppContextValue['loginWithGoogle'] = async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const profile = await ensureOwnerProvisioned(cred.user);
      setUserProfile(profile);
      setShowWelcomeScreen(false);
      setAuthModalMode(null);
      showToast('Sessão iniciada com Google.');
    } catch (error) {
      throw new Error(mapAuthErrorToPortuguese(error));
    }
  };

  const requestPasswordReset: AppContextValue['requestPasswordReset'] = async (phone, name, note) => {
    if (!isValidMzPhone(phone)) {
      throw new Error('Telefone inválido. Introduza telemóvel (ex: 84 123 4567), telefone fixo (ex: 21 490 123) ou número com +indicativo.');
    }
    const id = generateId('pwd');
    try {
      await setDoc(doc(db, 'passwordResetRequests', id), {
        id,
        phone: normalizeMzPhone(phone),
        name: name.trim().slice(0, 100),
        note: note.trim().slice(0, 240),
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setAuthModalMode(null);
      showToast('Pedido enviado! O administrador irá redefinir o seu acesso em breve.');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `passwordResetRequests/${id}`);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setSubView('none');
    setActiveTab('inicio');
    setShowWelcomeScreen(true);
    showToast('Sessão terminada.');
  };

  // Business Operations
  const saveProduct: AppContextValue['saveProduct'] = async (input) => {
    if (!requireProOrOpenPaywall('adicionar ou editar produtos')) return;
    if (!liveBusiness || !firebaseUser) return;
    if (isStaff) {
      showToast('Apenas o proprietário pode criar ou editar produtos.', 'error');
      return;
    }

    const id = input.id || generateId('prod');
    const path = `products/${id}`;
    try {
      if (input.id) {
        await updateDoc(doc(db, 'products', id), {
          name: input.name.trim().slice(0, 120),
          category: input.category.trim().slice(0, 60),
          isService: input.isService,
          costPrice: Math.max(0, Number(input.costPrice)),
          salePrice: Math.max(0, Number(input.salePrice)),
          quantity: input.isService ? 0 : Math.max(0, Number(input.quantity)),
          minStock: input.isService ? 0 : Math.max(0, Number(input.minStock)),
          photoDataUrl: input.photoDataUrl || '',
          updatedAt: serverTimestamp(),
        });
        showToast('Artigo actualizado.');
      } else {
        await setDoc(doc(db, 'products', id), {
          id,
          businessId: liveBusiness.id,
          ownerUid: liveBusiness.ownerUid,
          memberUids: liveBusiness.memberUids,
          name: input.name.trim().slice(0, 120),
          category: input.category.trim().slice(0, 60),
          isService: input.isService,
          costPrice: Math.max(0, Number(input.costPrice)),
          salePrice: Math.max(0, Number(input.salePrice)),
          quantity: input.isService ? 0 : Math.max(0, Number(input.quantity)),
          minStock: input.isService ? 0 : Math.max(0, Number(input.minStock)),
          photoDataUrl: input.photoDataUrl || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        showToast('Artigo adicionado ao catálogo.');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const adjustProductStock: AppContextValue['adjustProductStock'] = async (productId, delta) => {
    if (!requireProOrOpenPaywall('ajustar stock')) return;
    if (isStaff) {
      showToast('Apenas o proprietário pode ajustar entradas de stock.', 'error');
      return;
    }
    const target = liveProducts.find((p) => p.id === productId);
    if (!target || target.isService) return;
    const nextQty = Math.max(0, target.quantity + delta);
    try {
      await updateDoc(doc(db, 'products', productId), {
        quantity: nextQty,
        updatedAt: serverTimestamp(),
      });
      showToast(`Stock actualizado: ${nextQty} un.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${productId}`);
    }
  };

  const deleteProduct: AppContextValue['deleteProduct'] = async (productId) => {
    if (!requireProOrOpenPaywall('apagar produtos')) return;
    if (isStaff) {
      showToast('Apenas o proprietário pode apagar produtos.', 'error');
      return;
    }
    try {
      await deleteDoc(doc(db, 'products', productId));
      showToast('Artigo removido.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${productId}`);
    }
  };

  const completeSale: AppContextValue['completeSale'] = async ({
    items,
    discount,
    paymentMethod,
    customerId,
    customerName,
  }) => {
    if (!requireProOrOpenPaywall('registar vendas')) return null;
    if (!liveBusiness || !firebaseUser || !userProfile) return null;
    if (items.length === 0) return null;

    const subtotal = items.reduce((acc, i) => acc + i.lineTotal, 0);
    const cleanDiscount = Math.min(subtotal, Math.max(0, discount));
    const total = Math.max(0, subtotal - cleanDiscount);
    const totalCost = items.reduce((acc, i) => acc + i.costPrice * i.quantity, 0);
    const estimatedProfit = total - totalCost;
    const saleId = generateId('sale');

    const localSale: Sale = {
      id: saleId,
      businessId: liveBusiness.id,
      ownerUid: liveBusiness.ownerUid,
      memberUids: liveBusiness.memberUids,
      items,
      subtotal,
      discount: cleanDiscount,
      total,
      estimatedProfit,
      paymentMethod,
      customerId: customerId || '',
      customerName: customerName || 'Cliente Balcão',
      staffUid: firebaseUser.uid,
      staffName: userProfile.name,
      offlineId: '',
      createdAtMs: Date.now(),
    };

    if (!isOnline) {
      const offlineId = generateId('off');
      const queued: OfflineQueuedSale = {
        offlineId,
        businessId: liveBusiness.id,
        ownerUid: liveBusiness.ownerUid,
        memberUids: liveBusiness.memberUids,
        items,
        subtotal,
        discount: cleanDiscount,
        total,
        estimatedProfit,
        paymentMethod,
        customerId: customerId || '',
        customerName: customerName || 'Cliente Balcão',
        staffUid: firebaseUser.uid,
        staffName: userProfile.name,
        queuedAtMs: Date.now(),
      };
      setOfflineQueue(enqueueOfflineSale(queued));
      showToast('Venda guardada offline! Será sincronizada quando tiver internet.', 'warning');
      return { ...localSale, offlineId };
    }

    const batch = writeBatch(db);
    batch.set(doc(db, 'sales', saleId), {
      id: saleId,
      businessId: liveBusiness.id,
      ownerUid: liveBusiness.ownerUid,
      memberUids: liveBusiness.memberUids,
      items,
      subtotal,
      discount: cleanDiscount,
      total,
      estimatedProfit,
      paymentMethod,
      customerId: customerId || '',
      customerName: customerName || 'Cliente Balcão',
      staffUid: firebaseUser.uid,
      staffName: userProfile.name,
      offlineId: '',
      createdAt: serverTimestamp(),
    });

    for (const item of items) {
      if (!item.isService) {
        const prod = liveProducts.find((p) => p.id === item.productId);
        if (prod) {
          batch.update(doc(db, 'products', prod.id), {
            quantity: Math.max(0, prod.quantity - item.quantity),
            updatedAt: serverTimestamp(),
          });
        }
      }
    }

    if (paymentMethod === 'credito' && customerId) {
      const debtId = generateId('debt');
      const desc = items.map((i) => `${i.quantity}x ${i.name}`).join(', ').slice(0, 220);
      batch.set(doc(db, 'debts', debtId), {
        id: debtId,
        businessId: liveBusiness.id,
        ownerUid: liveBusiness.ownerUid,
        memberUids: liveBusiness.memberUids,
        customerId,
        saleId,
        description: desc || 'Venda a crédito',
        originalAmount: total,
        remainingAmount: total,
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const cust = liveCustomers.find((c) => c.id === customerId);
      if (cust) {
        batch.update(doc(db, 'customers', cust.id), {
          totalDebt: cust.totalDebt + total,
          updatedAt: serverTimestamp(),
        });
      }
    }

    try {
      await batch.commit();
      showToast('Venda registada com sucesso.');
      return localSale;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `sales/${saleId}`);
    }
  };

  const saveCustomer: AppContextValue['saveCustomer'] = async ({
    id,
    name,
    phone,
    secondaryPhone = '',
  }) => {
    if (!requireProOrOpenPaywall('guardar clientes')) return null;
    if (!liveBusiness) return null;
    if (!isValidMzPhone(phone)) {
      throw new Error('Telefone inválido. Introduza telemóvel (ex: 84 123 4567), telefone fixo (ex: 21 490 123) ou número com +indicativo.');
    }
    const trimmedSecondary = secondaryPhone.trim();
    if (trimmedSecondary && !isValidMzPhone(trimmedSecondary)) {
      throw new Error('Telefone alternativo inválido. Verifique os dígitos introduzidos.');
    }
    const cleanPhone = normalizeMzPhone(phone).slice(0, 25);
    const cleanSecondary = trimmedSecondary ? normalizeMzPhone(trimmedSecondary).slice(0, 25) : '';
    const customerId = id || generateId('cust');
    try {
      if (id) {
        await updateDoc(doc(db, 'customers', id), {
          name: name.trim().slice(0, 120),
          phone: cleanPhone,
          secondaryPhone: cleanSecondary,
          updatedAt: serverTimestamp(),
        });
        showToast('Dados do cliente actualizados.');
        const existing = liveCustomers.find((c) => c.id === id);
        return existing ? { ...existing, name: name.trim(), phone: cleanPhone, secondaryPhone: cleanSecondary } : null;
      } else {
        const customerObj: Customer = {
          id: customerId,
          businessId: liveBusiness.id,
          ownerUid: liveBusiness.ownerUid,
          memberUids: liveBusiness.memberUids,
          name: name.trim().slice(0, 120),
          phone: cleanPhone,
          secondaryPhone: cleanSecondary,
          totalDebt: 0,
        };
        await setDoc(doc(db, 'customers', customerId), {
          ...customerObj,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        showToast('Cliente adicionado.');
        return customerObj;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `customers/${customerId}`);
    }
  };

  const deleteCustomer: AppContextValue['deleteCustomer'] = async (customerId) => {
    if (!requireProOrOpenPaywall('apagar clientes')) return;
    if (isStaff) {
      showToast('Apenas o proprietário pode apagar clientes.', 'error');
      return;
    }
    try {
      await deleteDoc(doc(db, 'customers', customerId));
      showToast('Cliente removido.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `customers/${customerId}`);
    }
  };

  const recordDebtPayment: AppContextValue['recordDebtPayment'] = async ({
    customerId,
    debtId,
    amount,
    method,
    note,
  }) => {
    if (!requireProOrOpenPaywall('registar pagamentos de dívida')) return;
    if (!liveBusiness) return;

    const customer = liveCustomers.find((c) => c.id === customerId);
    const debt = liveDebts.find((d) => d.id === debtId);
    if (!customer || !debt) return;

    const payAmount = Math.min(debt.remainingAmount, Math.max(0, amount));
    if (payAmount <= 0) return;

    const paymentId = generateId('pay');
    const nextRemaining = Math.max(0, debt.remainingAmount - payAmount);
    const nextStatus = nextRemaining === 0 ? 'paid' : 'partial';

    const batch = writeBatch(db);
    batch.set(doc(db, 'payments', paymentId), {
      id: paymentId,
      businessId: liveBusiness.id,
      ownerUid: liveBusiness.ownerUid,
      memberUids: liveBusiness.memberUids,
      customerId,
      debtId,
      amount: payAmount,
      method,
      note: note.trim().slice(0, 200),
      createdAt: serverTimestamp(),
    });
    batch.update(doc(db, 'debts', debtId), {
      remainingAmount: nextRemaining,
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, 'customers', customerId), {
      totalDebt: Math.max(0, customer.totalDebt - payAmount),
      updatedAt: serverTimestamp(),
    });

    try {
      await batch.commit();
      showToast('Pagamento da dívida registado.');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `payments/${paymentId}`);
    }
  };

  const updateBusinessSettings: AppContextValue['updateBusinessSettings'] = async (input) => {
    if (!requireProOrOpenPaywall('alterar definições do negócio')) return;
    if (!liveBusiness || isStaff) return;
    try {
      await updateDoc(doc(db, 'businesses', liveBusiness.id), {
        name: input.name.trim().slice(0, 120),
        type: input.type,
        phone: input.phone ? normalizeMzPhone(input.phone) : '',
        nuit: input.nuit.trim().slice(0, 20),
        logoDataUrl: input.logoDataUrl || '',
        categories: input.categories.slice(0, 30),
        updatedAt: serverTimestamp(),
      });
      showToast('Definições do negócio guardadas.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `businesses/${liveBusiness.id}`);
    }
  };

  // Sync memberUids across collections whenever staff list changes
  const syncMemberUidsAcrossBusiness = async (businessId: string, nextMemberUids: string[], nextStaffCount: number) => {
    const batch = writeBatch(db);
    batch.update(doc(db, 'businesses', businessId), {
      memberUids: nextMemberUids,
      staffCount: nextStaffCount,
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, 'subscriptions', businessId), {
      memberUids: nextMemberUids,
      updatedAt: serverTimestamp(),
    });

    const cols = ['products', 'customers', 'debts'];
    for (const colName of cols) {
      const snap = await getDocs(query(collection(db, colName), where('businessId', '==', businessId)));
      snap.forEach((d) => {
        batch.update(d.ref, { memberUids: nextMemberUids, updatedAt: serverTimestamp() });
      });
    }
    const noUpdatedCols = ['sales', 'payments'];
    for (const colName of noUpdatedCols) {
      const snap = await getDocs(query(collection(db, colName), where('businessId', '==', businessId)));
      snap.forEach((d) => {
        batch.update(d.ref, { memberUids: nextMemberUids });
      });
    }
    await batch.commit();
  };

  const createStaffMember: AppContextValue['createStaffMember'] = async ({ name, phone, password }) => {
    if (!requireProOrOpenPaywall('adicionar funcionários')) return;
    if (!liveBusiness || !firebaseUser || isStaff) return;
    if (staffMembers.length >= MAX_STAFF_ACCOUNTS) {
      throw new Error('O plano Pro permite no máximo 2 funcionários além do dono.');
    }
    if (!isValidMzPhone(phone)) {
      throw new Error('Telefone inválido. Introduza telemóvel (ex: 84 123 4567), telefone fixo ou número com +indicativo.');
    }
    if (password.length < 6) {
      throw new Error('A palavra-passe do funcionário deve ter pelo menos 6 caracteres.');
    }

    const internalEmail = phoneToInternalEmail(phone);
    let staffUid = '';
    try {
      staffUid = await createStaffAuthAccount(internalEmail, password);
    } catch (error) {
      throw new Error(mapAuthErrorToPortuguese(error));
    }

    try {
      await setDoc(doc(db, 'users', staffUid), {
        uid: staffUid,
        name: name.trim().slice(0, 100),
        phone: normalizeMzPhone(phone),
        email: internalEmail,
        role: 'staff',
        businessId: liveBusiness.id,
        ownerUid: firebaseUser.uid,
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const nextMembers = Array.from(new Set([liveBusiness.ownerUid, ...liveBusiness.memberUids, staffUid])).slice(0, 3);
      await syncMemberUidsAcrossBusiness(liveBusiness.id, nextMembers, staffMembers.length + 1);
      showToast('Funcionário criado com sucesso.');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${staffUid}`);
    }
  };

  const toggleStaffActive: AppContextValue['toggleStaffActive'] = async (staffUid, active) => {
    if (!requireProOrOpenPaywall('gerir equipa') || isStaff) return;
    try {
      await updateDoc(doc(db, 'users', staffUid), {
        active,
        updatedAt: serverTimestamp(),
      });
      showToast(active ? 'Funcionário reactivado.' : 'Acesso do funcionário suspenso.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${staffUid}`);
    }
  };

  const removeStaffMember: AppContextValue['removeStaffMember'] = async (staffUid) => {
    if (!requireProOrOpenPaywall('remover funcionário') || !liveBusiness || isStaff) return;
    try {
      await deleteDoc(doc(db, 'users', staffUid));
      const nextMembers = liveBusiness.memberUids.filter((id) => id !== staffUid);
      const nextCount = Math.max(0, staffMembers.length - 1);
      await syncMemberUidsAcrossBusiness(liveBusiness.id, nextMembers, nextCount);
      showToast('Funcionário removido da equipa.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${staffUid}`);
    }
  };

  const submitProPaymentRequest: AppContextValue['submitProPaymentRequest'] = async ({
    planId,
    wallet,
    transactionCode,
    proofNote,
  }) => {
    if (!firebaseUser || !liveBusiness || !userProfile) {
      setAuthModalMode('register');
      return;
    }
    await paymentGateway.submitPayment({
      businessId: liveBusiness.id,
      ownerUid: firebaseUser.uid,
      ownerName: userProfile.name,
      ownerPhone: userProfile.phone || liveBusiness.phone,
      planId,
      wallet,
      transactionCode,
      proofNote,
      currentSubscriptionStatus: subscription?.status || 'demo',
    });
    showToast('Comprovativo enviado! Fica pendente até aprovação do administrador.');
  };

  // Admin Operations
  const approvePaymentRequest: AppContextValue['approvePaymentRequest'] = async (req) => {
    if (!isAdmin) return;
    const plan = getPlanById(req.planId);
    const existingSub = adminSubscriptions.find((s) => s.businessId === req.businessId);
    const baseMs = existingSub && existingSub.expiresAtMs > Date.now() ? existingSub.expiresAtMs : Date.now();
    const nextExpiresMs = baseMs + plan.durationDays * 24 * 3600 * 1000;

    const batch = writeBatch(db);
    batch.update(doc(db, 'paymentRequests', req.id), {
      status: 'approved',
      adminNote: 'Aprovado pelo administrador.',
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, 'subscriptions', req.businessId), {
      planId: req.planId,
      status: 'active',
      expiresAtMs: nextExpiresMs,
      updatedAt: serverTimestamp(),
    });
    try {
      await batch.commit();
      showToast(`Pagamento aprovado e Pro activado para ${req.ownerName}.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `paymentRequests/${req.id}`);
    }
  };

  const rejectPaymentRequest: AppContextValue['rejectPaymentRequest'] = async (req, reason) => {
    if (!isAdmin) return;
    const batch = writeBatch(db);
    batch.update(doc(db, 'paymentRequests', req.id), {
      status: 'rejected',
      adminNote: reason.trim() || 'Código de transacção não confirmado.',
      updatedAt: serverTimestamp(),
    });
    const existingSub = adminSubscriptions.find((s) => s.businessId === req.businessId);
    if (existingSub && existingSub.status === 'pending') {
      batch.update(doc(db, 'subscriptions', req.businessId), {
        status: existingSub.expiresAtMs > 0 && existingSub.expiresAtMs <= Date.now() ? 'expired' : 'demo',
        updatedAt: serverTimestamp(),
      });
    }
    try {
      await batch.commit();
      showToast('Pedido rejeitado.', 'warning');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `paymentRequests/${req.id}`);
    }
  };

  const manualActivatePro: AppContextValue['manualActivatePro'] = async (businessId, days, planId) => {
    if (!isAdmin) return;
    const existingSub = adminSubscriptions.find((s) => s.businessId === businessId);
    const baseMs = existingSub && existingSub.expiresAtMs > Date.now() ? existingSub.expiresAtMs : Date.now();
    const nextExpiresMs = baseMs + days * 24 * 3600 * 1000;

    try {
      await updateDoc(doc(db, 'subscriptions', businessId), {
        planId,
        status: 'active',
        expiresAtMs: nextExpiresMs,
        updatedAt: serverTimestamp(),
      });
      showToast(`Plano Pro activado/prolongado por ${days} dias.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `subscriptions/${businessId}`);
    }
  };

  const resolvePasswordReset: AppContextValue['resolvePasswordReset'] = async (requestId) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'passwordResetRequests', requestId), {
        status: 'resolved',
      });
      showToast('Pedido marcado como resolvido.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `passwordResetRequests/${requestId}`);
    }
  };

  return (
    <AppContext.Provider
      value={{
        authReady,
        firebaseUser,
        userProfile,
        isAdmin,
        isStaff,
        isDemoMode,
        isProActive,
        isExpiringSoon,
        daysUntilExpiry,
        subscriptionStatusLabel,
        showWelcomeScreen,
        setShowWelcomeScreen,
        demoPreset,
        setDemoPreset,
        activeTab,
        setActiveTab,
        subView,
        setSubView,
        paywallOpen,
        paywallReason,
        openPaywall,
        closePaywall,
        authModalMode,
        setAuthModalMode,
        enterDemoMode,
        isOnline,
        offlineQueue,
        syncingOffline,
        syncOfflineQueue,
        toast,
        showToast,
        business,
        products,
        sales,
        customers,
        debts,
        payments,
        subscription,
        paymentRequests,
        staffMembers,
        adminUsers,
        adminBusinesses,
        adminSubscriptions,
        adminPaymentRequests,
        adminPasswordResets,
        registerWithPhone,
        loginWithPhone,
        loginWithGoogle,
        requestPasswordReset,
        logout,
        requireProOrOpenPaywall,
        saveProduct,
        adjustProductStock,
        deleteProduct,
        completeSale,
        saveCustomer,
        deleteCustomer,
        recordDebtPayment,
        updateBusinessSettings,
        createStaffMember,
        toggleStaffActive,
        removeStaffMember,
        submitProPaymentRequest,
        approvePaymentRequest,
        rejectPaymentRequest,
        manualActivatePro,
        resolvePasswordReset,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
