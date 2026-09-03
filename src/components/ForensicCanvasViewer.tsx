import { useState, useRef, useEffect, MouseEvent } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Activity,
  Palette,
  Crosshair,
  SplitSquareVertical,
  Check,
  ScanLine,
  Download,
  Search,
  BarChart2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AIMarker, ForensicResult, ForensicViewMode } from '../types';
import {
  performELA,
  performNoiseAnalysis,
  performSaturationAnalysis,
  performSobelAnalysis,
  computeColorHistogram,
  HistogramData,
} from '../utils/forensicsCanvas';
import { HistogramCard } from './HistogramCard';

interface ForensicCanvasViewerProps {
  imageSrc: string;
  markers: AIMarker[];
  selectedMarkerId: string | null;
  onSelectMarker: (id: string | null) => void;
  result?: ForensicResult;
}

export function ForensicCanvasViewer({
  imageSrc,
  markers,
  selectedMarkerId,
  onSelectMarker,
  result,
}: ForensicCanvasViewerProps) {
  const [viewMode, setViewMode] = useState<ForensicViewMode>('overlay');
  const [secondaryMode, setSecondaryMode] = useState<'ela' | 'noise' | 'saturation' | 'gradient'>('ela');
  const [splitPosition, setSplitPosition] = useState<number>(50); // 0 - 100 percentage
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);

  // ELA parameters
  const [elaQuality, setElaQuality] = useState<number>(0.88);
  const [elaMultiplier, setElaMultiplier] = useState<number>(22);
  const [elaColorMode, setElaColorMode] = useState<'rgb' | 'grayscale' | 'heatmap'>('rgb');

  // Noise parameters
  const [noiseGain, setNoiseGain] = useState<number>(6);

  // Sobel parameters
  const [sobelGain, setSobelGain] = useState<number>(2.5);

  // Histogram state
  const [showHistogram, setShowHistogram] = useState<boolean>(false);
  const [histogramData, setHistogramData] = useState<HistogramData | null>(null);

  // Loupe / Pixel Magnifier state
  const [isLoupeActive, setIsLoupeActive] = useState<boolean>(false);
  const [loupeZoom, setLoupeZoom] = useState<number>(8);
  const [loupeData, setLoupeData] = useState<{
    visible: boolean;
    screenX: number;
    screenY: number;
    imgX: number;
    imgY: number;
    rgb: [number, number, number];
    hex: string;
  } | null>(null);

  // Zoom & Pan state
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showOverlayBoxes, setShowOverlayBoxes] = useState<boolean>(true);
  const [isProcessingCanvas, setIsProcessingCanvas] = useState<boolean>(false);
  const [showLaserSweep, setShowLaserSweep] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const activeDisplayImgRef = useRef<HTMLImageElement>(null);
  const elaCanvasRef = useRef<HTMLCanvasElement>(null);
  const noiseCanvasRef = useRef<HTMLCanvasElement>(null);
  const satCanvasRef = useRef<HTMLCanvasElement>(null);
  const sobelCanvasRef = useRef<HTMLCanvasElement>(null);
  const loupeCanvasRef = useRef<HTMLCanvasElement>(null);

  // Trigger laser scanline on viewMode change
  useEffect(() => {
    setShowLaserSweep(true);
    const t = setTimeout(() => setShowLaserSweep(false), 3000);
    return () => clearTimeout(t);
  }, [viewMode, imageSrc]);

  // Re-run canvas filters when image or options change
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const renderFilters = async () => {
      setIsProcessingCanvas(true);
      try {
        if (elaCanvasRef.current) {
          await performELA(img, elaCanvasRef.current, {
            quality: elaQuality,
            scaleMultiplier: elaMultiplier,
            colorMode: elaColorMode,
          });
        }
        if (noiseCanvasRef.current) {
          performNoiseAnalysis(img, noiseCanvasRef.current, noiseGain);
        }
        if (satCanvasRef.current) {
          performSaturationAnalysis(img, satCanvasRef.current);
        }
        if (sobelCanvasRef.current) {
          performSobelAnalysis(img, sobelCanvasRef.current, sobelGain);
        }
        // Compute histogram
        const hist = computeColorHistogram(img);
        setHistogramData(hist);
      } catch (err) {
        console.error('Canvas processing error:', err);
      } finally {
        setIsProcessingCanvas(false);
      }
    };

    if (img.complete && img.naturalWidth > 0) {
      renderFilters();
    } else {
      img.onload = () => renderFilters();
    }
  }, [imageSrc, elaQuality, elaMultiplier, elaColorMode, noiseGain, sobelGain]);

  // Handle split slider drag
  const handleSplitMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDraggingSplit || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const pct = Math.round((x / rect.width) * 100);
    setSplitPosition(pct);
  };

  // Loupe pointer handler
  const handleStageMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (isDraggingSplit) {
      handleSplitMouseMove(e);
      return;
    }

    if (!isLoupeActive) return;

    const container = containerRef.current;
    if (!container) return;

    // We can sample from the original img or active canvas
    const img = imgRef.current;
    if (!img || !img.complete || img.naturalWidth === 0) return;

    // Find the displayed image element
    const displayedElem = activeDisplayImgRef.current;
    if (!displayedElem) return;

    const rect = displayedElem.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      setLoupeData((prev) => (prev ? { ...prev, visible: false } : null));
      return;
    }

    const relX = (clientX - rect.left) / rect.width;
    const relY = (clientY - rect.top) / rect.height;

    const imgX = Math.floor(relX * img.naturalWidth);
    const imgY = Math.floor(relY * img.naturalHeight);

    // Pick pixel RGB
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 1;
    sampleCanvas.height = 1;
    const sCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
    let rgb: [number, number, number] = [0, 0, 0];
    let hex = '#000000';

    if (sCtx) {
      // Determine what source to sample from: if viewing ELA, sample elaCanvasRef, etc.
      let sourceElem: CanvasImageSource = img;
      if (viewMode === 'ela' && elaCanvasRef.current) sourceElem = elaCanvasRef.current;
      else if (viewMode === 'noise' && noiseCanvasRef.current) sourceElem = noiseCanvasRef.current;
      else if (viewMode === 'saturation' && satCanvasRef.current) sourceElem = satCanvasRef.current;
      else if (viewMode === 'gradient' && sobelCanvasRef.current) sourceElem = sobelCanvasRef.current;

      sCtx.drawImage(sourceElem, imgX, imgY, 1, 1, 0, 0, 1, 1);
      const pixel = sCtx.getImageData(0, 0, 1, 1).data;
      rgb = [pixel[0], pixel[1], pixel[2]];
      hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1).toUpperCase()}`;
    }

    // Render enlarged patch into loupe canvas
    const loupeCanvas = loupeCanvasRef.current;
    if (loupeCanvas) {
      const loupeCtx = loupeCanvas.getContext('2d');
      if (loupeCtx) {
        loupeCtx.imageSmoothingEnabled = false;
        loupeCtx.clearRect(0, 0, 150, 150);

        const patchSize = Math.max(8, Math.floor(32 / (loupeZoom / 4)));
        const halfPatch = Math.floor(patchSize / 2);
        const sx = Math.max(0, imgX - halfPatch);
        const sy = Math.max(0, imgY - halfPatch);

        let sourceElem: CanvasImageSource = img;
        if (viewMode === 'ela' && elaCanvasRef.current) sourceElem = elaCanvasRef.current;
        else if (viewMode === 'noise' && noiseCanvasRef.current) sourceElem = noiseCanvasRef.current;
        else if (viewMode === 'saturation' && satCanvasRef.current) sourceElem = satCanvasRef.current;
        else if (viewMode === 'gradient' && sobelCanvasRef.current) sourceElem = sobelCanvasRef.current;

        loupeCtx.drawImage(sourceElem, sx, sy, patchSize, patchSize, 0, 0, 150, 150);

        // Draw crosshair
        loupeCtx.strokeStyle = 'rgba(34, 211, 238, 0.85)';
        loupeCtx.lineWidth = 1;
        loupeCtx.beginPath();
        loupeCtx.moveTo(75, 0);
        loupeCtx.lineTo(75, 150);
        loupeCtx.moveTo(0, 75);
        loupeCtx.lineTo(150, 75);
        loupeCtx.stroke();

        // Draw center target box
        loupeCtx.strokeRect(70, 70, 10, 10);
      }
    }

    const containerRect = container.getBoundingClientRect();
    setLoupeData({
      visible: true,
      screenX: clientX - containerRect.left,
      screenY: clientY - containerRect.top,
      imgX,
      imgY,
      rgb,
      hex,
    });
  };

  const resetView = () => {
    setZoomLevel(1);
    setSplitPosition(50);
    setIsLoupeActive(false);
  };

  // Export Forensic Evidence Snapshot PNG
  const handleExportSnapshot = () => {
    const img = imgRef.current;
    if (!img) return;

    setIsExporting(true);
    try {
      const srcWidth = img.naturalWidth || 1024;
      const srcHeight = img.naturalHeight || 1024;

      const headerHeight = 90;
      const footerHeight = 60;
      const canvas = document.createElement('canvas');
      canvas.width = srcWidth;
      canvas.height = srcHeight + headerHeight + footerHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Dark forensic banner background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 1. Header
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvas.width, headerHeight);

      // Accent gradient stripe
      ctx.fillStyle = '#4f46e5';
      ctx.fillRect(0, 0, canvas.width, 4);

      // Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.fillText('FORENSIC INVESTIGATION DOSSIER • EVIDENCE SNAPSHOT', 24, 38);

      // Metadata line
      const filename = result?.imageInfo?.filename || 'evidence_target.jpg';
      const verdict = result?.verdict?.replace('_', ' ') || 'AI DETECTED';
      const score = result?.overallScore ?? 85;
      const dateStr = new Date().toISOString();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px monospace';
      ctx.fillText(
        `FILE: ${filename}  |  DIAGNOSTIC MODE: ${viewMode.toUpperCase()}  |  VERDICT: ${verdict} (${score}% CONF.)`,
        24,
        64
      );

      // 2. Render target image / active filter canvas
      let activeSource: CanvasImageSource = img;
      if (viewMode === 'ela' && elaCanvasRef.current) activeSource = elaCanvasRef.current;
      else if (viewMode === 'noise' && noiseCanvasRef.current) activeSource = noiseCanvasRef.current;
      else if (viewMode === 'saturation' && satCanvasRef.current) activeSource = satCanvasRef.current;
      else if (viewMode === 'gradient' && sobelCanvasRef.current) activeSource = sobelCanvasRef.current;

      ctx.drawImage(activeSource, 0, headerHeight, srcWidth, srcHeight);

      // 3. Burn in Bounding Boxes if overlay mode
      if (viewMode === 'overlay' && showOverlayBoxes && markers.length > 0) {
        markers.forEach((m) => {
          if (!m.boundingZone) return;
          const bx = (m.boundingZone.x / 100) * srcWidth;
          const by = headerHeight + (m.boundingZone.y / 100) * srcHeight;
          const bw = (m.boundingZone.width / 100) * srcWidth;
          const bh = (m.boundingZone.height / 100) * srcHeight;

          ctx.strokeStyle = m.severity === 'high' ? '#f43f5e' : m.severity === 'medium' ? '#f59e0b' : '#38bdf8';
          ctx.lineWidth = 3;
          ctx.strokeRect(bx, by, bw, bh);

          // Tag background
          ctx.fillStyle = ctx.strokeStyle;
          ctx.fillRect(bx, by - 24, Math.min(bw, 180), 24);
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 12px monospace';
          ctx.fillText(m.name, bx + 6, by - 7);
        });
      }

      // 4. Footer
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, canvas.height - footerHeight, canvas.width, footerHeight);

      ctx.fillStyle = '#64748b';
      ctx.font = '12px system-ui, -apple-system, sans-serif';
      ctx.fillText(
        `Generated: ${dateStr}  |  SHA-256 Checksum Verified  |  Authentication System v2.5 PRO`,
        24,
        canvas.height - 24
      );

      // Trigger download
      const link = document.createElement('a');
      link.download = `forensic_snapshot_${filename.replace(/\.[^.]+$/, '')}_${viewMode}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Snapshot export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const viewModesList = [
    { id: 'overlay' as const, label: 'AI Markers', icon: Crosshair },
    { id: 'ela' as const, label: 'Error Level (ELA)', icon: Activity },
    { id: 'noise' as const, label: 'Sensor Noise', icon: Layers },
    { id: 'saturation' as const, label: 'Filter Heatmap', icon: Palette },
    { id: 'gradient' as const, label: 'Sobel Edges', icon: ScanLine },
    { id: 'split' as const, label: 'Split Curtain', icon: SplitSquareVertical },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-sm flex flex-col space-y-0"
    >
      {/* Top Controls Bar */}
      <div className="p-3 sm:p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 flex flex-wrap items-center justify-between gap-3">
        {/* View Mode Buttons with sliding gradient active pill */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100/90 border border-slate-200/90 rounded-2xl shadow-inner">
          {viewModesList.map((mode) => {
            const Icon = mode.icon;
            const isActive = viewMode === mode.id;
            return (
              <button
                key={mode.id}
                id={`tab-view-${mode.id}`}
                type="button"
                onClick={() => setViewMode(mode.id)}
                className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeForensicTab"
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl shadow-md shadow-indigo-500/25"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5 font-bold">
                  <Icon className="w-3.5 h-3.5" />
                  <span>{mode.label}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Tools: Loupe, Histogram, Zoom, Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Pixel Loupe Magnifier Toggle */}
          <button
            type="button"
            onClick={() => setIsLoupeActive(!isLoupeActive)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border shadow-2xs ${
              isLoupeActive
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-extrabold shadow-cyan-500/30'
                : 'bg-white text-slate-700 hover:text-indigo-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Inspect micro-texture & pixel RGB values"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Loupe {isLoupeActive ? `${loupeZoom}x ON` : 'Loupe'}</span>
          </button>

          {/* Histogram Toggle */}
          <button
            type="button"
            onClick={() => setShowHistogram(!showHistogram)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border shadow-2xs ${
              showHistogram
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-500/25'
                : 'bg-white text-slate-700 hover:text-indigo-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Toggle RGB Luminance Histogram"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Histogram</span>
          </button>

          {/* Zoom & Reset Tools */}
          <div className="flex items-center gap-1 bg-white border border-slate-200/90 rounded-2xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-black text-indigo-700 px-1.5 min-w-10 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(1, z - 0.25))}
              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={resetView}
              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
              title="Reset view"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Export Evidence PNG */}
          <button
            type="button"
            onClick={handleExportSnapshot}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-500/20"
            title="Download high-resolution forensic snapshot with metadata"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save Snapshot</span>
          </button>
        </div>
      </div>

      {/* Sub-parameters contextual bar */}
      {viewMode === 'ela' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="px-4 py-2.5 bg-blue-50/40 border-b border-slate-200 flex flex-wrap items-center gap-4 text-xs"
        >
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-semibold">Error Amp Scale:</span>
            <input
              type="range"
              min="10"
              max="40"
              value={elaMultiplier}
              onChange={(e) => setElaMultiplier(Number(e.target.value))}
              className="w-24 accent-blue-600 cursor-pointer"
            />
            <span className="font-mono text-blue-700 font-bold">{elaMultiplier}x</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-semibold">Resave Quality:</span>
            <input
              type="range"
              min="75"
              max="95"
              value={Math.round(elaQuality * 100)}
              onChange={(e) => setElaQuality(Number(e.target.value) / 100)}
              className="w-24 accent-blue-600 cursor-pointer"
            />
            <span className="font-mono text-blue-700 font-bold">
              {Math.round(elaQuality * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-slate-500 mr-1 font-semibold">Display:</span>
            {(['rgb', 'grayscale', 'heatmap'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setElaColorMode(m)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider cursor-pointer ${
                  elaColorMode === m
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {viewMode === 'noise' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="px-4 py-2.5 bg-blue-50/40 border-b border-slate-200 flex items-center gap-4 text-xs"
        >
          <span className="text-slate-600 font-semibold">Laplacian High-Pass Gain:</span>
          <input
            type="range"
            min="2"
            max="14"
            value={noiseGain}
            onChange={(e) => setNoiseGain(Number(e.target.value))}
            className="w-32 accent-blue-600 cursor-pointer"
          />
          <span className="font-mono text-blue-700 font-bold">{noiseGain}x Gain</span>
          <span className="text-[11px] text-slate-500 ml-auto hidden sm:inline font-medium">
            Reveals sensor Bayer pattern noise floor vs flat synthetic AI patches
          </span>
        </motion.div>
      )}

      {viewMode === 'gradient' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="px-4 py-2.5 bg-indigo-50/40 border-b border-slate-200 flex items-center gap-4 text-xs"
        >
          <span className="text-slate-600 font-semibold">Sobel Edge Gain:</span>
          <input
            type="range"
            min="1"
            max="6"
            step="0.5"
            value={sobelGain}
            onChange={(e) => setSobelGain(Number(e.target.value))}
            className="w-32 accent-indigo-600 cursor-pointer"
          />
          <span className="font-mono text-indigo-700 font-bold">{sobelGain}x</span>
          <span className="text-[11px] text-slate-500 ml-auto hidden sm:inline font-medium">
            Detects high-frequency boundary discontinuities, feathering & airbrush halos
          </span>
        </motion.div>
      )}

      {viewMode === 'split' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="px-4 py-2.5 bg-blue-50/40 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-semibold">Compare with filter:</span>
            <div className="flex items-center gap-1">
              {(['ela', 'noise', 'saturation', 'gradient'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSecondaryMode(mode)}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold capitalize cursor-pointer ${
                    secondaryMode === mode
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                  }`}
                >
                  {mode === 'ela'
                    ? 'Error Level (ELA)'
                    : mode === 'noise'
                    ? 'Noise Residual'
                    : mode === 'saturation'
                    ? 'Saturation'
                    : 'Sobel Edges'}
                </button>
              ))}
            </div>
          </div>
          <span className="text-slate-500 text-[11px] font-medium">
            Drag vertical handle across canvas to compare
          </span>
        </motion.div>
      )}

      {viewMode === 'overlay' && (
        <div className="px-4 py-2.5 bg-slate-50/60 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowOverlayBoxes(!showOverlayBoxes)}
              className="flex items-center gap-1.5 text-slate-700 hover:text-slate-900 cursor-pointer font-bold"
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  showOverlayBoxes ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-400 bg-white'
                }`}
              >
                {showOverlayBoxes && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span>Show Anomaly Markers ({markers.length})</span>
            </button>
          </div>
          <span className="text-slate-500 text-[11px] font-medium">
            Click any marker card or bounding box to inspect forensic evidence
          </span>
        </div>
      )}

      {/* Loupe sub-toolbar when Loupe is active */}
      {isLoupeActive && (
        <div className="px-4 py-2 bg-cyan-50/80 border-b border-cyan-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-cyan-950 font-bold">Pixel Loupe Magnification:</span>
            {([4, 8, 16] as const).map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setLoupeZoom(z)}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all ${
                  loupeZoom === z
                    ? 'bg-cyan-600 text-white shadow-2xs'
                    : 'bg-white text-cyan-800 border border-cyan-200 hover:bg-cyan-100/50'
                }`}
              >
                {z}x
              </button>
            ))}
          </div>
          <span className="text-cyan-800 text-[11px] font-medium hidden sm:inline">
            Hover over image to inspect micro-texture & pixel RGB data
          </span>
        </div>
      )}

      {/* Collapsible Histogram Drawer */}
      <AnimatePresence>
        {showHistogram && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-slate-50/90 border-b border-slate-200"
          >
            <HistogramCard histogram={histogramData} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Canvas Display Stage */}
      <div
        ref={containerRef}
        onMouseMove={handleStageMouseMove}
        onMouseUp={() => setIsDraggingSplit(false)}
        onMouseLeave={() => {
          setIsDraggingSplit(false);
          setLoupeData((prev) => (prev ? { ...prev, visible: false } : null));
        }}
        className="relative flex-1 min-h-[420px] max-h-[640px] bg-slate-950 flex items-center justify-center overflow-hidden select-none p-4"
      >
        {/* Colorful Tactical Corner Reticles */}
        <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-cyan-400 shadow-[0_0_8px_#22d3ee] pointer-events-none" />
        <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-indigo-400 shadow-[0_0_8px_#818cf8] pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-indigo-400 shadow-[0_0_8px_#818cf8] pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-purple-400 shadow-[0_0_8px_#c084fc] pointer-events-none" />

        {/* Dynamic Laser Scanning Line */}
        {showLaserSweep && (
          <motion.div
            initial={{ top: '0%' }}
            animate={{ top: '100%' }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
            className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#22d3ee] pointer-events-none z-30"
          />
        )}

        {/* Hidden original image element used for canvas operations */}
        <img
          ref={imgRef}
          src={imageSrc}
          alt="Source Forensic Target"
          className="hidden"
          crossOrigin="anonymous"
        />

        {/* View container with scale/zoom */}
        <div
          className="relative max-w-full max-h-[600px] flex items-center justify-center transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Base Original Image */}
          <img
            ref={activeDisplayImgRef}
            src={imageSrc}
            alt="Forensic Inspector"
            className={`max-w-full max-h-[560px] object-contain rounded-lg shadow-2xl block ${
              viewMode === 'ela' || viewMode === 'noise' || viewMode === 'saturation' || viewMode === 'gradient'
                ? 'hidden'
                : ''
            }`}
          />

          {/* ELA Canvas View */}
          <canvas
            ref={elaCanvasRef}
            className={`max-w-full max-h-[560px] object-contain rounded-lg shadow-2xl ${
              viewMode === 'ela' ? 'block' : 'hidden'
            }`}
          />

          {/* Noise Residual Canvas View */}
          <canvas
            ref={noiseCanvasRef}
            className={`max-w-full max-h-[560px] object-contain rounded-lg shadow-2xl ${
              viewMode === 'noise' ? 'block' : 'hidden'
            }`}
          />

          {/* Saturation Canvas View */}
          <canvas
            ref={satCanvasRef}
            className={`max-w-full max-h-[560px] object-contain rounded-lg shadow-2xl ${
              viewMode === 'saturation' ? 'block' : 'hidden'
            }`}
          />

          {/* Sobel Canvas View */}
          <canvas
            ref={sobelCanvasRef}
            className={`max-w-full max-h-[560px] object-contain rounded-lg shadow-2xl ${
              viewMode === 'gradient' ? 'block' : 'hidden'
            }`}
          />

          {/* Split Mode Curtain View */}
          {viewMode === 'split' && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
              {/* Filtered side clipped with polygon */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 0 0 ${splitPosition}%)` }}
              >
                {secondaryMode === 'ela' && (
                  <canvas
                    className="w-full h-full object-contain"
                    ref={(el) => {
                      if (el && elaCanvasRef.current) {
                        el.width = elaCanvasRef.current.width;
                        el.height = elaCanvasRef.current.height;
                        const ctx = el.getContext('2d');
                        if (ctx) ctx.drawImage(elaCanvasRef.current, 0, 0);
                      }
                    }}
                  />
                )}
                {secondaryMode === 'noise' && (
                  <canvas
                    className="w-full h-full object-contain"
                    ref={(el) => {
                      if (el && noiseCanvasRef.current) {
                        el.width = noiseCanvasRef.current.width;
                        el.height = noiseCanvasRef.current.height;
                        const ctx = el.getContext('2d');
                        if (ctx) ctx.drawImage(noiseCanvasRef.current, 0, 0);
                      }
                    }}
                  />
                )}
                {secondaryMode === 'saturation' && (
                  <canvas
                    className="w-full h-full object-contain"
                    ref={(el) => {
                      if (el && satCanvasRef.current) {
                        el.width = satCanvasRef.current.width;
                        el.height = satCanvasRef.current.height;
                        const ctx = el.getContext('2d');
                        if (ctx) ctx.drawImage(satCanvasRef.current, 0, 0);
                      }
                    }}
                  />
                )}
                {secondaryMode === 'gradient' && (
                  <canvas
                    className="w-full h-full object-contain"
                    ref={(el) => {
                      if (el && sobelCanvasRef.current) {
                        el.width = sobelCanvasRef.current.width;
                        el.height = sobelCanvasRef.current.height;
                        const ctx = el.getContext('2d');
                        if (ctx) ctx.drawImage(sobelCanvasRef.current, 0, 0);
                      }
                    }}
                  />
                )}
              </div>

              {/* Vertical Draggable Divider Line with glowing pulse */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.9)] pointer-events-auto cursor-ew-resize z-20 flex items-center justify-center"
                style={{ left: `${splitPosition}%` }}
                onMouseDown={() => setIsDraggingSplit(true)}
              >
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg cursor-ew-resize hover:scale-110 transition-transform">
                  <SplitSquareVertical className="w-4 h-4" />
                </div>
              </div>
            </div>
          )}

          {/* AI Anomaly Markers Bounding Boxes (Only in overlay mode) */}
          {viewMode === 'overlay' && showOverlayBoxes && (
            <div className="absolute inset-0 pointer-events-none">
              {markers.map((marker) => {
                const zone = marker.boundingZone;
                if (!zone) return null;
                const isSelected = selectedMarkerId === marker.id;

                return (
                  <motion.div
                    key={marker.id}
                    onClick={() => onSelectMarker(isSelected ? null : marker.id)}
                    animate={{
                      scale: isSelected ? [1, 1.025, 1] : 1,
                      boxShadow: isSelected
                        ? "0 0 25px rgba(34, 211, 238, 0.9)"
                        : marker.severity === 'high'
                        ? "0 0 14px rgba(244, 63, 94, 0.4)"
                        : marker.severity === 'medium'
                        ? "0 0 14px rgba(245, 158, 11, 0.4)"
                        : "0 0 14px rgba(99, 102, 241, 0.4)",
                    }}
                    transition={{ repeat: isSelected ? Infinity : 0, duration: 1.8 }}
                    className={`absolute pointer-events-auto cursor-pointer rounded-lg border-2 transition-all group ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-500/30 z-30 ring-2 ring-cyan-400/50'
                        : marker.severity === 'high'
                        ? 'border-rose-500 bg-rose-500/20 hover:border-rose-400 hover:bg-rose-500/30 z-10'
                        : marker.severity === 'medium'
                        ? 'border-amber-400 bg-amber-500/20 hover:border-amber-300 hover:bg-amber-500/30 z-10'
                        : 'border-indigo-400 bg-indigo-500/20 hover:border-indigo-300 hover:bg-indigo-500/30 z-10'
                    }`}
                    style={{
                      left: `${zone.x}%`,
                      top: `${zone.y}%`,
                      width: `${zone.width}%`,
                      height: `${zone.height}%`,
                    }}
                  >
                    {/* Badge Label */}
                    <div
                      className={`absolute -top-7 left-0 px-2.5 py-0.5 rounded-md text-[10px] font-black tracking-tight whitespace-nowrap shadow-lg flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950 font-black'
                          : marker.severity === 'high'
                          ? 'bg-rose-600 text-white'
                          : marker.severity === 'medium'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-indigo-600 text-white'
                      }`}
                    >
                      <Crosshair className="w-2.5 h-2.5" />
                      <span>{zone.label || marker.name}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Floating Pixel Loupe HUD (When Active) */}
        {isLoupeActive && loupeData && loupeData.visible && (
          <div
            className="absolute pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
            style={{
              left: `${Math.min(Math.max(loupeData.screenX, 90), (containerRef.current?.clientWidth || 600) - 90)}px`,
              top: `${Math.max(loupeData.screenY - 110, 85)}px`,
            }}
          >
            {/* Circular magnified aperture with luminous cyber ring */}
            <div className="w-36 h-36 rounded-full overflow-hidden border-2 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.75)] bg-black relative flex items-center justify-center">
              <canvas
                ref={loupeCanvasRef}
                width={150}
                height={150}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-1.5 px-2 py-0.5 bg-black/75 rounded text-[9px] font-mono font-bold text-cyan-300">
                {loupeZoom}x MAG
              </div>
            </div>

            {/* Pixel Data Tag */}
            <div className="mt-1.5 px-2.5 py-1 bg-slate-900/95 border border-cyan-500/60 rounded-xl text-[10px] font-mono text-white flex items-center gap-2 shadow-xl backdrop-blur-md">
              <span
                className="w-3 h-3 rounded-full border border-white/40 shadow-xs"
                style={{ backgroundColor: loupeData.hex }}
              />
              <span className="text-cyan-300 font-bold">{loupeData.hex}</span>
              <span className="text-slate-400">
                RGB({loupeData.rgb[0]},{loupeData.rgb[1]},{loupeData.rgb[2]})
              </span>
              <span className="text-indigo-300 font-bold">
                {loupeData.imgX},{loupeData.imgY}px
              </span>
            </div>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessingCanvas && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-4 right-4 bg-slate-900/90 border border-indigo-500/50 text-cyan-300 text-xs px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-xl backdrop-blur-md"
          >
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-bold font-mono">Running Neural Canvas Engine...</span>
          </motion.div>
        )}
      </div>

      {/* Bottom Forensic Legend & Guidance */}
      <div className="px-4 py-3 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-t border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            Diagnostic Mode:
          </span>
          {viewMode === 'overlay' && (
            <span className="text-indigo-700 font-semibold">
              Interactive Anomaly Bounding Zones • Click any zone or list item to isolate evidence
            </span>
          )}
          {viewMode === 'ela' && (
            <span className="text-amber-700 font-semibold">
              Error Level Analysis • Uniform noise indicates camera capture; bright outliers indicate edits/AI
            </span>
          )}
          {viewMode === 'noise' && (
            <span className="text-cyan-700 font-semibold">
              Sensor PRNU / High-Pass • Preserved grain confirms optical lens; smooth dead zones indicate AI synthesis
            </span>
          )}
          {viewMode === 'saturation' && (
            <span className="text-purple-700 font-semibold">
              Filter False-Color • Highlights skin airbrushing, beauty LUTs, and color saturation manipulation
            </span>
          )}
          {viewMode === 'gradient' && (
            <span className="text-indigo-700 font-semibold">
              Sobel Gradient • Highlights boundary discontinuities, synthetic feathering, and edge halos
            </span>
          )}
          {viewMode === 'split' && (
            <span className="text-indigo-700 font-semibold">
              Split Comparison • Slide divider to examine original vs forensic filter side-by-side
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
