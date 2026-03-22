const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I for clarity

export function generateAccessCode(length = 6): string {
  let code = ''
  const array = new Uint32Array(length)
  crypto.getRandomValues(array)
  for (const val of array) {
    code += CHARS[val % CHARS.length]
  }
  return code
}

export function formatAccessCode(code: string): string {
  return code.length === 6 ? `${code.slice(0, 3)}-${code.slice(3)}` : code
}
