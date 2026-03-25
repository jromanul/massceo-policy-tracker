'use client'

import { ReactNode } from 'react'
import { X } from 'lucide-react'

export interface FilterOption {
  value: string
  label: string
}

export interface FilterConfig {
  key: string
  label: string
  options: FilterOption[]
  placeholder?: string
}

interface FilterBarDataProps {
  filters: FilterConfig[]
  values: Record<string, string>
  onChange: (key: string, value: string) => void
  onClear?: () => void
  className?: string
  children?: never
}

interface FilterBarChildrenProps {
  children: ReactNode
  className?: string
  filters?: never
}

type FilterBarProps = FilterBarDataProps | FilterBarChildrenProps

function hasActiveFilters(values: Record<string, string>): boolean {
  return Object.values(values).some((v) => v !== '' && v !== undefined)
}

export function FilterBar(props: FilterBarProps) {
  // Data-driven mode (filters/values/onChange)
  if ('filters' in props && props.filters !== undefined) {
    const { filters, values, onChange, onClear, className = '' } = props
    const isActive = hasActiveFilters(values)

    return (
      <div
        className={`flex flex-wrap items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg ${className}`}
      >
        {filters.map((filter) => (
          <div key={filter.key} className="flex items-center gap-2">
            <label
              htmlFor={`filter-${filter.key}`}
              className="text-xs font-medium text-slate-600 whitespace-nowrap"
            >
              {filter.label}
            </label>
            <select
              id={`filter-${filter.key}`}
              value={values[filter.key] ?? ''}
              onChange={(e) => onChange(filter.key, e.target.value)}
              className="text-sm border border-slate-300 rounded-md bg-white text-slate-700 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
            >
              <option value="">{filter.placeholder ?? `All ${filter.label}`}</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}
        {isActive && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-slate-500 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
          >
            <X size={12} />
            Clear filters
          </button>
        )}
      </div>
    )
  }

  // Children-based mode
  const { children, className = '' } = props as FilterBarChildrenProps
  return (
    <div
      className={`flex flex-wrap items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg ${className}`}
    >
      {children}
    </div>
  )
}

interface FilterSelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: { label: string; value: string }[]
  placeholder?: string
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'All',
}: FilterSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-medium text-slate-600 whitespace-nowrap">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm border border-slate-300 rounded-md bg-white text-slate-700 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

interface FilterToggleProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function FilterToggle({ label, checked, onChange }: FilterToggleProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-slate-300 text-slate-800 focus:ring-slate-500"
      />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  )
}
