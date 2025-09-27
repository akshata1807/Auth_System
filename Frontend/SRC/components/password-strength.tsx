'use client'

import { validatePassword, getPasswordStrengthText, getPasswordStrengthColor } from '@/lib/password-validation'

interface PasswordStrengthProps {
  password: string
  showFeedback?: boolean
}

export default function PasswordStrength({ password, showFeedback = true }: PasswordStrengthProps) {
  const validation = validatePassword(password)

  if (!password) return null

  return (
    <div className="mt-2">
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              validation.score <= 1 ? 'bg-red-500' :
              validation.score === 2 ? 'bg-orange-500' :
              validation.score === 3 ? 'bg-yellow-500' :
              validation.score === 4 ? 'bg-blue-500' : 'bg-green-500'
            }`}
            style={{ width: `${(validation.score / 5) * 100}%` }}
          />
        </div>
        <span className={`text-sm font-medium ${getPasswordStrengthColor(validation.score)}`}>
          {getPasswordStrengthText(validation.score)}
        </span>
      </div>

      {showFeedback && validation.feedback.length > 0 && (
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          <p className="font-medium mb-1">Password should include:</p>
          <ul className="space-y-1">
            {validation.feedback.map((feedback, index) => (
              <li key={index} className="flex items-center">
                <span className="text-red-500 mr-2">•</span>
                {feedback}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}