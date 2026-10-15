import React from 'react';

interface ForgeonLogoProps {
  size?: number;
  className?: string;
  variant?: 'color' | 'white' | 'horizontal';
}

export const ForgeonLogo: React.FC<ForgeonLogoProps> = ({
  size = 28,
  className = '',
  variant = 'color',
}) => {
  if (variant === 'horizontal') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <svg
          width={size}
          height={size}
          viewBox="400 300 670 650"
          className="shrink-0"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="forgeon_grad_top" x1="431" y1="322" x2="1053" y2="679" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#9070F7" />
              <stop offset="45%" stopColor="#454DFC" />
              <stop offset="100%" stopColor="#85A9FA" />
            </linearGradient>
            <linearGradient id="forgeon_grad_bottom" x1="431" y1="533" x2="946" y2="924" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4128FB" />
              <stop offset="60%" stopColor="#454DFC" />
              <stop offset="100%" stopColor="#85A9FA" />
            </linearGradient>
          </defs>
          <path
            d="M 431.8 679.3 L 431.8 524.6 L 629.5 322.1 L 1053.9 322.0 L 920.6 464.2 L 645.5 464.2 Z"
            fill="url(#forgeon_grad_top)"
          />
          <path
            d="M 431.1 924.6 L 431.1 752.5 L 645.5 533.1 L 946.5 533.1 L 804.6 679.1 L 675.8 679.1 Z"
            fill="url(#forgeon_grad_bottom)"
          />
        </svg>

        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span className="font-heading font-extrabold text-lg tracking-tight text-[#F4F4F7]">
              FORGEON
            </span>
            <span className="text-[#85A9FA] font-mono font-bold text-sm">//</span>
            <span className="font-heading font-bold text-sm tracking-widest text-[#85A9FA]">
              RECON
            </span>
          </div>
          <span className="text-[10px] font-sans text-[#A3A6B5] tracking-wider uppercase mt-1">
            Design System V2
          </span>
        </div>
      </div>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="400 300 670 650"
      className={`shrink-0 ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`fg_grad_${variant}`} x1="431" y1="322" x2="1053" y2="679" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={variant === 'white' ? '#FFFFFF' : '#9070F7'} />
          <stop offset="50%" stopColor={variant === 'white' ? '#FFFFFF' : '#454DFC'} />
          <stop offset="100%" stopColor={variant === 'white' ? '#FFFFFF' : '#85A9FA'} />
        </linearGradient>
        <linearGradient id={`fg_grad_b_${variant}`} x1="431" y1="533" x2="946" y2="924" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={variant === 'white' ? '#FFFFFF' : '#4128FB'} />
          <stop offset="60%" stopColor={variant === 'white' ? '#FFFFFF' : '#454DFC'} />
          <stop offset="100%" stopColor={variant === 'white' ? '#FFFFFF' : '#85A9FA'} />
        </linearGradient>
      </defs>
      <path
        d="M 431.8 679.3 L 431.8 524.6 L 629.5 322.1 L 1053.9 322.0 L 920.6 464.2 L 645.5 464.2 Z"
        fill={variant === 'white' ? '#FFFFFF' : `url(#fg_grad_${variant})`}
      />
      <path
        d="M 431.1 924.6 L 431.1 752.5 L 645.5 533.1 L 946.5 533.1 L 804.6 679.1 L 675.8 679.1 Z"
        fill={variant === 'white' ? '#FFFFFF' : `url(#fg_grad_b_${variant})`}
      />
    </svg>
  );
};
