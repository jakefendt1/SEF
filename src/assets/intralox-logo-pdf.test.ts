import { describe, it, expect } from 'vitest'
import { INTRALOX_LOGO_PNG, INTRALOX_LOGO_SIZE } from './intralox-logo-pdf'

// This test exists because the logo shipped broken for the entire life of the
// PDF export. pdf-export.ts carried its own copy of these bytes, truncated to
// 2,829 of 38,723 -- a single incomplete IDAT chunk and no IEND. jsPDF's
// addImage threw on it every time, a catch swallowed the error, and the export
// silently degraded to plain text. Nothing failed loudly, so nobody noticed.
//
// A truncated base64 blob still looks fine in a diff. These assertions are the
// only thing that can tell the difference, so they are deliberately structural:
// they decode the image and walk its chunk table rather than checking a length.

const PNG_SIGNATURE = '89504e470d0a1a0a'

function decode(dataUrl: string) {
  const [prefix, base64] = dataUrl.split(',')
  expect(prefix).toBe('data:image/png;base64')

  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return { base64, bytes, view: new DataView(bytes.buffer) }
}

function hex(bytes: Uint8Array): string {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

function ascii(bytes: Uint8Array): string {
  return Array.from(bytes, b => String.fromCharCode(b)).join('')
}

/** Walk the chunk table, which only succeeds if every declared length is present. */
function chunkTypes(bytes: Uint8Array, view: DataView): string[] {
  const types: string[] = []
  let offset = 8 // past the signature
  while (offset + 8 <= bytes.length) {
    const length = view.getUint32(offset)
    const type = ascii(bytes.subarray(offset + 4, offset + 8))
    types.push(type)
    offset += 12 + length // length + type + data + CRC
    if (type === 'IEND') break
  }
  expect(offset, 'chunk table overruns the buffer -- the image is truncated').toBeLessThanOrEqual(
    bytes.length,
  )
  return types
}

describe('INTRALOX_LOGO_PNG', () => {
  it('is base64 that decodes cleanly', () => {
    const { base64 } = decode(INTRALOX_LOGO_PNG)
    // The truncated copy failed exactly here: 3,773 chars, and 3,773 % 4 === 1,
    // which is not a decodable length under any padding.
    expect(base64.length % 4, 'base64 length must be a multiple of 4').toBe(0)
  })

  it('is a complete PNG, terminated by an IEND chunk', () => {
    const { bytes, view } = decode(INTRALOX_LOGO_PNG)
    expect(hex(bytes.subarray(0, 8))).toBe(PNG_SIGNATURE)

    const types = chunkTypes(bytes, view)
    expect(types[0]).toBe('IHDR')
    expect(types).toContain('IDAT')
    expect(types.at(-1), 'a PNG without IEND is a truncated PNG').toBe('IEND')
  })

  it('matches the declared dimensions, so PDF placements keep their aspect ratio', () => {
    const { view } = decode(INTRALOX_LOGO_PNG)
    expect(view.getUint32(16)).toBe(INTRALOX_LOGO_SIZE.width)
    expect(view.getUint32(20)).toBe(INTRALOX_LOGO_SIZE.height)
  })
})
