import { useState } from 'react';
import { BarChart2, AlertTriangle, CheckCircle } from 'lucide-react';
import { HistogramData } from '../utils/forensicsCanvas';

interface HistogramCardProps {
  histogram: HistogramData | null;
  className?: string;
}

export function HistogramCard({ histogram, className = '' }: HistogramCardProps) {
  const [activeChannel, setActiveChannel] = useState<'all' | 'lum' | 'r' | 'g' | 'b'>('all');

  if (!histogram) {
    return null;
  }

  // Find max value to normalize svg path height
  const maxVal = Math.max(
    ...histogram.lum,
    ...histogram.r,
    ...histogram.g,
    ...histogram.b,
    1
  );

  const makePath = (bins: number[]) => {
    const points = bins.map((val, idx) => {
      const x = (idx / 255) * 256;
      // Clamp height to 60px
      const y = 60 - (val / maxVal) * 56;
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    });
    return points.join(' ');
  };

  const isHighClipping = histogram.highlightClippingPct > 3.0;
  const isShadowClipping = histogram.shadowClippingPct > 3.0;

  return (
    <div className={`bg-white/95 border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-xs">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Photometric Tone & Histogram Spectrum
            </h4>
            <p className="text-[11px] text-slate-400">256-level optical luminance distribution & dynamic range</p>
          </div>
        </div>

        {/* Channel selector buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-[10px] font-bold">
          {(['all', 'lum', 'r', 'g', 'b'] as const).map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => setActiveChannel(ch)}
              className={`px-2 py-0.5 rounded-lg capitalize transition-all cursor-pointer ${
                activeChannel === ch
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {ch === 'all' ? 'All' : ch === 'lum' ? 'Lum' : ch.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Canvas Plot */}
      <div className="relative h-20 bg-slate-950 rounded-xl overflow-hidden p-2 flex items-end">
        {/* Subtle grid lines */}
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-2 opacity-15 pointer-events-none">
          <div className="border-r border-b border-slate-400" />
          <div className="border-r border-b border-slate-400" />
          <div className="border-r border-b border-slate-400" />
          <div className="border-b border-slate-400" />
          <div className="border-r border-slate-400" />
          <div className="border-r border-slate-400" />
          <div className="border-r border-slate-400" />
          <div />
        </div>

        <svg viewBox="0 0 256 60" className="w-full h-full overflow-visible preserve-3d" preserveAspectRatio="none">
          {(activeChannel === 'all' || activeChannel === 'r') && (
            <path
              d={makePath(histogram.r)}
              fill="none"
              stroke="#ef4444"
              strokeWidth="1.5"
              strokeOpacity={activeChannel === 'r' ? 1 : 0.65}
            />
          )}
          {(activeChannel === 'all' || activeChannel === 'g') && (
            <path
              d={makePath(histogram.g)}
              fill="none"
              stroke="#10b981"
              strokeWidth="1.5"
              strokeOpacity={activeChannel === 'g' ? 1 : 0.65}
            />
          )}
          {(activeChannel === 'all' || activeChannel === 'b') && (
            <path
              d={makePath(histogram.b)}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1.5"
              strokeOpacity={activeChannel === 'b' ? 1 : 0.65}
            />
          )}
          {(activeChannel === 'all' || activeChannel === 'lum') && (
            <path
              d={makePath(histogram.lum)}
              fill="none"
              stroke="#f8fafc"
              strokeWidth="1.8"
              strokeOpacity={activeChannel === 'lum' ? 1 : 0.85}
            />
          )}
        </svg>

        <div className="absolute bottom-1 left-2 text-[9px] font-mono text-slate-500">0 (Shadows)</div>
        <div className="absolute bottom-1 right-2 text-[9px] font-mono text-slate-500">255 (Highlights)</div>
      </div>

      {/* Clipping Diagnostics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between text-[11px] mb-0.5">
            <span className="text-slate-500 font-semibold">Shadow Crush</span>
            {isShadowClipping ? (
              <span className="text-amber-600 font-bold flex items-center gap-0.5">
                <AlertTriangle className="w-3 h-3" /> Clipped
              </span>
            ) : (
              <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                <CheckCircle className="w-3 h-3" /> Nominal
              </span>
            )}
          </div>
          <span className="text-xs font-mono font-bold text-slate-800">
            {histogram.shadowClippingPct}% (&lt;5 L)
          </span>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between text-[11px] mb-0.5">
            <span className="text-slate-500 font-semibold">Highlight Burn</span>
            {isHighClipping ? (
              <span className="text-amber-600 font-bold flex items-center gap-0.5">
                <AlertTriangle className="w-3 h-3" /> Blown Out
              </span>
            ) : (
              <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                <CheckCircle className="w-3 h-3" /> Nominal
              </span>
            )}
          </div>
          <span className="text-xs font-mono font-bold text-slate-800">
            {histogram.highlightClippingPct}% (&gt;250 L)
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
          <span className="text-slate-500 font-semibold text-[11px] block mb-0.5">Tone Grading</span>
          <span className="text-xs font-bold text-indigo-700 block truncate">
            {isHighClipping && isShadowClipping
              ? 'High-Contrast S-Curve (Processed)'
              : isHighClipping
              ? 'Overexposed / Retouched Skin'
              : 'Linear / Natural Dynamic Range'}
          </span>
        </div>
      </div>
    </div>
  );
}
