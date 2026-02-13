import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  inputSize?: 'xs' | 'sm' | 'md' | 'lg';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, helperText, fullWidth = false, inputSize = 'md', className = '', ...props },
    ref
  ) => {
    const inputClasses = [
      'input',
      'input-bordered',
      `input-${inputSize}`,
      error ? 'input-error' : '',
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
        <input ref={ref} className={inputClasses} {...props} />
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

Input.displayName = 'Input';
