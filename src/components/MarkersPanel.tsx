import { AlertCircle, AlertTriangle, Info, Eye, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { AIMarker } from '../types';

interface MarkersPanelProps {
  markers: AIMarker[];
  selectedMarkerId: string | null;
  onSelectMarker: (id: string | null) => void;
}

export function MarkersPanel({ markers, selectedMarkerId, onSelectMarker }: MarkersPanelProps) {
  const getSeverityBadge = (severity: AIMarker['severity']) => {
    switch (severity) {
      case 'high':
        return {
          label: 'High Severity',
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          borderHover: 'hover:border-rose-400',
          cardBg: 'bg-gradient-to-r from-rose-50/40 via-white to-white',
          iconColor: 'text-rose-600',
          icon: AlertCircle,
        };
      case 'medium':
        return {
          label: 'Medium Severity',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          borderHover: 'hover:border-amber-400',
          cardBg: 'bg-gradient-to-r from-amber-50/40 via-white to-white',
          iconColor: 'text-amber-600',
          icon: AlertTriangle,
        };
      case 'low':
      default:
        return {
          label: 'Minor Artifact',
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          borderHover: 'hover:border-indigo-400',
          cardBg: 'bg-gradient-to-r from-indigo-50/40 via-white to-white',
          iconColor: 'text-indigo-600',
          icon: Info,
        };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-lg space-y-4"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-pink-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              AI Generation Markers
            </h3>
            <p className="text-[11px] text-slate-400">Localized synthesis artifacts and perceptual cues</p>
          </div>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 font-mono font-extrabold flex items-center gap-1.5 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          {markers.length} Detected
        </span>
      </div>

      {markers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 text-center bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-emerald-50/70 border border-emerald-200/90 rounded-2xl space-y-2 shadow-xs"
        >
          <motion.div
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-500/25"
          >
            <CheckCircle2 className="w-6 h-6" />
          </motion.div>
          <h4 className="text-sm font-black text-emerald-950">No AI Synthesis Markers Found</h4>
          <p className="text-xs text-emerald-700 max-w-sm mx-auto leading-relaxed">
            Surface textures, iris patterns, specular highlights, and edge transitions match authentic optical camera photography.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
          {markers.map((marker, idx) => {
            const isSelected = selectedMarkerId === marker.id;
            const badge = getSeverityBadge(marker.severity);
            const SeverityIcon = badge.icon;

            return (
              <motion.div
                key={marker.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.015, x: 3 }}
                onClick={() => onSelectMarker(isSelected ? null : marker.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left shadow-xs ${
                  isSelected
                    ? 'bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-purple-50/60 border-indigo-500 shadow-md ring-2 ring-indigo-500/30'
                    : `${badge.cardBg} border-slate-200/90 ${badge.borderHover}`
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {marker.name}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200 shadow-2xs font-bold">
                      {marker.category}
                    </span>
                  </div>

                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-2xs ${badge.bg}`}>
                    <SeverityIcon className="w-3 h-3" />
                    {badge.label}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-2.5 font-normal">
                  {marker.description}
                </p>

                <div className="bg-white/90 border border-slate-200/90 rounded-xl p-3 text-[11px] text-slate-700 leading-normal flex items-start gap-2 shadow-2xs">
                  <span className="font-extrabold text-indigo-600 shrink-0 uppercase tracking-wider text-[10px]">Evidence:</span>
                  <span className="font-medium">{marker.evidence}</span>
                </div>

                {marker.boundingZone && (
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-indigo-600 font-bold">
                    <span className="flex items-center gap-1.5 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                      <Eye className="w-3.5 h-3.5" />
                      Pinned to canvas HUD overlay
                    </span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-90 text-indigo-600' : 'text-slate-400'}`} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

