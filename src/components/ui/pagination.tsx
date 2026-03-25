'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  maxVisible?: number;
  className?: string;
}

function getPageNumbers(current: number, total: number, maxVisible: number): (number | '...')[] {
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, current - half);
  let end = Math.min(total, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  const pages: (number | '...')[] = [];

  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push('...');
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (end < total) {
    if (end < total - 1) pages.push('...');
    pages.push(total);
  }

  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = false,
  maxVisible = 7,
  className = '',
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages, maxVisible);

  const btnBase =
    'inline-flex items-center justify-center w-8 h-8 rounded-md text-sm border transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-40 disabled:cursor-not-allowed';
  const btnIdle = 'border-slate-300 text-slate-600 hover:bg-slate-50';
  const btnActive = 'border-slate-800 bg-slate-800 text-white';
  const btnIcon = `${btnBase} ${btnIdle}`;

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={`flex items-center gap-1 ${className}`}
    >
      {showFirstLast && (
        <button
          type="button"
          aria-label="First page"
          disabled={currentPage === 1}
          onClick={() => onPageChange(1)}
          className={btnIcon}
        >
          <ChevronsLeft size={14} />
        </button>
      )}

      <button
        type="button"
        aria-label="Previous page"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className={btnIcon}
      >
        <ChevronLeft size={14} />
      </button>

      {pages.map((page, idx) =>
        page === '...' ? (
          <span
            key={`ellipsis-${idx}`}
            className="w-8 h-8 flex items-center justify-center text-sm text-slate-400"
            aria-hidden="true"
          >
            &hellip;
          </span>
        ) : (
          <button
            key={page}
            type="button"
            aria-label={`Page ${page}`}
            aria-current={currentPage === page ? 'page' : undefined}
            onClick={() => onPageChange(page as number)}
            className={`${btnBase} ${currentPage === page ? btnActive : btnIdle}`}
          >
            {page}
          </button>
        )
      )}

      <button
        type="button"
        aria-label="Next page"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className={btnIcon}
      >
        <ChevronRight size={14} />
      </button>

      {showFirstLast && (
        <button
          type="button"
          aria-label="Last page"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(totalPages)}
          className={btnIcon}
        >
          <ChevronsRight size={14} />
        </button>
      )}
    </nav>
  );
}
