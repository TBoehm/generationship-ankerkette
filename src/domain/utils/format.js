const LOCALES = { de: 'de-DE', en: 'en-GB' };

function resolve(locale) {
  return LOCALES[locale] ?? LOCALES.de;
}

export function formatInteger(value, locale) {
  return new Intl.NumberFormat(resolve(locale), { maximumFractionDigits: 0 }).format(value);
}

export function formatDecimal(value, locale, digits) {
  return new Intl.NumberFormat(resolve(locale), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}
