import React from 'react';

export default function Logo({ size = 40 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="100" height="100" rx="22" fill="#050505" />
      <rect
        x="1"
        y="1"
        width="98"
        height="98"
        rx="21"
        stroke="#7CFF4F"
        strokeWidth="1.5"
        strokeOpacity="0.2"
      />
      <path
        d="M50 15 L80 45 L60 45 L60 72 L40 72 L40 45 L20 45 Z"
        fill="url(#arrowGrad)"
        stroke="url(#arrowGrad)"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <text
        x="50"
        y="92"
        textAnchor="middle"
        fill="#7CFF4F"
        fontSize="20"
        fontWeight="900"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-1px"
      >
        1%
      </text>
      <defs>
        <linearGradient
          id="arrowGrad"
          x1="20"
          y1="15"
          x2="80"
          y2="72"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#9AFF75" />
          <stop offset="1" stopColor="#5CE038" />
        </linearGradient>
      </defs>
    </svg>
  );
}
