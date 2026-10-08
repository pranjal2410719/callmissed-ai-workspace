'use client';

import * as React from 'react';
import { ChevronDownIcon, CheckIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from './dropdown-menu';

export interface SelectOption {
  value: string;
  label: string;
  group?: string;
}

interface SelectDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label?: string;
  /** Optional suffix to append inside the trigger after the selected label */
  triggerSuffix?: string;
  style?: React.CSSProperties;
  triggerStyle?: React.CSSProperties;
  disabled?: boolean;
}

/**
 * A styled select-replacement built on Radix DropdownMenu.
 * Matches the Pietrastudio design system: cream hover, warm shadows,
 * coral checkmark for the selected item, 12px content radius.
 */
export const SelectDropdown: React.FC<SelectDropdownProps> = ({
  value,
  onChange,
  options,
  label,
  triggerSuffix,
  style,
  triggerStyle,
  disabled = false,
}) => {
  const selectedOption = options.find((o) => o.value === value);

  // Group options if any have a `group` field
  const hasGroups = options.some((o) => o.group);
  const groups: Record<string, SelectOption[]> = {};
  if (hasGroups) {
    for (const opt of options) {
      const g = opt.group ?? '';
      if (!groups[g]) groups[g] = [];
      groups[g].push(opt);
    }
  }

  const triggerLabel = selectedOption
    ? triggerSuffix
      ? `${selectedOption.label} ${triggerSuffix}`
      : selectedOption.label
    : 'Select...';

  return (
    <div style={style}>
      {label && (
        <div
          style={{
            fontSize: '11px',
            letterSpacing: '0.143em',
            textTransform: 'uppercase',
            color: '#6b6b6b',
            fontWeight: 700,
            marginBottom: '6px',
          }}
        >
          {label}
        </div>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={disabled}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            borderRadius: '8px',
            border: '1px solid #c4c4c4',
            background: '#ffffff',
            padding: '7px 10px',
            fontSize: '13px',
            letterSpacing: '-0.01em',
            color: '#000000',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            outline: 'none',
            width: '100%',
            minWidth: '0',
            textAlign: 'left',
            transition: 'border-color 0.15s, background 0.15s',
            ...triggerStyle,
          }}
          onMouseOver={(e) => {
            if (!disabled) (e.currentTarget as HTMLElement).style.borderColor = '#000000';
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = '#c4c4c4';
          }}
          onFocus={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = '#000000';
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = '#c4c4c4';
          }}
        >
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            {triggerLabel}
          </span>
          <ChevronDownIcon
            style={{ width: '14px', height: '14px', color: '#6b6b6b', flexShrink: 0 }}
          />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" style={{ minWidth: '220px', maxHeight: '320px', overflowY: 'auto' }}>
          {hasGroups ? (
            Object.entries(groups).map(([groupName, groupOptions], gIdx) => (
              <React.Fragment key={groupName || gIdx}>
                {gIdx > 0 && <DropdownMenuSeparator />}
                {groupName && <DropdownMenuLabel>{groupName}</DropdownMenuLabel>}
                <DropdownMenuGroup>
                  {groupOptions.map((opt) => {
                    const isSelected = opt.value === value;
                    return (
                      <DropdownMenuItem
                        key={opt.value}
                        onSelect={() => onChange(opt.value)}
                        style={{
                          justifyContent: 'space-between',
                          fontWeight: isSelected ? 700 : 400,
                          background: isSelected ? '#f8f6f2' : 'transparent',
                        }}
                      >
                        <span>{opt.label}</span>
                        {isSelected && (
                          <CheckIcon
                            style={{ width: '13px', height: '13px', color: '#ff5c3c', flexShrink: 0 }}
                          />
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuGroup>
              </React.Fragment>
            ))
          ) : (
            <DropdownMenuGroup>
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <DropdownMenuItem
                    key={opt.value}
                    onSelect={() => onChange(opt.value)}
                    style={{
                      justifyContent: 'space-between',
                      fontWeight: isSelected ? 700 : 400,
                      background: isSelected ? '#f8f6f2' : 'transparent',
                    }}
                  >
                    <span>{opt.label}</span>
                    {isSelected && (
                      <CheckIcon
                        style={{ width: '13px', height: '13px', color: '#ff5c3c', flexShrink: 0 }}
                      />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
