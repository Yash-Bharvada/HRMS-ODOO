export interface OptimisticLockData {
  id: string
  version?: number
  updatedAt?: string
}

export interface ConflictResolution {
  strategy: 'last-write-wins' | 'user-prompt' | 'merge'
  onConflict?: (local: any, remote: any) => Promise<any>
}

export class ConcurrentUpdateManager {
  private pendingUpdates = new Map<string, Promise<any>>()
  private lockVersions = new Map<string, number>()

  async updateWithOptimisticLock<T extends OptimisticLockData>(
    id: string,
    data: Partial<T>,
    updateFn: (data: Partial<T>) => Promise<T>,
    resolution: ConflictResolution = { strategy: 'last-write-wins' }
  ): Promise<T> {
    // Check if there's already a pending update for this resource
    const existingUpdate = this.pendingUpdates.get(id)
    if (existingUpdate) {
      // Wait for the existing update to complete
      await existingUpdate
    }

    // Create a new update promise
    const updatePromise = this.performUpdate(id, data, updateFn, resolution)
    this.pendingUpdates.set(id, updatePromise)

    try {
      const result = await updatePromise
      return result
    } finally {
      this.pendingUpdates.delete(id)
    }
  }

  private async performUpdate<T extends OptimisticLockData>(
    id: string,
    data: Partial<T>,
    updateFn: (data: Partial<T>) => Promise<T>,
    resolution: ConflictResolution
  ): Promise<T> {
    const currentVersion = this.lockVersions.get(id) || 0
    
    try {
      // Include version in the update data for optimistic locking
      const updateData = {
        ...data,
        version: currentVersion + 1
      }

      const result = await updateFn(updateData)
      
      // Update our local version tracking
      this.lockVersions.set(id, result.version || currentVersion + 1)
      
      return result
    } catch (error: any) {
      // Handle conflict errors (409 Conflict)
      if (error.status === 409) {
        return this.handleConflict(id, data, updateFn, resolution, error)
      }
      throw error
    }
  }

  private async handleConflict<T extends OptimisticLockData>(
    id: string,
    localData: Partial<T>,
    updateFn: (data: Partial<T>) => Promise<T>,
    resolution: ConflictResolution,
    conflictError: any
  ): Promise<T> {
    switch (resolution.strategy) {
      case 'last-write-wins':
        // Force the update by removing version check
        const { version, ...dataWithoutVersion } = localData
        return updateFn(dataWithoutVersion)

      case 'user-prompt':
        if (resolution.onConflict) {
          const remoteData = conflictError.details?.remoteData
          const resolvedData = await resolution.onConflict(localData, remoteData)
          return updateFn(resolvedData)
        }
        throw new Error('Conflict resolution handler not provided')

      case 'merge':
        // Simple merge strategy - in a real app, this would be more sophisticated
        const remoteData = conflictError.details?.remoteData || {}
        const mergedData = { ...remoteData, ...localData }
        return updateFn(mergedData)

      default:
        throw conflictError
    }
  }

  // Queue multiple updates to be processed sequentially
  async batchUpdate<T>(
    updates: Array<{
      id: string
      data: Partial<T>
      updateFn: (data: Partial<T>) => Promise<T>
    }>,
    resolution: ConflictResolution = { strategy: 'last-write-wins' }
  ): Promise<T[]> {
    const results: T[] = []
    
    for (const update of updates) {
      const result = await this.updateWithOptimisticLock(
        update.id,
        update.data,
        update.updateFn,
        resolution
      )
      results.push(result)
    }
    
    return results
  }

  // Clear version tracking (useful for logout or data refresh)
  clearVersions(): void {
    this.lockVersions.clear()
    this.pendingUpdates.clear()
  }

  // Get current version for a resource
  getVersion(id: string): number {
    return this.lockVersions.get(id) || 0
  }
}

export const concurrentUpdateManager = new ConcurrentUpdateManager()

// Hook for using concurrent updates in React components
export function useConcurrentUpdate() {
  return {
    updateWithLock: concurrentUpdateManager.updateWithOptimisticLock.bind(concurrentUpdateManager),
    batchUpdate: concurrentUpdateManager.batchUpdate.bind(concurrentUpdateManager),
    clearVersions: concurrentUpdateManager.clearVersions.bind(concurrentUpdateManager),
    getVersion: concurrentUpdateManager.getVersion.bind(concurrentUpdateManager)
  }
}