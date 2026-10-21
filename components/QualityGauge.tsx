import React from 'react';

interface QualityGaugeProps {
  percentage: number; // 0-100
}

export const QualityGauge: React.FC<QualityGaugeProps> = ({ percentage }) => {
  const clampedPct = Math.min(100, Math.max(0, percentage));
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedPct / 100) * circumference;

  // Color based on quality
  let gaugeColor = '#dc2626'; // red
  let bgGlow = 'rgba(220, 38, 38, 0.15)';
  let label = "Past sifat";
  if (clampedPct >= 80) {
    gaugeColor = '#16a34a';
    bgGlow = 'rgba(22, 163, 74, 0.15)';
    label = "A'lo sifat";
  } else if (clampedPct >= 60) {
    gaugeColor = '#ea580c';
    bgGlow = 'rgba(234, 88, 12, 0.15)';
    label = "O'rtacha sifat";
  } else if (clampedPct >= 40) {
    gaugeColor = '#d97706';
    bgGlow = 'rgba(217, 119, 6, 0.15)';
    label = "Qoniqarsiz";
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: 170, height: 170 }}>
        <svg viewBox="0 0 180 180" className="transform -rotate-90" style={{ width: '100%', height: '100%' }}>
          {/* Background circle */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Glow effect */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke={bgGlow}
            strokeWidth="20"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.2s ease-in-out, stroke 0.5s' }}
          />
          {/* Active arc */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke={gaugeColor}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.2s ease-in-out, stroke 0.5s' }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black" style={{ color: gaugeColor, transition: 'color 0.5s' }}>
            {clampedPct.toFixed(0)}%
          </span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">{label}</span>
        </div>
      </div>
    </div>
  );
};
