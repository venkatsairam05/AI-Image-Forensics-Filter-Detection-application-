import { Sliders, CheckCircle2, XCircle, Sparkles, Wand2, Eye, Sun, Aperture } from 'lucide-react';
import { motion } from 'motion/react';
import { FilterDetection } from '../types';

interface FilterDetectionPanelProps {
  filters: FilterDetection[];
}

export function FilterDetectionPanel({ filters }: FilterDetectionPanelProps) {
  const getFilterIcon = (type: FilterDetection['type']) => {
    switch (type) {
      case 'beauty_smoothing':
        return Wand2;
      case 'saturation_color':
        return Sun;
      case 'bokeh_blur':
        return Aperture;
      case 'sharpening':
        return Sparkles;
      default:
        return Sliders;
    }
  };

  const detectedCount = filters.filter((f) => f.detected).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-lg space-y-4"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Filter & Retouching Diagnostics
            </h3>
            <p className="text-[11px] text-slate-400">Beauty smoothing, color grading, frequency sharpening & blur</p>
          </div>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 font-mono font-extrabold flex items-center gap-1.5 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
          {detectedCount} Active / {filters.length} Analyzed
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
        {filters.map((filter, idx) => {
          const Icon = getFilterIcon(filter.type);
          const isDetected = filter.detected;

          return (
            <motion.div
              key={filter.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -3, scale: 1.015 }}
              className={`p-4 rounded-2xl border transition-all shadow-xs ${
                isDetected
                  ? 'bg-gradient-to-br from-purple-50/70 via-fuchsia-50/30 to-indigo-50/50 border-purple-300 shadow-md shadow-purple-500/10'
                  : 'bg-slate-50/70 border-slate-200/80 opacity-85 hover:opacity-100'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-sm ${
                      isDetected
                        ? 'bg-gradient-to-tr from-purple-600 to-fuchsia-500 text-white shadow-purple-500/30'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                      {filter.name}
                    </h4>
                    <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">
                      {filter.estimatedIntensity}
                    </span>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full border shadow-2xs ${
                    isDetected
                      ? 'bg-purple-100 text-purple-800 border-purple-300'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {isDetected ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-purple-600" />
                      Detected ({filter.confidence}%)
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 text-slate-400" />
                      Not Detected
                    </>
                  )}
                </span>
              </div>

              {/* Intensity progress bar */}
              <div className="space-y-1 mb-2.5">
                <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden relative border border-slate-200">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${filter.confidence}%` }}
                    transition={{ duration: 0.9, delay: 0.1 + idx * 0.05, ease: "easeOut" }}
                    className={`h-full rounded-full relative overflow-hidden ${
                      isDetected
                        ? 'bg-gradient-to-r from-purple-600 via-fuchsia-500 to-indigo-600'
                        : 'bg-slate-300'
                    }`}
                  >
                    {isDetected && <div className="absolute inset-0 bg-white/30 animate-shimmer" />}
                  </motion.div>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                {filter.details}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

