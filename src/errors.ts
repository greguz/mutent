import { Status } from './status'

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
  constructor () {
    super('EMUT_NOENT', 'Unknown entity')
  }
}

export class ExpectedCommitError extends MutentError {
  public source: any
  public target: any
  constructor (status: Status<any>) {
    super('EMUT_NOCOM', 'Expected commit')
    this.source = status.source
    this.target = status.target
  }
}
