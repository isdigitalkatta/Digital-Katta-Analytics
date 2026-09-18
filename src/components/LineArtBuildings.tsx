import React from 'react';

interface LineArtBuildingsProps {
  className?: string;
  showText?: boolean;
}

export const LineArtBuildings: React.FC<LineArtBuildingsProps> = ({
  className = '',
  showText = true,
}) => {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* 3 Line-Art Architectural Monuments / Landmarks Doodle */}
      <svg
        className="w-48 sm:w-56 h-12 text-[#0284C7]/80"
        viewBox="0 0 240 60"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Left Monument */}
        <path d="M20 56 V30 H48 V56" />
        <path d="M20 30 C20 20, 48 20, 48 30" />
        <path d="M34 20 V12" />
        <path d="M28 56 V40 H40 V56" />

        {/* Center Gateway (Gateway of India style) */}
        <path d="M80 56 V16 H160 V56" />
        <path d="M72 16 H168" />
        <path d="M88 16 V10 H152 V16" />
        <path d="M120 10 V4" />
        <path d="M102 56 V32 C102 24, 138 24, 138 32 V56" />
        {/* Side mini arches on center gateway */}
        <path d="M84 44 V34 C84 30, 96 30, 96 34 V44" />
        <path d="M144 44 V34 C144 30, 156 30, 156 34 V44" />

        {/* Right Monument */}
        <path d="M192 56 V30 H220 V56" />
        <path d="M192 30 C192 20, 220 20, 220 30" />
        <path d="M206 20 V12" />
        <path d="M200 56 V40 H212 V56" />

        {/* Ground baseline */}
        <line x1="8" y1="56" x2="232" y2="56" />
      </svg>

      {showText && (
        <p className="text-[10px] tracking-[0.2em] font-bold text-slate-500 mt-1 uppercase">
          PEOPLE <span className="text-[#0284C7] mx-1">|</span> PLATFORMS <span className="text-[#0284C7] mx-1">|</span> POSSIBILITIES
        </p>
      )}
    </div>
  );
};
