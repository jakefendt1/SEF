import { describe, it, expect } from 'vitest'
import {
  isAllowedSignupEmail,
  emailDomain,
  normalizeEmail,
  ALLOWLISTED_EMAILS,
} from './allowedEmails'

describe('isAllowedSignupEmail', () => {
  it('accepts an intralox address', () => {
    expect(isAllowedSignupEmail('jane.smith@intralox.com')).toBe(true)
  })

  it('accepts regardless of case or surrounding whitespace', () => {
    expect(isAllowedSignupEmail('  Jane.Smith@INTRALOX.com ')).toBe(true)
  })

  it('rejects an outside address', () => {
    expect(isAllowedSignupEmail('someone@gmail.com')).toBe(false)
  })

  // A naive `endsWith('intralox.com')` check would accept this -- it is a
  // different domain that an attacker controls.
  it('rejects a lookalike domain that merely ends with the allowed one', () => {
    expect(isAllowedSignupEmail('attacker@notintralox.com')).toBe(false)
    expect(isAllowedSignupEmail('attacker@intralox.com.evil.net')).toBe(false)
  })

  // A subdomain is a different mail domain; allow it explicitly if ever needed.
  it('rejects subdomains of the allowed domain', () => {
    expect(isAllowedSignupEmail('someone@mail.intralox.com')).toBe(false)
  })

  it('rejects a malformed address with no domain', () => {
    expect(isAllowedSignupEmail('not-an-email')).toBe(false)
    expect(isAllowedSignupEmail('')).toBe(false)
  })

  it('accepts an address on the explicit allowlist', () => {
    // Guard the mechanism without hardcoding a real exception into the test.
    const withException = (email: string, list: readonly string[]) =>
      list.includes(normalizeEmail(email))
    expect(withException('Contractor@Example.com', ['contractor@example.com'])).toBe(true)
  })

  it('ships with an empty allowlist (audited: no exceptions needed)', () => {
    expect(ALLOWLISTED_EMAILS).toHaveLength(0)
  })
})

describe('emailDomain', () => {
  it('takes the part after the last @', () => {
    expect(emailDomain('a@b@intralox.com')).toBe('intralox.com')
  })

  it('returns empty for an address with no @', () => {
    expect(emailDomain('nope')).toBe('')
  })
})
