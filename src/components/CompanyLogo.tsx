import React, { useState } from 'react';

interface CompanyLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'hero' | 'sidebar';
  showTagline?: boolean;
  className?: string;
  variant?: 'light' | 'dark' | 'transparent';
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  size = 'md',
  showTagline = false,
  className = '',
  variant = 'transparent',
}) => {
  const [imgError, setImgError] = useState(false);

  // Size dimensions
  const sizeClasses = {
    sm: 'h-8 w-auto',
    md: 'h-10 w-auto',
    lg: 'h-14 w-auto',
    hero: 'h-24 sm:h-28 w-auto',
    sidebar: 'h-9 w-auto',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {!imgError ? (
        <div className="relative flex items-center justify-center shrink-0">
          <img
            src="/digital_katta_logo.jpg"
            alt="Digital Katta Logo"
            className={`${sizeClasses[size]} object-contain drop-shadow-xs rounded-lg transition-transform hover:scale-105 duration-200`}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        /* Highly faithful vector fallback replicating the exact company logo elements */
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-slate-200 p-1 flex flex-col justify-between items-center">
            <div className="grid grid-cols-2 gap-0.5 w-full">
              <span className="w-2.5 h-2.5 rounded-xs bg-blue-500"></span>
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-500"></span>
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500"></span>
              <span className="w-2.5 h-2.5 rounded-xs bg-rose-600"></span>
            </div>
            <div className="text-[7px] font-extrabold text-orange-600 leading-none">
              DK
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1 font-heading leading-tight">
              <span className="text-base font-extrabold text-orange-500 tracking-tight">
                Digital
              </span>
              <span className="text-base font-extrabold text-red-800">
                कट्टा
              </span>
            </div>
            {showTagline && (
              <p className="text-[10px] text-slate-500 font-medium tracking-tight">
                ठिकाण एक, सुविधा अनेक..!
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
