import { X, ShieldAlert, Cpu, Activity, Layers, Palette, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MethodologyModal({ isOpen, onClose }: MethodologyModalProps) {
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
            className="relative bg-white/95 backdrop-blur-xl border border-slate-200/90 w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar z-10"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Forensic Detection Methodology
                  </h3>
                  <p className="text-xs text-slate-400">
                    Scientific framework for synthetic image detection and artifact attribution
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

            <div className="space-y-3.5 text-xs sm:text-sm leading-relaxed">
              {/* Section 1: ELA */}
              <div className="bg-gradient-to-r from-amber-50/60 via-orange-50/30 to-white border border-amber-200/80 p-4.5 rounded-2xl space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 font-black text-slate-900">
                  <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-amber-950 font-bold">1. Error Level Analysis (ELA)</span>
                </div>
                <p className="text-slate-600 pl-8 font-normal">
                  ELA exploits the lossy nature of JPEG compression. When an image is saved, each 8×8 pixel grid reaches an error state relative to the original. When modified or spliced, imported segments degrade at differing compression rates. Uniform noise levels indicate single-generation camera captures, whereas bright localized clusters signal inpainting, compositing, or neural blending.
                </p>
              </div>

              {/* Section 2: Sensor PRNU */}
              <div className="bg-gradient-to-r from-teal-50/60 via-cyan-50/30 to-white border border-teal-200/80 p-4.5 rounded-2xl space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 font-black text-slate-900">
                  <div className="w-6 h-6 rounded-lg bg-teal-500 text-white flex items-center justify-center shadow-xs">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-teal-950 font-bold">2. Photo Response Non-Uniformity (PRNU) & Sensor Noise</span>
                </div>
                <p className="text-slate-600 pl-8 font-normal">
                  Real physical camera sensors produce a unique, deterministic noise fingerprint caused by silicon manufacturing tolerances across sensor photosites. Generative AI models (Diffusion, GANs) lack physical sensors and instead exhibit mathematically smooth surfaces or isotropic synthetic Gaussian noise residuals.
                </p>
              </div>

              {/* Section 3: Deconvolution Artifacts */}
              <div className="bg-gradient-to-r from-indigo-50/60 via-purple-50/30 to-white border border-indigo-200/80 p-4.5 rounded-2xl space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 font-black text-slate-900">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <Cpu className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-indigo-950 font-bold">3. Neural Deconvolution & Transposed Convolution Fingerprints</span>
                </div>
                <p className="text-slate-600 pl-8 font-normal">
                  Deep neural upsamplers leave periodic grid or checkerboard artifacts in the spatial frequency domain (detectable via 2D Fast Fourier Transform peaks). Recent Latent Diffusion architectures (Midjourney, Flux, SDXL) also reveal characteristic blending in complex repetitive patterns (text, fingers, ear cartilage, teeth, and iris striations).
                </p>
              </div>

              {/* Section 4: Filter & Retouching Detection */}
              <div className="bg-gradient-to-r from-fuchsia-50/60 via-pink-50/30 to-white border border-fuchsia-200/80 p-4.5 rounded-2xl space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 font-black text-slate-900">
                  <div className="w-6 h-6 rounded-lg bg-fuchsia-600 text-white flex items-center justify-center shadow-xs">
                    <Palette className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-fuchsia-950 font-bold">4. Digital Filter & Beautification Classification</span>
                </div>
                <p className="text-slate-600 pl-8 font-normal">
                  Bilateral filter skin smoothing removes high-frequency facial pores while preserving major edge gradients. Computational portrait blur exhibits stepped depth boundary discontinuities compared to natural optical depth-of-field circle of confusion. Saturation histograms detect non-linear color grading LUTs and HDR clipping.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-500/25"
              >
                Close Methodology Guide
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

