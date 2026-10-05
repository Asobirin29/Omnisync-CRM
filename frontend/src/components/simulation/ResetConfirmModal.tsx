import React from 'react';
import { AlertTriangle, RotateCcw, RefreshCw } from 'lucide-react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  isResetting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  isResetting,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Reset Seluruh Data Demo?</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Tindakan ini akan mengembalikan seluruh database ke seed awal Rancaekek Supply Co.:
          </p>
          <ul className="text-xs text-slate-600 dark:text-slate-300 list-disc list-inside space-y-1 pt-1">
            <li>Stok varian produk dikembalikan ke angka awal</li>
            <li>Chat uji coba dan pesanan baru akan dibersihkan</li>
            <li>Tag pelanggan otomatis dievaluasi ulang</li>
          </ul>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isResetting}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isResetting}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer"
          >
            {isResetting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Mereset Database...</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ya, Reset Data Demo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
