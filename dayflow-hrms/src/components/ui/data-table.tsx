import React, { useState, useMemo } from 'react'
import { clsx } from 'clsx'
import { ChevronUp, ChevronDown, Search } from 'lucide-react'
import { DataTableProps, DataTableColumn } from '../../types'
import { Input } from './input'
import { LoadingSpinner } from './loading-spinner'

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  onSort,
  className
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data
    
    return data.filter(item =>
      columns.some(column => {
        const value = item[column.key]
        return value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      })
    )
  }, [data, searchTerm, columns])

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortKey]
      const bValue = b[sortKey]
      
      if (aValue === bValue) return 0
      
      const comparison = aValue < bValue ? -1 : 1
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [filteredData, sortKey, sortDirection])

  const handleSort = (key: keyof T) => {
    if (!columns.find(col => col.key === key)?.sortable) return
    
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
    
    onSort?.(key, sortDirection === 'asc' ? 'desc' : 'asc')
  }

  const getSortIcon = (key: keyof T) => {
    if (sortKey !== key) return null
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner text="Loading data..." />
      </div>
    )
  }

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={clsx(
                      'px-4 py-3 text-left text-sm font-medium text-muted-foreground',
                      column.sortable && 'cursor-pointer hover:text-foreground select-none'
                    )}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{column.label}</span>
                      {column.sortable && getSortIcon(column.key)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {sortedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {searchTerm ? 'No results found' : 'No data available'}
                  </td>
                </tr>
              ) : (
                sortedData.map((item, index) => (
                  <tr key={index} className="hover:bg-accent/50">
                    {columns.map((column) => (
                      <td
                        key={String(column.key)}
                        className="px-4 py-3 text-sm text-card-foreground"
                      >
                        {column.render
                          ? column.render(item[column.key], item)
                          : String(item[column.key] ?? '')
                        }
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results count */}
      {data.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {sortedData.length} of {data.length} results
          {searchTerm && ` for "${searchTerm}"`}
        </div>
      )}
    </div>
  )
}