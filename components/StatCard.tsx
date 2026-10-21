import React from 'react';

interface StatCardProps {
  label: string;
  value: number;
  type: 'total' | 'healthy' | 'broken';
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, type }) => {
  let colorClass = "";
  let bgClass = "";
  let icon = null;

  switch (type) {
    case 'healthy':
      colorClass = "text-green-600";
      bgClass = "bg-green-50 border-green-200";
      icon = (
        <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
      break;
    case 'broken':
      colorClass = "text-red-600";
      bgClass = "bg-red-50 border-red-200";
      icon = (
        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
      break;
    default: // total
      colorClass = "text-blue-600";
      bgClass = "bg-blue-50 border-blue-200";
      icon = (
        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      );
  }

  return (
    <div className={`p-4 rounded-xl border ${bgClass} flex flex-col items-center justify-center text-center shadow-sm`}>
      <div className="mb-2 p-2 bg-white rounded-full shadow-sm">
        {icon}
      </div>
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
    </div>
  );
};