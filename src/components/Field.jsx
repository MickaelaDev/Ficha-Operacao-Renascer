import { useEffect, useRef, useState } from 'react';

export default function Field({ label, children, className = '' }) {
  return (
    <label className={`field ${className}`.trim()}>
      <span className="field__label">{label}</span>
      {children}
    </label>
  );
}

/**
 * Input numérico controlado com rascunho local: deixa apagar e digitar
 * livremente sem o valor "pular" de volta para 0 a cada tecla.
 */
export function NumberInput({ value, onChange, min = 0, max, className = 'input input--num', ...rest }) {
  const [draft, setDraft] = useState(String(value ?? 0));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setDraft(String(value ?? 0));
  }, [value]);

  const commit = (raw) => {
    const digits = raw.replace(/[^\d]/g, '');
    setDraft(digits);
    if (digits === '') return;
    let n = Number(digits);
    if (!Number.isFinite(n)) return;
    if (min !== undefined) n = Math.max(min, n);
    if (max !== undefined) n = Math.min(max, n);
    onChange(n);
  };

  return (
    <input
      {...rest}
      className={className}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={draft}
      onFocus={(event) => {
        focused.current = true;
        event.target.select();
      }}
      onChange={(event) => commit(event.target.value)}
      onBlur={() => {
        focused.current = false;
        setDraft(String(value ?? 0));
      }}
    />
  );
}
