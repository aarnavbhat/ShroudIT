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
        html5QrCode = new Html5Qrcode("interactive-camera-view", {
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        });
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

        const qrConfig = {
          fps: 12,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minSide = Math.min(viewfinderWidth, viewfinderHeight);
            const edge = Math.floor(minSide * 0.75);
            return { width: Math.max(edge, 160), height: Math.max(edge, 160) };
          }
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
            scannerRef.current?.clear();
          }).catch(() => {});
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
        if (decodedText.startsWith("openid4vp://presentation?data=")) {
          const rawJson = decodeURIComponent(decodedText.split("?data=")[1]);
          payload = JSON.parse(rawJson);
        } else if (decodedText.startsWith("{")) {
          payload = JSON.parse(decodedText);
        }
      }
      onScanSuccess(payload);
    } catch (e) {
      onScanSuccess(decodedText);
    }
    onClose();
  };

  // Image file upload handler
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode("interactive-camera-view-temp");
      const decodedText = await html5QrCode.scanFile(file, true);
      handleSuccessfulScan(decodedText);
    } catch (err) {
      setCameraError(`Could not detect QR code in uploaded image: ${err.message || err}`);
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
    const simulatedPayload = {
      isSimulatedTap: true,
      timestamp: new Date().toISOString(),
      nonceBinding: currentNonce,
      verifierBinding: verifierDid,
      revealedStatements: [
        { label: "Age ≥ 18", statement: "Holder is 18 years or older", value: true },
        { label: "Bengaluru Resident", statement: "Holder resides within BBMP jurisdiction", value: true }
      ],
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

        {/* Camera Viewport */}
        <div className="relative rounded-2xl bg-black border border-slate-800 overflow-hidden min-h-[240px] flex items-center justify-center">
          <div id="interactive-camera-view" className="w-full h-full"></div>
          <div id="interactive-camera-view-temp" style={{ display: 'none' }}></div>

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
