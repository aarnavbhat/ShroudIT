import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Camera, 
  X, 
  Upload, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Zap, 
  Clipboard, 
  Smartphone,
  RefreshCw
} from 'lucide-react';

export default function CameraQrScannerModal({ isOpen, onClose, onScanSuccess, currentNonce, verifierDid }) {
  const [cameraError, setCameraError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [manualPasteOpen, setManualPasteOpen] = useState(false);
  const [manualPasteText, setManualPasteText] = useState('');
  const [hasStoredWalletProof, setHasStoredWalletProof] = useState(false);

  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Check if wallet has a stored presentation in localStorage
    try {
      const stored = localStorage.getItem('shroudit_active_presentation');
      setHasStoredWalletProof(!!stored);
    } catch (e) {
      setHasStoredWalletProof(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    setCameraError(null);
    let html5QrCode = null;

    const startScanner = async () => {
      try {
        const viewEl = document.getElementById("interactive-camera-view");
        if (viewEl) viewEl.innerHTML = "";
        html5QrCode = new Html5Qrcode("interactive-camera-view", false);
        scannerRef.current = html5QrCode;

        let cameraIdOrConfig = { facingMode: "environment" };

        try {
          const cameras = await Html5Qrcode.getCameras();
          if (cameras && cameras.length > 0) {
            setAvailableCameras(cameras);
            const chosenId = selectedCameraId || cameras[0].id;
            cameraIdOrConfig = chosenId;
          }
        } catch (camErr) {
          // Camera permission might prompt during start()
        }

        setIsScanning(true);

        // Optimal viewport scanning with flexible square box
        const qrConfig = {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minDim = Math.min(viewfinderWidth, viewfinderHeight);
            return {
              width: Math.max(220, Math.floor(minDim * 0.85)),
              height: Math.max(220, Math.floor(minDim * 0.85))
            };
          },
          aspectRatio: 1.0
        };

        await html5QrCode.start(
          cameraIdOrConfig,
          qrConfig,
          (decodedText) => {
            handleSuccessfulScan(decodedText);
          },
          () => {
            // Frame error normal while scanning
          }
        );
      } catch (err) {
        setCameraError(`Camera Notice: ${err.message || 'Permission denied or webcam busy'}. Use "Load from Wallet", image file, or clipboard paste.`);
        setIsScanning(false);
      }
    };

    const timer = setTimeout(startScanner, 250);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen, selectedCameraId]);

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().then(() => {
            try { scannerRef.current?.clear(); } catch(e) {}
          }).catch(() => {});
        } else {
          try { scannerRef.current?.clear(); } catch(e) {}
        }
      } catch (e) {}
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleSuccessfulScan = (decodedText) => {
    stopScanner();
    try {
      let payload = decodedText;
      if (typeof decodedText === 'string') {
        const trimmed = decodedText.trim();
        if (trimmed.startsWith("openid4vp://presentation?data=")) {
          const rawJson = decodeURIComponent(trimmed.split("?data=")[1]);
          payload = JSON.parse(rawJson);
        } else if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
          payload = JSON.parse(trimmed);
        }
      }
      onScanSuccess(payload);
    } catch (e) {
      onScanSuccess(decodedText);
    }
    onClose();
  };

  // Robust Multi-Stage QR Decoder for Uploaded Photos & Screenshots
  const decodeQrFromImageFile = async (file) => {
    // If user uploaded a JSON export directly
    if (file.type === "application/json" || file.name.endsWith(".json")) {
      const text = await file.text();
      return text;
    }

    const imgUrl = URL.createObjectURL(file);
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error("Unable to read image file"));
      img.src = imgUrl;
    });

    // Strategy 1: Native browser BarcodeDetector (fastest, immune to high-res moiré & angle tilt)
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const barcodes = await detector.detect(img);
        if (barcodes && barcodes.length > 0) {
          URL.revokeObjectURL(imgUrl);
          return barcodes[0].rawValue;
        }
      } catch (e) {}
    }

    const tempContainer = document.getElementById("interactive-camera-view-temp");

    // Strategy 2: Direct scanFile fallback on raw file
    if (tempContainer) tempContainer.innerHTML = "";
    let rawScanner = null;
    try {
      rawScanner = new Html5Qrcode("interactive-camera-view-temp", false);
      const decoded = await rawScanner.scanFile(file, false);
      try { await rawScanner.clear(); } catch(e) {}
      if (decoded) {
        URL.revokeObjectURL(imgUrl);
        return decoded;
      }
    } catch (e) {
      if (rawScanner) {
        try { await rawScanner.clear(); } catch(cErr) {}
      }
    }

    // Strategy 3: Multi-Scale Canvas Downsampling (essential for high-res 12MP/48MP smartphone photos)
    const testScales = [800, 600, 1100];
    for (const maxDim of testScales) {
      try {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);

        // Try native BarcodeDetector on downsampled canvas
        if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
          try {
            const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
            const barcodes = await detector.detect(canvas);
            if (barcodes && barcodes.length > 0) {
              URL.revokeObjectURL(imgUrl);
              return barcodes[0].rawValue;
            }
          } catch (e) {}
        }

        // Try Html5Qrcode on downsampled blob
        const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.92));
        if (blob) {
          const scaledFile = new File([blob], `scaled_${maxDim}.jpg`, { type: 'image/jpeg' });
          if (tempContainer) tempContainer.innerHTML = "";
          let loopScanner = null;
          try {
            loopScanner = new Html5Qrcode("interactive-camera-view-temp", false);
            const decoded = await loopScanner.scanFile(scaledFile, false);
            try { await loopScanner.clear(); } catch(e) {}
            if (decoded) {
              URL.revokeObjectURL(imgUrl);
              return decoded;
            }
          } catch(loopErr) {
            if (loopScanner) {
              try { await loopScanner.clear(); } catch(cErr) {}
            }
          }
        }
      } catch (err) {
        // try next scale
      }
    }

    URL.revokeObjectURL(imgUrl);
    throw new Error("No QR code detected in this photo. Click '⚡ Load Active Presentation from Wallet' below!");
  };

  // Image file upload handler (e.g. photo taken from phone)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCameraError(null);
    try {
      const decodedText = await decodeQrFromImageFile(file);
      handleSuccessfulScan(decodedText);
    } catch (err) {
      setCameraError(err.message || 'Could not detect QR code in uploaded image.');
    }
  };

  // 1-Click Load from Active Wallet Enclave
  const handleIngestFromWallet = () => {
    try {
      const stored = localStorage.getItem('shroudit_active_presentation');
      if (stored) {
        const parsed = JSON.parse(stored);
        handleSuccessfulScan(parsed);
        return;
      }
    } catch (e) {}
    setCameraError("No active presentation found in Wallet yet. Open /wallet, click 'Derive Fresh BBS+ Proof', then retry.");
  };

  // Clipboard Paste Handler
  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipText = await navigator.clipboard.readText();
        if (clipText && (clipText.startsWith("{") || clipText.startsWith("openid4vp"))) {
          handleSuccessfulScan(clipText);
          return;
        }
      }
    } catch (e) {}
    setManualPasteOpen(true);
  };

  const handleSubmitManualPaste = () => {
    if (manualPasteText.trim()) {
      handleSuccessfulScan(manualPasteText.trim());
    }
  };

  // Quick simulate button for instant demo
  const handleSimulateQuickTap = () => {
    let activeStatements = [
      { label: "Age ≥ 18", statement: "Holder is 18 years or older", value: true },
      { label: "Bengaluru Resident", statement: "Holder resides within BBMP jurisdiction", value: true }
    ];
    let boundV = verifierDid;
    let boundN = currentNonce;

    try {
      const stored = localStorage.getItem('shroudit_active_presentation');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.revealedStatements && parsed.revealedStatements.length > 0) {
          activeStatements = parsed.revealedStatements;
        }
        if (parsed.verifierBinding) boundV = parsed.verifierBinding;
        if (parsed.nonceBinding) boundN = parsed.nonceBinding;
      }
    } catch (e) {}

    const simulatedPayload = {
      isSimulatedTap: true,
      timestamp: new Date().toISOString(),
      nonceBinding: boundN,
      verifierBinding: boundV,
      revealedStatements: activeStatements,
      randomizedCommitment: "0xcomm_quick_tap_" + Math.random().toString(36).substring(2, 8)
    };
    handleSuccessfulScan(simulatedPayload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl glass-panel-glow bg-[#0b101e] border border-cyan-500/40 p-6 shadow-2xl shadow-cyan-950/60 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Live Camera QR Scanner</h3>
              <p className="text-[11px] text-slate-400">OpenID4VP Resident Presentation Capture</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Selector (if multiple cameras exist) */}
        {availableCameras.length > 1 && (
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Camera Source:</span>
            <select
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 text-xs"
            >
              {availableCameras.map(c => (
                <option key={c.id} value={c.id}>{c.label || `Camera ${c.id.substring(0, 6)}...`}</option>
              ))}
            </select>
          </div>
        )}

        {/* Scanning Mobile Screen Guidance Tip */}
        <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-xs text-slate-300 space-y-1.5">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-bold text-cyan-300">Scanning from Phone Screen to Webcam?</span>
          </div>
          <ul className="text-[11px] text-slate-400 space-y-0.5 list-disc list-inside">
            <li><strong className="text-slate-200">Lower phone brightness to ~30%</strong> (prevents camera from being blinded by screen glare)</li>
            <li><strong className="text-slate-200">Hold phone 35–45 cm (1.5 ft) away</strong> (laptop webcams cannot focus closer than that)</li>
            <li><strong className="text-cyan-300">Easiest:</strong> Click <strong className="text-white">"⚡ Load Active Presentation from Wallet"</strong> below for instant 1-click test!</li>
          </ul>
        </div>

        {/* Camera Viewport */}
        <div className="relative rounded-2xl bg-black border border-slate-800 overflow-hidden min-h-[240px] flex items-center justify-center">
          <div id="interactive-camera-view" className="w-full h-full"></div>
          <div id="interactive-camera-view-temp" style={{ position: 'fixed', top: -9999, left: -9999, width: '400px', height: '400px', visibility: 'hidden' }}></div>

          {cameraError && (
            <div className="p-5 text-center space-y-2 z-10 max-w-sm">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="text-xs text-amber-200 leading-relaxed">{cameraError}</p>
            </div>
          )}

          {/* Animated scan line overlay */}
          {isScanning && !cameraError && (
            <div className="absolute inset-x-8 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-lg shadow-cyan-400 animate-bounce pointer-events-none"></div>
          )}
        </div>

        {/* Manual Paste Box (if opened) */}
        {manualPasteOpen && (
          <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/40 space-y-2 animate-fadeIn">
            <span className="text-xs font-semibold text-cyan-300 block">Paste Proof Payload JSON:</span>
            <textarea
              rows={3}
              value={manualPasteText}
              onChange={(e) => setManualPasteText(e.target.value)}
              placeholder='Paste JSON proof from "/wallet" here...'
              className="w-full p-2 rounded-lg bg-black/70 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setManualPasteOpen(false)}
                className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitManualPaste}
                disabled={!manualPasteText.trim()}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-cyan-500 text-black disabled:opacity-50"
              >
                Ingest & Verify
              </button>
            </div>
          </div>
        )}

        {/* Alternative Ingestion Methods for 100% Reliable Testing */}
        <div className="space-y-2 pt-1">
          {/* Primary Quick Button: Load from Wallet Enclave */}
          <button
            onClick={handleIngestFromWallet}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 hover:brightness-110 flex items-center justify-center space-x-2 transition-all"
          >
            <Smartphone className="w-4 h-4 fill-black" />
            <span>⚡ Load Active Presentation from Wallet</span>
          </button>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={handlePasteFromClipboard}
              className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-semibold flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Clipboard className="w-3.5 h-3.5 text-cyan-400" />
              <span>Paste Clipboard</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-semibold flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Upload QR File</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          <p className="text-center text-[10px] text-slate-500 font-mono pt-1">
            Aim camera at Resident Wallet QR, click "Enlarge QR", or use instant wallet load
          </p>
        </div>
      </div>
    </div>
  );
}
