import React from 'react';

export const Moonshot = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ width: '16px', height: '16px', color: '#8b5cf6', flexShrink: 0 }}
  >
    <path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.79c.4-.28.84-.5 1.3-.67A9.047 9.047 0 0012 3z" />
  </svg>
);

export const Deepseek = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ width: '16px', height: '16px', color: '#0ea5e9', flexShrink: 0 }}
  >
    <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm1 14.93V18a1 1 0 01-2 0v-1.07A6 6 0 016.07 11H5a1 1 0 010-2h1.07A6 6 0 0111 4.07V3a1 1 0 012 0v1.07A6 6 0 0117.93 9H19a1 1 0 010 2h-1.07A6 6 0 0113 16.93z" />
  </svg>
);

export const Flux = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ width: '16px', height: '16px', color: '#ec4899', flexShrink: 0 }}
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);
