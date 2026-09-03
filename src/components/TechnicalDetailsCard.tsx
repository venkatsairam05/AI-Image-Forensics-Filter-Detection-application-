import { Binary, ShieldCheck, FileSearch, Lightbulb, Camera, Cpu } from 'lucide-react';
import { motion } from 'motion/react';
import { TechnicalMetrics, ForensicResult } from '../types';

interface TechnicalDetailsCardProps {
  metrics: TechnicalMetrics;
  imageInfo: ForensicResult['imageInfo'];
}

export function TechnicalDetailsCard({ metrics, imageInfo }: TechnicalDetailsCardProps) {
  const cards = [
    {
      title: 'Error Level (ELA) Signature',
      icon: Cpu,
      content: metrics.elaDiscrepancy,
      accent: 'from-blue-500 to-indigo-600',
      iconBg: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      title: 'Sensor Noise & PRNU Consistency',
      icon: Camera,
      content: metrics.noiseConsistency,
      accent: 'from-teal-500 to-emerald-600',
      iconBg: 'bg-teal-50 text-teal-600 border-teal-200',
    },
    {
      title: 'Frequency Domain & Deconvolution',
      icon: Binary,
      content: metrics.frequencyArtifacts,
      accent: 'from-purple-500 to-indigo-600',
      iconBg: 'bg-purple-50 text-purple-600 border-purple-200',
    },
    {
      title: 'Lighting & Specular Coherence',
      icon: Lightbulb,
      content: metrics.chromaticLighting,
      accent: 'from-amber-500 to-orange-600',
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-lg space-y-5"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Binary className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Technical Forensics Dossier
            </h3>
            <p className="text-[11px] text-slate-400">Mathematical & spectral telemetry verification</p>
          </div>
        </div>
        <span className="text-xs text-slate-700 font-mono font-bold bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/90 shadow-2xs">
          {imageInfo.dimensions.width}×{imageInfo.dimensions.height}px • {(imageInfo.fileSizeBytes / 1024).toFixed(1)} KB
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              whileHover={{ y: -3, scale: 1.015 }}
              className="bg-gradient-to-br from-slate-50/90 via-white to-slate-50/70 hover:from-white hover:to-indigo-50/30 border border-slate-200/90 hover:border-indigo-300 p-4.5 rounded-2xl space-y-2 transition-all shadow-xs"
            >
              <div className="flex items-center gap-2.5 font-bold text-slate-900">
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center border shadow-2xs ${card.iconBg}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs sm:text-sm font-bold">{card.title}</span>
              </div>
              <p className="text-slate-600 leading-relaxed pl-9 font-normal">
                {card.content}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Metadata & EXIF Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        whileHover={{ scale: 1.01 }}
        className="bg-gradient-to-r from-slate-50/90 via-white to-slate-50/90 border border-slate-200/90 p-4.5 rounded-2xl space-y-2 shadow-xs"
      >
        <div className="flex items-center justify-between text-xs font-bold text-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shadow-2xs">
              <FileSearch className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs sm:text-sm font-bold">Metadata & Header Inspection</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-mono font-extrabold border shadow-2xs ${
            metrics.metadataInspection.hasExif
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : 'bg-amber-100 text-amber-800 border-amber-300'
          }`}>
            {metrics.metadataInspection.hasExif ? 'EXIF Preserved' : 'EXIF Stripped / Synthetic'}
          </span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed pl-9.5 font-normal">
          {metrics.metadataInspection.notes}
        </p>
      </motion.div>

      {/* Recommendations */}
      {metrics.recommendations && metrics.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-indigo-50/80 via-blue-50/60 to-purple-50/60 border border-indigo-200/90 p-5 rounded-2xl space-y-2.5 shadow-sm"
        >
          <span className="text-xs uppercase tracking-wider font-black text-indigo-950 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            Forensic Analyst Directives & Verification
          </span>
          <ul className="space-y-2 text-xs text-slate-700">
            {metrics.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0 mt-1.5" />
                <span className="font-medium leading-relaxed">{rec}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </motion.div>
  );
}

