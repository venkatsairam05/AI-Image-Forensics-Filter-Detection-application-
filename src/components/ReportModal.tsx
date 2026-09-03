import { useState } from 'react';
import { X, Download, Copy, Check, ShieldCheck, ShieldAlert, FileText, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ForensicResult } from '../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ForensicResult;
}

export function ReportModal({ isOpen, onClose, result }: ReportModalProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    const text = JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forensics_dossier_${result.imageInfo.filename.replace(/\.[^/.]+$/, '')}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Animated backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white/95 backdrop-blur-xl border border-slate-200/90 w-full max-w-3xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar z-10"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Forensic Investigation Certificate
                  </h3>
                  <p className="text-xs text-slate-400">
                    Official analysis dossier generated on {new Date(result.analyzedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Certificate Card */}
            <div className="bg-gradient-to-br from-slate-50/90 via-white to-slate-50/90 border border-slate-200/90 rounded-2xl p-6 space-y-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Target File
                  </span>
                  <span className="text-sm font-bold text-slate-900 font-mono">
                    {result.imageInfo.filename}
                  </span>
                  <span className="text-xs text-slate-500 block mt-0.5 font-medium">
                    {result.imageInfo.dimensions.width}×{result.imageInfo.dimensions.height} px • {(result.imageInfo.fileSizeBytes / 1024).toFixed(1)} KB
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Forensic Verdict
                  </span>
                  <span className={`text-lg font-black block tracking-tight ${
                    result.verdict === 'AI_GENERATED' ? 'text-rose-600' : result.verdict === 'AUTHENTIC' ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {result.verdict.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-mono text-indigo-600 font-black">
                    AI Likelihood: {result.overallScore}% ({result.verdictConfidence}% Conf.)
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <span className="font-extrabold text-slate-900">Executive Summary:</span>
                <p className="text-slate-700 leading-relaxed bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs font-normal">
                  {result.verdictSummary}
                </p>
              </div>

              {/* Colorful Scores Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                <div className="bg-gradient-to-br from-rose-50/80 to-red-50/50 p-3.5 rounded-2xl border border-rose-200 shadow-2xs">
                  <span className="text-[10px] text-rose-700 font-bold block mb-1">AI Probability</span>
                  <span className="text-xl font-black text-rose-600 font-mono">
                    {result.scoresBreakdown.aiProbability}%
                  </span>
                </div>
                <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/50 p-3.5 rounded-2xl border border-emerald-200 shadow-2xs">
                  <span className="text-[10px] text-emerald-700 font-bold block mb-1">Authenticity</span>
                  <span className="text-xl font-black text-emerald-600 font-mono">
                    {result.scoresBreakdown.authenticityConfidence}%
                  </span>
                </div>
                <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/50 p-3.5 rounded-2xl border border-amber-200 shadow-2xs">
                  <span className="text-[10px] text-amber-700 font-bold block mb-1">Manipulation</span>
                  <span className="text-xl font-black text-amber-600 font-mono">
                    {result.scoresBreakdown.manipulationConfidence}%
                  </span>
                </div>
                <div className="bg-gradient-to-br from-purple-50/80 to-fuchsia-50/50 p-3.5 rounded-2xl border border-purple-200 shadow-2xs">
                  <span className="text-[10px] text-purple-700 font-bold block mb-1">Filter Grading</span>
                  <span className="text-xl font-black text-purple-600 font-mono">
                    {result.scoresBreakdown.filterConfidence}%
                  </span>
                </div>
              </div>

              {/* Markers summary */}
              <div className="space-y-2 text-xs">
                <span className="font-extrabold text-slate-900">Detected Forensic Markers ({result.aiMarkers.length}):</span>
                <ul className="space-y-1.5 pl-1">
                  {result.aiMarkers.map((m, idx) => (
                    <li key={idx} className="text-slate-600 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0 mt-1.5" />
                      <span>
                        <strong className="text-slate-900 font-bold">{m.name}</strong> ({m.severity}): {m.description}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={copyToClipboard}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied JSON Dossier' : 'Copy JSON'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-indigo-600 bg-white border border-slate-200 hover:bg-indigo-50/50 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-indigo-600" />
                  <span>Print Dossier</span>
                </button>
                <button
                  type="button"
                  onClick={downloadJson}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-black text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-500/25"
                >
                  <Download className="w-4 h-4" />
                  <span>Download JSON Dossier</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

