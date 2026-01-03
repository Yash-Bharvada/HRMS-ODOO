// Validation utility functions
// These will be used for form validation throughout the application

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPassword(password: string): boolean {
  return password.length >= 6
}

export function isValidEmployeeId(employeeId: string): boolean {
  return employeeId.length >= 3 && /^[A-Z0-9]+$/i.test(employeeId)
}

export function isValidName(name: string): boolean {
  return name.trim().length >= 2
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
  return phoneRegex.test(phone)
}

export function isValidSalary(salary: number): boolean {
  return salary > 0 && Number.isFinite(salary)
}

export function validateRequired(value: string, fieldName: string): string | null {
  if (!value || value.trim().length === 0) {
    return `${fieldName} is required`
  }
  return null
}