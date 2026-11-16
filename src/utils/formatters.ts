import { PaymentMethod } from '../types';

/**
 * Formata valores monetários estritamente no padrão moçambicano: "1.250,00 MT"
 */
export function formatMT(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  const fixed = safe.toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  const negative = intPart.startsWith('-');
  const digits = negative ? intPart.slice(1) : intPart;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negative ? '-' : ''}${grouped},${decPart} MT`;
}

/**
 * Normaliza telefone (moçambicano móvel/fixo ou internacional) para armazenamento limpo.
 * - Móvel MZ (ex: +258 84 123 4567 -> 841234567)
 * - Fixo MZ (ex: +258 21 490 123 -> 21490123)
 * - Internacional (ex: +27 82 123 4567 -> +27821234567)
 */
export function normalizeMzPhone(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('00258') && digits.length >= 13) {
    return digits.slice(5, 14);
  }
  if (digits.startsWith('258') && (digits.length === 11 || digits.length === 12)) {
    return digits.slice(3);
  }
  if (trimmed.startsWith('+') || digits.startsWith('00')) {
    const intl = digits.startsWith('00') ? digits.slice(2) : digits;
    return intl ? `+${intl.slice(0, 15)}` : '';
  }
  return digits.slice(0, 15);
}

/**
 * Valida telefones e números de telefone:
 * - Telemóvel moçambicano (9 dígitos: 82–87)
 * - Telefone fixo moçambicano (8 dígitos: 21–29)
 * - Outros números de telefone válidos (7 a 15 dígitos, nacionais ou internacionais com +)
 */
export function isValidMzPhone(raw: string): boolean {
  const norm = normalizeMzPhone(raw);
  if (!norm) return false;
  if (norm.startsWith('+')) {
    return /^[1-9][0-9]{6,14}$/.test(norm.slice(1));
  }
  if (/^(82|83|84|85|86|87)[0-9]{7}$/.test(norm)) return true;
  if (/^2[1-9][0-9]{6}$/.test(norm)) return true;
  return /^[0-9]{7,15}$/.test(norm);
}

export function formatPhoneDisplay(raw: string): string {
  if (!raw) return '';
  const norm = normalizeMzPhone(raw);
  if (/^(82|83|84|85|86|87)[0-9]{7}$/.test(norm)) {
    return `+258 ${norm.slice(0, 2)} ${norm.slice(2, 5)} ${norm.slice(5)}`;
  }
  if (/^2[1-9][0-9]{6}$/.test(norm)) {
    return `+258 ${norm.slice(0, 2)} ${norm.slice(2, 5)} ${norm.slice(5)}`;
  }
  if (norm.startsWith('+')) {
    return norm;
  }
  return raw;
}

/**
 * Converte número de telefone para o email interno invisível exigido pelo Firebase Auth.
 */
export function phoneToInternalEmail(rawPhone: string): string {
  const norm = normalizeMzPhone(rawPhone);
  const digitsOnly = norm.startsWith('+') ? norm.slice(1) : norm;
  const authDigits =
    !norm.startsWith('+') && (digitsOnly.length === 8 || digitsOnly.length === 9)
      ? `258${digitsOnly}`
      : digitsOnly;
  return `${authDigits}@bancafacil.app`;
}

export function formatDateTimeMz(ms: number): string {
  if (!ms) return '—';
  return new Intl.DateTimeFormat('pt-MZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ms));
}

export function formatDateMz(ms: number): string {
  if (!ms) return '—';
  return new Intl.DateTimeFormat('pt-MZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(ms));
}

export function paymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case 'dinheiro':
      return 'Dinheiro';
    case 'mpesa':
      return 'M-Pesa';
    case 'emola':
      return 'e-Mola';
    case 'mkesh':
      return 'mKesh';
    case 'credito':
      return 'A crédito';
  }
}

export function buildWhatsAppUrl(phoneRaw: string, message: string): string {
  const norm = normalizeMzPhone(phoneRaw);
  const digitsOnly = norm.startsWith('+') ? norm.slice(1) : norm;
  const full =
    !norm.startsWith('+') && (digitsOnly.length === 8 || digitsOnly.length === 9)
      ? `258${digitsOnly}`
      : digitsOnly || phoneRaw.replace(/\D/g, '');
  const encoded = encodeURIComponent(message);
  return full ? `https://wa.me/${full}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}

export function generateId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`;
}

/**
 * Comprime imagem no telemóvel para poupar dados móveis e caber no Firestore (< 120 KB).
 */
export async function compressImageToDataUrl(file: File, maxDim = 480, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível processar a imagem.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Ficheiro de imagem inválido.'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('Erro ao ler a imagem.'));
    reader.readAsDataURL(file);
  });
}

export function getTimestampMs(val: unknown, fallbackMs?: number): number {
  if (typeof fallbackMs === 'number' && fallbackMs > 0) return fallbackMs;
  if (typeof val === 'number') return val;
  if (val && typeof val === 'object' && 'toMillis' in val && typeof (val as { toMillis: () => number }).toMillis === 'function') {
    return (val as { toMillis: () => number }).toMillis();
  }
  if (val && typeof val === 'object' && 'seconds' in val && typeof (val as { seconds: number }).seconds === 'number') {
    return (val as { seconds: number }).seconds * 1000;
  }
  return Date.now();
}
