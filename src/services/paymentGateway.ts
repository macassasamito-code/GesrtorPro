import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { getPlanById } from '../config/plans';
import { PaymentRequest, PlanId, SubscriptionStatus, WalletProvider } from '../types';
import { generateId } from '../utils/formatters';
import { db, handleFirestoreError, OperationType } from './firebase';

export interface SubmitPaymentInput {
  businessId: string;
  ownerUid: string;
  ownerName: string;
  ownerPhone: string;
  planId: Exclude<PlanId, 'free'>;
  wallet: WalletProvider;
  transactionCode: string;
  proofNote: string;
  currentSubscriptionStatus: SubscriptionStatus;
}

export interface PaymentGatewayAdapter {
  readonly mode: 'manual' | 'api';
  submitPayment(input: SubmitPaymentInput): Promise<PaymentRequest>;
}

/**
 * Implementação manual v1 para M-Pesa, e-Mola e mKesh.
 * Estruturada para futura substituição directa por chamadas às APIs oficiais.
 */
class ManualMobileWalletAdapter implements PaymentGatewayAdapter {
  readonly mode = 'manual' as const;

  async submitPayment(input: SubmitPaymentInput): Promise<PaymentRequest> {
    const plan = getPlanById(input.planId);
    const requestId = generateId('payreq');
    const cleanCode = input.transactionCode.trim().toUpperCase();
    const cleanNote = input.proofNote.trim();

    const payload: PaymentRequest = {
      id: requestId,
      businessId: input.businessId,
      ownerUid: input.ownerUid,
      ownerName: input.ownerName.trim() || 'Comerciante',
      ownerPhone: input.ownerPhone.trim(),
      planId: input.planId,
      amount: plan.priceMt,
      wallet: input.wallet,
      transactionCode: cleanCode,
      proofNote: cleanNote,
      status: 'pending',
      adminNote: '',
      createdAtMs: Date.now(),
    };

    const batch = writeBatch(db);
    batch.set(doc(db, 'paymentRequests', requestId), {
      id: payload.id,
      businessId: payload.businessId,
      ownerUid: payload.ownerUid,
      ownerName: payload.ownerName,
      ownerPhone: payload.ownerPhone,
      planId: payload.planId,
      amount: payload.amount,
      wallet: payload.wallet,
      transactionCode: payload.transactionCode,
      proofNote: payload.proofNote,
      status: 'pending',
      adminNote: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (input.currentSubscriptionStatus !== 'active') {
      batch.update(doc(db, 'subscriptions', input.businessId), {
        planId: input.planId,
        status: 'pending',
        updatedAt: serverTimestamp(),
      });
    }

    try {
      await batch.commit();
      return payload;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `paymentRequests/${requestId}`);
    }
  }
}

export const paymentGateway: PaymentGatewayAdapter = new ManualMobileWalletAdapter();
