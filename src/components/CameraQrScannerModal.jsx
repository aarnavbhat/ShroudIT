import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Upload, Sparkles, AlertCircle, CheckCircle2, Zap } from 'lucide-react';

export default function CameraQrScannerModal({ isOpen, onClose, onScanSuccess, currentNonce, verifierDid }) {
  const [cameraError, setCameraError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    setCameraError(null);
    let html5QrCode = null;

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode("interactive-camera-view");
        scannerRef.current = html5QrCode;

        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) {
          setCameraError("No video cameras detected on this device. You can upload a QR image or click 'Simulate Tap' below.");
          return;
        }

        const cameraId = cameras[0].id;
        setIsScanning(true);

        await html5QrCode.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            handleSuccessfulScan(decodedText);
          },
          () => {
            // Frame error - normal while scanning
          }
        );
      } catch (err) {
        setCameraError(`Camera initialization: ${err.message || 'Permission denied or webcam busy'}. Use file upload or test tap.`);
        setIsScanning(false);
      }
    };

    // Small delay to ensure DOM element is mounted
    const timer = setTimeout(startScanner, 200);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen]);

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().then(() => {
            scannerRef.current.clear();
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
      // Parse payload if JSON or OpenID4VP URI
      let payload = decodedText;
      if (decodedText.startsWith("openid4vp://presentation?data=")) {
        const rawJson = decodeURIComponent(decodedText.split("?data=")[1]);
        payload = JSON.parse(rawJson);
      } else if (decodedText.startsWith("{")) {
        payload = JSON.parse(decodedText);
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

        {/* Camera Viewport */}
        <div className="relative rounded-2xl bg-black border border-slate-800 overflow-hidden min-h-[260px] flex items-center justify-center">
          <div id="interactive-camera-view" className="w-full h-full"></div>
          <div id="interactive-camera-view-temp" style={{ display: 'none' }}></div>

          {cameraError && (
            <div className="p-5 text-center space-y-2 z-10 max-w-sm">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="text-xs text-amber-200">{cameraError}</p>
            </div>
          )}

          {/* Animated scan line overlay */}
          {isScanning && !cameraError && (
            <div className="absolute inset-x-8 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-lg shadow-cyan-400 animate-bounce pointer-events-none"></div>
          )}
        </div>

        {/* Action Controls */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center justify-center space-x-2 transition-colors"
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Scan from Image File</span>
            </button>

            <button
              onClick={handleSimulateQuickTap}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black text-xs font-bold uppercase tracking-wider shadow-md shadow-cyan-500/20 hover:brightness-110 flex items-center justify-center space-x-1.5 transition-all"
            >
              <Zap className="w-4 h-4 fill-black" />
              <span>Simulate Instant Tap</span>
            </button>
          </div>

          <p className="text-center text-[10px] text-slate-500 font-mono">
            Aim camera at Resident Wallet QR code on smartphone or monitor
          </p>
        </div>
      </div>
    </div>
  );
}
