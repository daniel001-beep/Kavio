import React from 'react';
import Image from 'next/image';

interface VeloxLogoProps {
  size?: number;
  variant?: 'full' | 'icon' | 'light';
  className?: string;
}

const KavioLogoIcon: React.FC<{ size?: number }> = ({ size = 36 }) => {
  return (
    <Image
      src="/kavio.svg"
      alt="Kavio Logo Icon"
      width={size}
      height={size}
      className="transition-all duration-300 hover:scale-105"
      style={{
        filter: 'drop-shadow(0 0 8px rgba(99,91,255,0.4))',
      }}
    />
  );
};

export const VeloxLogoIconOnly: React.FC<VeloxLogoProps> = ({ size = 36 }) => {
  return (
    <div
      className="hover:drop-shadow-lg transition-all duration-300"
      aria-label="Kavio Logo"
    >
      <KavioLogoIcon size={size} />
    </div>
  );
};

export const VeloxLogoLight: React.FC<VeloxLogoProps> = ({ size = 36, className = '' }) => {
  return (
    <div
      className={`flex items-center gap-3 hover:opacity-85 transition-opacity duration-300 ${className}`}
      aria-label="Kavio Logo"
    >
      <KavioLogoIcon size={size} />
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-bold tracking-tight text-slate-900">KAVIO</span>
        <span className="text-xs font-light tracking-widest text-slate-500">OPERATING SYSTEM</span>
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
      className={`flex items-center gap-3 hover:opacity-95 transition-all duration-300 ${className}`}
      aria-label="Kavio Logo"
      role="img"
    >
      <KavioLogoIcon size={size} />
      <div className="flex flex-col leading-tight">
        <span className={`text-base font-bold tracking-tight ${textColor}`}>
          KAVIO
        </span>
        <span
          className={`text-xs font-light tracking-widest ${mutedColor}`}
          style={{ letterSpacing: '0.15em' }}
        >
          OS
        </span>
      </div>
    </div>
  );
};

export default VeloxLogo;
