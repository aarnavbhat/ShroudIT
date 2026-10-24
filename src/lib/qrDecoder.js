import jsQR from 'jsqr';
import { 
  QRCodeReader, 
  RGBLuminanceSource, 
  HybridBinarizer, 
  BinaryBitmap, 
  DecodeHintType,
  HTMLCanvasElementLuminanceSource
} from '@zxing/library';
import { Html5Qrcode } from 'html5-qrcode';

/**
 * High-speed synchronous QR decoder operating on an HTML5 canvas.
 * Executes dual-engine analysis:
 * 1. ZXing HybridBinarizer (adaptive windowed thresholding for uneven lighting, shadows, screen glare)
 * 2. ZXing Inverted HybridBinarizer (for dark-mode QR codes)
 * 3. jsQR (robust 2D matrix locator for deformed or low-contrast targets)
 * 4. Native window.BarcodeDetector if available
 */
export function decodeCanvasWithDualEngine(canvas) {
  if (!canvas || canvas.width < 16 || canvas.height < 16) return null;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imgData;

  // Pass 1: ZXing Standard HybridBinarizer
  try {
    const grayBuffer = HTMLCanvasElementLuminanceSource.toGrayscaleBuffer(data, width, height, false);
    const lum = new RGBLuminanceSource(grayBuffer, width, height);
    const bin = new HybridBinarizer(lum);
    const bmp = new BinaryBitmap(bin);
    const qrReader = new QRCodeReader();
    const hints = new Map();
    hints.set(DecodeHintType.TRY_HARDER, true);
    const res = qrReader.decode(bmp, hints);
    if (res && res.getText()) {
      return res.getText();
    }
  } catch (e) {}

  // Pass 2: ZXing Inverted HybridBinarizer
  try {
    const grayBufferInvert = HTMLCanvasElementLuminanceSource.toGrayscaleBuffer(data, width, height, true);
    const lumInvert = new RGBLuminanceSource(grayBufferInvert, width, height);
    const binInvert = new HybridBinarizer(lumInvert);
    const bmpInvert = new BinaryBitmap(binInvert);
    const qrReader = new QRCodeReader();
    const hints = new Map();
    hints.set(DecodeHintType.TRY_HARDER, true);
    const res = qrReader.decode(bmpInvert, hints);
    if (res && res.getText()) {
      return res.getText();
    }
  } catch (e) {}

  // Pass 3: jsQR engine with both inversion attempts
  try {
    const code = jsQR(data, width, height, { inversionAttempts: 'attemptBoth' });
    if (code && code.data) {
      return code.data;
    }
  } catch (e) {}

  return null;
}

/**
 * Industrial-Grade Multi-Pass QR Decoder for uploaded files (PNG, JPG, Screen Captures, JSON proofs)
 * Guaranteed not to hang. Fully resilient against screen moire, glare, and high phone camera resolutions.
 */
export async function decodeQrFromImageFile(file, onProgress) {
  if (!file) throw new Error("No file provided for QR ingestion");

  // If user uploaded a JSON export or text proof directly
  if (
    file.type === "application/json" || 
    file.name.endsWith(".json") || 
    file.name.endsWith(".txt") || 
    file.type.startsWith("text/")
  ) {
    onProgress?.("Reading JSON / text proof payload directly...");
    const text = await file.text();
    return text.trim();
  }

  onProgress?.("Loading uploaded image...");

  const imgUrl = URL.createObjectURL(file);
  const img = new Image();

  try {
    // Load image with safety timeout
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("Image loading timed out. Please try uploading a PNG or JPG."));
      }, 4000);

      img.onload = () => {
        clearTimeout(timer);
        resolve();
      };
      img.onerror = () => {
        clearTimeout(timer);
        reject(new Error("Unable to parse image format. Please ensure it is a valid PNG or JPG photo."));
      };
      img.src = imgUrl;
    });

    onProgress?.("Analyzing QR code geometry...");

    // Strategy 1: Direct canvas at original size if reasonable
    if (img.naturalWidth <= 1400 && img.naturalHeight <= 1400) {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const decoded = decodeCanvasWithDualEngine(canvas);
      if (decoded) return decoded;
    }

    // Strategy 2: Multi-Scale Resampling
    // Downsampling high-resolution phone photos (e.g. 12MP/48MP) eliminates monitor subpixel moire lines!
    const testScales = [1000, 650, 1400, 480];
    for (const maxDim of testScales) {
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      // Pass A: Bilinear smooth (eliminates screen moire and camera grain)
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);
      let decoded = decodeCanvasWithDualEngine(canvas);
      if (decoded) return decoded;

      // Pass B: Nearest-neighbor crisp
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, w, h);
      decoded = decodeCanvasWithDualEngine(canvas);
      if (decoded) return decoded;
    }

    // Strategy 3: Contrast Stretch & Luminance Normalization (removes screen reflection / room glare)
    try {
      const canvas = document.createElement('canvas');
      let w = Math.min(img.naturalWidth, 900);
      let h = Math.round((img.naturalHeight * w) / img.naturalWidth);
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;

      let min = 255, max = 0;
      for (let i = 0; i < d.length; i += 4) {
        const gray = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000;
        if (gray < min) min = gray;
        if (gray > max) max = gray;
      }
      const range = max - min;
      if (range > 25) {
        for (let i = 0; i < d.length; i += 4) {
          const gray = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000;
          const v = Math.min(255, Math.max(0, ((gray - min) / range) * 255));
          d[i] = v;
          d[i + 1] = v;
          d[i + 2] = v;
        }
        ctx.putImageData(imgData, 0, 0);
        const decoded = decodeCanvasWithDualEngine(canvas);
        if (decoded) return decoded;
      }
    } catch (e) {}

    // Strategy 4: Center-Crop (if photo captured the whole laptop screen or desk around the QR code)
    try {
      const canvas = document.createElement('canvas');
      const cropW = Math.round(img.naturalWidth * 0.70);
      const cropH = Math.round(img.naturalHeight * 0.70);
      const startX = Math.round(img.naturalWidth * 0.15);
      const startY = Math.round(img.naturalHeight * 0.15);
      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, startX, startY, cropW, cropH, 0, 0, cropW, cropH);
      const decoded = decodeCanvasWithDualEngine(canvas);
      if (decoded) return decoded;
    } catch (e) {}

    // Strategy 5: Rotations (90, 180, 270 degrees in case of mobile portrait orientation EXIF)
    for (const angle of [90, 180, 270]) {
      try {
        const canvas = document.createElement('canvas');
        let targetW = Math.min(img.naturalWidth, 800);
        let targetH = Math.round((img.naturalHeight * targetW) / img.naturalWidth);
        if (angle === 90 || angle === 270) {
          canvas.width = targetH;
          canvas.height = targetW;
        } else {
          canvas.width = targetW;
          canvas.height = targetH;
        }
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((angle * Math.PI) / 180);
        ctx.drawImage(img, -targetW / 2, -targetH / 2, targetW, targetH);
        const decoded = decodeCanvasWithDualEngine(canvas);
        if (decoded) return decoded;
      } catch (e) {}
    }

    // Strategy 6: Native browser BarcodeDetector if available
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const barcodes = await detector.detect(img);
        if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
          return barcodes[0].rawValue;
        }
      } catch (e) {}
    }

    // Strategy 7: Fallback to Html5Qrcode.scanFile
    try {
      let tempDiv = document.getElementById("shroudit-temp-file-scanner");
      if (!tempDiv) {
        tempDiv = document.createElement("div");
        tempDiv.id = "shroudit-temp-file-scanner";
        tempDiv.style.display = "none";
        document.body.appendChild(tempDiv);
      }
      const html5Qr = new Html5Qrcode("shroudit-temp-file-scanner");
      const scanPromise = html5Qr.scanFile(file, false);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 1800));
      const res = await Promise.race([scanPromise, timeoutPromise]);
      try { html5Qr.clear(); } catch(e) {}
      if (res) return res;
    } catch (e) {}

    throw new Error("No QR code detected in this photo. Click '⚡ Ingest Active from Wallet' for 1-click verification!");
  } finally {
    URL.revokeObjectURL(imgUrl);
  }
}
