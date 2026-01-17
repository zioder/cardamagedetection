'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Loader2, DollarSign, Car, BadgeAlert, Layers, Image as ImageIcon, ChevronDown } from 'lucide-react';
import Navbar from '../components/Navbar';
import UploadZone from '../components/UploadZone';
import AnalysisCard from '../components/AnalysisCard';
import { cn } from '../lib/utils';

interface Prediction {
  class: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

const CURRENCIES = [
  { code: 'TND', symbol: 'DT' },
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
];

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [currency, setCurrency] = useState('TND');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<string>('idle');

  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [annotatedImage, setAnnotatedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [repairedImage, setRepairedImage] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [sources, setSources] = useState<any[]>([]);

  const [verifying, setVerifying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [overrideAnalysis, setOverrideAnalysis] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    status: 'VERIFIED' | 'REJECTED' | 'RISKY';
    confidence: number;
    riskScore: number;
    processingTime: number;
    analysis: any;
    summary: any;
  } | null>(null);

  const handleImageSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target?.result as string;
      setImage(imageData);
      resetState();

      console.log('[Auth] Starting check for:', file.name);
      setVerifying(true);
      setVerificationResult(null);

      try {
        const fetchPromise = fetch('/api/check-authenticity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: imageData }),
          cache: 'no-store'
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), 25000)
        );

        const res = await Promise.race([fetchPromise, timeoutPromise]) as Response;
        const data = await res.json();
        console.log('[Auth] Response:', data);

        setVerificationResult(data);
      } catch (err: any) {
        console.error("[Auth] Error:", err);
        setVerificationResult({
          status: 'RISKY',
          confidence: 0,
          riskScore: 100,
          processingTime: 0,
          analysis: null,
          summary: {
            recommendation: "Security protocol timeout. Manual review required.",
            totalFindings: 0,
            criticalCount: 0,
            warningCount: 0
          }
        });
      } finally {
        setVerifying(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const resetState = () => {
    setPredictions([]);
    setAnnotatedImage(null);
    setAnalysis(null);
    setRepairedImage(null);
    setGenError(null);
    setSources([]);
    setStep('idle');
    setVerificationResult(null);
  };

  const handleClear = () => {
    setImage(null);
    resetState();
  };

  const runAnalysis = async () => {
    if (!image) return;
    setLoading(true);
    setGenError(null);

    try {
      // 1. Detect
      setStep('detect');
      const detRes = await fetch('/api/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image })
      });
      const detData = await detRes.json();

      if (!detRes.ok) throw new Error(detData.details || detData.error || "Detection failed");

      setPredictions(detData.predictions || []);
      setAnnotatedImage(detData.annotatedImage || null);

      // 2. Analyze (with Search Grounding)
      setStep('analyze');
      const anlRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image,
          annotatedImage: detData.annotatedImage,
          predictions: detData.predictions,
          currency
        })
      });
      const anlData = await anlRes.json();

      if (!anlRes.ok) throw new Error(anlData.details || anlData.error || "Analysis failed");

      setAnalysis(anlData.analysis);
      setSources(anlData.sources || []);

      // 3. Generate
      setStep('generate');
      if (detData.annotatedImage) {
        const genRes = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image,
            annotatedImage: detData.annotatedImage,
            carModel: anlData.analysis?.carModel,
            damages: anlData.analysis?.damages
          })
        });
        const genData = await genRes.json();

        if (!genRes.ok) {
          setGenError(genData.details || genData.error || "Generation failed");
        } else if (genData.generatedImage) {
          setRepairedImage(genData.generatedImage);
        } else {
          setGenError(genData.message || "Model did not return image data");
        }
      } else {
        setGenError("No annotated image available for reference");
      }

      setStep('done');
    } catch (e: any) {
      console.error(e);
      alert(e.message || "An error occurred during analysis.");
    } finally {
      setLoading(false);
    }
  };

  const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || 'DT';

  return (
    <main className="min-h-screen relative overflow-x-hidden pb-40">
      {/* Dynamic Background */}
      <div className="fixed inset-0 bg-[#030303] -z-20" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,#1e1b4b,transparent_70%)] opacity-50 -z-10" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[140%] h-[500px] bg-violet-600/10 blur-[120px] rounded-full -z-10 animate-pulse" />

      <Navbar />

      <div className="container mx-auto px-6 pt-32">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-20 space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase font-bold tracking-[0.2em] text-violet-300 backdrop-blur-xl"
          >
            <Sparkles className="w-4 h-4" />
            <span>Next-Gen Damage Intelligence</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black tracking-tighter text-white leading-[0.9]"
          >
            Professional <br />
            <span className="text-gradient">Automotive Audit.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto font-medium"
          >
            Upload high-resolution vehicle photos for instant detection,
            grounded cost estimation, and generative restoration.
          </motion.p>
        </div>

        {/* Upload & Controls */}
        <div className="max-w-5xl mx-auto mb-24">
          <UploadZone
            onImageSelect={handleImageSelect}
            selectedImage={image}
            onClear={handleClear}
          />

          <AnimatePresence mode="wait">
            {image && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-10"
              >
                <div className="flex flex-col gap-4">
                  <div className="bg-white/[0.02] border border-white/5 p-5 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-white/5 rounded-lg text-gray-400 border border-white/5">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.15em] text-gray-500 font-bold mb-1">Currency</label>
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          className="bg-transparent text-base font-bold text-white focus:outline-none cursor-pointer appearance-none pr-6 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlPSIjNmQ2ZDZkIiBzdHJva2Utd2lkdGg9IjIiPjxwYXRoIGQ9Ik02IDlsNiA2IDYtNiIvPjwvc3ZnPg==')] bg-no-repeat bg-[right_center] bg-[length:1rem]"
                        >
                          {CURRENCIES.map(c => (
                            <option key={c.code} value={c.code} className="bg-slate-900">{c.code} ({c.symbol})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      disabled={loading || verifying || !image}
                      onClick={runAnalysis}
                      className="group relative px-8 py-3.5 rounded-xl bg-violet-600 font-black text-white uppercase tracking-widest text-[10px] overflow-hidden hover:bg-violet-700 disabled:bg-white/5 disabled:text-gray-600 transition-all shadow-[0_0_20px_-5px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_-5px_rgba(139,92,246,0.5)] active:scale-95"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      <div className="relative flex items-center gap-3">
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        <span>{step === 'idle' ? 'Start Protocol' : step === 'done' ? 'Run Again' : 'Executing...'}</span>
                      </div>
                    </button>
                  </div>

                  {verifying ? (
                    <div className="flex items-center gap-2.5 px-4 py-3 bg-white/[0.02] border border-white/5 rounded-lg">
                      <div className="relative">
                        <div className="w-4 h-4 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                        <div className="absolute inset-0 blur-sm bg-violet-500/20 rounded-full animate-pulse" />
                      </div>
                      <span className="uppercase tracking-[0.15em] text-[10px] text-gray-400 font-bold">Verifying Authenticity...</span>
                    </div>
                  ) : verificationResult ? (
                    <div className="flex flex-col gap-3 w-full">
                      {/* Status Header */}
                      <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                          <div className="space-y-1">
                            <div className={cn(
                              "inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border",
                              verificationResult.status === 'VERIFIED' ? "bg-green-500/10 border-green-500/20 text-green-400" :
                                verificationResult.status === 'REJECTED' ? "bg-red-500/10 border-red-500/20 text-red-400" :
                                  "bg-amber-500/10 border-amber-500/20 text-amber-400"
                            )}>
                              {verificationResult.status}
                            </div>
                            <h4 className="text-lg font-black text-white tracking-tight">Authenticity Verification</h4>
                          </div>

                          <div className="flex items-center gap-6">
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">Confidence</p>
                              <p className="text-base font-black text-white">{verificationResult.confidence}%</p>
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">Processing</p>
                              <p className="text-base font-black text-white">{(verificationResult.processingTime / 1000).toFixed(2)}s</p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-white/5">
                          <p className="text-sm text-gray-300 leading-relaxed">
                            {verificationResult.summary?.recommendation || 'Analysis complete.'}
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-3 pt-4">
                          <div className="text-center p-3 rounded-lg bg-white/[0.02]">
                            <p className="text-2xl font-black text-white">{verificationResult.summary?.totalFindings || 0}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Total Findings</p>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-white/[0.02]">
                            <p className="text-2xl font-black text-red-400">{verificationResult.summary?.criticalCount || 0}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Critical</p>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-white/[0.02]">
                            <p className="text-2xl font-black text-amber-400">{verificationResult.summary?.warningCount || 0}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Warnings</p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all group"
                      >
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-white transition-colors">
                          {showDetails ? 'Hide Technical Report' : 'View Full Security Report'}
                        </span>
                        <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform duration-300", showDetails && "rotate-180")} />
                      </button>

                      {showDetails && verificationResult.analysis && (
                        <div className="space-y-4">
                          {/* AI Detection Summary */}
                          {(verificationResult as any).aiDetection && (
                            <div className="rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden">
                              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.03]">
                                <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">AI Detection Analysis</span>
                                <span className={cn(
                                  "text-[10px] font-black px-2 py-1 rounded-full",
                                  (verificationResult as any).aiDetection.isLikelyAI 
                                    ? "bg-red-500/20 text-red-400" 
                                    : "bg-green-500/20 text-green-400"
                                )}>
                                  {(verificationResult as any).aiDetection.isLikelyAI ? 'AI DETECTED' : 'AUTHENTIC'}
                                </span>
                              </div>
                              <div className="p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500">Detection Confidence</span>
                                  <span className="text-sm font-bold text-white">{(verificationResult as any).aiDetection.confidence}%</span>
                                </div>
                                {(verificationResult as any).aiDetection.detectionMethods?.length > 0 && (
                                  <div>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Detection Methods Used</p>
                                    <div className="flex flex-wrap gap-2">
                                      {(verificationResult as any).aiDetection.detectionMethods.map((method: string, i: number) => (
                                        <span key={i} className="px-2 py-1 text-[10px] font-bold bg-violet-500/10 text-violet-300 rounded-md border border-violet-500/20">
                                          {method.replace(/_/g, ' ')}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {(verificationResult as any).aiDetection.primaryIndicators?.length > 0 && (
                                  <div>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Primary Indicators</p>
                                    <div className="space-y-2">
                                      {(verificationResult as any).aiDetection.primaryIndicators.map((indicator: string, i: number) => (
                                        <div key={i} className="flex items-start gap-2 text-sm">
                                          <span className="text-amber-500">•</span>
                                          <span className="text-gray-300">{indicator}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Camera & Device Info */}
                          {verificationResult.analysis.metadata && (
                            <div className="rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden">
                              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.03]">
                                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Device & Location Info</span>
                                <div className="flex gap-2">
                                  {verificationResult.analysis.metadata.hasEXIF && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-green-500/20 text-green-400 rounded">EXIF ✓</span>
                                  )}
                                  {verificationResult.analysis.metadata.hasGPS && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">GPS ✓</span>
                                  )}
                                </div>
                              </div>
                              <div className="p-4">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                  {verificationResult.analysis.metadata.cameraInfo?.make && (
                                    <div>
                                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">Camera Make</p>
                                      <p className="text-sm font-bold text-white">{verificationResult.analysis.metadata.cameraInfo.make}</p>
                                    </div>
                                  )}
                                  {verificationResult.analysis.metadata.cameraInfo?.model && (
                                    <div>
                                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">Camera Model</p>
                                      <p className="text-sm font-bold text-white">{verificationResult.analysis.metadata.cameraInfo.model}</p>
                                    </div>
                                  )}
                                  {verificationResult.analysis.metadata.cameraInfo?.software && (
                                    <div>
                                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">Software</p>
                                      <p className="text-sm font-bold text-white">{verificationResult.analysis.metadata.cameraInfo.software}</p>
                                    </div>
                                  )}
                                  {verificationResult.analysis.metadata.cameraInfo?.lensModel && (
                                    <div>
                                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">Lens</p>
                                      <p className="text-sm font-bold text-white">{verificationResult.analysis.metadata.cameraInfo.lensModel}</p>
                                    </div>
                                  )}
                                  {verificationResult.analysis.metadata.timestamps?.exifDateTimeOriginal && (
                                    <div>
                                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">Date Taken</p>
                                      <p className="text-sm font-bold text-white">
                                        {new Date(verificationResult.analysis.metadata.timestamps.exifDateTimeOriginal).toLocaleDateString()}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                
                                {/* GPS Coordinates */}
                                {verificationResult.analysis.metadata.gpsInfo?.latitude && verificationResult.analysis.metadata.gpsInfo?.longitude && (
                                  <div className="mt-4 pt-4 border-t border-white/5">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">📍 GPS Coordinates</p>
                                    <div className="flex flex-wrap items-center gap-4">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400">Lat:</span>
                                        <span className="text-sm font-mono font-bold text-white">
                                          {verificationResult.analysis.metadata.gpsInfo.latitude.toFixed(6)}°
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400">Lng:</span>
                                        <span className="text-sm font-mono font-bold text-white">
                                          {verificationResult.analysis.metadata.gpsInfo.longitude.toFixed(6)}°
                                        </span>
                                      </div>
                                      {verificationResult.analysis.metadata.gpsInfo.altitude && (
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-gray-400">Alt:</span>
                                          <span className="text-sm font-mono font-bold text-white">
                                            {verificationResult.analysis.metadata.gpsInfo.altitude.toFixed(1)}m
                                          </span>
                                        </div>
                                      )}
                                      <a 
                                        href={`https://www.google.com/maps?q=${verificationResult.analysis.metadata.gpsInfo.latitude},${verificationResult.analysis.metadata.gpsInfo.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-auto px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                                      >
                                        View on Map →
                                      </a>
                                    </div>
                                  </div>
                                )}
                                
                                {!verificationResult.analysis.metadata.hasEXIF && !verificationResult.analysis.metadata.cameraInfo?.make && (
                                  <p className="text-sm text-gray-500 italic">No camera/device information available</p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Forensics Analysis */}
                          <div className="rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.03]">
                              <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Forensic Analysis</span>
                            </div>
                            <div className="p-4 space-y-4">
                              {/* Forensic Metrics */}
                              {verificationResult.analysis.forensics && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                  {verificationResult.analysis.forensics.elaAnalysis && (
                                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                                      <p className="text-[9px] text-gray-500 uppercase tracking-widest">ELA Variance</p>
                                      <p className={cn(
                                        "text-lg font-black",
                                        verificationResult.analysis.forensics.elaAnalysis.hasManipulation ? "text-red-400" : "text-green-400"
                                      )}>
                                        {verificationResult.analysis.forensics.elaAnalysis.variance?.toFixed(1) || 'N/A'}
                                      </p>
                                    </div>
                                  )}
                                  {verificationResult.analysis.forensics.textureAnalysis && (
                                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                                      <p className="text-[9px] text-gray-500 uppercase tracking-widest">Texture Natural</p>
                                      <p className={cn(
                                        "text-lg font-black",
                                        verificationResult.analysis.forensics.textureAnalysis.naturalness > 50 ? "text-green-400" : "text-red-400"
                                      )}>
                                        {verificationResult.analysis.forensics.textureAnalysis.naturalness?.toFixed(0) || 'N/A'}%
                                      </p>
                                    </div>
                                  )}
                                  {verificationResult.analysis.forensics.frequencyAnalysis && (
                                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                                      <p className="text-[9px] text-gray-500 uppercase tracking-widest">Freq Anomalies</p>
                                      <p className={cn(
                                        "text-lg font-black",
                                        verificationResult.analysis.forensics.frequencyAnalysis.hasAnomalies ? "text-red-400" : "text-green-400"
                                      )}>
                                        {verificationResult.analysis.forensics.frequencyAnalysis.hasAnomalies ? 'Yes' : 'No'}
                                      </p>
                                    </div>
                                  )}
                                  {verificationResult.analysis.forensics.aiArtifactAnalysis && (
                                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                                      <p className="text-[9px] text-gray-500 uppercase tracking-widest">AI Artifacts</p>
                                      <p className={cn(
                                        "text-lg font-black",
                                        verificationResult.analysis.forensics.aiArtifactAnalysis.hasArtifacts ? "text-red-400" : "text-green-400"
                                      )}>
                                        {verificationResult.analysis.forensics.aiArtifactAnalysis.hasArtifacts ? 'Found' : 'None'}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Forensics Findings */}
                              {verificationResult.analysis.forensics?.findings?.length > 0 ? (
                                <div className="space-y-2">
                                  {verificationResult.analysis.forensics.findings.map((f: any, i: number) => (
                                    <div key={i} className={cn(
                                      "flex items-start gap-3 p-3 rounded-lg border",
                                      f.type === 'critical' ? "bg-red-500/10 border-red-500/20" : 
                                      f.type === 'warning' ? "bg-amber-500/5 border-amber-500/10" : 
                                      "bg-white/[0.02] border-white/5"
                                    )}>
                                      <div className={cn(
                                        "mt-1 w-2 h-2 rounded-full flex-shrink-0", 
                                        f.type === 'critical' ? "bg-red-500" : 
                                        f.type === 'warning' ? "bg-amber-500" : "bg-blue-500"
                                      )} />
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <p className="text-sm text-gray-200 font-medium">{f.message}</p>
                                          <span className={cn(
                                            "text-[9px] font-bold px-1.5 py-0.5 rounded",
                                            f.type === 'critical' ? "bg-red-500/20 text-red-400" : 
                                            f.type === 'warning' ? "bg-amber-500/20 text-amber-400" : 
                                            "bg-blue-500/20 text-blue-400"
                                          )}>
                                            {f.severity}
                                          </span>
                                        </div>
                                        {f.details && <p className="text-xs text-gray-500 mt-1">{f.details}</p>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500 italic">No forensic issues detected</p>
                              )}
                            </div>
                          </div>

                          {/* Metadata Findings */}
                          {verificationResult.analysis.metadata?.findings?.length > 0 && (
                            <div className="rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden">
                              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.03]">
                                <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Metadata Findings</span>
                              </div>
                              <div className="p-4 space-y-2">
                                {verificationResult.analysis.metadata.findings.map((f: any, i: number) => (
                                  <div key={i} className={cn(
                                    "flex items-start gap-3 p-3 rounded-lg border",
                                    f.type === 'critical' ? "bg-red-500/10 border-red-500/20" : 
                                    f.type === 'warning' ? "bg-amber-500/5 border-amber-500/10" : 
                                    "bg-white/[0.02] border-white/5"
                                  )}>
                                    <div className={cn(
                                      "mt-1 w-2 h-2 rounded-full flex-shrink-0", 
                                      f.type === 'critical' ? "bg-red-500" : 
                                      f.type === 'warning' ? "bg-amber-500" : "bg-blue-500"
                                    )} />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <p className="text-sm text-gray-200 font-medium">{f.message}</p>
                                        <span className={cn(
                                          "text-[9px] font-bold px-1.5 py-0.5 rounded",
                                          f.type === 'critical' ? "bg-red-500/20 text-red-400" : 
                                          f.type === 'warning' ? "bg-amber-500/20 text-amber-400" : 
                                          "bg-blue-500/20 text-blue-400"
                                        )}>
                                          {f.severity}
                                        </span>
                                      </div>
                                      {f.details && <p className="text-xs text-gray-500 mt-1">{f.details}</p>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-20 h-0.5 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        className="h-full bg-white/20"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results Section */}
        <AnimatePresence>
          {step !== 'idle' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-24"
            >
              <div className="space-y-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between px-2">
                      <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <span className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-black ring-1 ring-blue-500/20">01</span>
                        Initial Feed
                      </h3>
                      <ImageIcon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="relative group rounded-[2.5rem] overflow-hidden bg-white/5 border border-white/10 aspect-[4/3] sm:aspect-video shadow-2xl">
                      {image && <img src={image} alt="Original" className="w-full h-full object-cover" />}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between px-2">
                      <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <span className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center font-black ring-1 ring-red-500/20">02</span>
                        Intelligence Layer
                      </h3>
                      <Layers className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="relative rounded-[2.5rem] overflow-hidden bg-black/40 border border-white/10 aspect-[4/3] sm:aspect-video flex items-center justify-center shadow-2xl">
                      {annotatedImage ? (
                        <img src={annotatedImage} alt="Annotated" className="w-full h-full object-contain" />
                      ) : (
                        <div className="flex flex-col items-center gap-4 text-gray-500 font-bold">
                          {loading && step === 'detect' ? (
                            <Loader2 className="w-10 h-10 animate-spin text-red-500/50" />
                          ) : <BadgeAlert className="w-10 h-10 opacity-20" />}
                          <span className="uppercase text-xs tracking-widest">Neural Scanning...</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="space-y-8 max-w-6xl mx-auto"
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-4 justify-center underline decoration-green-500/30 decoration-8 underline-offset-[12px]">
                      <span className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-400 flex items-center justify-center font-black ring-1 ring-green-500/20 shadow-lg shadow-green-900/20">03</span>
                      Digital Restoration
                    </h3>
                  </div>

                  <div className="relative rounded-[3rem] overflow-hidden bg-[#050505] border-2 border-white/10 aspect-video flex items-center justify-center shadow-2xl">
                    {repairedImage ? (
                      <img src={repairedImage} alt="Repaired" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-6 text-gray-500">
                        {loading && step === 'generate' ? (
                          <span className="uppercase text-xs tracking-[0.4em] font-black text-green-500/50">Processing Pixels...</span>
                        ) : genError ? (
                          <span className="text-xs font-bold text-red-500">{genError}</span>
                        ) : (
                          <ImageIcon className="w-16 h-16 opacity-20" />
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {analysis && (
                <div className="max-w-6xl mx-auto">
                  <AnalysisCard
                    analysis={analysis}
                    currencySymbol={currencySymbol}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
