import React from 'react';

export const LoadingOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-2xl flex flex-col items-center shadow-2xl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
        <p className="text-gray-800 font-medium text-lg">Urug'lar tahlil qilinmoqda...</p>
        <p className="text-gray-500 text-sm mt-2">Iltimos kuting</p>
      </div>
    </div>
  );
};