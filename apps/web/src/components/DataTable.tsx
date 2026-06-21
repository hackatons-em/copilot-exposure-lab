import type { ReactNode } from "react";

export interface Column<Row> {
  key: string;
  header: ReactNode;
  /** Render the cell for a row. */
  cell: (row: Row) => ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}

interface DataTableProps<Row> {
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  onRowHref?: (row: Row) => string;
  empty?: ReactNode;
}

const alignClass = { left: "text-left", right: "text-right", center: "text-center" } as const;

/** Dense, readable table on a calm light surface. */
export function DataTable<Row>({ columns, rows, rowKey, empty }: DataTableProps<Row>) {
  return (
    <div className="overflow-hidden rounded-lg border border-surface-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-surface-border bg-surface-subtle">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink-faint ${
                    alignClass[col.align ?? "left"]
                  } ${col.className ?? ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-ink-faint">
                  {empty ?? "No rows."}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={rowKey(row)} className="border-b border-surface-border last:border-0 hover:bg-surface-subtle">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-3 py-2.5 align-middle text-ink ${alignClass[col.align ?? "left"]} ${
                        col.className ?? ""
                      }`}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
