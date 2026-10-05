import React from 'react';
import type { Platform } from '../../types';
import { getPlatformConfig } from '../../utils/formatters';
import { Terminal } from 'lucide-react';

interface SimLogEntry {
  id: number;
  time: string;
  type: string;
  platform: string;
  detail: string;
  latency_ms: number;
  status: number;
}

interface SimulationLogViewerProps {
  logs: SimLogEntry[];
  onClearLogs: () => void;
}

export const SimulationLogViewer: React.FC<SimulationLogViewerProps> = ({
  logs,
  onClearLogs,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Live Simulation Activity Log</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aliran event simulasi yang dibangkitkan oleh Auto Simulation engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <button
              onClick={onClearLogs}
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Bersihkan Log
            </button>
          )}
          <span className="text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">
            {logs.length} Events
          </span>
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
            Belum ada aktivitas simulasi. Klik tombol <strong>"Mulai Auto Simulation"</strong> di atas untuk melihat event pesanan dan pesan masuk secara acak tiap 5-10 detik.
          </div>
        ) : (
          logs.map((log) => {
            const pConfig = getPlatformConfig(log.platform as Platform);
            return (
              <div key={log.id} className="p-3 sm:px-5 flex items-center justify-between text-xs hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">{log.time}</span>
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                      log.type === 'ORDER'
                        ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                        : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    }`}
                  >
                    {log.type}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${pConfig.badgeBg}`}>
                    {pConfig.name}
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-xs sm:max-w-md">
                    {log.detail}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono text-[11px] font-bold ${
                      log.latency_ms < 2000 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {log.latency_ms} ms
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      log.status === 201 || log.status === 200
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    {log.status}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
