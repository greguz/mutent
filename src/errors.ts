export class MutentError extends Error {
  public code: string
  constructor (code: string, message?: string) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
    this.code = code
  }
}

export class UndefinedEntityError extends MutentError {
  constructor () {
    super('EMUT_NODEF', 'Undefined entity')
  }
}

export class UnknownEntityError extends MutentError {
  public query: any
  public options: any
  constructor (query: any, options: any) {
    super('EMUT_NOENT', 'Unknown entity')
    this.query = query
    this.options = options
  }
}

export class ExpectedCommitError extends MutentError {
  public source: any
  public target: any
  public options: any
  constructor (source: any, target: any, options: any) {
    super('EMUT_NOCOM', 'Expected commit')
    this.source = source
    this.target = target
    this.options = options
  }
}
