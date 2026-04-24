import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, Check } from 'lucide-react'
import { cn } from '../../lib/utils'

interface Option { value: string; label: string }

interface ComboboxProps {
  label?: string
  error?: string
  placeholder?: string
  options: Option[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function Combobox({ label, error, placeholder, options, value, onChange, className }: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = options.find((o) => o.value === value)
  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [])

  const openDropdown = () => {
    setOpen(true)
    setQuery('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const select = (option: Option) => {
    // Clicking the already-selected option deselects it (useful for filter dropdowns)
    onChange(option.value === value ? '' : option.value)
    setOpen(false)
    setQuery('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { setOpen(false); setQuery('') }
    if (e.key === 'Enter') { e.preventDefault(); if (filtered.length > 0) select(filtered[0]) }
  }

  const inputId = label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1" ref={containerRef}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        {/* Closed state: show selected label or placeholder */}
        {!open ? (
          <button
            id={inputId}
            type="button"
            onClick={openDropdown}
            className={cn(
              'w-full rounded-lg border px-3 py-2 text-sm text-left flex items-center justify-between gap-2',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white',
              error ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400',
              className
            )}
          >
            <span className={cn('truncate', selected ? 'text-gray-900' : 'text-gray-400')}>
              {selected ? selected.label : (placeholder ?? 'Select...')}
            </span>
            <ChevronDown size={14} className="text-gray-400 shrink-0" />
          </button>
        ) : (
          /* Open state: search input */
          <div className="w-full rounded-lg border border-blue-500 ring-2 ring-blue-500 px-3 py-2 text-sm flex items-center gap-2 bg-white">
            <Search size={13} className="text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              className="flex-1 outline-none bg-transparent text-sm text-gray-900 placeholder-gray-400 min-w-0"
              placeholder={`Search ${label?.toLowerCase() ?? ''}...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        )}

        {/* Dropdown list */}
        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-2.5 text-sm text-gray-400">No results for "{query}"</p>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => select(option)}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 transition-colors',
                    option.value === value
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {option.value === value && <Check size={13} className="shrink-0 text-blue-600" />}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
