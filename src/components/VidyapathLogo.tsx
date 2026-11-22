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
    sm: { icon: 'w-8 h-8 rounded-lg', text: 'text-base', sub: 'text-[9px]' },
    md: { icon: 'w-11 h-11 rounded-xl', text: 'text-xl', sub: 'text-[11px]' },
    lg: { icon: 'w-20 h-20 sm:w-24 sm:h-24 rounded-2xl', text: 'text-2xl', sub: 'text-xs' },
    xl: { icon: 'w-24 h-24 sm:w-28 sm:h-28 rounded-2xl', text: 'text-3xl', sub: 'text-xs' },
    hero: { icon: 'w-32 h-32 rounded-3xl', text: 'text-4xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Official Vidyapath 3D Lantern on Book Logo */}
      <img
        src="/logo.png"
        alt="Vidyapath Logo"
        className={`shrink-0 object-contain shadow-xs ${currentSize.icon}`}
        loading="eager"
      />

      {/* Wordmark (Optional or Header/Hero Display) */}
      {showWordmark && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`font-black tracking-tight text-[#0F766E] ${currentSize.text}`}>
              Vidyapath
            </span>
            <span className="text-xs font-bold text-[#0F766E] bg-[#F0FDFA] px-1.5 py-0.5 rounded-md border border-[#CCFBF1]">
              విద్యాపథ్
            </span>
          </div>
          {subtitle && (
            <span className={`font-bold text-[#475569] tracking-wide mt-0.5 ${currentSize.sub}`}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
