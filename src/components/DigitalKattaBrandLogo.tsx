import React, { useState } from 'react';
import { DIGITAL_KATTA_LOGO_BASE64 } from '../assets/logoBase64';

interface DigitalKattaBrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  tagline?: string;
  subTagline?: string;
  className?: string;
  framed?: boolean;
  horizontal?: boolean;
  variant?: 'light' | 'dark' | 'transparent';
}

export const DigitalKattaBrandLogo: React.FC<DigitalKattaBrandLogoProps> = ({
  size = 'md',
  showTagline = true,
  tagline = 'ठिकाण एक, सुविधा अनेक..!',
  subTagline,
  className = '',
  framed = false,
  horizontal = true,
  variant = 'transparent',
}) => {
  const [imgError, setImgError] = useState(false);

  // Responsive image dimensions
  const imgSizeMap = {
    sm: 'w-9 h-9 sm:w-10 sm:h-10',
    md: 'w-12 h-12 sm:w-14 sm:h-14',
    lg: 'w-16 h-16 sm:w-20 sm:h-20',
    xl: 'w-24 h-24 sm:w-28 sm:h-28',
  }[size];

  // Font size map
  const titleSizeMap = {
    sm: 'text-sm sm:text-base',
    md: 'text-base sm:text-lg',
    lg: 'text-xl sm:text-2xl',
    xl: 'text-2xl sm:text-3xl',
  }[size];

  const taglineSizeMap = {
    sm: 'text-[9px] sm:text-[10px]',
    md: 'text-[10px] sm:text-[11px]',
    lg: 'text-xs sm:text-sm',
    xl: 'text-sm sm:text-base',
  }[size];

  // Official logo image element
  const logoImage = !imgError ? (
    <img
      src={DIGITAL_KATTA_LOGO_BASE64 || '/digital_katta_logo.jpg'}
      alt="Digital कट्टा - ठिकाण एक, सुविधा अनेक..! (Theekan Ek, Suvidha Anek)"
      className={`${imgSizeMap} rounded-xl object-contain shrink-0 shadow-2xs border border-orange-200/60 bg-[#12233F] transition-transform duration-200 hover:scale-105`}
      onError={() => setImgError(true)}
      loading="eager"
    />
  ) : (
    // High-fidelity SVG fallback emblem if image fails
    <div
      className={`${imgSizeMap} rounded-xl bg-[#12233F] text-white flex items-center justify-center shrink-0 shadow-2xs border border-orange-200/60 p-1`}
    >
      <div className="grid grid-cols-2 gap-0.5 w-full h-full p-0.5">
        <div className="bg-[#2563EB] rounded-xs" />
        <div className="bg-[#F56B2B] rounded-xs" />
        <div className="bg-[#16A34A] rounded-xs" />
        <div className="bg-[#881337] rounded-xs" />
      </div>
    </div>
  );

  // Wordmark typography
  const wordmark = (
    <div className={`flex flex-col ${horizontal ? 'text-left' : 'text-center'}`}>
      <div className={`font-extrabold tracking-tight flex items-baseline gap-1 ${titleSizeMap} leading-tight font-heading`}>
        <span className={variant === 'light' ? 'text-white' : 'text-[#12233F]'}>Digital</span>
        <span className="text-[#F56B2B]">कट्टा</span>
      </div>
      {showTagline && (
        <div className="flex flex-col">
          <span
            className={`font-semibold ${taglineSizeMap} mt-0.5 tracking-tight ${
              variant === 'light' ? 'text-orange-200' : 'text-[#881337]'
            }`}
            title="Theekan Ek, Suvidha Anek"
          >
            {tagline}
          </span>
          {subTagline ? (
            <span
              className={`text-[9px] sm:text-[10px] font-medium tracking-tight ${
                variant === 'light' ? 'text-orange-200/80' : 'text-slate-500'
              }`}
            >
              {subTagline}
            </span>
          ) : (size === 'lg' || size === 'xl') ? (
            <span
              className={`text-[9px] sm:text-[10px] font-medium tracking-tight ${
                variant === 'light' ? 'text-orange-200/80' : 'text-slate-500'
              }`}
            >
              Theekan Ek, Suvidha Anek
            </span>
          ) : null}
        </div>
      )}
    </div>
  );

  if (framed) {
    return (
      <div
        className={`inline-flex ${
          horizontal ? 'flex-row items-center gap-3' : 'flex-col items-center gap-2'
        } p-2.5 rounded-2xl bg-white shadow-xs border border-orange-100 select-none ${className}`}
      >
        {logoImage}
        {wordmark}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex ${
        horizontal ? 'flex-row items-center gap-3' : 'flex-col items-center gap-2'
      } select-none ${className}`}
    >
      {logoImage}
      {wordmark}
    </div>
  );
};


