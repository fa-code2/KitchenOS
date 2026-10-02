import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  X, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Trash2, 
  Layers, 
  Scan, 
  Loader2,
  ShieldCheck,
  Plus,
  RefreshCw,
  Info,
  Video,
  VideoOff
} from 'lucide-react';
import { api } from '../services/api';

const SAMPLE_PRESETS = [
  {
    id: 'citrus',
    title: '🍊 Citrus & Lemons',
    subtitle: 'Fresh Lemons, Oranges, Limes',
    imageUrl: 'https://images.unsplash.com/photo-1546548970-71785318a17b?auto=format&fit=crop&w=1000&q=80'
  },
  {
    id: 'fruits',
    title: '🍎 Mixed Fruit Haul',
    subtitle: 'Apples, Bananas, Citrus, Produce',
    imageUrl: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=1000&q=80'
  },
  {
    id: 'avocado_tomato',
    title: '🥑 Avocado & Salad Bowl',
    subtitle: 'Avocados, Fresh Greens, Produce',
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1000&q=80'
  },
  {
    id: 'veggies',
    title: '🥦 Crisp Market Veggies',
    subtitle: 'Broccoli, Greens, Carrots, Produce',
    imageUrl: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?auto=format&fit=crop&w=1000&q=80'
  }
];

export default function VisionScanModal({ isOpen, onClose, onImportSuccess }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'camera' | 'presets'
  const [isScanning, setIsScanning] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [detectedItems, setDetectedItems] = useState([]);
  const [scanMetadata, setScanMetadata] = useState(null);
  const [error, setError] = useState(null);

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Stop camera when modal closes or unmounts
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Camera access unavailable. Check browser permissions or use file upload.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const captureFrameFromCamera = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const displayUrl = canvas.toDataURL('image/jpeg');
        stopCamera();
        runScanOnBlob(blob, displayUrl);
      }
    }, 'image/jpeg', 0.90);
  };

  if (!isOpen) return null;

  const runScanOnBlob = async (blob, displayUrl) => {
    setIsScanning(true);
    setError(null);
    setPreviewImage(displayUrl);

    try {
      const formData = new FormData();
      formData.append('file', blob, 'scan_input.jpg');
      const res = await api.scanGroceryImage(formData);

      setDetectedItems(res.items || []);
      setScanMetadata({
        count: res.detected_count,
        time: res.processing_time_ms,
        model: res.model_used
      });
    } catch (err) {
      console.error(err);
      setError('Vision inference encountered an issue. Try another photo or adjust lighting.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      runScanOnBlob(file, event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = async (preset) => {
    setIsScanning(true);
    setError(null);
    setPreviewImage(preset.imageUrl);

    try {
      const response = await fetch(preset.imageUrl);
      const blob = await response.blob();
      await runScanOnBlob(blob, preset.imageUrl);
    } catch (err) {
      try {
        const res = await api.scanGroceryImage(new FormData());
        setDetectedItems(res.items || []);
        setScanMetadata({
          count: res.detected_count,
          time: res.processing_time_ms,
          model: res.model_used
        });
      } catch (e) {
        setError('Sample scan failed.');
      } finally {
        setIsScanning(false);
      }
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...detectedItems];
    updated[index][field] = value;
    setDetectedItems(updated);
  };

  const handleRemoveItem = (index) => {
    setDetectedItems(detectedItems.filter((_, i) => i !== index));
  };

  const handleAddNewItem = () => {
    setDetectedItems([
      ...detectedItems,
      {
        name: 'Fresh Produce Item',
        category: 'Produce',
        confidence: 0.95,
        estimated_shelf_life_days: 7,
        recommended_location: 'Fridge',
        suggested_quantity: 1.0,
        suggested_unit: 'units',
        storage_tip: 'Store in refrigerator crisper drawer'
      }
    ]);
  };

  const handleConfirmImport = async () => {
    try {
      const payload = detectedItems.map(item => ({
        name: item.name,
        category: item.category,
        quantity: parseFloat(item.suggested_quantity || 1),
        unit: item.suggested_unit || 'units',
        location: item.recommended_location || 'Fridge',
        confidence: item.confidence
      }));
      await api.bulkImportScanned(payload);
      onImportSuccess();
      onClose();
    } catch (err) {
      setError('Failed to import items into pantry.');
    }
  };

  const resetScan = () => {
    setPreviewImage(null);
    setDetectedItems([]);
    setScanMetadata(null);
    setError(null);
    if (activeTab === 'camera') {
      startCamera();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-[#FFFDF8] rounded-3xl border-2 border-[#E6DBC8] shadow-2xl p-6 sm:p-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E6DBC8]">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-[#A84323]/10 text-[#A84323] flex items-center justify-center border border-[#A84323]/20 shadow-xs">
              <Camera className="w-6 h-6 text-[#A84323]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#2D1F18] font-serif flex items-center gap-2">
                <span>AI Vision & Grocery Scanner</span>
                <span className="text-[10px] font-bold tracking-wider uppercase bg-[#A84323]/10 text-[#A84323] px-2.5 py-0.5 rounded-full border border-[#A84323]/25">
                  Gemini Vision AI
                </span>
              </h3>
              <p className="text-xs text-[#5C4435] font-medium">
                Multimodal food item detection with automatic shelf-life and storage recommendations
              </p>
            </div>
          </div>
          <button
            onClick={() => { stopCamera(); onClose(); }}
            className="p-2 rounded-xl text-[#8A7667] hover:text-[#2D1F18] hover:bg-[#FAF5EB] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scan Selection Modes */}
        {!previewImage ? (
          <div className="mt-6 space-y-6">
            {/* Tab navigation */}
            <div className="flex items-center space-x-2 p-1 bg-[#FAF5EB] rounded-2xl border border-[#E6DBC8] max-w-md mx-auto">
              <button
                type="button"
                onClick={() => { setActiveTab('upload'); stopCamera(); }}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'upload'
                    ? 'bg-[#A84323] text-white shadow-md shadow-[#A84323]/20'
                    : 'text-[#6B5344] hover:text-[#2D1F18]'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Upload File</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('camera'); startCamera(); }}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'camera'
                    ? 'bg-[#A84323] text-white shadow-md shadow-[#A84323]/20'
                    : 'text-[#6B5344] hover:text-[#2D1F18]'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>Live Camera</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('presets'); stopCamera(); }}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'presets'
                    ? 'bg-[#A84323] text-white shadow-md shadow-[#A84323]/20'
                    : 'text-[#6B5344] hover:text-[#2D1F18]'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Demo Presets</span>
              </button>
            </div>

            {/* TAB 1: Upload File */}
            {activeTab === 'upload' && (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group cursor-pointer rounded-2xl border-2 border-dashed border-[#E6DBC8] hover:border-[#A84323]/60 p-10 text-center transition-all bg-[#FAF5EB]/50 hover:bg-[#FAF5EB] flex flex-col items-center justify-center"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-3xl bg-[#A84323]/10 text-[#A84323] flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-[#A84323]/20 transition-all border border-[#A84323]/25">
                  <Upload className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-[#2D1F18] font-serif">Upload Produce Photo or Grocery Haul</h4>
                <p className="text-xs text-[#5C4435] mt-1 max-w-md mx-auto font-medium">
                  Select an image of fruits, vegetables, or pantry staples. Gemini analyzes visible ingredients and extracts their shelf-life estimates.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#A84323] bg-[#A84323]/10 px-3.5 py-1.5 rounded-full border border-[#A84323]/20">
                  <Scan className="w-3.5 h-3.5" />
                  <span>Supports JPG, PNG, WEBP, HEIC</span>
                </div>
              </div>
            )}

            {/* TAB 2: Live Camera */}
            {activeTab === 'camera' && (
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative w-full max-w-lg aspect-video rounded-2xl overflow-hidden border border-[#E6DBC8] bg-black/90 shadow-xl flex items-center justify-center">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                  />

                  {!cameraActive && (
                    <div className="text-center p-6 space-y-3">
                      <VideoOff className="w-10 h-10 text-[#8A7667] mx-auto" />
                      <p className="text-xs text-[#E6DBC8] max-w-xs font-medium">
                        {cameraError || 'Camera is not active. Click below to grant camera permissions.'}
                      </p>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-4 py-2 rounded-xl bg-[#A84323] hover:bg-[#94381C] text-white font-bold text-xs transition-colors shadow-sm"
                      >
                        Enable Camera
                      </button>
                    </div>
                  )}
                </div>

                {cameraActive && (
                  <button
                    type="button"
                    onClick={captureFrameFromCamera}
                    className="flex items-center space-x-2 px-8 py-3 rounded-full bg-[#A84323] hover:bg-[#94381C] text-white font-extrabold text-sm shadow-xl shadow-[#A84323]/25 hover:scale-105 transition-all"
                  >
                    <Camera className="w-5 h-5 text-white" />
                    <span>Capture Photo & Analyze with Gemini AI</span>
                  </button>
                )}
              </div>
            )}

            {/* TAB 3: Test Presets */}
            {activeTab === 'presets' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2 text-xs font-bold text-[#2D1F18] font-serif">
                    <Sparkles className="w-4 h-4 text-[#A84323]" />
                    <span>Instant Food & Grocery Presets:</span>
                  </div>
                  <span className="text-[11px] text-[#8A7667]">Click any preset to run Gemini AI analysis</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {SAMPLE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className="p-3.5 rounded-2xl bg-[#FAF5EB] hover:bg-[#F5EDE1] border border-[#E6DBC8] hover:border-[#A84323]/40 text-left transition-all group flex flex-col justify-between"
                    >
                      <div>
                        <div className="font-bold text-xs text-[#2D1F18] group-hover:text-[#A84323] transition-colors font-serif">
                          {preset.title}
                        </div>
                        <div className="text-[10px] text-[#5C4435] mt-1 font-medium">
                          {preset.subtitle}
                        </div>
                      </div>
                      <div className="mt-3 text-[10px] font-bold text-[#A84323] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <span>Analyze with Gemini</span>
                        <span>→</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        ) : (
          /* Preview and Detection Results View */
          <div className="mt-6 space-y-6">
            
            {/* Clean Image Preview */}
            <div className="relative rounded-2xl overflow-hidden border border-[#E6DBC8] bg-black/85 h-64 flex items-center justify-center">
              <img
                src={previewImage}
                alt="Kitchen Upload Preview"
                className="w-full h-full object-contain"
              />
              
              {isScanning ? (
                <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-10 h-10 text-[#A84323] animate-spin" />
                  <div className="text-center">
                    <p className="text-sm font-bold text-white font-serif">Running Gemini Vision Intelligence...</p>
                    <p className="text-xs text-[#E6DBC8] mt-0.5">Detecting grocery items, shelf-life standards & storage zones</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                    <span className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-black/85 backdrop-blur-md text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-lg">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      {scanMetadata?.model || 'Gemini Vision AI'}
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-white px-3 py-1.5 rounded-xl bg-black/85 backdrop-blur-md border border-white/20">
                      {detectedItems.length} items identified ({scanMetadata?.time || 35}ms)
                    </span>
                  </div>

                  {/* Reset button */}
                  <div className="absolute bottom-3 right-3 flex items-center">
                    <button
                      onClick={resetScan}
                      className="px-3 py-1.5 rounded-xl bg-black/85 backdrop-blur-md text-xs font-semibold text-white hover:text-amber-200 border border-white/20 flex items-center gap-1.5 transition-all shadow-md"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Scan Another Photo</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Detected Items List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-[#2D1F18] font-serif flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#A84323]" />
                  <span>Gemini AI Detected Items</span>
                  <span className="text-xs font-normal text-[#5C4435]">({detectedItems.length})</span>
                </h4>
                <button
                  type="button"
                  onClick={handleAddNewItem}
                  className="px-3 py-1 rounded-xl text-xs font-bold text-[#A84323] bg-[#A84323]/10 hover:bg-[#A84323]/20 border border-[#A84323]/30 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Item</span>
                </button>
              </div>

              {detectedItems.length === 0 && !isScanning ? (
                <div className="p-6 text-center rounded-2xl bg-[#FAF5EB] border border-[#E6DBC8]">
                  <Info className="w-8 h-8 text-[#A84323] mx-auto mb-2 opacity-80" />
                  <p className="text-sm font-bold text-[#2D1F18] font-serif">No distinct food or grocery items detected in this image</p>
                  <p className="text-xs text-[#5C4435] mt-1 max-w-sm mx-auto font-medium">
                    Try uploading a closer photo with clear lighting, or use the "Add Item" button to enter items manually.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {detectedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-[#FAF5EB] border border-[#E6DBC8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#A84323]/40 hover:bg-[#F5EDE1] transition-all"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-9 h-9 rounded-xl bg-[#A84323]/15 text-[#A84323] flex items-center justify-center font-bold text-xs border border-[#A84323]/25 shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                            className="w-full bg-transparent font-bold text-sm text-[#2D1F18] focus:outline-none focus:border-b-2 border-[#A84323] py-0.5"
                          />
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#5C4435] mt-1">
                            <span className="text-emerald-800 font-mono font-bold bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                              {Math.round((item.confidence || 0.9) * 100)}% match
                            </span>
                            <span className="text-[#5C4435] bg-[#EFE7D8] px-2 py-0.5 rounded-md font-medium">
                              Est. {item.estimated_shelf_life_days}d shelf life
                            </span>
                            <span className="text-[#5C4435] font-medium">
                              Category: {item.category}
                            </span>
                            {item.storage_tip && (
                              <span className="text-[#8A7667] italic truncate max-w-xs">
                                • {item.storage_tip}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E6DBC8] shrink-0">
                        <div className="flex items-center space-x-1.5">
                          <input
                            type="number"
                            min="0.5"
                            step="0.5"
                            value={item.suggested_quantity}
                            onChange={(e) => handleItemChange(idx, 'suggested_quantity', e.target.value)}
                            className="w-16 px-2.5 py-1.5 rounded-xl bg-[#FFFDF8] border border-[#E6DBC8] text-xs font-bold text-[#2D1F18] text-center focus:outline-none focus:border-[#A84323]"
                          />
                          <input
                            type="text"
                            value={item.suggested_unit}
                            onChange={(e) => handleItemChange(idx, 'suggested_unit', e.target.value)}
                            className="w-16 px-2 py-1.5 rounded-xl bg-[#FFFDF8] border border-[#E6DBC8] text-xs text-[#5C4435] font-medium text-center focus:outline-none focus:border-[#A84323]"
                          />
                        </div>

                        <select
                          value={item.recommended_location}
                          onChange={(e) => handleItemChange(idx, 'recommended_location', e.target.value)}
                          className="px-2.5 py-1.5 rounded-xl bg-[#FFFDF8] border border-[#E6DBC8] text-xs font-medium text-[#2D1F18] focus:outline-none focus:border-[#A84323]"
                        >
                          <option value="Fridge" className="bg-[#FFFDF8] text-[#2D1F18]">Fridge</option>
                          <option value="Pantry" className="bg-[#FFFDF8] text-[#2D1F18]">Pantry</option>
                          <option value="Freezer" className="bg-[#FFFDF8] text-[#2D1F18]">Freezer</option>
                        </select>

                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className="p-2 rounded-xl text-[#8A7667] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-xs text-rose-800 flex items-center space-x-2 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#E6DBC8]">
              <button
                type="button"
                onClick={() => { stopCamera(); onClose(); }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#8A7667] hover:text-[#2D1F18] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={detectedItems.length === 0 || isScanning}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#A84323] hover:bg-[#94381C] shadow-md shadow-[#A84323]/25 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Check className="w-4 h-4" />
                <span>Import {detectedItems.length} Items to Smart Pantry</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
