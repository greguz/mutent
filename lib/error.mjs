export class MutentError extends Error {
  constructor (code, message, info) {
    super(message)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
    this.name = 'MutentError'
    this.code = code || 'EMUT_GENERIC_ERROR'
    if (info !== undefined) {
      this.info = info
    }
  }

  get [Symbol.toStringTag] () {
    return 'Error'
  }

  toString () {
    return `${this.name} [${this.code}]: ${this.message}`
  }

  toJSON () {
    return {
      error: this.code,
      message: this.message,
      info: this.info
    }
  }
}
