/**
 * Russian Phone Number Normalization Service
 * Handles conversion of various Russian phone formats to standard E.164 format (+7XXXXXXXXXX)
 */

/**
 * Extracts only digits from phone string
 */
export function extractDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Normalizes Russian phone number to standard format (+7XXXXXXXXXX)
 * Accepts formats like:
 * - 89991234567 (domestic, starts with 8)
 * - +79991234567 (international)
 * - +7 (999) 123-45-67
 * - (999) 123-45-67
 * - 999 123 45 67
 * Returns null if invalid
 */
export function normalizeRussianPhone(phone: string): string | null {
  if (!phone || typeof phone !== 'string') return null;

  // Extract only digits
  let digits = extractDigits(phone.trim());

  if (!digits || digits.length === 0) return null;

  // Handle country code variations
  // +7, +78, +80, 8, 78, 80 should all become 7
  if (digits.startsWith('8') && digits.length === 11) {
    // Domestic format: 89991234567 -> 79991234567
    digits = '7' + digits.slice(1);
  } else if (digits.startsWith('78') && digits.length === 12) {
    // 789991234567 -> 79991234567
    digits = digits.slice(1);
  } else if (digits.startsWith('7') && digits.length === 11) {
    // Already in correct format: 79991234567
    // Keep as is
  } else if (digits.length === 10) {
    // Just the local number: 9991234567 -> 79991234567
    digits = '7' + digits;
  } else if (digits.startsWith('80') && digits.length === 12) {
    // 809991234567 -> 79991234567
    digits = '7' + digits.slice(2);
  } else {
    // Invalid format
    return null;
  }

  // Validate: should be exactly 11 digits starting with 7
  if (digits.length !== 11 || !digits.startsWith('7')) {
    return null;
  }

  // Validate: second digit should be 3-9 (operator code)
  if (!/^7[3-9]/.test(digits)) {
    return null;
  }

  return '+' + digits;
}

/**
 * Formats phone number for display
 * Input: 79991234567 or +79991234567
 * Output: +7 (999) 123-45-67
 */
export function formatPhoneForDisplay(phone: string): string {
  const normalized = normalizeRussianPhone(phone);
  if (!normalized) return phone;

  // Remove + and extract digits
  const digits = normalized.slice(1);

  // Format: +7 (999) 123-45-67
  return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`;
}

/**
 * Formats phone number for input field (as user types)
 * Handles partial input like: 7, 79, 799, 7999, 79991...
 */
export function formatPhoneForInput(phone: string): string {
  if (!phone) return '';

  // Extract only digits
  let digits = extractDigits(phone);

  if (!digits) return '';

  // Normalize leading digits
  if (digits.startsWith('8')) {
    digits = '7' + digits.slice(1);
  } else if (!digits.startsWith('7')) {
    digits = '7' + digits;
  }

  // Limit to 11 digits
  digits = digits.slice(0, 11);

  // Format as we go: +7 (9) 9 9 1 2 3 4 5 6 7 -> +7 (999) 123-45-67
  if (digits.length === 0) return '';
  if (digits.length === 1) return '+' + digits;
  if (digits.length <= 4) return '+' + digits[0] + ' (' + digits.slice(1);
  if (digits.length <= 7) return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4)}`;
  if (digits.length <= 9) return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`;
}

/**
 * Validates Russian phone number
 */
export function isValidRussianPhone(phone: string): boolean {
  const normalized = normalizeRussianPhone(phone);
  if (!normalized) return false;

  const digits = extractDigits(normalized);

  // Should have exactly 11 digits
  if (digits.length !== 11) return false;

  // Should start with 7
  if (!digits.startsWith('7')) return false;

  // Second digit should be 3-9 (operator code)
  if (!/^7[3-9]/.test(digits)) return false;

  // Check for sequential repeated digits (like 7777777777)
  if (/^(\d)\1+$/.test(digits)) return false;

  // Check for common invalid patterns
  if (/^7[01]/.test(digits)) return false;

  return true;
}
