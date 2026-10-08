'use client';

import * as React from 'react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'default',
      size = 'default',
      style,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // Pietrastudio button tokens:
    // Coral: #ff5c3c
    // Ink Black: #000000
    // Silver / Border: #c4c4c4
    // Cream Paper: #f8f6f2
    const baseStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      borderRadius: '8px',
      fontFamily: "'Labil Grotesk', 'Inter', ui-sans-serif, system-ui, sans-serif",
      fontSize: size === 'sm' ? '12px' : size === 'lg' ? '15px' : '13px',
      fontWeight: 500,
      letterSpacing: '-0.01em',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1,
      outline: 'none',
      transition: 'all 0.15s ease',
      whiteSpace: 'nowrap',
      padding:
        size === 'sm'
          ? '5px 10px'
          : size === 'lg'
          ? '10px 20px'
          : size === 'icon'
          ? '8px'
          : '8px 16px',
    };

    let variantStyle: React.CSSProperties = {};
    if (variant === 'default') {
      variantStyle = {
        background: '#ff5c3c',
        color: '#ffffff',
        border: 'none',
        boxShadow: 'rgba(0, 0, 0, 0.02) 0px 2px 0px 0px',
      };
    } else if (variant === 'outline') {
      variantStyle = {
        background: '#ffffff',
        color: '#000000',
        border: '1px solid #c4c4c4',
      };
    } else if (variant === 'secondary') {
      variantStyle = {
        background: '#f8f6f2',
        color: '#000000',
        border: '1px solid #c4c4c4',
      };
    } else if (variant === 'ghost') {
      variantStyle = {
        background: 'transparent',
        color: '#6b6b6b',
        border: 'none',
      };
    } else if (variant === 'destructive') {
      variantStyle = {
        background: '#fff1ee',
        color: '#ff5c3c',
        border: '1px solid #ff5c3c',
      };
    }

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`focus-visible:ring-1 focus-visible:ring-[#ff5c3c] ${className}`}
        style={{ ...baseStyle, ...variantStyle, ...style }}
        onMouseOver={(e) => {
          if (disabled) return;
          if (variant === 'outline') {
            (e.currentTarget as HTMLElement).style.borderColor = '#000000';
            (e.currentTarget as HTMLElement).style.background = '#f8f6f2';
          } else if (variant === 'default') {
            (e.currentTarget as HTMLElement).style.background = '#e54e30';
          } else if (variant === 'ghost') {
            (e.currentTarget as HTMLElement).style.background = '#f8f6f2';
            (e.currentTarget as HTMLElement).style.color = '#000000';
          }
        }}
        onMouseOut={(e) => {
          if (variant === 'outline') {
            (e.currentTarget as HTMLElement).style.borderColor = '#c4c4c4';
            (e.currentTarget as HTMLElement).style.background = '#ffffff';
          } else if (variant === 'default') {
            (e.currentTarget as HTMLElement).style.background = '#ff5c3c';
          } else if (variant === 'ghost') {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = '#6b6b6b';
          }
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
