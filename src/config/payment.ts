import { WalletProvider } from '../types';

export interface WalletPaymentMethod {
  id: WalletProvider;
  title: string;
  name: string;
  phoneNumber: string;
  number: string;
  accountName: string;
  ussdCode: string;
  instructionMessage: string;
  instructions: string[];
}

export type WalletPaymentInstruction = WalletPaymentMethod;

export const PAYMENT_METHODS: WalletPaymentMethod[] = [
  {
    id: 'mpesa',
    title: 'Pagamento por M-Pesa (Vodacom)',
    name: 'M-Pesa',
    phoneNumber: '84 000 0000',
    number: '84 000 0000',
    accountName: 'GestorPro Lda',
    ussdCode: '*150#',
    instructionMessage:
      'Transfira o valor do plano para o número M-Pesa indicado acima e cole abaixo o código de confirmação recebido por SMS para submeter o comprovativo.',
    instructions: [
      'Marque *150# no seu telemóvel Vodacom ou abra a aplicação M-Pesa.',
      'Escolha "Transferir dinheiro" e introduza o número 84 000 0000.',
      'Confirme o nome do titular (GestorPro Lda) e o valor do plano escolhido.',
      'Copie o código da transacção recebido por SMS, cole no campo abaixo e toque em "Enviar Comprovativo".',
    ],
  },
  {
    id: 'emola',
    title: 'Pagamento por e-Mola (Movitel)',
    name: 'e-Mola',
    phoneNumber: '86 000 0000',
    number: '86 000 0000',
    accountName: 'GestorPro Lda',
    ussdCode: '*898#',
    instructionMessage:
      'Transfira o valor do plano para a conta e-Mola indicada acima e insira o código da transacção recebido por SMS para submeter o comprovativo.',
    instructions: [
      'Marque *898# no seu telemóvel Movitel ou abra a aplicação e-Mola.',
      'Seleccione "Transferir" e escreva o número 86 000 0000.',
      'Verifique o nome (GestorPro Lda), o valor do plano e confirme com o seu PIN.',
      'Insira abaixo o código de confirmação recebido por SMS e toque em "Enviar Comprovativo".',
    ],
  },
  {
    id: 'mkesh',
    title: 'Pagamento por mKesh (Tmcel)',
    name: 'mKesh',
    phoneNumber: '82 000 0000',
    number: '82 000 0000',
    accountName: 'GestorPro Lda',
    ussdCode: '*400#',
    instructionMessage:
      'Efectue a transferência mKesh para o número indicado acima e registe abaixo o código de confirmação recebido por SMS para submeter o comprovativo.',
    instructions: [
      'Marque *400# no seu telemóvel Tmcel.',
      'Escolha a opção "Transferência" e indique o número 82 000 0000.',
      'Introduza o valor exacto do plano e confirme a operação.',
      'Registe abaixo o código da transacção recebido por SMS e toque em "Enviar Comprovativo".',
    ],
  },
];

export const PAYMENT_INSTRUCTIONS: Record<WalletProvider, WalletPaymentMethod> = {
  mpesa: PAYMENT_METHODS[0],
  emola: PAYMENT_METHODS[1],
  mkesh: PAYMENT_METHODS[2],
};

export const MOBILE_WALLETS: WalletPaymentMethod[] = PAYMENT_METHODS;

export function getWalletInstruction(wallet: WalletProvider): WalletPaymentMethod {
  return PAYMENT_METHODS.find((m) => m.id === wallet) ?? PAYMENT_METHODS[0];
}
