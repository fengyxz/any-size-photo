import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = "", size = 64 }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
    >
      <defs>
        <linearGradient
          id="logoGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" style={{ stopColor: "#3B82F6", stopOpacity: 1 }} />
          <stop
            offset="100%"
            style={{ stopColor: "#2563EB", stopOpacity: 1 }}
          />
        </linearGradient>
      </defs>
      
      {/* 圆角方形背景 */}
      <rect
        x="4"
        y="4"
        width="56"
        height="56"
        rx="14"
        fill="url(#logoGradient)"
      />

      {/* 图片图标 */}
      <rect
        x="16"
        y="16"
        width="20"
        height="16"
        rx="2"
        fill="white"
        opacity="0.95"
      />
      <circle cx="20" cy="20" r="1.5" fill="#3B82F6" />
      <path
        d="M16 24 L22 18 L28 24 L36 16 L36 30 L16 30 Z"
        fill="#3B82F6"
        opacity="0.8"
      />

      {/* 压缩/缩放图标 - 右下角 */}
      <g transform="translate(38, 38)">
        <circle cx="0" cy="0" r="8" fill="white" opacity="0.9" />
        <path
          d="M-3 -3 L3 3 M3 -3 L-3 3"
          stroke="#3B82F6"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle
          cx="0"
          cy="0"
          r="3"
          fill="none"
          stroke="#3B82F6"
          strokeWidth="1.2"
        />
      </g>
    </svg>
  );
};

