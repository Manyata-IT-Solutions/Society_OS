/**
 * Sanitizes text to prevent CSV/Excel Formula Injection attacks.
 * Prepends a single quote to strings starting with '=', '+', '-', '@', '\t', '\r'.
 */
export function sanitizeCsvFormula(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);
  if (str.length === 0) {
    return '';
  }

  const firstChar = str.charAt(0);
  if (['=', '+', '-', '@', '\t', '\r'].includes(firstChar)) {
    return `'${str}`;
  }

  return str;
}

export function sanitizeRowForCsv(row: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(row)) {
    if (typeof val === 'string') {
      sanitized[key] = sanitizeCsvFormula(val);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}
