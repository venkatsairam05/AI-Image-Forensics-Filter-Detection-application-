import { useState, useRef, useEffect, DragEvent, ChangeEvent } from 'react';
import { Upload, Sparkles, AlertCircle, ArrowRight, ShieldCheck, Scan, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import { SAMPLE_IMAGES, SampleImage } from '../data/sampleImages';

interface ImageUploaderProps {
  onImageSelected: (imageData: {
    base64: string;
    mimeType: string;
    filename: string;
    fileSizeBytes: number;
    dimensions: { width: number; height: number };
  }) => void;
  isLoading: boolean;
}

export function ImageUploader({ onImageSelected, isLoading }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle clipboard paste
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isLoading) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isLoading]);

  const processFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, WebP, etc.)');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError('Image file exceeds maximum limit of 20MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        onImageSelected({
          base64,
          mimeType: file.type || 'image/jpeg',
          filename: file.name,
          fileSizeBytes: file.size,
          dimensions: {
            width: img.naturalWidth || img.width,
            height: img.naturalHeight || img.height,
          },
        });
      };
      img.onerror = () => {
        setError('Failed to decode image data');
      };
      img.src = base64;
    };
    reader.onerror = () => {
      setError('Failed to read file from disk');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isLoading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  // Convert external sample URL to Base64 via Canvas to prevent CORS and pass to backend
  const loadSample = async (sample: SampleImage) => {
    if (isLoading) return;
    setError(null);

    try {
      const response = await fetch(sample.url, { mode: 'cors' });
      if (!response.ok) throw new Error('Could not fetch sample image');
      const blob = await response.blob();
      const file = new File([blob], `${sample.id}.jpg`, { type: 'image/jpeg' });
      processFile(file);
    } catch (err) {
      console.warn('Direct fetch failed, loading via canvas proxy:', err);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          onImageSelected({
            base64: dataUrl,
            mimeType: 'image/jpeg',
            filename: `${sample.id}.jpg`,
            fileSizeBytes: Math.round(dataUrl.length * 0.75),
            dimensions: { width: canvas.width, height: canvas.height },
          });
        }
      };
      img.onerror = () => {
        setError('Failed to load sample image. Please try uploading your own image file.');
      };
      img.src = sample.url;
    }
  };

  return (
    <div className="w-full space-y-8">
      {/* Drag and Drop Zone with Radiant Gradient Border */}
      <div className="p-[2px] rounded-3xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 shadow-lg hover:shadow-indigo-500/20 transition-all gradient-border-animated">
        <motion.div
          id="image-dropzone"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          whileHover={{ scale: 1.004 }}
          whileTap={{ scale: 0.995 }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isLoading && fileInputRef.current?.click()}
          className={`relative group rounded-[22px] p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[330px] bg-white/95 backdrop-blur-md overflow-hidden ${
            isDragging
              ? 'bg-blue-50/90 scale-[1.01]'
              : 'hover:bg-slate-50/70'
          } ${isLoading ? 'pointer-events-none opacity-60' : ''}`}
        >
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 forensic-grid-pattern opacity-70 pointer-events-none" />

          {/* Ambient scanner beam effect with cyan glow */}
          <motion.div
            animate={{ y: ['-100%', '350%'] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "linear" }}
            className="absolute inset-x-0 h-28 bg-gradient-to-b from-transparent via-cyan-500/15 to-transparent pointer-events-none"
          />

          {/* Tactical corner brackets with lively color */}
          <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-indigo-400 group-hover:border-cyan-500 transition-colors pointer-events-none" />
          <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-indigo-400 group-hover:border-cyan-500 transition-colors pointer-events-none" />
          <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-indigo-400 group-hover:border-cyan-500 transition-colors pointer-events-none" />
          <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-indigo-400 group-hover:border-cyan-500 transition-colors pointer-events-none" />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/bmp,image/tiff"
            className="hidden"
            onChange={handleFileInputChange}
            disabled={isLoading}
          />

          {/* Animated Icon Floating with Multi-Layer Radar Pulse */}
          <div className="relative mb-4">
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.05, 0.4] }}
              transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full bg-indigo-400 -m-3 pointer-events-none"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.15, 0.6] }}
              transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut", delay: 0.3 }}
              className="absolute inset-0 rounded-full bg-cyan-400 -m-1 pointer-events-none"
            />
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="relative w-18 h-18 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-fuchsia-500 text-white flex items-center justify-center shadow-xl shadow-indigo-500/30 group-hover:scale-108 transition-transform"
            >
              <Upload className="w-8 h-8" />
            </motion.div>
          </div>

          <h3 className="relative z-10 text-xl sm:text-2xl font-black text-slate-900 mb-1.5 tracking-tight">
            Drop photograph to initiate forensic scan
          </h3>
          <p className="relative z-10 text-xs sm:text-sm text-slate-500 max-w-md mb-4 leading-relaxed font-medium">
            Drag & drop your file here, click to browse, or paste directly from clipboard (<kbd className="px-2 py-0.5 text-xs bg-slate-100 border border-slate-300 rounded-md text-slate-700 font-mono font-bold">Ctrl+V</kbd>)
          </p>

          {/* Colourful File Format Pills */}
          <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="px-3 py-1 bg-blue-50/80 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg font-mono font-bold transition-colors">
              JPG / JPEG
            </span>
            <span className="px-3 py-1 bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg font-mono font-bold transition-colors">
              PNG
            </span>
            <span className="px-3 py-1 bg-purple-50/80 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-lg font-mono font-bold transition-colors">
              WEBP
            </span>
            <span className="px-3 py-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-mono font-bold shadow-2xs">
              Max 20MB
            </span>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 px-4 py-2.5 rounded-2xl max-w-md shadow-xs font-semibold"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Preset Sample Gallery */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                Forensic Benchmark Testbed
              </h4>
              <p className="text-[11px] text-slate-400 hidden sm:block">Pre-calibrated test cases across generative AI, DSLR optics, and filters</p>
            </div>
          </div>
          <span className="text-xs text-indigo-700 font-bold bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 px-3 py-1 rounded-full border border-indigo-200/80 flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            Instant 1-Click Verification
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SAMPLE_IMAGES.map((sample, idx) => (
            <motion.button
              key={sample.id}
              id={`sample-btn-${sample.id}`}
              type="button"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => loadSample(sample)}
              disabled={isLoading}
              className="text-left group relative bg-white/95 hover:bg-slate-50 border border-slate-200/90 hover:border-indigo-400 rounded-2xl p-3.5 transition-all cursor-pointer flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-xl hover:shadow-indigo-500/15"
            >
              <div className="aspect-video w-full rounded-xl overflow-hidden mb-3 bg-slate-100 relative shadow-2xs">
                <img
                  src={sample.url}
                  alt={sample.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                  <span className="text-[11px] font-extrabold text-white flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 backdrop-blur-xs px-2.5 py-1 rounded-lg shadow-md">
                    <Scan className="w-3.5 h-3.5" /> Analyze Sample
                  </span>
                </div>
                <span className={`absolute top-2 left-2 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-md backdrop-blur-xs flex items-center gap-1 ${
                  sample.category === 'AI Generated'
                    ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white'
                    : sample.category === 'Authentic DSLR'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {sample.category}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <h5 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                    {sample.title}
                  </h5>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all shrink-0" />
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-normal">
                  {sample.description}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

