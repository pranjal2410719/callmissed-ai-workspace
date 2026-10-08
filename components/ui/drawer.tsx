'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

const Drawer = DialogPrimitive.Root;
const DrawerTrigger = DialogPrimitive.Trigger;
const DrawerPortal = DialogPrimitive.Portal;
const DrawerClose = DialogPrimitive.Close;

const DrawerOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ style, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      background: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(2px)',
      animation: 'fadeIn 0.15s ease',
      ...style,
    }}
    {...props}
  />
));
DrawerOverlay.displayName = DialogPrimitive.Overlay.displayName;

interface DrawerContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: 'right' | 'bottom';
}

const DrawerContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  DrawerContentProps
>(({ side = 'right', children, style, ...props }, ref) => {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DialogPrimitive.Content
        ref={ref}
        style={{
          position: 'fixed',
          zIndex: 51,
          background: '#ffffff',
          boxShadow: 'rgba(239, 227, 225, 0.4) 5px 5px 30px 0px, rgba(0, 0, 0, 0.1) 0px 10px 40px 0px',
          display: 'flex',
          flexDirection: 'column',
          outline: 'none',
          ...(side === 'right'
            ? {
                top: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                maxWidth: '460px',
                borderLeft: '1px solid #c4c4c4',
                animation: 'slideInRight 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }
            : {
                left: 0,
                right: 0,
                bottom: 0,
                maxHeight: '85vh',
                borderTop: '1px solid #c4c4c4',
                borderRadius: '20px 20px 0 0',
                animation: 'slideInBottom 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }),
          ...style,
        }}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            borderRadius: '8px',
            border: '1px solid #c4c4c4',
            background: '#f8f6f2',
            padding: '6px',
            cursor: 'pointer',
            color: '#141414',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s',
          }}
          aria-label="Close"
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#e8e8ea';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#f8f6f2';
          }}
        >
          <X style={{ width: '15px', height: '15px' }} />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DrawerPortal>
  );
});
DrawerContent.displayName = DialogPrimitive.Content.displayName;

const DrawerHeader = ({
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    style={{
      padding: '20px 24px',
      borderBottom: '1px solid #c4c4c4',
      background: '#f8f6f2',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      ...style,
    }}
    {...props}
  />
);
DrawerHeader.displayName = 'DrawerHeader';

const DrawerFooter = ({
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    style={{
      marginTop: 'auto',
      padding: '16px 24px',
      borderTop: '1px solid #c4c4c4',
      background: '#f8f6f2',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: '10px',
      ...style,
    }}
    {...props}
  />
);
DrawerFooter.displayName = 'DrawerFooter';

const DrawerTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ style, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    style={{
      fontSize: '16px',
      fontWeight: 700,
      letterSpacing: '-0.01em',
      color: '#000000',
      fontFamily: "'Labil Grotesk', 'Inter', sans-serif",
      ...style,
    }}
    {...props}
  />
));
DrawerTitle.displayName = DialogPrimitive.Title.displayName;

const DrawerDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ style, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    style={{
      fontSize: '13px',
      color: '#6b6b6b',
      letterSpacing: '-0.01em',
      lineHeight: 1.4,
      ...style,
    }}
    {...props}
  />
));
DrawerDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Drawer,
  DrawerTrigger,
  DrawerPortal,
  DrawerClose,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
