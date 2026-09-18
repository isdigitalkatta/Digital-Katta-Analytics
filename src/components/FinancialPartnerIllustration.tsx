import React from 'react';

interface FinancialPartnerIllustrationProps {
  className?: string;
  showAnnotation?: boolean;
}

export const FinancialPartnerIllustration: React.FC<FinancialPartnerIllustrationProps> = ({
  className = '',
  showAnnotation = true,
}) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Background warm circle halo */}
      <div className="absolute inset-x-8 bottom-0 top-10 bg-[#FED7AA]/30 rounded-full blur-2xl pointer-events-none" />

      {/* SVG Illustration of smiling Indian professional with laptop and desk plant */}
      <svg
        className="w-full max-w-[340px] h-auto drop-shadow-sm"
        viewBox="0 0 360 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Soft background oval */}
        <ellipse cx="180" cy="200" rx="140" ry="80" fill="#FFEDD5" opacity="0.6" />

        {/* Potted Plant on left */}
        <g id="desk-plant">
          {/* Pot */}
          <path d="M40 240 L45 268 H65 L70 240 Z" fill="#F9FAFB" stroke="#E2E8F0" strokeWidth="2" />
          <ellipse cx="55" cy="240" rx="15" ry="4" fill="#E2E8F0" />
          {/* Leaves */}
          <path d="M55 240 C45 220 30 220 28 210 C38 208 52 222 55 238" fill="#16A34A" />
          <path d="M55 238 C60 215 72 212 78 202 C78 214 68 226 56 238" fill="#22C55E" />
          <path d="M55 235 C52 210 50 195 44 190 C40 200 48 218 54 235" fill="#15803D" />
          <path d="M55 235 C62 218 78 224 82 218 C78 230 64 232 55 238" fill="#4ADE80" />
        </g>

        {/* Professional Person */}
        <g id="person">
          {/* Body / Shirt */}
          {/* Green Overshirt */}
          <path
            d="M110 280 C110 245 130 220 160 215 L200 215 C230 220 250 245 250 280 Z"
            fill="#3F6212"
          />
          {/* Inner White Tee */}
          <path
            d="M162 215 C162 235 198 235 198 215 Z"
            fill="#FFFFFF"
          />
          {/* Open collar lapels */}
          <path d="M158 215 L170 248 L160 280" stroke="#2D4A0C" strokeWidth="2" fill="none" />
          <path d="M202 215 L190 248 L200 280" stroke="#2D4A0C" strokeWidth="2" fill="none" />

          {/* Neck */}
          <path d="M168 185 H192 V220 C192 222 168 222 168 220 Z" fill="#D97706" opacity="0.8" />
          <path d="M168 185 H192 V218 C192 220 168 220 168 218 Z" fill="#FBBF24" />

          {/* Head & Face */}
          <path
            d="M152 145 C152 110 162 100 180 100 C198 100 208 110 208 145 C208 175 198 195 180 195 C162 195 152 175 152 145 Z"
            fill="#FBBF24"
          />

          {/* Modern Hair (Stylish Dark) */}
          <path
            d="M150 135 C146 115 155 92 180 92 C205 92 214 112 210 135 C206 130 202 120 198 115 C185 110 165 112 156 122 Z"
            fill="#1E293B"
          />
          <path
            d="M175 92 C190 85 208 90 214 105 C210 100 198 94 180 94 Z"
            fill="#334155"
          />

          {/* Facial Features */}
          {/* Eyebrows (smiling slant) */}
          <path d="M162 136 C166 133 172 134 175 137" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
          <path d="M185 137 C188 134 194 133 198 136" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />

          {/* Eyes looking thoughtfully up-right */}
          <ellipse cx="169" cy="142" rx="3.5" ry="3" fill="#0F172A" />
          <circle cx="170" cy="141" r="1" fill="#FFFFFF" />
          <ellipse cx="191" cy="142" rx="3.5" ry="3" fill="#0F172A" />
          <circle cx="192" cy="141" r="1" fill="#FFFFFF" />

          {/* Nose */}
          <path d="M180 142 V155 L184 157" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />

          {/* Warm confident smile */}
          <path d="M170 166 C176 174 186 174 192 166" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
          {/* Teeth highlight */}
          <path d="M173 167 C178 171 184 171 189 167 Z" fill="#FFFFFF" />

          {/* Light neat beard */}
          <path
            d="M156 155 C156 182 166 195 180 195 C194 195 204 182 204 155 C202 165 196 188 180 188 C164 188 158 165 156 155 Z"
            fill="#0F172A"
            opacity="0.25"
          />

          {/* Arm and Hand on Chin (Thoughtful pose) */}
          <path
            d="M195 225 L215 200 L200 178 C198 176 195 178 195 182 L192 195 Z"
            fill="#FBBF24"
          />
          {/* Fingers resting under chin */}
          <path
            d="M182 178 C185 174 194 174 195 178 C195 182 188 185 182 182 Z"
            fill="#F59E0B"
          />
        </g>

        {/* Laptop in front */}
        <g id="laptop">
          {/* Screen back */}
          <path d="M185 220 L275 220 L260 270 L170 270 Z" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1.5" />
          {/* Screen glow & logo dot */}
          <path d="M190 225 L268 225 L255 265 L178 265 Z" fill="#F8FAFC" />
          <circle cx="223" cy="245" r="4" fill="#F56B2B" opacity="0.8" />
          {/* Base */}
          <path d="M165 270 L280 270 L275 276 L160 276 Z" fill="#94A3B8" />
        </g>

        {/* Desk line */}
        <line x1="20" y1="276" x2="340" y2="276" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
      </svg>

      {/* Handwritten Annotation & Arrow: "Better Credit, Brighter Future!" */}
      {showAnnotation && (
        <div className="absolute top-2 right-2 sm:right-6 pointer-events-none transform rotate-3">
          {/* 3 Radiance sparks */}
          <div className="flex items-center justify-center gap-1 mb-0.5 text-[#EA580C]">
            <span className="text-xs">✦</span>
            <span className="text-[10px]">✦</span>
            <span className="text-xs">✦</span>
          </div>

          <div className="bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-xl shadow-xs border border-amber-200/80">
            <p className="font-handwriting text-base sm:text-lg font-bold text-[#12233F] leading-tight text-center">
              Better Credit,<br />
              <span className="text-[#F56B2B]">Brighter Future!</span>
            </p>
          </div>

          {/* Curved Hand-Drawn Arrow pointing to person */}
          <svg className="w-10 h-8 text-[#12233F] mt-0.5 ml-2" viewBox="0 0 40 32" fill="none">
            <path
              d="M32 4 C 20 10, 10 20, 8 28"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
            <path
              d="M4 22 L8 29 L15 25"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
};
