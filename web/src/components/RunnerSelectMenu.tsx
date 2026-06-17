import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@tutti-os/ui-system';
import { ChevronDown } from 'lucide-react';

type RunnerSelectMenuOption = {
  value: string;
  label: string;
  title?: string | null;
};

type RunnerSelectMenuProps = {
  className?: string;
  label: string;
  title: string;
  value: string;
  options: RunnerSelectMenuOption[];
  onValueChange: (value: string) => void;
};

export function RunnerSelectMenu({
  className = '',
  label,
  title,
  value,
  options,
  onValueChange,
}: RunnerSelectMenuProps) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`tool-button runner-select-button ${className}`.trim()}
          type="button"
          aria-label={title}
        >
          <span className="dropdown-menu-trigger-label runner-select-value">{label}</span>
          <ChevronDown size={16} data-icon="chevron-down" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="runner-menu-content min-w-24 w-max"
        style={{ zIndex: 'var(--z-dialog-popover)' }}
      >
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          {options.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              title={option.title || undefined}
            >
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
