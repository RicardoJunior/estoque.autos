import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  selectSize?: 'xs' | 'sm' | 'md' | 'lg';
  options: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      selectSize = 'md',
      className = '',
      options,
      ...props
    },
    ref
  ) => {
    const selectClasses = [
      'select',
      'select-bordered',
      `select-${selectSize}`,
      error ? 'select-error' : '',
      fullWidth ? 'w-full' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="label">
            <span className="label-text">{label}</span>
          </label>
        )}
        <select ref={ref} className={selectClasses} {...props}>
          <option value="">Selecione...</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {(error || helperText) && (
          <label className="label">
            {error && <span className="label-text-alt text-error">{error}</span>}
            {!error && helperText && <span className="label-text-alt">{helperText}</span>}
          </label>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
