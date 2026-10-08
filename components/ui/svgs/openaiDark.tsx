import React from 'react';

export const OpenaiDark = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ width: '16px', height: '16px', color: '#ffffff', flexShrink: 0 }}
  >
    <path d="M22.28 9.87a5.98 5.98 0 00-.52-4.93 6.07 6.07 0 00-6.49-2.73A6.07 6.07 0 0010.8.84a6.08 6.08 0 00-5.83 4.23 6.05 6.05 0 00-3.9 2.83 6.07 6.07 0 00.74 7.02 5.98 5.98 0 00.52 4.93 6.07 6.07 0 006.49 2.73 6.03 6.03 0 004.47 1.37 6.08 6.08 0 005.83-4.23 6.05 6.05 0 003.9-2.83 6.07 6.07 0 00-.74-7.02zM12 14.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
  </svg>
);
