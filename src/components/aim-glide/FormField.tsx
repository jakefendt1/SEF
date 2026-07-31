// Accessible Form Field Components
// Design: Executive Dashboard — all form controls have proper labels, hints, and ARIA attributes

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useId } from 'react';

interface NumberFieldProps {
  label: string;
  hint?: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  step?: string;
  id?: string;
  className?: string;
}

export function NumberField({ label, hint, value, onChange, suffix, step = '1', id: propId, className }: NumberFieldProps) {
  const autoId = useId();
  const id = propId || autoId;
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id} className="text-sm font-medium text-foreground/80">
        {label}
        {hint && <span className="ml-1.5 text-xs font-normal text-muted-foreground">({hint})</span>}
      </Label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="number"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          step={step}
          className="font-mono text-base h-11 min-h-[44px]"
          aria-describedby={hintId}
          inputMode="decimal"
        />
        {suffix && (
          <span className="text-sm text-muted-foreground whitespace-nowrap shrink-0" aria-hidden="true">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

interface NumberWithSelectProps {
  label: string;
  hint?: string;
  value: number;
  onChange: (value: number) => void;
  selectValue: string;
  onSelectChange: (value: string) => void;
  options: { value: string; label: string }[];
  suffix?: string;
  step?: string;
  selectLabel?: string;
  className?: string;
}

export function NumberWithSelect({
  label, hint, value, onChange, selectValue, onSelectChange, options, suffix, step = '1', selectLabel, className
}: NumberWithSelectProps) {
  const id = useId();
  const selectId = `${id}-select`;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id} className="text-sm font-medium text-foreground/80">
        {label}
        {hint && <span className="ml-1.5 text-xs font-normal text-muted-foreground">({hint})</span>}
      </Label>
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <Input
          id={id}
          type="number"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          step={step}
          className="font-mono text-base h-11 min-h-[44px] flex-1 min-w-[100px]"
          inputMode="decimal"
        />
        {suffix && (
          <span className="text-sm text-muted-foreground whitespace-nowrap shrink-0" aria-hidden="true">
            {suffix}
          </span>
        )}
        <Select value={selectValue} onValueChange={onSelectChange}>
          <SelectTrigger
            className="h-11 min-h-[44px] min-w-[120px] w-auto"
            aria-label={selectLabel || `${label} time period`}
            id={selectId}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
}

export function TextField({ label, value, onChange, placeholder, id: propId, className }: TextFieldProps) {
  const autoId = useId();
  const id = propId || autoId;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id} className="text-sm font-medium text-foreground/80">
        {label}
      </Label>
      <Input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 min-h-[44px] text-base"
      />
    </div>
  );
}

interface NumberWithSelectAndTextProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  selectValue: string;
  onSelectChange: (value: string) => void;
  options: { value: string; label: string }[];
  textValue: string;
  onTextChange: (value: string) => void;
  textPlaceholder?: string;
  className?: string;
}

export function NumberWithSelectAndText({
  label, value, onChange, selectValue, onSelectChange, options, textValue, onTextChange, textPlaceholder, className
}: NumberWithSelectAndTextProps) {
  const id = useId();

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id} className="text-sm font-medium text-foreground/80">
        {label}
      </Label>
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          id={id}
          type="number"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="font-mono text-base h-11 min-h-[44px] w-[140px]"
          inputMode="decimal"
        />
        <span className="text-sm text-muted-foreground shrink-0" aria-hidden="true">$</span>
        <Select value={selectValue} onValueChange={onSelectChange}>
          <SelectTrigger className="h-11 min-h-[44px] min-w-[120px] w-auto" aria-label={`${label} time period`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="text"
          value={textValue}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={textPlaceholder}
          className="h-11 min-h-[44px] text-base flex-1 min-w-[160px]"
          aria-label={`${label} description`}
        />
      </div>
    </div>
  );
}

interface OutputFieldProps {
  label: string;
  hint?: string;
  value: number;
  onChange: (value: number) => void;
  productValue: string;
  onProductChange: (value: string) => void;
  productOptions: { value: string; label: string }[];
  unitValue: string;
  onUnitChange: (value: string) => void;
  unitOptions: { value: string; label: string }[];
  className?: string;
}

export function OutputField({
  label, hint, value, onChange, productValue, onProductChange, productOptions, unitValue, onUnitChange, unitOptions, className
}: OutputFieldProps) {
  const id = useId();

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id} className="text-sm font-medium text-foreground/80">
        {label}
        {hint && <span className="ml-1.5 text-xs font-normal text-muted-foreground">({hint})</span>}
      </Label>
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <Input
          id={id}
          type="number"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="font-mono text-base h-11 min-h-[44px] flex-1 min-w-[100px]"
          inputMode="decimal"
        />
        <Select value={productValue} onValueChange={onProductChange}>
          <SelectTrigger className="h-11 min-h-[44px] min-w-[100px] w-auto" aria-label="Product unit type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {productOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={unitValue} onValueChange={onUnitChange}>
          <SelectTrigger className="h-11 min-h-[44px] min-w-[110px] w-auto" aria-label="Output time period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {unitOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
