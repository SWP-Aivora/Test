/**
 * Form validation helpers
 */

export interface ValidationRule {
  validate: (value: any) => boolean;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  if (!email || !email.trim()) {
    errors.push('Email is required.');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Please enter a valid email address.');
  }
  return { valid: errors.length === 0, errors };
}

export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  if (!password) {
    errors.push('Password is required.');
  } else if (password.length < 6) {
    errors.push('Password must be at least 6 characters long.');
  }
  return { valid: errors.length === 0, errors };
}

export function validatePasswordMatch(password: string, confirmPassword: string): ValidationResult {
  const errors: string[] = [];
  if (!confirmPassword) {
    errors.push('Please confirm your password.');
  } else if (password !== confirmPassword) {
    errors.push('Passwords do not match.');
  }
  return { valid: errors.length === 0, errors };
}

export function validateRequired(value: any, fieldName = 'This field'): ValidationResult {
  const errors: string[] = [];
  if (value === null || value === undefined || String(value).trim() === '') {
    errors.push(`${fieldName} is required.`);
  }
  return { valid: errors.length === 0, errors };
}

export function validateMinLength(value: string, min: number, fieldName = 'This field'): ValidationResult {
  const errors: string[] = [];
  if (!value || value.length < min) {
    errors.push(`${fieldName} must be at least ${min} characters long.`);
  }
  return { valid: errors.length === 0, errors };
}

export function validateNumberRange(value: number, min: number, max: number, fieldName = 'This field'): ValidationResult {
  const errors: string[] = [];
  if (isNaN(value)) {
    errors.push(`${fieldName} must be a number.`);
  } else if (value < min || value > max) {
    errors.push(`${fieldName} must be between ${min} and ${max}.`);
  }
  return { valid: errors.length === 0, errors };
}

export function validatePositiveNumber(value: number, fieldName = 'This field'): ValidationResult {
  const errors: string[] = [];
  if (isNaN(value) || value <= 0) {
    errors.push(`${fieldName} must be a positive number.`);
  }
  return { valid: errors.length === 0, errors };
}

export function validateUrl(value: string, required = false): ValidationResult {
  const errors: string[] = [];
  if (!value && !required) return { valid: true, errors };
  if (!value && required) {
    errors.push('URL is required.');
    return { valid: false, errors };
  }
  try {
    new URL(value);
  } catch {
    errors.push('Please enter a valid URL.');
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Combine multiple validation results
 */
export function combineValidations(...results: ValidationResult[]): ValidationResult {
  const allErrors = results.flatMap(r => r.errors);
  return { valid: allErrors.length === 0, errors: allErrors };
}
