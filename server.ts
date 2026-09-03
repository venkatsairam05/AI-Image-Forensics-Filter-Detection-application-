import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// High body size limit for base64 image data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Forensic Analysis Endpoint
app.post('/api/forensics/analyze', async (req, res) => {
  try {
    const { imageBase64, mimeType, filename, fileSizeBytes, dimensions } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const cleanMimeType = mimeType || 'image/jpeg';
    // Remove data:image/...;base64, prefix if present
    const base64Data = imageBase64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '');

    const ai = getGeminiClient();

    const prompt = `You are a Senior Digital Media Forensics Investigator specializing in AI-generated imagery detection and photo manipulation analysis (referencing principles of Error Level Analysis, deconvolution artifacts, Photo Response Non-Uniformity PRNU, bilateral skin smoothing, and GAN/diffusion model signatures).

Analyze the provided image with rigorous forensic scrutiny.

You must evaluate:
1. AI Generation Markers:
   - Synthetic generation cues: Diffusion latent noise residuals, GAN checkerboard patterns, texture dissolution, plastic skin appearance, lack of pore structure.
   - Anatomical and semantic consistency: Pupil roundness, iris striation, corneal light reflection angles, teeth alignment, ear cartilage, fingers/hands, accessories/clothing coherence.
   - Optical and geometric consistency: Natural lens depth-of-field vs synthetic flat/gaussian blur, perspective vanishing points, shadows and specular highlights agreement with light source.
   - Background fidelity: Repetition, surreal logic, blurred transitions.
   - Probable generator architecture: e.g. Midjourney v6, Stable Diffusion XL, Flux.1, DALL-E 3, StyleGAN, or Authentic Camera.

2. Digital Filter Detection:
   - Beautification & Skin Smoothing (bilateral filtering, airbrushing)
   - Saturation & Vibrance Boost (color grading, LUTs)
   - High-Pass Edge Sharpening (haloing, ringing artifacts)
   - Vignette & Contrast S-curve manipulation
   - Synthetic Bokeh / Computational Portrait Blur
   - Multiple Compression Artifacts (JPEG double compression indicators)

3. Exact Bounding Zones:
   - Identify 2 to 6 specific regions of interest on the image where forensic evidence or anomalies are concentrated.
   - Provide coordinates in percentage normalized scale (0 to 100): x (from left 0-100), y (from top 0-100), width (0-100), height (0-100).

4. Numerical Confidence Scores (0 to 100%):
   - overallScore: Likelihood of being AI-Generated (0 = 100% Authentic Camera capture, 100 = 100% AI Generated).
   - verdict: Exactly one of: 'AI_GENERATED' | 'HIGHLY_SUSPICIOUS' | 'LIKELY_AUTHENTIC' | 'AUTHENTIC' | 'HEAVILY_FILTERED'.
   - verdictConfidence: Confidence percentage in the stated verdict.

Return ONLY a valid JSON object strictly matching this schema:
{
  "overallScore": number, // 0 - 100
  "verdict": "AI_GENERATED" | "HIGHLY_SUSPICIOUS" | "LIKELY_AUTHENTIC" | "AUTHENTIC" | "HEAVILY_FILTERED",
  "verdictConfidence": number, // 0 - 100
  "verdictSummary": string, // 2-3 concise sentences detailing forensic conclusions
  "detectedModelFamily": string, // e.g. "Flux / Midjourney v6" or "DSLR / Optical Sensor"
  "scoresBreakdown": {
    "aiProbability": number, // 0 - 100
    "authenticityConfidence": number, // 0 - 100
    "manipulationConfidence": number, // 0 - 100
    "filterConfidence": number // 0 - 100
  },
  "aiMarkers": [
    {
      "id": string,
      "category": "anatomy" | "texture" | "lighting" | "frequency" | "geometry" | "coherence" | "artifact",
      "name": string,
      "severity": "high" | "medium" | "low",
      "description": string,
      "evidence": string,
      "boundingZone": {
        "x": number, // 0 - 100
        "y": number, // 0 - 100
        "width": number, // 0 - 100
        "height": number, // 0 - 100
        "label": string,
        "category": "anatomy" | "texture" | "lighting" | "frequency" | "geometry" | "artifact"
      }
    }
  ],
  "filtersDetected": [
    {
      "id": string,
      "name": string,
      "detected": boolean,
      "confidence": number, // 0 - 100
      "estimatedIntensity": string,
      "details": string,
      "type": "beauty_smoothing" | "saturation_color" | "sharpening" | "vignette_contrast" | "bokeh_blur" | "compression_artifact" | "other"
    }
  ],
  "technicalMetrics": {
    "elaDiscrepancy": string,
    "noiseConsistency": string,
    "frequencyArtifacts": string,
    "chromaticLighting": string,
    "metadataInspection": {
      "hasExif": boolean,
      "softwareTag": string,
      "dimensions": string,
      "colorSpace": string,
      "cameraModel": string,
      "notes": string
    },
    "recommendations": [string]
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: cleanMimeType,
              data: base64Data,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '';
    let parsedResult;
    try {
      parsedResult = JSON.parse(responseText.trim());
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', responseText);
      // Fallback extraction
      const match = responseText.match(/\{[\s\S]*\}/);
      if (match) {
        parsedResult = JSON.parse(match[0]);
      } else {
        throw new Error('Model did not return valid JSON');
      }
    }

    // Attach metadata
    const finalReport = {
      ...parsedResult,
      analyzedAt: new Date().toISOString(),
      imageInfo: {
        filename: filename || 'uploaded_image',
        fileSizeBytes: fileSizeBytes || Math.round(base64Data.length * 0.75),
        dimensions: dimensions || { width: 1024, height: 1024 },
        aspectRatio: dimensions ? `${dimensions.width}:${dimensions.height}` : '1:1',
      },
    };

    return res.json(finalReport);
  } catch (err: any) {
    console.error('Forensic analysis error:', err);
    return res.status(500).json({
      error: err.message || 'Forensic analysis failed',
      details: err.stack,
    });
  }
});

// Start server with Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Image Forensics server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
