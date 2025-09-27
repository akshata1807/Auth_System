export interface PasswordValidation {
  isValid: boolean
  score: number // 0-4
  feedback: string[]
  checks: {
    length: boolean
    uppercase: boolean
    lowercase: boolean
    numbers: boolean
    special: boolean
  }
}

export function validatePassword(password: string): PasswordValidation {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  }

  const score = Object.values(checks).filter(Boolean).length

  const feedback: string[] = []
  if (!checks.length) feedback.push('At least 8 characters')
  if (!checks.uppercase) feedback.push('One uppercase letter')
  if (!checks.lowercase) feedback.push('One lowercase letter')
  if (!checks.numbers) feedback.push('One number')
  if (!checks.special) feedback.push('One special character')

  return {
    isValid: score >= 3, // At least 3 out of 5 criteria
    score,
    feedback,
    checks
  }
}

export function getPasswordStrengthText(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return 'Very Weak'
    case 2:
      return 'Weak'
    case 3:
      return 'Fair'
    case 4:
      return 'Good'
    case 5:
      return 'Strong'
    default:
      return 'Very Weak'
  }
}

export function getPasswordStrengthColor(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return 'text-red-600'
    case 2:
      return 'text-orange-600'
    case 3:
      return 'text-yellow-600'
    case 4:
      return 'text-blue-600'
    case 5:
      return 'text-green-600'
    default:
      return 'text-red-600'
  }
}