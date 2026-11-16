import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = true,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0F1F16]/50 dark:bg-black/75 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#121F18] p-6 shadow-xl border border-[#E2E8E4] dark:border-[#23382C]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                danger
                  ? 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400'
                  : 'bg-[#FEF9C3] dark:bg-[#2A230D] text-[#854D0E] dark:text-[#FACC15]'
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0F1F16] dark:text-[#F1F5F2]">{title}</h3>
              <p className="mt-1 text-sm text-[#4B5E53] dark:text-[#8FA598] leading-relaxed">{message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Fechar"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#4B5E53] dark:text-[#8FA598] hover:bg-[#F1F5F2] dark:hover:bg-[#182920]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[48px] rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#182920] px-4 py-2.5 text-sm font-semibold text-[#0F1F16] dark:text-[#F1F5F2] hover:bg-[#F6F8F6] dark:hover:bg-[#1E3327] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`min-h-[48px] rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors ${
              danger
                ? 'bg-red-700 hover:bg-red-800'
                : 'bg-[#15803D] hover:bg-[#166534]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
