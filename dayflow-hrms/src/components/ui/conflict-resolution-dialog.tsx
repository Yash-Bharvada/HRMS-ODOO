'use client'

import { useState } from 'react'
import { Button } from './button'
import { AlertTriangle } from 'lucide-react'

interface ConflictResolutionDialogProps {
  isOpen: boolean
  onClose: () => void
  localData: any
  remoteData: any
  onResolve: (resolvedData: any, strategy: 'local' | 'remote' | 'merge') => void
  title?: string
  description?: string
}

export function ConflictResolutionDialog({
  isOpen,
  onClose,
  localData,
  remoteData,
  onResolve,
  title = "Data Conflict Detected",
  description = "The data you're trying to save has been modified by another user. Please choose how to resolve this conflict."
}: ConflictResolutionDialogProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<'local' | 'remote' | 'merge'>('local')

  if (!isOpen) return null

  const handleResolve = () => {
    let resolvedData
    
    switch (selectedStrategy) {
      case 'local':
        resolvedData = localData
        break
      case 'remote':
        resolvedData = remoteData
        break
      case 'merge':
        resolvedData = { ...remoteData, ...localData }
        break
    }
    
    onResolve(resolvedData, selectedStrategy)
    onClose()
  }

  const formatData = (data: any) => {
    return JSON.stringify(data, null, 2)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-auto">
        <div className="flex items-center mb-4">
          <AlertTriangle className="h-6 w-6 text-yellow-500 mr-2" />
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
        
        <p className="text-gray-600 mb-6">{description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-medium mb-2">Your Changes</h3>
            <div className="border rounded p-3 bg-blue-50">
              <pre className="text-sm overflow-auto max-h-40">
                {formatData(localData)}
              </pre>
            </div>
            <label className="flex items-center mt-2">
              <input
                type="radio"
                name="strategy"
                value="local"
                checked={selectedStrategy === 'local'}
                onChange={(e) => setSelectedStrategy(e.target.value as 'local')}
                className="mr-2"
              />
              Use my changes
            </label>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Server Changes</h3>
            <div className="border rounded p-3 bg-green-50">
              <pre className="text-sm overflow-auto max-h-40">
                {formatData(remoteData)}
              </pre>
            </div>
            <label className="flex items-center mt-2">
              <input
                type="radio"
                name="strategy"
                value="remote"
                checked={selectedStrategy === 'remote'}
                onChange={(e) => setSelectedStrategy(e.target.value as 'remote')}
                className="mr-2"
              />
              Use server changes
            </label>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="font-medium mb-2">Merged Result</h3>
          <div className="border rounded p-3 bg-yellow-50">
            <pre className="text-sm overflow-auto max-h-40">
              {formatData({ ...remoteData, ...localData })}
            </pre>
          </div>
          <label className="flex items-center mt-2">
            <input
              type="radio"
              name="strategy"
              value="merge"
              checked={selectedStrategy === 'merge'}
              onChange={(e) => setSelectedStrategy(e.target.value as 'merge')}
              className="mr-2"
            />
            Merge both changes (your changes take priority)
          </label>
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleResolve}>
            Apply Resolution
          </Button>
        </div>
      </div>
    </div>
  )
}