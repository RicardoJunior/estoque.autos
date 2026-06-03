import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  textareaSize?: 'xs' | 'sm' | 'md' | 'lg';
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { label, error, helperText, fullWidth = false, textareaSize = 'md', className = '', ...props },
    ref
  ) => {
    const textareaClasses = [
      'textarea',
      'textarea-bordered',
      `textarea-${textareaSize}`,
      error ? 'textarea-error' : '',
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
        <textarea ref={ref} className={textareaClasses} {...props} />
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

Textarea.displayName = 'Textarea';
