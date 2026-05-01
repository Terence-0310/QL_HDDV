"use client";

import type { ReactNode } from "react";

type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
};

export function DataTable<T>({ columns, rows }: Props<T>) {
  return (
    <div className="card" style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "860px" }}>
        <thead>
          <tr style={{ background: "var(--surface-muted)" }}>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{
                  textAlign: "left",
                  padding: "0.8rem 0.9rem",
                  borderBottom: "1px solid var(--border)",
                  color: "var(--text-muted)",
                  fontWeight: 700,
                  fontSize: "0.86rem",
                }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} style={{ transition: "background 0.15s ease" }}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  style={{
                    padding: "0.82rem 0.9rem",
                    borderBottom: "1px solid #f3ece7",
                    verticalAlign: "top",
                  }}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
