function escapeCsvValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const normalized = String(value);
  if (normalized.includes('"') || normalized.includes(",") || normalized.includes("\n")) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

export function buildCsv(headers: string[], rows: Array<Array<string | number | boolean | null | undefined>>): string {
  const headerLine = headers.map(escapeCsvValue).join(",");
  const body = rows.map((row) => row.map(escapeCsvValue).join(",")).join("\n");
  // Prepend UTF-8 BOM so Excel opens it with correct encoding
  return `\uFEFF${headerLine}\n${body}`;
}
