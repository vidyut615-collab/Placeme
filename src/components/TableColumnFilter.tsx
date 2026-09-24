'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Filter, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface TableColumnFilterProps {
  title: string
  options: string[]
  selectedValues: string[]
  onChange: (selected: string[]) => void
  showSearch?: boolean
}

export function TableColumnFilter({
  title,
  options,
  selectedValues,
  onChange,
  showSearch = true,
}: TableColumnFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const filteredOptions = useMemo(() => {
    if (!showSearch || !search.trim()) return options
    const q = search.toLowerCase().trim()
    return options.filter(opt => opt.toLowerCase().includes(q))
  }, [options, search, showSearch])

  const isActive = selectedValues.length > 0

  const handleToggle = (option: string) => {
    if (selectedValues.includes(option)) {
      onChange(selectedValues.filter(v => v !== option))
    } else {
      onChange([...selectedValues, option])
    }
  }

  const handleSelectAll = () => {
    const all = Array.from(new Set([...selectedValues, ...filteredOptions]))
    onChange(all)
  }

  const handleClear = () => {
    onChange([])
  }

  return (
    <div className="relative inline-flex items-center" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 font-semibold text-xs transition-colors py-1 px-1.5 rounded hover:bg-zinc-200/60 dark:hover:bg-zinc-800 ${
          isActive
            ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/40'
            : 'text-zinc-700 dark:text-zinc-300'
        }`}
        title={`Filter by ${title}`}
      >
        <span>{title}</span>
        <Filter className={`h-3 w-3 ${isActive ? 'fill-blue-600 dark:fill-blue-400 text-blue-600 dark:text-blue-400' : 'text-zinc-400'}`} />
        {isActive && (
          <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 text-[9px] font-bold rounded-full bg-blue-600 text-white">
            {selectedValues.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-60 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl p-2.5 space-y-2 animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100">
              Filter by {title}
            </span>
            {isActive && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Clear all ({selectedValues.length})
              </button>
            )}
          </div>

          {/* Search Box */}
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${title.toLowerCase()}...`}
                className="h-7 text-xs pl-7 pr-2"
                autoFocus
              />
            </div>
          )}

          {/* Quick Select All / Clear */}
          <div className="flex items-center justify-between text-[10px] text-zinc-500 px-0.5 pt-0.5">
            <button
              type="button"
              onClick={handleSelectAll}
              className="hover:text-blue-600 dark:hover:text-blue-400 font-medium"
            >
              Select filtered
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="hover:text-red-600 dark:hover:text-red-400 font-medium"
            >
              Deselect all
            </button>
          </div>

          {/* Options Checkbox List */}
          <div className="max-h-48 overflow-y-auto space-y-0.5 pr-0.5 divide-y divide-zinc-50 dark:divide-zinc-800/40">
            {filteredOptions.length === 0 ? (
              <div className="text-center py-4 text-[11px] text-zinc-400 italic">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const checked = selectedValues.includes(opt)
                return (
                  <label
                    key={opt}
                    className="flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-zinc-100 dark:hover:bg-zinc-800/80 cursor-pointer select-none transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggle(opt)}
                      className="h-3.5 w-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="truncate text-zinc-800 dark:text-zinc-200 text-xs font-medium">
                      {opt}
                    </span>
                  </label>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface TableColumnSortProps {
  title: string
  field: string
  currentField: string | null
  currentDirection: 'asc' | 'desc'
  onSort: (field: string) => void
}

export function TableColumnSort({
  title,
  field,
  currentField,
  currentDirection,
  onSort,
}: TableColumnSortProps) {
  const isSorted = currentField === field

  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={`inline-flex items-center gap-1.5 font-semibold text-xs py-1 px-1.5 rounded transition-colors hover:bg-zinc-200/60 dark:hover:bg-zinc-800 ${
        isSorted
          ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/40'
          : 'text-zinc-700 dark:text-zinc-300'
      }`}
      title={`Sort by ${title} (${isSorted ? (currentDirection === 'asc' ? 'ascending' : 'descending') : 'click to sort'})`}
    >
      <span>{title}</span>
      {isSorted ? (
        currentDirection === 'asc' ? (
          <ArrowUp className="h-3 w-3 text-blue-600 dark:text-blue-400 stroke-[2.5]" />
        ) : (
          <ArrowDown className="h-3 w-3 text-blue-600 dark:text-blue-400 stroke-[2.5]" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 text-zinc-400 opacity-60" />
      )}
    </button>
  )
}
