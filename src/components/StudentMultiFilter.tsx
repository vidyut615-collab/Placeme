'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Filter, ChevronDown, Check, X, RotateCcw, Search } from 'lucide-react'

export interface StudentFilterState {
  degrees: string[]
  departments: string[]
  years: string[]
  colleges?: string[]
  statuses?: string[]
}

interface MultiSelectDropdownProps {
  label: string
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
}

function MultiSelectDropdown({ label, options, selected, onChange }: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Focus search input when dropdown opens, clear search when it closes
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    } else {
      setSearchQuery('')
    }
  }, [isOpen])

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
    const q = searchQuery.trim().toLowerCase()
    if (!q) return options
    return options.filter(opt => opt.toLowerCase().includes(q))
  }, [options, searchQuery])

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option))
    } else {
      onChange([...selected, option])
    }
  }

  const handleSelectAll = () => {
    if (searchQuery.trim()) {
      // Select all currently filtered options
      const combined = Array.from(new Set([...selected, ...filteredOptions]))
      onChange(combined)
    } else {
      onChange([...options])
    }
  }

  const handleClear = () => {
    if (searchQuery.trim()) {
      // Deselect only currently filtered options
      onChange(selected.filter(item => !filteredOptions.includes(item)))
    } else {
      onChange([])
    }
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-9 text-xs flex items-center gap-1.5 border ${
          selected.length > 0 
            ? 'border-blue-500 bg-blue-50/50 text-blue-700 dark:border-blue-600 dark:bg-blue-950/40 dark:text-blue-300 font-medium' 
            : 'text-zinc-700 dark:text-zinc-300'
        }`}
      >
        <span>{label}</span>
        {selected.length > 0 && (
          <span className="inline-flex items-center justify-center rounded-full bg-blue-600 text-white text-[10px] h-4 min-w-[16px] px-1 font-semibold">
            {selected.length}
          </span>
        )}
        <ChevronDown className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute left-0 z-50 mt-1.5 w-64 sm:w-72 origin-top-left rounded-lg border bg-white dark:bg-zinc-900 p-2 shadow-lg ring-1 ring-black/5 dark:ring-white/10 outline-none animate-in fade-in-0 zoom-in-95">
          {/* Header with Title and All / Clear */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b text-[11px] font-medium text-zinc-500 px-1">
            <span>Filter by {label}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
              >
                {searchQuery.trim() ? 'Select matching' : 'All'}
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={handleClear}
                className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Search Input for filtering options */}
          <div className="relative mb-2 px-0.5">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}...`}
              className="w-full pl-7 pr-7 py-1.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto space-y-0.5 py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => {
                const isChecked = selected.includes(option)
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleOption(option)}
                    className="w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-md text-left text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <span className="truncate pr-2" title={option}>{option}</span>
                    <div
                      className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                        isChecked
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-zinc-300 dark:border-zinc-600 bg-transparent'
                      }`}
                    >
                      {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="text-center py-3 text-xs text-zinc-400 italic">
                {searchQuery.trim() ? `No matches for "${searchQuery}"` : 'No options available'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface StudentMultiFilterProps {
  availableDegrees: string[]
  availableDepartments: string[]
  availableYears: string[]
  availableColleges?: string[]
  availableStatuses?: string[]
  filters: StudentFilterState
  onFilterChange: (filters: StudentFilterState) => void
  onClearFilters: () => void
}

export function StudentMultiFilter({
  availableDegrees,
  availableDepartments,
  availableYears,
  availableColleges,
  availableStatuses = ['Active', 'Pending'],
  filters,
  onFilterChange,
  onClearFilters
}: StudentMultiFilterProps) {
  const hasActiveFilters = 
    filters.degrees.length > 0 || 
    filters.departments.length > 0 || 
    filters.years.length > 0 ||
    (filters.colleges ? filters.colleges.length > 0 : false) ||
    (filters.statuses ? filters.statuses.length > 0 : false)

  const totalActiveCount = 
    filters.degrees.length + 
    filters.departments.length + 
    filters.years.length +
    (filters.colleges?.length || 0) +
    (filters.statuses?.length || 0)

  const removeFilterItem = (category: keyof StudentFilterState, value: string) => {
    const currentList = filters[category] || []
    onFilterChange({
      ...filters,
      [category]: currentList.filter(item => item !== value)
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 mr-1">
          <Filter className="h-3.5 w-3.5 text-zinc-400" />
          <span className="font-medium">Filter:</span>
        </div>

        {/* College Filter - Shown only when availableColleges is provided */}
        {availableColleges && availableColleges.length > 0 && (
          <MultiSelectDropdown
            label="College"
            options={availableColleges}
            selected={filters.colleges || []}
            onChange={(selected) => onFilterChange({ ...filters, colleges: selected })}
          />
        )}

        <MultiSelectDropdown
          label="Degree"
          options={availableDegrees}
          selected={filters.degrees}
          onChange={(selected) => onFilterChange({ ...filters, degrees: selected })}
        />

        <MultiSelectDropdown
          label="Department"
          options={availableDepartments}
          selected={filters.departments}
          onChange={(selected) => onFilterChange({ ...filters, departments: selected })}
        />

        <MultiSelectDropdown
          label="Passing Year"
          options={availableYears}
          selected={filters.years}
          onChange={(selected) => onFilterChange({ ...filters, years: selected })}
        />

        {/* Active / Pending Status Filter */}
        {availableStatuses && availableStatuses.length > 0 && (
          <MultiSelectDropdown
            label="Active / Pending"
            options={availableStatuses}
            selected={filters.statuses || []}
            onChange={(selected) => onFilterChange({ ...filters, statuses: selected })}
          />
        )}

        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-9 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Reset Filters ({totalActiveCount})
          </Button>
        )}
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {filters.colleges && filters.colleges.map(col => (
            <Badge
              key={`col-${col}`}
              variant="secondary"
              className="text-[11px] font-normal gap-1 pl-2 pr-1 py-0.5 bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
            >
              <span>College: {col}</span>
              <button
                type="button"
                onClick={() => removeFilterItem('colleges', col)}
                className="hover:bg-amber-200 dark:hover:bg-amber-800 rounded p-0.5"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}

          {filters.degrees.map(deg => (
            <Badge
              key={`deg-${deg}`}
              variant="secondary"
              className="text-[11px] font-normal gap-1 pl-2 pr-1 py-0.5 bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
            >
              <span>Degree: {deg}</span>
              <button
                type="button"
                onClick={() => removeFilterItem('degrees', deg)}
                className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded p-0.5"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}

          {filters.departments.map(dept => (
            <Badge
              key={`dept-${dept}`}
              variant="secondary"
              className="text-[11px] font-normal gap-1 pl-2 pr-1 py-0.5 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
            >
              <span>Dept: {dept}</span>
              <button
                type="button"
                onClick={() => removeFilterItem('departments', dept)}
                className="hover:bg-emerald-200 dark:hover:bg-emerald-800 rounded p-0.5"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}

          {filters.years.map(yr => (
            <Badge
              key={`yr-${yr}`}
              variant="secondary"
              className="text-[11px] font-normal gap-1 pl-2 pr-1 py-0.5 bg-purple-50 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
            >
              <span>Year: {yr}</span>
              <button
                type="button"
                onClick={() => removeFilterItem('years', yr)}
                className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded p-0.5"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}

          {filters.statuses && filters.statuses.map(st => (
            <Badge
              key={`st-${st}`}
              variant="secondary"
              className={`text-[11px] font-normal gap-1 pl-2 pr-1 py-0.5 border ${
                st === 'Active'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-yellow-50 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
              }`}
            >
              <span>Status: {st}</span>
              <button
                type="button"
                onClick={() => removeFilterItem('statuses', st)}
                className="hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded p-0.5"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
