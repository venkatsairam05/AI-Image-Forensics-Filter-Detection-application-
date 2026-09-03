/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ConfidenceGauge } from './components/ConfidenceGauge';
import { ForensicCanvasViewer } from './components/ForensicCanvasViewer';
import { MarkersPanel } from './components/MarkersPanel';
import { FilterDetectionPanel } from './components/FilterDetectionPanel';
import { TechnicalDetailsCard } from './components/TechnicalDetailsCard';
import { MethodologyModal } from './components/MethodologyModal';
import { ReportModal } from './components/ReportModal';
import { ForensicResult } from './types';
import { ShieldAlert, Cpu, Sparkles, AlertCircle, RefreshCw, Activity, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{
    filename: string;
    fileSizeBytes: number;
    mimeType: string;
    dimensions: { width: number; height: number };
  } | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<string>('Initializing forensic scan...');
  const [loadingProgress, setLoadingProgress] = useState<number>(15);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ForensicResult | null>(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  // Modals
  const [isMethodologyOpen, setIsMethodologyOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

  const handleImageSelected = async (data: {
    base64: string;
    mimeType: string;
    filename: string;
    fileSizeBytes: number;
    dimensions: { width: number; height: number };
  }) => {
    setImageSrc(data.base64);
    setImageMeta({
      filename: data.filename,
      fileSizeBytes: data.fileSizeBytes,
      mimeType: data.mimeType,
      dimensions: data.dimensions,
    });
    setResult(null);
    setSelectedMarkerId(null);
    setError(null);
    setIsLoading(true);

    // Dynamic loading ticker steps for user feedback
    const stages = [
      { text: 'Extracting pixel matrix & compression profile...', pct: 25 },
      { text: 'Running spatial frequency & deconvolution analysis...', pct: 45 },
      { text: 'Evaluating latent diffusion & GAN synthesis markers...', pct: 68 },
      { text: 'Auditing bilateral filter & retouching intensity...', pct: 85 },
      { text: 'Synthesizing multi-modal confidence scores...', pct: 95 },
    ];

    let stageIdx = 0;
    setLoadingStage(stages[0].text);
    setLoadingProgress(stages[0].pct);
    const interval = setInterval(() => {
      stageIdx = (stageIdx + 1) % stages.length;
      setLoadingStage(stages[stageIdx].text);
      setLoadingProgress(stages[stageIdx].pct);
    }, 1200);

    try {
      const response = await fetch('/api/forensics/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: data.base64,
          mimeType: data.mimeType,
          filename: data.filename,
          fileSizeBytes: data.fileSizeBytes,
          dimensions: data.dimensions,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server returned ${response.status}`);
      }

      const report: ForensicResult = await response.json();
      setResult(report);

      // Trigger celebratory confetti if the image is authentic
      if (report.verdict === 'AUTHENTIC' || report.scoresBreakdown.authenticityConfidence >= 65) {
        setTimeout(() => {
          confetti({
            particleCount: 110,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#10B981', '#3B82F6', '#06B6D4', '#60A5FA', '#34D399', '#818CF8'],
          });
        }, 300);
      }
    } catch (err: any) {
      console.error('Forensic analysis failed:', err);
      setError(err.message || 'Failed to complete forensic image analysis.');
    } finally {
      clearInterval(interval);
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setImageSrc(null);
    setImageMeta(null);
    setResult(null);
    setSelectedMarkerId(null);
    setError(null);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans antialiased selection:bg-indigo-600 selection:text-white relative overflow-hidden">
      {/* Ambient colorful aurora orbs in background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-tr from-blue-400/20 via-indigo-400/15 to-purple-400/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] bg-gradient-to-br from-purple-400/15 via-pink-400/15 to-indigo-400/15 rounded-full blur-3xl animate-pulse-glow [animation-delay:2s]" />
        <div className="absolute -bottom-40 left-1/4 w-[32rem] h-[32rem] bg-gradient-to-tr from-cyan-400/15 via-teal-400/15 to-blue-400/15 rounded-full blur-3xl animate-pulse-glow [animation-delay:4s]" />
      </div>

      <Header
        onReset={handleReset}
        hasResult={Boolean(result)}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        onExportReport={() => setIsReportOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 relative z-10">
        {/* If no image selected yet */}
        {!imageSrc && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="text-center max-w-3xl mx-auto space-y-3.5 pt-2 pb-2">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 text-indigo-700 border border-indigo-200/80 shadow-2xs backdrop-blur-xs"
              >
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 animate-pulse" />
                <span>Forensic Verification & Neural Authenticity Suite</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-600 text-white font-mono font-bold text-[10px]">
                  v2.5 PRO
                </span>
              </motion.div>

              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                Detect{' '}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  AI Generation Markers
                </span>{' '}
                &{' '}
                <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
                  Filters
                </span>
              </h2>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
                Inspect photographs for generative diffusion patterns, Error Level Analysis (ELA) discrepancies, camera sensor PRNU noise fingerprints, and computational beauty retouches.
              </p>

              {/* Colorful feature chips */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center gap-1.5 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Diffusion & GAN Markers
                </span>
                <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/80 flex items-center gap-1.5 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  Error Level Analysis (ELA)
                </span>
                <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center gap-1.5 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Sensor PRNU Noise
                </span>
                <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-pink-50 text-pink-700 border border-pink-200/80 flex items-center gap-1.5 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                  Beautification & Filters
                </span>
              </div>
            </div>

            <ImageUploader onImageSelected={handleImageSelected} isLoading={isLoading} />
          </motion.div>
        )}

        {/* Loading State Overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3 }}
              className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-10 sm:p-16 text-center flex flex-col items-center justify-center space-y-6 shadow-xl relative overflow-hidden forensic-grid-pattern"
            >
              {/* Colorful radar pulse ripples */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
                <div className="w-56 h-56 rounded-full border-2 border-cyan-400/40 animate-radar-pulse" />
                <div className="w-80 h-80 rounded-full border-2 border-indigo-400/30 animate-radar-pulse [animation-delay:0.5s]" />
                <div className="w-[28rem] h-[28rem] rounded-full border-2 border-purple-400/20 animate-radar-pulse [animation-delay:1s]" />
              </div>

              {/* Central Glowing Multi-color Radar Core */}
              <div className="relative w-24 h-24">
                {/* Outer spinning gradient ring */}
                <div className="w-24 h-24 rounded-full border-4 border-transparent border-t-cyan-500 border-r-indigo-500 border-b-purple-500 border-l-pink-500 animate-spin" />
                <motion.div
                  animate={{ scale: [1, 1.15, 1], rotate: [0, 180, 360] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white absolute inset-0 m-auto flex items-center justify-center shadow-lg shadow-indigo-500/30"
                >
                  <ShieldAlert className="w-8 h-8 text-white" />
                </motion.div>
              </div>

              <div className="space-y-2 max-w-md relative z-10">
                <div className="flex items-center justify-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600 animate-pulse" />
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Executing Multi-Vector Diagnostics
                  </h3>
                </div>
                <p className="text-xs sm:text-sm font-mono font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {loadingStage}
                </p>
              </div>

              {/* Colorful Progress Bar */}
              <div className="w-full max-w-md space-y-1.5 relative z-10">
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/80 shadow-inner">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 relative overflow-hidden"
                    animate={{ width: `${loadingProgress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <div className="absolute inset-0 bg-white/30 animate-shimmer" />
                  </motion.div>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-mono font-semibold">
                  <span className="text-indigo-600">Deep Neural Pipeline</span>
                  <span className="text-purple-600 font-bold">{loadingProgress}%</span>
                </div>
              </div>

              <span className="text-xs text-slate-500 max-w-md relative z-10 leading-relaxed">
                Analyzing high-order Fourier frequencies, deconvolution checkerboards, and localized error compression gradients.
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error State */}
        {error && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50/90 border border-red-200 rounded-2xl p-6 text-red-800 space-y-3 shadow-sm"
          >
            <div className="flex items-center gap-2 font-bold text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>Forensic Analysis Error</span>
            </div>
            <p className="text-xs sm:text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Another Image
            </button>
          </motion.div>
        )}

        {/* Forensic Results Dashboard */}
        {result && imageSrc && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="space-y-8"
          >
            {/* 1. Hero Confidence Gauge & Verdict */}
            <ConfidenceGauge result={result} />

            {/* 2. Interactive Multi-View Forensic Canvas Studio */}
            <ForensicCanvasViewer
              imageSrc={imageSrc}
              markers={result.aiMarkers}
              selectedMarkerId={selectedMarkerId}
              onSelectMarker={setSelectedMarkerId}
              result={result}
            />

            {/* 3. Deep Forensic Investigation Modules */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* AI Generation Markers */}
              <div className="lg:col-span-6">
                <MarkersPanel
                  markers={result.aiMarkers}
                  selectedMarkerId={selectedMarkerId}
                  onSelectMarker={setSelectedMarkerId}
                />
              </div>

              {/* Filter & Retouching Diagnostics */}
              <div className="lg:col-span-6">
                <FilterDetectionPanel filters={result.filtersDetected} />
              </div>
            </div>

            {/* 4. Technical Metrics Dossier */}
            <TechnicalDetailsCard
              metrics={result.technicalMetrics}
              imageInfo={result.imageInfo}
            />
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p>
          AI Image Forensics & Filter Detection System • Built with Error Level Analysis (ELA) & Multi-modal Forensic Diagnostics
        </p>
      </footer>

      {/* Modals */}
      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />

      {result && (
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          result={result}
        />
      )}
    </div>
  );
}

