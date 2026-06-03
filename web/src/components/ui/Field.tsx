export function Field({
  label,
  name,
  error,
  hint,
  children,
  ...props
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      {children ?? <input id={name} name={name} className="field" {...props} />}
      {hint && !error && (
        <p className="mt-1 text-xs text-[var(--color-ink-soft)]">{hint}</p>
      )}
      {error && <p className="mt-1 text-xs text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}
