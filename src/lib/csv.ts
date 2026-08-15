export function csvCell(value: string | number | boolean | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value)
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function csvRow(values: (string | number | boolean | null | undefined)[]): string {
  return values.map(csvCell).join(",")
}
