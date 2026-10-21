import React, { useState, useRef, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { AppView, SeedAnalysisResult, ChartData } from './types';
import { analyzeSeedImage } from './services/geminiService';
import { Button } from './components/Button';
import { StatCard } from './components/StatCard';
import { LoadingOverlay } from './components/LoadingOverlay';

// Icons
const CameraIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const UploadIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const ExitIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const RefreshIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<SeedAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showHealthy, setShowHealthy] = useState<boolean>(true);
  const [showBroken, setShowBroken] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Logic for Camera View ---
  const startCamera = async () => {
    setCurrentView(AppView.CAMERA);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Kamerani ishga tushirib bo'lmadi:", err);
      alert("Kamerani ishga tushirib bo'lmadi. Iltimos ruxsatlarni tekshiring.");
      setCurrentView(AppView.HOME);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const captureImage = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageData);
        stopCamera();
        performAnalysis(imageData);
      }
    }
  };

  // --- Logic for Upload View ---
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCapturedImage(result);
        performAnalysis(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Common Logic ---
  const performAnalysis = async (imageData: string) => {
    setIsLoading(true);
    try {
      const result = await analyzeSeedImage(imageData);
      setAnalysisResult(result);
      setCurrentView(AppView.RESULTS);
    } catch (error: any) {
      alert(error?.message || "Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.");
      resetApp();
    } finally {
      setIsLoading(false);
    }
  };

  const resetApp = () => {
    stopCamera();
    setCapturedImage(null);
    setAnalysisResult(null);
    setShowHealthy(true);
    setShowBroken(true);
    setCurrentView(AppView.HOME);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // --- Renders ---

  const renderHome = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 max-w-md mx-auto w-full">
      <div className="mb-10 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-green-600 shadow-md">
           <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M12 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" fill="#16a34a" stroke="none"/>
           </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Smart Seed</h1>
        <p className="text-gray-500">Sun'iy intellekt yordamida urug' sifatini aniqlash tizimi</p>
      </div>

      <div className="w-full space-y-4">
        <Button 
          variant="primary" 
          fullWidth 
          icon={<CameraIcon />}
          onClick={startCamera}
          className="h-16 text-lg"
        >
          Kamera orqali aniqlash
        </Button>
        
        <div className="relative">
          <Button 
            variant="secondary" 
            fullWidth 
            icon={<UploadIcon />}
            className="h-16 text-lg"
            onClick={() => fileInputRef.current?.click()}
          >
            Fayl yuklash
          </Button>
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept="image/*"
            onChange={handleFileUpload}
          />
        </div>

        <div className="pt-8 border-t border-gray-200 mt-8">
          <Button 
            variant="danger" 
            fullWidth 
            icon={<ExitIcon />}
            onClick={() => alert("Dasturdan chiqish uchun brauzerni yoping.")}
          >
            Chiqish
          </Button>
        </div>
      </div>
      
      <p className="mt-12 text-xs text-gray-400">Version 1.0.0</p>
    </div>
  );

  const renderCamera = () => (
    <div className="flex flex-col h-screen bg-black relative">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        className="h-full w-full object-cover"
        onLoadedMetadata={() => videoRef.current?.play()}
      />
      
      {/* Overlay controls */}
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-center">
        <button 
          onClick={resetApp}
          className="p-3 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-all"
        >
          <ExitIcon />
        </button>
        
        <button 
          onClick={captureImage}
          className="w-20 h-20 rounded-full border-4 border-white bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-all active:scale-95"
        >
          <div className="w-16 h-16 bg-white rounded-full"></div>
        </button>

        <div className="w-12"></div> {/* Spacer for alignment */}
      </div>

      <div className="absolute top-4 left-0 right-0 text-center">
        <span className="bg-black/50 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
          Urug'larni ramkaga to'g'rilang
        </span>
      </div>
    </div>
  );

  const renderResults = () => {
    if (!analysisResult) return null;

    const chartData: ChartData[] = [
      { name: 'Sifatli', value: analysisResult.healthy, fill: '#16a34a' },
      { name: 'Shikastlangan', value: analysisResult.broken, fill: '#dc2626' },
    ];

    return (
      <div className="min-h-screen lg:h-screen bg-gray-50 flex flex-col overflow-x-hidden">
        {/* Header - Fixed Height on desktop */}
        <div className="bg-white shadow-sm border-b border-gray-100 shrink-0 px-4 md:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600 font-bold shadow-sm">
                 <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                 </svg>
               </div>
               <div>
                 <h2 className="text-sm md:text-md lg:text-lg font-bold text-gray-800 leading-none">Smart Seed</h2>
                 <span className="text-[10px] text-gray-400 font-medium">Tahlil hisoboti</span>
               </div>
            </div>
            <button 
              onClick={resetApp} 
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              title="Chiqish"
            >
                <ExitIcon />
            </button>
        </div>

        {/* Content Area - Fits Exactly on Desktop */}
        <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:overflow-hidden flex flex-col justify-between">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full lg:overflow-hidden">
            
            {/* Left Column: Image with Overlays (7 Cols out of 12) */}
            <div className="lg:col-span-7 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col lg:h-full lg:overflow-hidden justify-between">
              <div className="flex items-center justify-between mb-3 shrink-0">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tasvir va Koordinatalar</h3>
                
                {/* Active Category Toggles / Filters */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowBroken(!showBroken)} 
                    className={`px-3 py-1 text-xs font-bold rounded-full transition-all border flex items-center gap-1.5 ${
                      showBroken 
                        ? 'bg-red-50 text-red-700 border-red-200 shadow-sm' 
                        : 'bg-gray-50 text-gray-400 border-gray-200 opacity-60'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                    Yaroqsiz ({analysisResult.broken})
                  </button>
                  <button 
                    onClick={() => setShowHealthy(!showHealthy)} 
                    className={`px-3 py-1 text-xs font-bold rounded-full transition-all border flex items-center gap-1.5 ${
                      showHealthy 
                        ? 'bg-green-50 text-green-700 border-green-200 shadow-sm' 
                        : 'bg-gray-50 text-gray-400 border-gray-200 opacity-60'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-green-600"></span>
                    Sog'lom ({analysisResult.healthy})
                  </button>
                </div>
              </div>

              {/* Bounding box responsive image centerer */}
              <div className="relative flex-1 bg-gray-950 rounded-xl overflow-hidden flex items-center justify-center border border-gray-800 shadow-inner min-h-[300px] lg:min-h-0 lg:h-0">
                {capturedImage && (
                  <div className="relative inline-block max-w-full max-h-full">
                    <img 
                      src={capturedImage} 
                      alt="Analyzed Seeds" 
                      className="max-w-full max-h-[50vh] lg:max-h-[calc(100vh-280px)] object-contain block select-none rounded" 
                    />
                    
                    {/* CSS Overlays for Bounding Boxes */}
                    {analysisResult.seeds && analysisResult.seeds.map((seed, idx) => {
                      const isBroken = seed.type === 'broken';
                      
                      if (isBroken && !showBroken) return null;
                      if (!isBroken && !showHealthy) return null;

                      // Scale coordinate boundary [ymin, xmin, ymax, xmax] from 0..1000 to percentages
                      const [ymin, xmin, ymax, xmax] = seed.box_2d.map(coord => coord / 10);
                      const top = Math.min(Math.max(ymin, 0), 100);
                      const left = Math.min(Math.max(xmin, 0), 100);
                      const height = Math.min(Math.max(ymax - ymin, 2.0), 100 - top);
                      const width = Math.min(Math.max(xmax - xmin, 2.0), 100 - left);

                      const borderStyle = isBroken 
                        ? 'border-red-500 bg-red-500/10 hover:bg-red-500/25 text-red-100 shadow-[0_0_8px_rgba(239,68,68,0.4)]' 
                        : 'border-green-500 bg-green-500/10 hover:bg-green-500/25 text-green-100 shadow-[0_0_8px_rgba(34,197,94,0.4)]';

                      return (
                        <div
                           key={idx}
                           className={`absolute border-2 rounded flex items-center justify-center transition-all duration-200 hover:scale-[1.05] group cursor-pointer ${borderStyle}`}
                           style={{
                             top: `${top}%`,
                             left: `${left}%`,
                             width: `${width}%`,
                             height: `${height}%`,
                             zIndex: isBroken ? 20 : 10,
                           }}
                        >
                          {/* Rich Label Tooltip */}
                          <div className={`absolute -top-8 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-all text-[10px] font-bold px-2 py-0.5 rounded shadow-xl pointer-events-none whitespace-nowrap z-50 ${
                            isBroken ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                          }`}>
                            {isBroken ? "Yaroqsiz / Shikastlangan" : "Sog'lom / Sifatli"}
                          </div>
                          
                          {/* Centered micro-mark */}
                          <span className="text-[7px] md:text-[9px] font-black w-3.5 h-3.5 flex items-center justify-center rounded-full bg-black/60 shadow text-white pointer-events-none">
                            {isBroken ? '✕' : '✓'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <p className="mt-2 text-center text-[10px] text-gray-400 italic shrink-0">
                Urug'larga kursor bilan boring yoki bosing
              </p>
            </div>

            {/* Right Column: Mini Dashboard statistics & action buttons (5 Cols out of 12) */}
            <div className="lg:col-span-5 lg:h-full lg:overflow-y-auto pr-1 flex flex-col justify-between space-y-4 pb-4 lg:pb-0">
              
              {/* Compact horizontal stats row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50/50 border border-blue-100/60 p-3 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
                  <div className="text-blue-500 mb-0.5">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Umumiy</span>
                  <span className="text-lg lg:text-xl font-black text-blue-900 leading-none mt-1">{analysisResult.total}</span>
                </div>
                <div className="bg-green-50/50 border border-green-100/60 p-3 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
                  <div className="text-green-500 mb-0.5">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sog'lom</span>
                  <span className="text-lg lg:text-xl font-black text-green-900 leading-none mt-1">{analysisResult.healthy}</span>
                </div>
                <div className="bg-red-50/50 border border-red-100/60 p-3 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
                  <div className="text-red-500 mb-0.5">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Yaroqsiz</span>
                  <span className="text-lg lg:text-xl font-black text-red-950 leading-none mt-1">{analysisResult.broken}</span>
                </div>
              </div>

              {/* Uzbek Summary Box */}
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tahlil Xulosasi</h4>
                <p className="text-sm text-gray-700 leading-relaxed max-h-[120px] lg:max-h-[140px] overflow-y-auto pr-1">
                  {analysisResult.summary}
                </p>
              </div>

              {/* Chart Component - Compressed height to keep on screen */}
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 w-full text-left">Nisbat Diagrammasi</h4>
                <div className="h-40 w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={24} iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Primary Action Button */}
              <div className="pt-2">
                 <Button 
                   variant="primary" 
                   fullWidth 
                   icon={<RefreshIcon />}
                   onClick={resetApp}
                   className="h-12 text-md font-semibold"
                 >
                   Yangi Tahlil Yuklash
                 </Button>
              </div>

            </div>

          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {isLoading && <LoadingOverlay />}
      {currentView === AppView.HOME && renderHome()}
      {currentView === AppView.CAMERA && renderCamera()}
      {/* Upload uses the same view as Home initially, processing handled in function */}
      {currentView === AppView.RESULTS && renderResults()}
    </>
  );
};

export default App;