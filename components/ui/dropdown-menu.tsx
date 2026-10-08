'use client';

import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { CheckIcon, ChevronRightIcon, CircleIcon } from 'lucide-react';

// ─── Root ────────────────────────────────────────────────────────────────────
const DropdownMenu = DropdownMenuPrimitive.Root;

interface DropdownMenuTriggerProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger> {
  render?: React.ReactElement<{ children?: React.ReactNode; className?: string }>;
}

const DropdownMenuTrigger = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Trigger>,
  DropdownMenuTriggerProps
>(({ render, children, asChild, ...props }, ref) => {
  if (render) {
    return (
      <DropdownMenuPrimitive.Trigger ref={ref} asChild {...props}>
        {React.cloneElement(render, {
          children: render.props.children || children,
        })}
      </DropdownMenuPrimitive.Trigger>
    );
  }
  return (
    <DropdownMenuPrimitive.Trigger ref={ref} asChild={asChild} {...props}>
      {children}
    </DropdownMenuPrimitive.Trigger>
  );
});
DropdownMenuTrigger.displayName = DropdownMenuPrimitive.Trigger.displayName;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

// ─── SubTrigger ──────────────────────────────────────────────────────────────
const DropdownMenuSubTrigger = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className: _cls, inset: _inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      borderRadius: '6px',
      padding: '7px 10px',
      fontSize: '13px',
      letterSpacing: '-0.01em',
      color: '#000000',
      cursor: 'pointer',
      userSelect: 'none',
      outline: 'none',
      background: 'transparent',
      border: 'none',
      width: '100%',
    }}
    {...props}
  >
    {children}
    <ChevronRightIcon style={{ marginLeft: 'auto', width: '14px', height: '14px', color: '#6b6b6b' }} />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

// ─── SubContent ──────────────────────────────────────────────────────────────
const DropdownMenuSubContent = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    style={{
      minWidth: '160px',
      background: '#ffffff',
      border: '1px solid #c4c4c4',
      borderRadius: '12px',
      padding: '4px',
      boxShadow: 'rgba(239, 227, 225, 0.3) 5px 5px 24px 0px, rgba(133, 136, 140, 0.2) 0px 0px 40px 0px',
      zIndex: 60,
    }}
    {...props}
  />
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

// ─── Content ─────────────────────────────────────────────────────────────────
const DropdownMenuContent = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ sideOffset = 6, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      style={{
        minWidth: '200px',
        background: '#ffffff',
        border: '1px solid #c4c4c4',
        borderRadius: '12px',
        padding: '4px',
        boxShadow:
          'rgba(239, 227, 225, 0.3) 5px 5px 24px 0px, rgba(133, 136, 140, 0.2) 0px 0px 40px 0px',
        zIndex: 60,
        animationDuration: '120ms',
      }}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

// ─── Item ─────────────────────────────────────────────────────────────────────
interface DropdownMenuItemProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> {
  inset?: boolean;
  variant?: 'default' | 'destructive';
}

const DropdownMenuItem = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Item>,
  DropdownMenuItemProps
>(({ inset: _inset, variant = 'default', style, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      borderRadius: '8px',
      padding: '7px 10px',
      fontSize: '13px',
      letterSpacing: '-0.01em',
      color: variant === 'destructive' ? '#ff5c3c' : '#000000',
      cursor: 'pointer',
      userSelect: 'none',
      outline: 'none',
      background: 'transparent',
      border: 'none',
      width: '100%',
      transition: 'background 0.1s',
      ...style,
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLElement).style.background =
        variant === 'destructive' ? '#fff1ee' : '#f8f6f2';
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLElement).style.background = 'transparent';
    }}
    {...props}
  />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

// ─── CheckboxItem ─────────────────────────────────────────────────────────────
const DropdownMenuCheckboxItem = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    checked={checked}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      borderRadius: '8px',
      padding: '7px 10px 7px 32px',
      fontSize: '13px',
      letterSpacing: '-0.01em',
      color: '#000000',
      cursor: 'pointer',
      userSelect: 'none',
      outline: 'none',
      position: 'relative',
    }}
    {...props}
  >
    <span style={{ position: 'absolute', left: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px' }}>
      <DropdownMenuPrimitive.ItemIndicator>
        <CheckIcon style={{ width: '12px', height: '12px', color: '#ff5c3c' }} />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

// ─── RadioItem ────────────────────────────────────────────────────────────────
const DropdownMenuRadioItem = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      borderRadius: '8px',
      padding: '7px 10px 7px 32px',
      fontSize: '13px',
      letterSpacing: '-0.01em',
      color: '#000000',
      cursor: 'pointer',
      userSelect: 'none',
      outline: 'none',
      position: 'relative',
    }}
    {...props}
  >
    <span style={{ position: 'absolute', left: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px' }}>
      <DropdownMenuPrimitive.ItemIndicator>
        <CircleIcon style={{ width: '8px', height: '8px', fill: '#ff5c3c', color: '#ff5c3c' }} />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

// ─── Label ────────────────────────────────────────────────────────────────────
const DropdownMenuLabel = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ inset: _inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    style={{
      padding: '5px 10px',
      fontSize: '11px',
      letterSpacing: '0.143em',
      textTransform: 'uppercase',
      color: '#6b6b6b',
      fontWeight: 700,
    }}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

// ─── Separator ────────────────────────────────────────────────────────────────
const DropdownMenuSeparator = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    style={{
      margin: '4px -4px',
      height: '1px',
      background: '#c4c4c4',
    }}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

// ─── Shortcut ─────────────────────────────────────────────────────────────────
const DropdownMenuShortcut = ({ ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    style={{
      marginLeft: 'auto',
      fontSize: '11px',
      letterSpacing: '0.08em',
      color: '#6b6b6b',
    }}
    {...props}
  />
);
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};
