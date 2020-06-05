import Herry from 'herry'

export const MutentError = Herry

export const UndefinedEntityError = Herry.define(
  'EMUT_NODEF',
  'Undefined entity'
)

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

export class UnknownRoutineError extends MutentError {
  constructor (key: string) {
    super('EMUT_NORTN', `Unknown ${key} routine`)
  }
}
