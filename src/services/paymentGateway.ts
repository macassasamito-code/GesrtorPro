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

export interface ParsedTransactionProof {
  transactionCode: string;
  proofNote: string;
  isFullSms: boolean;
  extractedCode: string | null;
}

const TRANSACTION_CODE_BLACKLIST = /^(?:MZN|MT|SMS|PIN|ID|REF|COD|CODIGO|M-PESA|MPESA|EMOLA|E-MOLA|MKESH|M-KESH|VODACOM|MOVITEL|TMCEL)$/i;

export function extractTransactionCodeFromSms(smsText: string): string | null {
  const normalized = smsText.trim();
  if (!normalized) return null;

  // 1. Padrão clássico M-Pesa / e-Mola com pontos (ex: PP240519.1234.A89012 ou CI250112.1430.B12345)
  const dottedMatch = normalized.match(/\b([A-Z0-9]{2,5}\d{4,8}\.\d{3,5}\.[A-Z0-9]{3,12})\b/i);
  if (dottedMatch?.[1]) {
    return dottedMatch[1].toUpperCase();
  }

  // 2. Padrão explícito com etiqueta (ex: "ID da transaccao: 12345678", "Ref: MK998811", "Código: AB1234")
  const labeledMatch = normalized.match(
    /(?:id(?:\s+(?:da\s+)?transa[cç][aã]o)?|transa[cç][aã]o(?:\s+id)?|ref(?:er[eê]ncia)?|c[oó]d(?:igo)?(?:\s+(?:da\s+)?transa[cç][aã]o)?|txid|comprovativo)\s*[:#=\-]?\s*([A-Z0-9][A-Z0-9.\-_]{3,39})/i
  );
  if (labeledMatch?.[1] && !TRANSACTION_CODE_BLACKLIST.test(labeledMatch[1])) {
    return labeledMatch[1].replace(/[.,;!?]+$/, '').toUpperCase();
  }

  // 3. Token alfanumérico misto (letras + dígitos) que não seja valor em MT/MZN nem hora/data
  const tokens = normalized.split(/\s+/);
  for (const rawToken of tokens) {
    const token = rawToken.replace(/^[("'[]+|[)"'\].,;!?]+$/g, '');
    if (
      token.length >= 6 &&
      token.length <= 40 &&
      /[A-Z]/i.test(token) &&
      /\d/.test(token) &&
      !/^\d+(?:[.,]\d+)?(?:MT|MZN)$/i.test(token) &&
      !/^\d{1,2}[:h]\d{2}$/i.test(token) &&
      !TRANSACTION_CODE_BLACKLIST.test(token)
    ) {
      return token.toUpperCase();
    }
  }

  return null;
}

export function parseTransactionProof(rawInput: string, extraNote = ''): ParsedTransactionProof {
  const trimmed = rawInput.trim();
  const cleanExtra = extraNote.trim();
  const isFullSms = /\s/.test(trimmed) || trimmed.length > 35;

  if (!isFullSms) {
    return {
      transactionCode: trimmed.slice(0, 500).toUpperCase(),
      proofNote: cleanExtra.slice(0, 1200),
      isFullSms: false,
      extractedCode: trimmed ? trimmed.slice(0, 500).toUpperCase() : null,
    };
  }

  const extractedCode = extractTransactionCodeFromSms(trimmed);
  const transactionCode = (extractedCode || trimmed).slice(0, 500);
  const smsBlock = `SMS: ${trimmed}`;
  const combinedProof = cleanExtra ? `${smsBlock}\nNota: ${cleanExtra}` : smsBlock;

  return {
    transactionCode,
    proofNote: combinedProof.slice(0, 1200),
    isFullSms: true,
    extractedCode,
  };
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
    const parsed = parseTransactionProof(input.transactionCode, input.proofNote);

    const payload: PaymentRequest = {
      id: requestId,
      businessId: input.businessId,
      ownerUid: input.ownerUid,
      ownerName: input.ownerName.trim() || 'Comerciante',
      ownerPhone: input.ownerPhone.trim(),
      planId: input.planId,
      amount: plan.priceMt,
      wallet: input.wallet,
      transactionCode: parsed.transactionCode,
      proofNote: parsed.proofNote,
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
