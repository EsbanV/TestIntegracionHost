export function isEmail(value: string): boolean {
  return /\S+@\S+\.\S+/.test(value)
}

export function isPasswordStrong(value: string): boolean {
  // minimal example: at least 6 chars
  return value.length >= 6
}

// Extract domain part from an email. Returns empty string if invalid.
export function getEmailDomain(email: string): string {
  const at = email.lastIndexOf('@')
  if (at < 0) return ''
  return email.slice(at + 1).toLowerCase()
}

// Read allowed domains from env (comma-separated), with a default fallback
export function parseAllowedDomainsFromEnv(envValue: string | undefined, fallback = 'uct.cl,alu.uct.cl'): string[] {
  return String(envValue || fallback)
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
}

// Check if an email belongs to allowed domains
export function isAllowedEmailDomain(email: string, allowedDomains: string[]): boolean {
  const domain = getEmailDomain(email)
  return !!domain && allowedDomains.includes(domain)
}
