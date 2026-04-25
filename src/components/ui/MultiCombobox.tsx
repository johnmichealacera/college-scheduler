import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, Check } from 'lucide-react'
import { cn } from '../../lib/utils'

interface Option { value: string; label: string }

interface MultiComboboxProps {
  placeholder?: string
  options: Option[]
  values: string[]
  onChange: (values: string[]) => void
  className?: string
}

export function MultiCombobox({ placeholder, options, values, onChange, className }: MultiComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  const toggle = (value: string) => {
    onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value])
  }

  const buttonLabel =
    values.length === 0
      ? (placeholder ?? 'Select...')
      : values.length === 1
        ? (options.find((o) => o.value === values[0])?.label ?? '1 selected')
        : `${values.length} rooms selected`

  return (
    <div className="flex flex-col gap-1" ref={containerRef}>
      <div className="relative">
        {!open ? (
          <button
            type="button"
            onClick={openDropdown}
            className={cn(
              'w-full rounded-lg border px-3 py-2 text-sm text-left flex items-center justify-between gap-2',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white',
              'border-gray-300 hover:border-gray-400',
              className
            )}
          >
            <span className={cn('truncate', values.length > 0 ? 'text-gray-900' : 'text-gray-400')}>
              {buttonLabel}
            </span>
            <ChevronDown size={14} className="text-gray-400 shrink-0" />
          </button>
        ) : (
          <div className="w-full rounded-lg border border-blue-500 ring-2 ring-blue-500 px-3 py-2 text-sm flex items-center gap-2 bg-white">
            <Search size={13} className="text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              className="flex-1 outline-none bg-transparent text-sm text-gray-900 placeholder-gray-400 min-w-0"
              placeholder="Search rooms..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') { setOpen(false); setQuery('') } }}
            />
          </div>
        )}

        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-2.5 text-sm text-gray-400">No results for "{query}"</p>
            ) : (
              filtered.map((option) => {
                const isSelected = values.includes(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggle(option.value)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors',
                      isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <div className={cn(
                      'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0',
                      isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                    )}>
                      {isSelected && <Check size={10} className="text-white" />}
                    </div>
                    <span className="truncate">{option.label}</span>
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
