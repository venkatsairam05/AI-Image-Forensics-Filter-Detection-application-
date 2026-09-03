import { RefreshCw, FileText, Info, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface HeaderProps {
  onReset: () => void;
  hasResult: boolean;
  onOpenMethodology: () => void;
  onExportReport?: () => void;
}

export function Header({ onReset, hasResult, onOpenMethodology, onExportReport }: HeaderProps) {
  return (
    <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-40 shadow-sm relative">
      {/* Radiant colorful top border line */}
      <div className="absolute top-0 inset-x-0 h-[2.5px] bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 animate-shimmer" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 6 }}
            whileTap={{ scale: 0.95 }}
            className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-fuchsia-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-500/30 cursor-pointer overflow-hidden group"
          >
            <span className="relative z-10 font-mono tracking-tighter">Σ</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
              className="absolute -inset-1 rounded-xl border border-white/30 pointer-events-none"
            />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 bg-clip-text text-transparent flex items-center gap-1.5">
                SENTINEL
                <span className="font-semibold text-slate-400 text-xs sm:text-sm tracking-normal">| AI FORENSICS</span>
              </h1>
              <motion.span
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 text-emerald-700 border border-emerald-300/80 shadow-2xs"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>ONLINE ENGINE</span>
              </motion.span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:flex items-center gap-1.5 font-medium">
              <span className="text-blue-600 font-semibold">Neural Artifacts</span>
              <span className="text-slate-300">•</span>
              <span className="text-purple-600 font-semibold">Error Level (ELA)</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-600 font-semibold">Sensor PRNU</span>
              <span className="text-slate-300">•</span>
              <span className="text-pink-600 font-semibold">Filter Classification</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-sm font-medium">
          <motion.button
            id="methodology-btn"
            type="button"
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenMethodology}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-indigo-600 bg-white hover:bg-indigo-50/50 border border-slate-200/90 hover:border-indigo-300 rounded-xl transition-all cursor-pointer shadow-2xs"
            title="View Forensic Methodology"
          >
            <Info className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden md:inline">Methodology</span>
          </motion.button>

          {hasResult && onExportReport && (
            <motion.button
              id="export-report-btn"
              type="button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={onExportReport}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-800 hover:text-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 rounded-xl transition-all cursor-pointer shadow-xs hover:shadow-sm"
              title="Export Forensic Report"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden md:inline">Export Dossier</span>
            </motion.button>
          )}

          {hasResult && (
            <motion.button
              id="reset-analysis-btn"
              type="button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md hover:shadow-indigo-500/25"
              title="Analyze New Image"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>New Scan</span>
            </motion.button>
          )}
        </div>
      </div>
    </header>
  );
}

