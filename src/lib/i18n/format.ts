export function formatDate(value: string, locale = "en-NG", timeZone = "Africa/Lagos") { return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone }).format(new Date(value)); }
export function formatNumber(value: number, locale = "en-NG") { return new Intl.NumberFormat(locale).format(value); }
