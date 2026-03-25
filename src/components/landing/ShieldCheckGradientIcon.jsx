import React from 'react';

// Teal to Apple Green gradient shield with checkmark, no border
const ShieldCheckGradientIcon = ({ size = 48, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="shield-gradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#14b8a6" /> {/* Teal */}
        <stop offset="1" stopColor="#7ed957" /> {/* Apple Green */}
      </linearGradient>
    </defs>
    {/* Shield shape */}
    <path
      d="M24 4C24 4 8 8 8 18C8 36 24 44 24 44C24 44 40 36 40 18C40 8 24 4 24 4Z"
      fill="url(#shield-gradient)"
    />
    {/* Checkmark */}
    <path
      d="M17 25L22 30L31 19"
      fill="none"
      stroke="#fff"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default ShieldCheckGradientIcon;

