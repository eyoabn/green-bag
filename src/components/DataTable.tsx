"use client";

import React from "react";
import { Search, ChevronLeft, ChevronRight, AlertCircle, RefreshCw, Inbox } from "lucide-react";

export interface DataTableColumn<T> {
  header: string;
  accessorKey?: keyof T;
  id?: string;
  className?: string;
  cell?: (row: T) => React.ReactNode;
}

export interface DataTableFilter {
  id: string;
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}

export interface DataTableProps<T> {
  title?: string;
  subtitle?: string;
  columns: DataTableColumn<T>[];
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  filters?: DataTableFilter[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyMessage?: string;
  actions?: React.ReactNode;
  keyExtractor: (item: T) => string;
}

export default function DataTable<T>({
  title,
  subtitle,
  columns,
  data,
  totalCount,
  page,
  pageSize,
  onPageChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search records...",
  filters = [],
  isLoading = false,
  isError = false,
  errorMessage = "An error occurred while loading records.",
  onRetry,
  emptyTitle = "No records found",
  emptyMessage = "There are no records matching your current filter criteria.",
  actions,
  keyExtractor,
}: DataTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startRecord = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, totalCount);

  return (
    <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm overflow-hidden flex flex-col">
      {/* Table Header Controls */}
      <div className="p-5 sm:p-6 border-b border-stone-200/80 bg-stone-50/50 space-y-4">
        {(title || actions) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              {title && <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">{title}</h2>}
              {subtitle && <p className="text-xs sm:text-sm text-stone-500 mt-0.5">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2.5">{actions}</div>}
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {onSearchChange !== undefined && (
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
              <input
                type="text"
                value={searchValue || ""}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#1E3B2E]/20 focus:border-[#1E3B2E] transition-all"
              />
            </div>
          )}

          {filters.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              {filters.map((filter) => (
                <div key={filter.id} className="relative min-w-[130px]">
                  <select
                    value={filter.value}
                    onChange={(e) => filter.onChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs sm:text-sm text-stone-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#1E3B2E]/20 focus:border-[#1E3B2E] transition-all cursor-pointer"
                  >
                    {filter.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {filter.label ? `${filter.label}: ${opt.label}` : opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-stone-100/70 border-b border-stone-200/80 text-[11px] font-bold uppercase tracking-wider text-stone-500">
            <tr>
              {columns.map((col, idx) => (
                <th key={col.id || (col.accessorKey ? String(col.accessorKey) : `th-${idx}`)} className={`px-5 py-3.5 ${col.className || ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-100">
            {isLoading ? (
              // Loading Skeleton
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx} className="animate-pulse">
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="px-5 py-4">
                      <div className="h-4 bg-stone-200/70 rounded-md w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : isError ? (
              // Error State
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-3">
                      <AlertCircle size={24} />
                    </div>
                    <p className="font-bold text-stone-900 text-sm mb-1">{errorMessage}</p>
                    <p className="text-xs text-stone-500 mb-4">Please verify database connectivity and try again.</p>
                    {onRetry && (
                      <button
                        onClick={onRetry}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E3B2E] text-[#E0B382] hover:bg-[#8C4B31] hover:text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        <RefreshCw size={14} />
                        <span>Retry</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mb-3">
                      <Inbox size={28} />
                    </div>
                    <h3 className="font-bold text-stone-800 text-base mb-1">{emptyTitle}</h3>
                    <p className="text-xs text-stone-500 leading-relaxed">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              // Real Data Rows
              data.map((item) => {
                const key = keyExtractor(item);
                return (
                  <tr key={key} className="hover:bg-stone-50/80 transition-colors">
                    {columns.map((col, cIdx) => (
                      <td key={col.id || (col.accessorKey ? String(col.accessorKey) : `td-${cIdx}`)} className={`px-5 py-4 ${col.className || ""}`}>
                        {col.cell
                          ? col.cell(item)
                          : col.accessorKey
                          ? String(item[col.accessorKey] ?? "")
                          : null}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 sm:p-5 border-t border-stone-200/80 bg-stone-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600">
        <div>
          Showing <span className="font-bold text-stone-900">{startRecord}</span> to{" "}
          <span className="font-bold text-stone-900">{endRecord}</span> of{" "}
          <span className="font-bold text-stone-900">{totalCount}</span> entries
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || isLoading}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 disabled:opacity-40 disabled:cursor-not-allowed font-semibold transition-colors cursor-pointer"
          >
            <ChevronLeft size={14} />
            <span>Prev</span>
          </button>

          <span className="px-2 font-medium text-stone-700">
            Page <span className="font-bold text-stone-900">{page}</span> of{" "}
            <span className="font-bold text-stone-900">{totalPages}</span>
          </span>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || isLoading}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 disabled:opacity-40 disabled:cursor-not-allowed font-semibold transition-colors cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
