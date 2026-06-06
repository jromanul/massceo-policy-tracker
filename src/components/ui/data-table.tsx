'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
  useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { SearchInput } from './search-input';

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  className?: string;
}

export function DataTable<TData>({
  columns,
  data,
  searchable = false,
  searchPlaceholder = 'Search...',
  pageSize = 20,
  className = '',
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  const { pageIndex, pageSize: currentPageSize } = table.getState().pagination;
  const totalRows = table.getFilteredRowModel().rows.length;
  const pageCount = table.getPageCount();
  const startRow = pageIndex * currentPageSize + 1;
  const endRow = Math.min((pageIndex + 1) * currentPageSize, totalRows);

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {searchable && (
        <div className="flex items-center justify-between gap-3">
          <SearchInput
            placeholder={searchPlaceholder}
            onChange={(val) => setGlobalFilter(val)}
            className="max-w-xs"
          />
          {totalRows !== data.length && (
            <span className="text-sm text-slate-500">
              {totalRows} of {data.length} records
            </span>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-[4px] border border-[var(--border)] bg-[var(--surface)]">
        <table className="min-w-full">
          <thead
            style={{
              backgroundColor: 'var(--muted)',
              borderBottom: '2px solid var(--ma-navy)',
            }}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortDir = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] select-none ${
                        canSort ? 'cursor-pointer hover:text-[var(--ma-navy)]' : ''
                      }`}
                      style={{ color: 'var(--ma-navy)' }}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <span className="inline-flex items-center gap-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          <span style={{ color: 'var(--ma-navy)' }}>
                            {sortDir === 'asc' ? (
                              <ChevronUp size={14} />
                            ) : sortDir === 'desc' ? (
                              <ChevronDown size={14} />
                            ) : (
                              <ChevronsUpDown size={14} />
                            )}
                          </span>
                        )}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm"
                  style={{ color: 'var(--foreground-subtle)' }}
                >
                  No records found.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, idx) => (
                <tr
                  key={row.id}
                  className="transition-colors border-t border-[var(--border)] hover:bg-[var(--muted)]"
                  style={
                    idx % 2 === 1
                      ? { backgroundColor: 'var(--surface-alt)' }
                      : undefined
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 text-[13.5px] whitespace-nowrap"
                      style={{ color: 'var(--foreground)' }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-slate-500">
            {totalRows > 0 ? `${startRow}–${endRow} of ${totalRows}` : '0 records'}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1.5 text-sm rounded-[3px] border border-[var(--border-strong)] text-[var(--ma-navy-ink)] hover:bg-[var(--muted)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(pageCount, 7) }, (_, i) => {
              const page = i;
              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => table.setPageIndex(page)}
                  className={`px-3 py-1.5 text-sm rounded-[3px] border transition-colors ${
                    pageIndex === page
                      ? 'bg-[var(--ma-navy)] text-white border-[var(--ma-navy)]'
                      : 'border-[var(--border-strong)] text-[var(--ma-navy-ink)] hover:bg-[var(--muted)]'
                  }`}
                >
                  {page + 1}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1.5 text-sm rounded-[3px] border border-[var(--border-strong)] text-[var(--ma-navy-ink)] hover:bg-[var(--muted)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
