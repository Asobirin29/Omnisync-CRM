import React from 'react';
import {
  FlaskConical,
  Play,
  Square,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

interface SimulationLabHeaderProps {
  isAutoSimulating: boolean;
  onToggleAutoSim: () => void;
  onOpenResetConfirm: () => void;
  resetSuccessMessage: string;
}

export const SimulationLabHeader: React.FC<SimulationLabHeaderProps> = ({
  isAutoSimulating,
  onToggleAutoSim,
  onOpenResetConfirm,
  resetSuccessMessage,
}) => {
  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/50 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-10 -top-10 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <FlaskConical className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">OmniSync Simulation Lab</h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Tahap 5
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Testbed simulasi omnichannel untuk membangkitkan transaksi e-commerce (Shopee, Tokopedia, Lazada, Blibli) dan pesan WhatsApp secara instan. Uji latensi sinkronisasi stok riil lintas channel dalam satuan milidetik.
          </p>
        </div>

        {/* Action buttons: Auto Simulation & Reset Demo */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Auto Sim Toggle */}
          <button
            onClick={onToggleAutoSim}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-lg cursor-pointer ${
              isAutoSimulating
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25 animate-pulse'
                : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black shadow-emerald-500/25'
            }`}
          >
            {isAutoSimulating ? (
              <>
                <Square className="w-4 h-4 fill-white" />
                <span>Hentikan Auto Simulation</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Mulai Auto Simulation (5-10s)</span>
              </>
            )}
          </button>

          {/* Reset Demo Data Button */}
          <button
            onClick={onOpenResetConfirm}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl font-semibold text-xs sm:text-sm bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Reset Data Demo</span>
          </button>
        </div>
      </div>

      {/* Status notification when Auto-Sim is running */}
      {isAutoSimulating && (
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold">
              Auto Simulation aktif: Event acak (pesanan & chat) dibangkitkan otomatis tiap ~6-8 detik.
            </span>
          </div>
          <span className="hidden sm:inline font-mono text-[11px] text-slate-400">
            Sinkronisasi real-time via Socket.io
          </span>
        </div>
      )}

      {/* Reset success feedback */}
      {resetSuccessMessage && (
        <div className="mt-4 p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{resetSuccessMessage}</span>
        </div>
      )}
    </div>
  );
};
