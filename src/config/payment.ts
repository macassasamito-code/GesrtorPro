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
    phoneNumber: '84 65 68 561',
    number: '84 65 68 561',
    accountName: 'Samito Mateus Samussene Macassa',
    ussdCode: '*150#',
    instructionMessage:
      'Transfira o valor do plano para o número M-Pesa indicado acima e cole abaixo o código da transacção ou toda a mensagem SMS de confirmação recebida.',
    instructions: [
      'Marque *150# no seu telemóvel Vodacom ou abra a aplicação M-Pesa.',
      'Escolha "Transferir dinheiro" e introduza o número 84 65 68 561.',
      'Confirme o nome do titular (Samito Mateus Samussene Macassa) e o valor do plano escolhido.',
      'Copie o código da transacção ou toda a mensagem SMS de confirmação, cole no campo abaixo e toque em "Enviar Comprovativo".',
    ],
  },
  {
    id: 'emola',
    title: 'Pagamento por e-Mola (Movitel)',
    name: 'e-Mola',
    phoneNumber: '87 65 68 561',
    number: '87 65 68 561',
    accountName: 'Samito Mateus Samussene Macassa',
    ussdCode: '*898#',
    instructionMessage:
      'Transfira o valor do plano para a conta e-Mola indicada acima e cole abaixo o código da transacção ou toda a mensagem SMS de confirmação recebida.',
    instructions: [
      'Marque *898# no seu telemóvel Movitel ou abra a aplicação e-Mola.',
      'Seleccione "Transferir" e escreva o número 87 65 68 561.',
      'Verifique o nome (Samito Mateus Samussene Macassa), o valor do plano e confirme com o seu PIN.',
      'Cole abaixo o código de confirmação ou a mensagem SMS completa recebida e toque em "Enviar Comprovativo".',
    ],
  },
  {
    id: 'mkesh',
    title: 'Pagamento por mKesh (Tmcel)',
    name: 'mKesh',
    phoneNumber: '83 49 56 882',
    number: '83 49 56 882',
    accountName: 'Samito Mateus Samussene Macassa',
    ussdCode: '*400#',
    instructionMessage:
      'Efectue a transferência mKesh para o número indicado acima e cole abaixo o código da transacção ou toda a mensagem SMS de confirmação recebida.',
    instructions: [
      'Marque *400# no seu telemóvel Tmcel.',
      'Escolha a opção "Transferência" e indique o número 83 49 56 882.',
      'Confirme o nome do titular (Samito Mateus Samussene Macassa), introduza o valor exacto do plano e confirme a operação.',
      'Cole abaixo o código da transacção ou a mensagem SMS completa recebida e toque em "Enviar Comprovativo".',
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
