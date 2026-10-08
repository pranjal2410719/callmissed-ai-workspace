'use client';

import * as React from 'react';
import { ChevronDownIcon, CheckIcon } from 'lucide-react';
import { Button } from './button';
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
  logo?: React.ReactNode;
  group?: string;
}

interface SelectDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label?: string;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  triggerStyle?: React.CSSProperties;
  style?: React.CSSProperties;
  disabled?: boolean;
}

/**
 * Modern model/option select dropdown matching @reui/c-dropdown-menu-18 pattern.
 * Supports icons/logos, category groups, clean outline button trigger with ChevronDownIcon,
 * and coral check indicator for selected items. Fully mobile responsive.
 */
export const SelectDropdown: React.FC<SelectDropdownProps> = ({
  value,
  onChange,
  options,
  label,
  placeholder = 'Select...',
  className = '',
  triggerClassName = '',
  triggerStyle,
  style,
  disabled = false,
}) => {
  const selectedOption = options.find((o) => o.value === value);

  const hasGroups = options.some((o) => o.group);
  const groups: Record<string, SelectOption[]> = {};
  if (hasGroups) {
    for (const opt of options) {
      const g = opt.group ?? '';
      if (!groups[g]) groups[g] = [];
      groups[g].push(opt);
    }
  }

  return (
    <div className={`w-full sm:w-auto ${className}`} style={style}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: '11px',
            letterSpacing: '0.143em',
            textTransform: 'uppercase',
            color: '#6b6b6b',
            fontWeight: 700,
            marginBottom: '6px',
          }}
        >
          {label}
        </label>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={disabled}
          render={
            <Button
              variant="outline"
              size="sm"
              className={`w-full sm:w-auto min-w-[140px] justify-between ${triggerClassName}`}
              style={{
                background: '#ffffff',
                border: '1px solid #c4c4c4',
                color: '#000000',
                fontSize: '13px',
                fontWeight: 500,
                letterSpacing: '-0.01em',
                padding: '6px 12px',
                borderRadius: '8px',
                ...triggerStyle,
              }}
            >
              <span className="flex items-center gap-2 truncate">
                {selectedOption?.logo && (
                  <span className="shrink-0">{selectedOption.logo}</span>
                )}
                <span className="truncate">{selectedOption?.label || placeholder}</span>
              </span>
              <ChevronDownIcon
                className="ml-2 h-3.5 w-3.5 text-[#6b6b6b] shrink-0"
                aria-hidden="true"
              />
            </Button>
          }
        />

        <DropdownMenuContent
          align="start"
          className="w-56 max-h-72 overflow-y-auto"
          style={{
            minWidth: '200px',
            background: '#ffffff',
            border: '1px solid #c4c4c4',
            borderRadius: '12px',
            padding: '4px',
            boxShadow:
              'rgba(239, 227, 225, 0.4) 5px 5px 24px 0px, rgba(133, 136, 140, 0.15) 0px 0px 30px 0px',
            zIndex: 60,
          }}
        >
          {label && (
            <DropdownMenuLabel
              style={{
                fontSize: '11px',
                letterSpacing: '0.143em',
                textTransform: 'uppercase',
                color: '#6b6b6b',
                padding: '6px 10px',
                fontWeight: 700,
              }}
            >
              {label}
            </DropdownMenuLabel>
          )}

          {hasGroups ? (
            Object.entries(groups).map(([groupName, groupOptions], gIdx) => (
              <React.Fragment key={groupName || gIdx}>
                {gIdx > 0 && <DropdownMenuSeparator />}
                {groupName && (
                  <DropdownMenuLabel
                    style={{
                      fontSize: '11px',
                      letterSpacing: '0.143em',
                      textTransform: 'uppercase',
                      color: '#6b6b6b',
                      padding: '4px 10px',
                    }}
                  >
                    {groupName}
                  </DropdownMenuLabel>
                )}
                <DropdownMenuGroup>
                  {groupOptions.map((item) => {
                    const isSelected = item.value === value;
                    return (
                      <DropdownMenuItem
                        key={item.value}
                        onSelect={() => onChange(item.value)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          padding: '7px 10px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: isSelected ? 600 : 400,
                          background: isSelected ? '#f8f6f2' : 'transparent',
                          color: '#000000',
                          cursor: 'pointer',
                        }}
                      >
                        <span className="flex items-center gap-2 truncate">
                          {item.logo && (
                            <span className="shrink-0">{item.logo}</span>
                          )}
                          <span className="truncate">{item.label}</span>
                        </span>
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
              {options.map((item) => {
                const isSelected = item.value === value;
                return (
                  <DropdownMenuItem
                    key={item.value}
                    onSelect={() => onChange(item.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: isSelected ? 600 : 400,
                      background: isSelected ? '#f8f6f2' : 'transparent',
                      color: '#000000',
                      cursor: 'pointer',
                    }}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {item.logo && (
                        <span className="shrink-0">{item.logo}</span>
                      )}
                      <span className="truncate">{item.label}</span>
                    </span>
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
