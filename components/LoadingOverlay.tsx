import React from 'react';

export const LoadingOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex flex-col items-center justify-center">
      <div className="bg-white p-10 rounded-3xl flex flex-col items-center shadow-2xl max-w-sm mx-4">
        {/* Animated seed icon */}
        <div className="relative w-20 h-20 mb-6">
          {/* Pulsing rings */}
          <div className="absolute inset-0 rounded-full bg-green-400/20 animate-ping"></div>
          <div className="absolute inset-2 rounded-full bg-green-400/30 animate-ping" style={{ animationDelay: '0.3s' }}></div>
          
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-200 animate-pulse">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <circle cx="12" cy="11" r="3" fill="white" stroke="none" />
              </svg>
            </div>
          </div>
        </div>

        {/* Progress text */}
        <h3 className="text-gray-900 font-bold text-lg mb-1">Tahlil jarayonida</h3>
        <p className="text-gray-500 text-sm text-center mb-5">
          Sun'iy intellekt urug'larni aniqlash va sifatini baholash ustida ishlamoqda...
        </p>
        
        {/* Progress bar */}
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
            style={{
              animation: 'loading-progress 2.5s ease-in-out infinite',
            }}
          ></div>
        </div>
        
        <style>{`
          @keyframes loading-progress {
            0% { width: 0%; }
            50% { width: 80%; }
            100% { width: 100%; }
          }
        `}</style>
      </div>
    </div>
  );
};