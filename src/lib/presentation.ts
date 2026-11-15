/** Absence and invalid values must never be presented as a real zero. */
export function displayNumber(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function formatOptionalDate(value: string | null | undefined, language: string, dateOnly = false): string {
  if (!value) return '—';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';
  const locale = language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US';
  return dateOnly ? date.toLocaleDateString(locale) : date.toLocaleString(locale);
}

/** Tone follows the displayed precision, including values that round to negative zero. */
export function pnlPresentation(value: unknown) {
  const number = displayNumber(value);
  if (number === null) return { text: '—', className: 'text-muted-foreground' };
  const rounded = Number(number.toFixed(2));
  return {
    text: `${rounded > 0 ? '+' : ''}${rounded.toFixed(2)}`,
    className: rounded > 0 ? 'text-profit' : rounded < 0 ? 'text-loss' : 'text-muted-foreground',
  };
}
