'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from './button'

interface ErrorMessageProps {
  title?: string
  message: string
  onRetry?: () => void
  showRetry?: boolean
  className?: string
}

export function ErrorMessage({ 
  title = "Error", 
  message, 
  onRetry, 
  showRetry = true,
  className = ""
}: ErrorMessageProps) {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <p className="text-sm text-red-700 mt-1">{message}</p>
          {showRetry && onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="mt-3 text-red-700 border-red-300 hover:bg-red-100"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

interface NetworkErrorProps {
  onRetry?: () => void
}

export function NetworkError({ onRetry }: NetworkErrorProps) {
  return (
    <ErrorMessage
      title="Connection Error"
      message="Unable to connect to the server. Please check your internet connection and try again."
      onRetry={onRetry}
    />
  )
}

interface ValidationErrorProps {
  errors: Record<string, string[]>
}

export function ValidationError({ errors }: ValidationErrorProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">Validation Error</h3>
          <div className="mt-2">
            {Object.entries(errors).map(([field, fieldErrors]) => (
              <div key={field} className="mb-2">
                <p className="text-sm font-medium text-red-700 capitalize">{field}:</p>
                <ul className="list-disc list-inside text-sm text-red-600 ml-2">
                  {fieldErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}