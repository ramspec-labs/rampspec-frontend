import type { ReactNode } from "react";

export type DataColumn<T> = { key: string; label: string; render: (row: T) => ReactNode };
export function DataTable<T extends { id: string }>({ caption, columns, rows }: { caption: string; columns: DataColumn<T>[]; rows: T[] }) {
  return <div className="overflow-hidden rounded-lg border border-line bg-surface"><table className="w-full text-left text-sm"><caption className="sr-only">{caption}</caption><thead className="border-b border-line bg-canvas text-xs uppercase tracking-wide text-muted"><tr>{columns.map((column) => <th key={column.key} scope="col" className="px-4 py-3 font-semibold">{column.label}</th>)}</tr></thead><tbody className="divide-y divide-line">{rows.map((row) => <tr key={row.id} className="hover:bg-canvas">{columns.map((column) => <td key={column.key} className="px-4 py-3 align-top">{column.render(row)}</td>)}</tr>)}</tbody></table></div>;
}
