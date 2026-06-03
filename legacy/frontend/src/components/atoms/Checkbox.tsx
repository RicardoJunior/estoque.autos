import React from 'react';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  checkboxSize?: 'xs' | 'sm' | 'md' | 'lg';
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, checkboxSize = 'md', className = '', ...props }, ref) => {
    const checkboxClasses = [
      'checkbox',
      `checkbox-${checkboxSize}`,
      error ? 'checkbox-error' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="form-control">
        <label className="label cursor-pointer justify-start gap-3">
          <input ref={ref} type="checkbox" className={checkboxClasses} {...props} />
          <span className="label-text">{label}</span>
        </label>
        {error && (
          <label className="label">
            <span className="label-text-alt text-error">{error}</span>
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
