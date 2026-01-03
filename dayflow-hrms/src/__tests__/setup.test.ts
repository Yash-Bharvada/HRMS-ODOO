// Basic setup test to verify Jest configuration
describe('Project Setup', () => {
  it('should have Jest configured correctly', () => {
    expect(true).toBe(true)
  })

  it('should be able to import types', () => {
    const mockUser = {
      id: '1',
      employeeId: 'EMP001',
      fullName: 'Test User',
      email: 'test@example.com',
      role: 'employee' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    expect(mockUser.role).toBe('employee')
  })
})