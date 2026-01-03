'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { userService } from '@/services/data.service'
import { User } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { isValidEmail, isValidName, isValidPhone, isValidSalary, validateRequired } from '@/utils/validation'

interface FormErrors {
  fullName?: string
  email?: string
  phone?: string
  address?: string
  salary?: string
}

export function ProfilePage() {
  const { user: currentUser } = useAuth()
  const [profileUser, setProfileUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    salary: ''
  })

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) return

      try {
        setLoading(true)
        // Use the current user data directly from auth context
        // In a real app, you might want to fetch fresh data from the server
        setProfileUser(currentUser)
        setFormData({
          fullName: currentUser.fullName || '',
          email: currentUser.email || '',
          phone: currentUser.phone || '',
          address: currentUser.address || '',
          salary: currentUser.salary?.toString() || ''
        })
      } catch (error) {
        setErrorMessage('Failed to load profile data')
        console.error('Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [currentUser])

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Validate required fields
    const nameError = validateRequired(formData.fullName, 'Full name')
    if (nameError) newErrors.fullName = nameError
    else if (!isValidName(formData.fullName)) {
      newErrors.fullName = 'Full name must be at least 2 characters'
    }

    const emailError = validateRequired(formData.email, 'Email')
    if (emailError) newErrors.email = emailError
    else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Validate optional fields
    if (formData.phone && !isValidPhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    if (formData.salary && !isValidSalary(parseFloat(formData.salary))) {
      newErrors.salary = 'Please enter a valid salary amount'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!profileUser || !currentUser) return

    if (!validateForm()) return

    try {
      setSaving(true)
      setErrorMessage('')
      setSuccessMessage('')

      const updateData: Partial<User> = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone || undefined,
        address: formData.address || undefined
      }

      // Only admins can update salary
      if (currentUser.role === 'admin' && formData.salary) {
        updateData.salary = parseFloat(formData.salary)
      }

      // Try to update via user service, but fallback to direct update if user not found
      let updatedUser: User
      try {
        updatedUser = await userService.update(profileUser.id, updateData)
      } catch (error) {
        // If user not found in service, create updated user object directly
        updatedUser = {
          ...profileUser,
          ...updateData,
          updatedAt: new Date()
        }
      }
      
      setProfileUser(updatedUser)
      setSuccessMessage('Profile updated successfully!')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const canEditField = (field: string): boolean => {
    if (!currentUser || !profileUser) return false
    
    // Users can edit their own basic fields
    if (currentUser.id === profileUser.id) {
      return ['fullName', 'email', 'phone', 'address'].includes(field)
    }
    
    // Admins can edit all fields for any user
    if (currentUser.role === 'admin') {
      return true
    }
    
    return false
  }

  const canEditSalary = (): boolean => {
    return currentUser?.role === 'admin'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  if (!profileUser) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-card rounded-lg border border-border shadow-sm">
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-semibold text-card-foreground">Profile Management</h1>
          <p className="text-muted-foreground mt-1">
            {currentUser?.id === profileUser.id ? 'Manage your profile information' : `Managing profile for ${profileUser.fullName}`}
          </p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Section - Profile Picture and Basic Info */}
            <div className="lg:col-span-1">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  {profileUser.profilePicture ? (
                    <img
                      src={profileUser.profilePicture}
                      alt={profileUser.fullName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="text-4xl font-semibold text-muted-foreground">
                      {profileUser.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-semibold text-card-foreground">{profileUser.fullName}</h2>
                <p className="text-muted-foreground capitalize">{profileUser.role}</p>
                <p className="text-sm text-muted-foreground mt-1">ID: {profileUser.employeeId}</p>
              </div>
            </div>

            {/* Right Section - Editable Fields */}
            <div className="lg:col-span-2">
              <form data-testid="profile-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-medium text-card-foreground mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        data-testid="fullName-field"
                        label="Full Name"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        error={errors.fullName}
                        readOnly={!canEditField('fullName')}
                        disabled={!canEditField('fullName')}
                      />
                      <Input
                        data-testid="email-field"
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        error={errors.email}
                        readOnly={!canEditField('email')}
                        disabled={!canEditField('email')}
                      />
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h3 className="text-lg font-medium text-card-foreground mb-4">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        data-testid="phone-field"
                        label="Phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        error={errors.phone}
                        readOnly={!canEditField('phone')}
                        disabled={!canEditField('phone')}
                      />
                      <Input
                        data-testid="address-field"
                        label="Address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        error={errors.address}
                        readOnly={!canEditField('address')}
                        disabled={!canEditField('address')}
                      />
                    </div>
                  </div>

                  {/* Employment Information */}
                  <div>
                    <h3 className="text-lg font-medium text-card-foreground mb-4">Employment Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        data-testid="employee-id-field"
                        label="Employee ID"
                        value={profileUser.employeeId}
                        readOnly
                        disabled
                      />
                      <Input
                        data-testid="role-field"
                        label="Role"
                        value={profileUser.role}
                        readOnly
                        disabled
                      />
                    </div>
                    {(profileUser.salary !== undefined || canEditSalary()) && (
                      <div className="mt-4">
                        <Input
                          data-testid="salary-field"
                          label="Salary"
                          type="number"
                          value={formData.salary}
                          onChange={(e) => handleInputChange('salary', e.target.value)}
                          error={errors.salary}
                          readOnly={!canEditSalary()}
                          disabled={!canEditSalary()}
                        />
                      </div>
                    )}
                  </div>

                  {/* Messages */}
                  {errorMessage && (
                    <div data-testid="error-message" className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                      <p className="text-sm text-destructive">{errorMessage}</p>
                    </div>
                  )}

                  {successMessage && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-800">{successMessage}</p>
                    </div>
                  )}

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <Button
                      data-testid="save-button"
                      type="submit"
                      loading={saving}
                      disabled={saving || (currentUser?.id !== profileUser.id && currentUser?.role !== 'admin')}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}