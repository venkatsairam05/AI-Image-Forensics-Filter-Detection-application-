import { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Filter, AlertTriangle, Cpu, Camera, Sliders, Sparkles, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { ForensicResult } from '../types';

interface ConfidenceGaugeProps {
  result: ForensicResult;
}

export function ConfidenceGauge({ result }: ConfidenceGaugeProps) {
  const { overallScore, verdict, verdictConfidence, verdictSummary, detectedModelFamily, scoresBreakdown } = result;

  // Animated counter for overallScore
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Math.min(100, Math.max(0, overallScore));
    const duration = 1200; // ms
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = (end - start) / steps;

    const timer = setInterval(() => {
      start += increment;
      if ((increment > 0 && start >= end) || (increment < 0 && start <= end)) {
        setDisplayScore(end);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.round(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [overallScore]);

  // Verdict visual configurations
  const getVerdictConfig = () => {
    switch (verdict) {
      case 'AI_GENERATED':
        return {
          title: 'AI Generated Content',
          subtitle: 'High probability of neural synthesis (diffusion / GAN)',
          badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
          indicatorColor: '#f43f5e',
          gradientStops: ['#f43f5e', '#e11d48', '#be123c'],
          glowColor: 'rgba(244, 63, 94, 0.35)',
          icon: Cpu,
        };
      case 'HIGHLY_SUSPICIOUS':
        return {
          title: 'Highly Suspicious Markers',
          subtitle: 'Uncanny artifacts and inconsistent frequency anomalies detected',
          badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
          indicatorColor: '#f59e0b',
          gradientStops: ['#f59e0b', '#d97706', '#b45309'],
          glowColor: 'rgba(245, 158, 11, 0.35)',
          icon: AlertTriangle,
        };
      case 'HEAVILY_FILTERED':
        return {
          title: 'Heavily Filtered / Retouched',
          subtitle: 'Extensive post-processing, bilateral smoothing, or synthetic bokeh',
          badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
          indicatorColor: '#a855f7',
          gradientStops: ['#a855f7', '#9333ea', '#7e22ce'],
          glowColor: 'rgba(168, 85, 247, 0.35)',
          icon: Filter,
        };
      case 'LIKELY_AUTHENTIC':
      case 'AUTHENTIC':
      default:
        return {
          title: 'Authentic Camera Capture',
          subtitle: 'Consistent optical sensor noise & natural physics verified',
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          indicatorColor: '#10b981',
          gradientStops: ['#34d399', '#10b981', '#059669'],
          glowColor: 'rgba(16, 185, 129, 0.35)',
          icon: ShieldCheck,
        };
    }
  };

  const config = getVerdictConfig();
  const VerdictIcon = config.icon;

  // Calculate arc geometry for circular gauge
  const radius = 80;
  const strokeWidth = 14;
  const normalizedScore = Math.min(100, Math.max(0, overallScore));
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * (240 / 360);
  const strokeDashoffset = arcLength - (normalizedScore / 100) * arcLength;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-lg space-y-6 relative overflow-hidden"
    >
      {/* Radiant top indicator glow */}
      <div
        className="absolute top-0 inset-x-0 h-1.5 transition-colors duration-700"
        style={{
          background: `linear-gradient(90deg, ${config.gradientStops.join(', ')})`,
          boxShadow: `0 0 15px ${config.glowColor}`,
        }}
      />

      {/* Top Banner: Verdict & Model Family */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-start gap-3.5">
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`p-3.5 rounded-2xl border shadow-sm ${config.badgeBg} relative`}
          >
            <VerdictIcon className="w-6 h-6 shrink-0" />
            <motion.span
              animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ repeat: Infinity, duration: 2.2 }}
              className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-current opacity-75"
            />
          </motion.div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {config.title}
              </h2>
              <span className={`px-3 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider border shadow-2xs ${config.badgeBg}`}>
                {verdictConfidence}% Confidence
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
              {config.subtitle}
            </p>
          </div>
        </div>

        <motion.div
          whileHover={{ scale: 1.03, y: -2 }}
          className="sm:text-right bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-50 border border-slate-200/90 px-4 py-3 rounded-2xl shadow-2xs"
        >
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-indigo-500 block">
            Signature Architecture
          </span>
          <span className="text-sm font-bold text-slate-800 flex items-center sm:justify-end gap-1.5 mt-0.5">
            <Cpu className="w-3.5 h-3.5 text-indigo-600" />
            {detectedModelFamily || 'Standard Diffusion / Inpainting'}
          </span>
        </motion.div>
      </div>

      {/* Main Confidence Visualization Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Radial AI Confidence Dial */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-50/90 via-indigo-50/20 to-slate-100/60 border border-slate-200/90 rounded-3xl relative overflow-hidden shadow-sm">
          {/* Sonar radar pulse */}
          <motion.div
            animate={{ scale: [0.95, 1.1, 0.95], opacity: [0.25, 0.5, 0.25] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
            className="absolute inset-0 forensic-dot-dense opacity-40 pointer-events-none"
          />

          <div className="relative w-52 h-44 flex items-center justify-center">
            <svg
              className="w-52 h-52 -rotate-[210deg] transform filter drop-shadow-md"
              viewBox="0 0 200 200"
            >
              <defs>
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={config.gradientStops[0]} />
                  <stop offset="50%" stopColor={config.gradientStops[1]} />
                  <stop offset="100%" stopColor={config.gradientStops[2]} />
                </linearGradient>
              </defs>

              {/* Background Track Arc */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="transparent"
                stroke="#e2e8f0"
                strokeWidth={strokeWidth}
                strokeDasharray={`${arcLength} ${circumference}`}
                strokeLinecap="round"
              />
              {/* Colored Fill Arc */}
              <motion.circle
                cx="100"
                cy="100"
                r={radius}
                fill="transparent"
                stroke="url(#gaugeGradient)"
                strokeWidth={strokeWidth}
                strokeDasharray={`${arcLength} ${circumference}`}
                initial={{ strokeDashoffset: arcLength }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                strokeLinecap="round"
                style={{
                  filter: `drop-shadow(0 0 8px ${config.glowColor})`,
                }}
              />
            </svg>

            {/* Score Center Text */}
            <div className="absolute top-[48%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              <motion.span
                key={displayScore}
                className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 block font-mono"
              >
                {displayScore}%
              </motion.span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block -mt-0.5">
                AI Likelihood
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between w-full px-4 -mt-2 text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <Camera className="w-3 h-3" />
              0% Real
            </span>
            <span className="text-slate-400 font-mono text-[11px]">Forensic Index</span>
            <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
              <Cpu className="w-3 h-3" />
              100% AI
            </span>
          </div>
        </div>

        {/* Multi-Dimensional Confidence Metric Bars */}
        <div className="lg:col-span-7 space-y-3.5">
          {/* AI Probability - Vibrant Rose */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            whileHover={{ scale: 1.01, borderColor: '#f43f5e' }}
            className="space-y-1.5 bg-gradient-to-r from-rose-50/40 via-white to-white border border-rose-200/80 p-3.5 rounded-2xl shadow-xs transition-all"
          >
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Cpu className="w-3.5 h-3.5" />
                </div>
                GAN & Latent Diffusion Likelihood
              </span>
              <span className="font-extrabold text-rose-600 font-mono text-sm">
                {scoresBreakdown.aiProbability}%
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden relative border border-slate-200/60 shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${scoresBreakdown.aiProbability}%` }}
                transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                className="bg-gradient-to-r from-rose-500 via-pink-500 to-red-600 h-full rounded-full relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/25 animate-shimmer" />
              </motion.div>
            </div>
          </motion.div>

          {/* Optical Sensor Authenticity - Vibrant Emerald */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            whileHover={{ scale: 1.01, borderColor: '#10b981' }}
            className="space-y-1.5 bg-gradient-to-r from-emerald-50/40 via-white to-white border border-emerald-200/80 p-3.5 rounded-2xl shadow-xs transition-all"
          >
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Camera className="w-3.5 h-3.5" />
                </div>
                Optical Camera Sensor Authenticity
              </span>
              <span className="font-extrabold text-emerald-600 font-mono text-sm">
                {scoresBreakdown.authenticityConfidence}%
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden relative border border-slate-200/60 shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${scoresBreakdown.authenticityConfidence}%` }}
                transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                className="bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 h-full rounded-full relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/25 animate-shimmer" />
              </motion.div>
            </div>
          </motion.div>

          {/* Digital Manipulation Index - Vibrant Amber */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            whileHover={{ scale: 1.01, borderColor: '#f59e0b' }}
            className="space-y-1.5 bg-gradient-to-r from-amber-50/40 via-white to-white border border-amber-200/80 p-3.5 rounded-2xl shadow-xs transition-all"
          >
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                Manipulation & Splicing Index
              </span>
              <span className="font-extrabold text-amber-600 font-mono text-sm">
                {scoresBreakdown.manipulationConfidence}%
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden relative border border-slate-200/60 shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${scoresBreakdown.manipulationConfidence}%` }}
                transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                className="bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500 h-full rounded-full relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/25 animate-shimmer" />
              </motion.div>
            </div>
          </motion.div>

          {/* Filter Processing Level - Vibrant Purple */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            whileHover={{ scale: 1.01, borderColor: '#a855f7' }}
            className="space-y-1.5 bg-gradient-to-r from-purple-50/40 via-white to-white border border-purple-200/80 p-3.5 rounded-2xl shadow-xs transition-all"
          >
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Sliders className="w-3.5 h-3.5" />
                </div>
                Filter & Post-Processing Intensity
              </span>
              <span className="font-extrabold text-purple-600 font-mono text-sm">
                {scoresBreakdown.filterConfidence}%
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden relative border border-slate-200/60 shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${scoresBreakdown.filterConfidence}%` }}
                transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                className="bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-600 h-full rounded-full relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/25 animate-shimmer" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Forensic Verdict Summary: Slate 950 contrast card with animated accent line */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-slate-950 text-white rounded-2xl p-5 sm:p-6 shadow-xl space-y-2 relative overflow-hidden border border-slate-800"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-blue-600/20 via-purple-600/20 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <span>Forensic Synthesis Analysis</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          </h4>
        </div>
        <p className="text-sm leading-relaxed text-slate-200 font-normal">
          {verdictSummary}
        </p>
      </motion.div>
    </motion.div>
  );
}

