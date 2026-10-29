import React, { useState } from 'react';
import { ShieldCheck, Package } from 'lucide-react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackTitle?: string;
  categorySlug?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt = 'Product image',
  className = '',
  fallbackTitle,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!src || hasError) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 text-neutral-500 overflow-hidden select-none ${className}`}
        role="img"
        aria-label={alt}
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative z-10 flex flex-col items-center p-4 text-center">
          <div className="w-12 h-12 mb-2 rounded-full bg-white shadow-xs flex items-center justify-center text-neutral-700">
            <Package className="w-6 h-6 stroke-[1.5]" />
          </div>
          <span className="text-xs font-medium text-neutral-700 tracking-tight line-clamp-1 max-w-[85%]">
            {fallbackTitle || alt}
          </span>
          <span className="text-[10px] text-neutral-400 mt-0.5 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Tailored Protective Cover
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-neutral-100 ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 animate-pulse bg-neutral-200 flex items-center justify-center z-10">
          <Package className="w-6 h-6 text-neutral-300" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        {...props}
      />
    </div>
  );
};
