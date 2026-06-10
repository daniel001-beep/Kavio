import React from 'react';

interface VeloxLogoProps {
  size?: number;
  variant?: 'full' | 'icon' | 'light';
  className?: string;
}

const VeloxLogoIcon: React.FC<{ size?: number; variant?: 'full' | 'icon' | 'light' }> = ({ size = 36, variant = 'full' }) => {
  const isDark = variant !== 'light';
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="transition-all duration-300"
      style={{
        filter: isDark ? 'drop-shadow(0 0 8px rgba(59,130,246,0.4))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
      }}
    >
      <defs>
        <linearGradient id="veloxPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="veloxSecondary" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="veloxAccent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
      </defs>
      
      {/* Abstract Geometric V Shape */}
      {/* Left Pillar */}
      <polygon points="4,6 12,6 20,30 12,30" fill="url(#veloxPrimary)" />
      
      {/* Right Pillar (Shortened) */}
      <polygon points="24,6 32,6 28,18 20,18" fill="url(#veloxSecondary)" />
      
      {/* Growth/Data Block */}
      <rect x="22" y="22" width="8" height="8" rx="1.5" fill="url(#veloxAccent)" />
    </svg>
  );
};

export const VeloxLogoIconOnly: React.FC<VeloxLogoProps> = ({ size = 36 }) => {
  return (
    <div
      className="hover:drop-shadow-lg transition-all duration-300"
      aria-label="Kavio Logo"
    >
      <VeloxLogoIcon size={size} variant="icon" />
    </div>
  );
};

export const VeloxLogoLight: React.FC<VeloxLogoProps> = ({ size = 36, className = '' }) => {
  return (
    <div
      className={`flex items-center gap-3 hover:opacity-80 transition-opacity duration-300 ${className}`}
      aria-label="Velox Fintech Logo"
    >
      <VeloxLogoIcon size={size} variant="light" />
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-bold tracking-tight text-slate-900">KAVIO</span>
        <span className="text-xs font-light tracking-widest text-slate-500">FINTECH</span>
      </div>
    </div>
  );
};

const VeloxLogo: React.FC<VeloxLogoProps> = ({ size = 36, variant = 'full', className = '' }) => {
  const isDark = variant !== 'light';
  const textColor = isDark ? 'text-slate-100' : 'text-slate-900';
  const mutedColor = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div
      className={`flex items-center gap-3 hover:opacity-90 transition-all duration-300 ${className}`}
      aria-label="Velox Fintech Logo"
      role="img"
    >
      <VeloxLogoIcon size={size} variant={variant} />
      <div className="flex flex-col leading-tight">
        <span className={`text-base font-bold tracking-tight ${textColor}`}>
          KAVIO
        </span>
        <span
          className={`text-xs font-light tracking-widest ${mutedColor}`}
          style={{ letterSpacing: '0.15em' }}
        >
          FINTECH
        </span>
      </div>
    </div>
  );
};

export default VeloxLogo;
