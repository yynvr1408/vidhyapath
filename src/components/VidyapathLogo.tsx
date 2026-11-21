import React from 'react';

interface VidyapathLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showWordmark?: boolean;
  className?: string;
  subtitle?: string;
}

export const VidyapathLogo: React.FC<VidyapathLogoProps> = ({
  size = 'md',
  showWordmark = false,
  className = '',
  subtitle,
}) => {
  const sizeMap = {
    sm: { icon: 'w-7 h-7', text: 'text-base', sub: 'text-[9px]' },
    md: { icon: 'w-10 h-10', text: 'text-xl', sub: 'text-[11px]' },
    lg: { icon: 'w-14 h-14', text: 'text-2xl', sub: 'text-xs' },
    xl: { icon: 'w-18 h-18', text: 'text-3xl', sub: 'text-xs' },
    hero: { icon: 'w-24 h-24', text: 'text-4xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Creative SVG Icon: The Lantern of Knowledge & Learning Pathway */}
      <div
        className={`relative shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#DCFCE7] via-white to-[#F0FDF4] p-2 border-2 border-[#16A34A] shadow-md ${currentSize.icon} lantern-glow`}
        title="Vidyapath · The Path of Knowledge"
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Base Pathway - Ascending Geometric Road */}
          <path
            d="M20 86L38 48L62 48L80 86H20Z"
            fill="url(#pathwayGradient)"
            opacity="0.9"
          />
          {/* Pathway Center Dividing Dash Line */}
          <path
            d="M50 84V52"
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="4 4"
          />

          {/* Open Book Wings */}
          <path
            d="M18 54C28 46 42 48 50 54C58 48 72 46 82 54C78 64 64 62 50 58C36 62 22 64 18 54Z"
            fill="#15803D"
          />
          <path
            d="M50 58V40"
            stroke="#14532D"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Lantern Glass Dome Frame */}
          <path
            d="M32 46C32 32 40 22 50 22C60 22 68 32 68 46H32Z"
            fill="#DCFCE7"
            fillOpacity="0.65"
            stroke="#16A34A"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* Golden Flame of Wisdom */}
          <path
            d="M50 18C44 26 42 33 45 38C47 41 53 41 55 38C58 33 56 26 50 18Z"
            fill="url(#flameGradient)"
          />
          <circle cx="50" cy="33" r="3.5" fill="#FFFFFF" opacity="0.8" />

          {/* Lantern Top Cap & Ring */}
          <path
            d="M44 22H56V18C56 16.5 54.5 15 50 15C45.5 15 44 16.5 44 18V22Z"
            fill="#15803D"
          />
          <circle
            cx="50"
            cy="11"
            r="4.5"
            stroke="#15803D"
            strokeWidth="2.5"
            fill="none"
          />

          {/* Radiance Sparkles */}
          <circle cx="26" cy="24" r="2.5" fill="#FACC15" />
          <circle cx="74" cy="24" r="2.5" fill="#FACC15" />
          <circle cx="50" cy="4" r="2" fill="#FACC15" />

          {/* Gradients */}
          <defs>
            <linearGradient id="pathwayGradient" x1="50" y1="48" x2="50" y2="86" gradientUnits="userSpaceOnUse">
              <stop stopColor="#16A34A" />
              <stop offset="1" stopColor="#14532D" />
            </linearGradient>
            <linearGradient id="flameGradient" x1="50" y1="18" x2="50" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FACC15" />
              <stop offset="0.6" stopColor="#F59E0B" />
              <stop offset="1" stopColor="#EA580C" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Wordmark (Optional or Header/Hero Display) */}
      {showWordmark && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`font-black tracking-tight text-[#15803D] ${currentSize.text}`}>
              Vidyapath
            </span>
            <span className="text-xs font-bold text-[#16A34A] bg-[#DCFCE7] px-1.5 py-0.5 rounded-md border border-[#86EFAC]">
              విద్యాపథ్
            </span>
          </div>
          <span className={`font-bold text-[#475569] tracking-wide mt-0.5 ${currentSize.sub}`}>
            {subtitle || 'The Last-Mile Tutor for Class 10 Maths'}
          </span>
        </div>
      )}
    </div>
  );
};
