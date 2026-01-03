// Frontend performance monitoring utilities

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Measure API call performance
  measureApiCall<T>(
    name: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    return apiCall().then(
      (result) => {
        const duration = performance.now() - startTime;
        this.recordMetric(`api.${name}`, duration);
        
        if (duration > 2000) {
          console.warn(`Slow API call detected: ${name} took ${duration.toFixed(2)}ms`);
        }
        
        return result;
      },
      (error) => {
        const duration = performance.now() - startTime;
        this.recordMetric(`api.${name}.error`, duration);
        throw error;
      }
    );
  }

  // Measure component render performance
  measureRender(componentName: string, renderFn: () => void): void {
    const startTime = performance.now();
    renderFn();
    const duration = performance.now() - startTime;
    
    this.recordMetric(`render.${componentName}`, duration);
    
    if (duration > 16) { // 60fps threshold
      console.warn(`Slow render detected: ${componentName} took ${duration.toFixed(2)}ms`);
    }
  }

  private recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  getMetrics(name: string): { avg: number; min: number; max: number; count: number } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) {
      return null;
    }

    const sum = values.reduce((a, b) => a + b, 0);
    return {
      avg: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    };
  }

  getAllMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, any> = {};
    
    for (const [name] of this.metrics) {
      const metrics = this.getMetrics(name);
      if (metrics) {
        result[name] = metrics;
      }
    }
    
    return result;
  }

  clearMetrics(): void {
    this.metrics.clear();
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// React hook for performance monitoring
export function usePerformanceMonitor() {
  return {
    measureApiCall: performanceMonitor.measureApiCall.bind(performanceMonitor),
    measureRender: performanceMonitor.measureRender.bind(performanceMonitor),
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
    getAllMetrics: performanceMonitor.getAllMetrics.bind(performanceMonitor),
    clearMetrics: performanceMonitor.clearMetrics.bind(performanceMonitor),
  };
}

// Decorator for measuring API calls
export function measureApiCall(name: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      return performanceMonitor.measureApiCall(
        `${target.constructor.name}.${name}`,
        () => originalMethod.apply(this, args)
      );
    };
    
    return descriptor;
  };
}

// Web Vitals monitoring
export function initWebVitals() {
  if (typeof window === 'undefined') return;

  // Largest Contentful Paint
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      performanceMonitor.recordMetric('web-vitals.lcp', entry.startTime);
    }
  }).observe({ entryTypes: ['largest-contentful-paint'] });

  // First Input Delay
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      performanceMonitor.recordMetric('web-vitals.fid', (entry as any).processingStart - entry.startTime);
    }
  }).observe({ entryTypes: ['first-input'] });

  // Cumulative Layout Shift
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!(entry as any).hadRecentInput) {
        performanceMonitor.recordMetric('web-vitals.cls', (entry as any).value);
      }
    }
  }).observe({ entryTypes: ['layout-shift'] });
}