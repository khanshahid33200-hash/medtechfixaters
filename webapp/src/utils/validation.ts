/**
 * Unified Form Validation and Sanitization Rules
 * Ensures emails, phone numbers, ages, and names meet clinical platform standards.
 */

export interface ValidationResult {
  isValid: boolean
  error?: string
}

export interface PhoneValidationResult extends ValidationResult {
  cleaned: string
}

export interface AgeValidationResult extends ValidationResult {
  ageNum: number
}

/**
 * Validates Email Address according to RFC 5322 standard pattern.
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email address is required.' }
  }
  const trimmed = email.trim()
  if (trimmed.length < 5 || trimmed.length > 254) {
    return { isValid: false, error: 'Email address must be between 5 and 254 characters.' }
  }
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g. doctor@example.com).' }
  }
  return { isValid: true }
}

/**
 * Cleans phone number by stripping spaces, hyphens, brackets, and +91 country prefix.
 */
export function cleanPhoneNumber(phone: string): string {
  if (!phone) return ''
  let cleaned = phone.replace(/[\s\-().]/g, '')
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.substring(3)
  } else if (cleaned.startsWith('0091')) {
    cleaned = cleaned.substring(4)
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1)
  }
  return cleaned
}

/**
 * Validates Mobile / Phone number.
 * Requires 10-digit format starting with valid prefix (6-9 for India) or 10-15 standard international digits.
 */
export function validatePhone(phone: string): PhoneValidationResult {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, cleaned: '', error: 'Mobile number is required.' }
  }
  const cleaned = cleanPhoneNumber(phone)
  
  // Reject non-numeric
  if (!/^\d+$/.test(cleaned)) {
    return { isValid: false, cleaned, error: 'Mobile number must contain digits only.' }
  }

  // Reject dummy sequences
  if (/^(\d)\1{9,}$/.test(cleaned) || cleaned === '1234567890' || cleaned === '0123456789') {
    return { isValid: false, cleaned, error: 'Please enter a valid, real mobile number.' }
  }

  // Standard Indian 10-digit mobile
  if (cleaned.length === 10) {
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      return { isValid: false, cleaned, error: '10-digit mobile number should begin with 6, 7, 8, or 9.' }
    }
    return { isValid: true, cleaned }
  }

  // International standard 10-15 digits
  if (cleaned.length >= 10 && cleaned.length <= 15) {
    return { isValid: true, cleaned }
  }

  return { isValid: false, cleaned, error: 'Please enter a valid 10-digit mobile number.' }
}

/**
 * Validates Patient Age (1 to 120).
 */
export function validateAge(age: number | string): AgeValidationResult {
  const num = typeof age === 'number' ? age : parseInt(String(age).trim(), 10)
  if (isNaN(num) || num <= 0) {
    return { isValid: false, ageNum: 0, error: 'Please enter a valid positive age.' }
  }
  if (num > 120) {
    return { isValid: false, ageNum: num, error: 'Age must be 120 years or younger.' }
  }
  return { isValid: true, ageNum: num }
}

/**
 * Validates Person Name.
 */
export function validateName(name: string): ValidationResult {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Full name is required.' }
  }
  const trimmed = name.trim()
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Full name must be at least 2 characters long.' }
  }
  if (!/[a-zA-Z]/.test(trimmed)) {
    return { isValid: false, error: 'Name must contain letters.' }
  }
  return { isValid: true }
}

/**
 * Random temporary password for a newly provisioned account (shown once to the
 * admin who creates it). Replaces a shared hard-coded default.
 */
export function generateTempPassword(length = 14): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%'
  const bytes = new Uint32Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}
