export function parsePublicationDate(value: Date | string | null): Date | null {
  if (!value) return null;
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? null : value;

  const normalized = value.trim();
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  // Obsługa historycznych rekordów zapisanych jako dd.mm.rrrr.
  const legacyMatch = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(normalized);
  if (legacyMatch) {
    const [, day, month, year] = legacyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatPublicationDate(
  value: Date | string | null,
  options: Intl.DateTimeFormatOptions
): string | null {
  const parsed = parsePublicationDate(value);
  return parsed ? parsed.toLocaleDateString("pl-PL", options) : null;
}
